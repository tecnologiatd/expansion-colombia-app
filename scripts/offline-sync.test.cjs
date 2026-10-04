const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { DatabaseSync } = require("node:sqlite");

const load = (file, modules = {}, globals = {}) => {
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2021,
      },
    },
  ).outputText;
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      if (!(name in modules)) throw new Error(`Missing test module ${name}`);
      return modules[name];
    },
    console: { warn() {} },
    AbortController,
    setTimeout,
    clearTimeout,
    ...globals,
  });
  return exports;
};

const policy = load("core/offline/sync-schedule.ts");
test("solo operadores autenticados sincronizan; backoff 1, 2, 4 y máximo 5 minutos", () => {
  assert.equal(policy.canSyncTickets("authenticated", "administrator"), true);
  assert.equal(policy.canSyncTickets("authenticated", "shop_manager"), true);
  assert.equal(policy.canSyncTickets("authenticated", "subscriber"), false);
  assert.equal(
    policy.canSyncTickets("unauthenticated", "administrator"),
    false,
  );
  assert.equal(policy.nextSyncDelay(null, 0, 1000), 0);
  assert.equal(policy.nextSyncDelay(1000, 0, 1000), 300000);
  for (const [failures, delay] of [
    [1, 60000],
    [2, 120000],
    [3, 240000],
    [4, 300000],
    [10, 300000],
  ])
    assert.equal(policy.nextSyncDelay(1000, failures, 1000), delay);
});

const harness = () => {
  let session = {
    status: "authenticated",
    token: "test-session",
    user: { username: "operator", role: "administrator" },
  };
  let online = true;
  const rows = [];
  let lastSync = null;
  let fetchCalls = 0;
  let fetchPage = async () => ({
    tickets: [],
    serverTime: "2026-10-04T00:00:00Z",
    activeEventIds: [],
    nextCursor: null,
  });
  const cleanups = [];
  const timers = [];
  const appState = {
    currentState: "active",
    addEventListener: () => ({ remove() {} }),
  };
  const create = () => (initializer) => {
    let state;
    const set = (value) => {
      state = { ...state, ...value };
    };
    state = initializer(set);
    const store = () => state;
    store.getState = () => state;
    store.setState = set;
    return store;
  };
  const auth = (selector) => selector(session);
  auth.getState = () => session;
  const connectivity = (selector) => selector({ isOnline: online });
  connectivity.getState = () => ({ isOnline: online });
  const modules = {
    react: {
      useCallback: (fn) => fn,
      useEffect: (fn) => {
        const c = fn();
        if (c) cleanups.push(c);
      },
      useState: (value) => [value, () => {}],
    },
    "react-native": { AppState: appState },
    zustand: { create },
    "@/core/actions/ticket-sync.actions": {
      getDeviceId: async () => "test-installation",
      pushValidationBatch: async () => ({ results: [] }),
      fetchTicketSyncPage: (...args) => {
        fetchCalls++;
        return fetchPage(...args);
      },
    },
    "@/core/offline/ticket-db": {
      getLastSyncAt: () => lastSync,
      getPendingCount: () => 0,
      getPendingValidations: () => [],
      pruneEventsNotIn() {},
      removePendingValidations() {},
      ensureScannerOwner() {},
      setLastSyncAt: (value) => {
        lastSync = value;
      },
      upsertTickets: (tickets) => rows.push(...tickets),
    },
    "@/core/offline/connectivity": { useConnectivityStore: connectivity },
    "@/presentation/auth/store/useAuthStore": { useAuthStore: auth },
    "@/core/offline/sync-schedule": policy,
  };
  const hook = load("presentation/hooks/useTicketSync.ts", modules, {
    setTimeout: (fn, delay) => {
      timers.push({ fn, delay });
      return timers.length;
    },
    clearTimeout() {},
  });
  return {
    hook,
    rows,
    timers,
    cleanups,
    appState,
    calls: () => fetchCalls,
    lastSync: () => lastSync,
    setSession: (value) => {
      session = value;
    },
    setOnline: (value) => {
      online = value;
    },
    setFetch: (fn) => {
      fetchPage = fn;
    },
  };
};

test("el consumidor del escáner no crea timers; el coordinador raíz sí", () => {
  const h = harness();
  h.hook.useTicketSync();
  assert.equal(h.timers.length, 0);
  h.hook.useAutomaticTicketSync();
  assert.equal(h.timers.length, 1);
  assert(h.timers[0].delay <= 10000);
  h.cleanups.forEach((cleanup) => cleanup());
});

test("disparos simultáneos comparten una sola descarga", async () => {
  const h = harness();
  const a = h.hook.syncTickets();
  const b = h.hook.syncTickets();
  assert.equal(a, b);
  assert.equal(await a, true);
  assert.equal(h.calls(), 1);
});

test("no descarga offline ni para compradores", async () => {
  const h = harness();
  h.setOnline(false);
  assert.equal(await h.hook.syncTickets(), false);
  h.setOnline(true);
  h.setSession({
    status: "authenticated",
    token: "buyer",
    user: { username: "buyer", role: "subscriber" },
  });
  assert.equal(await h.hook.syncTickets(), false);
  assert.equal(h.calls(), 0);
});

test("no aplica respuestas de una sesión cerrada mientras descargaba", async () => {
  const h = harness();
  let complete;
  let started;
  const waiting = new Promise((resolve) => {
    started = resolve;
  });
  h.setFetch(
    () =>
      new Promise((resolve) => {
        complete = resolve;
        started();
      }),
  );
  const operation = h.hook.syncTickets();
  await waiting;
  h.setSession({ status: "unauthenticated" });
  complete({
    tickets: [{ qrCode: "fixture" }],
    serverTime: "test",
    activeEventIds: [],
    nextCursor: null,
  });
  assert.equal(await operation, false);
  assert.equal(h.rows.length, 0);
  assert.equal(h.lastSync(), null);
});

test("la actualización automática espera cinco minutos y se pausa en segundo plano", async () => {
  const h = harness();
  h.hook.useAutomaticTicketSync();
  await h.timers[0].fn();
  assert.equal(h.calls(), 1);
  assert.equal(h.timers.length, 2);
  assert(h.timers[1].delay >= 299000 && h.timers[1].delay <= 310000);
  h.cleanups.forEach((cleanup) => cleanup());
  const background = harness();
  background.appState.currentState = "background";
  background.hook.useAutomaticTicketSync();
  assert.equal(background.timers.length, 0);
});

test("el recurso de imagen nunca contiene URI vacía", () => {
  const { imageSource } = load("helpers/image-source.ts", {
    "../assets/images/icon.png": 42,
  });
  for (const value of [undefined, null, "", "   "])
    assert.equal(imageSource(value), 42);
  assert.equal(
    imageSource(" https://example.invalid/image.png ").uri,
    "https://example.invalid/image.png",
  );
});

test("SQLite preserva usos y catálogo de escaneos pendientes durante un pull", () => {
  const native = new DatabaseSync(":memory:");
  const db = {
    execSync: (sql) => native.exec(sql),
    getAllSync: (sql, args = []) => native.prepare(sql).all(...args),
    getFirstSync: (sql, args = []) => native.prepare(sql).get(...args),
    runSync: (sql, args = []) => native.prepare(sql).run(...args),
    withTransactionSync: (fn) => {
      native.exec("BEGIN");
      try {
        fn();
        native.exec("COMMIT");
      } catch (error) {
        native.exec("ROLLBACK");
        throw error;
      }
    },
  };
  const api = load("core/offline/ticket-db.ts", {
    "expo-sqlite": { openDatabaseSync: () => db },
  });
  try {
    const ticket = {
      qrCode: "fixture/event",
      orderId: "1",
      eventId: "event",
      usageCount: 0,
      maxUsages: 3,
      revoked: false,
      customerName: null,
      updatedAt: "2026-10-04T00:00:00Z",
    };
    api.upsertTickets([ticket]);
    api.recordOfflineValidation({
      localId: "fixture-scan",
      qrCode: ticket.qrCode,
      eventId: ticket.eventId,
      validatedAt: ticket.updatedAt,
    });
    api.upsertTickets([{ ...ticket, usageCount: 1 }]);
    assert.equal(api.getTicketByQr(ticket.qrCode).usageCount, 2);
    api.pruneEventsNotIn([]);
    assert(api.getTicketByQr(ticket.qrCode));
    api.removePendingValidations(["fixture-scan"]);
    api.upsertTickets([{ ...ticket, usageCount: 2 }]);
    assert.equal(api.getTicketByQr(ticket.qrCode).usageCount, 2);
    api.pruneEventsNotIn([]);
    assert.equal(api.getTicketByQr(ticket.qrCode), null);
  } finally {
    native.close();
  }
});
