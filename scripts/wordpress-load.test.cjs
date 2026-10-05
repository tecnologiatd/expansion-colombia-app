// Pruebas locales con React Query real; sin WordPress, pagos ni SQLite.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { create, act } = require("react-test-renderer");
const query = require("@tanstack/react-query");
const { create: createStore } = require("zustand");
global.IS_REACT_ACT_ENVIRONMENT = true;

function load(file, modules) {
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2021,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      if (name in modules) return modules[name];
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return require("react/jsx-runtime");
      if (name === "@tanstack/react-query") return query;
      if (!(name in modules)) throw new Error(`Missing module ${name}`);
      return modules[name];
    },
    Date,
  });
  return exports;
}
const policy = load("core/checkout/payment-policy.ts", {});
const polling = load("core/checkout/payment-polling.ts", {
  "./payment-policy": policy,
});

test("retorno del pago: espera el foco/carga sin destello de error; conserva errores reales y datos guardados", async () => {
  let online = true;
  let state = { isPending: true, isLoading: false, isPaused: false };
  const forceRefetch = () => {};
  const host = (name) => (props) => React.createElement(name, props);
  const { default: OrderDetails } = load(
    "presentation/components/OrderDetails.tsx",
    {
      "@/core/monitoring/sentry": { reportAppError() {} },
      "react-native": {
        View: "View",
        Text: "Text",
        ScrollView: "ScrollView",
        RefreshControl: "RefreshControl",
        Alert: {},
      },
      "@/presentation/hooks/useOrders": {
        useOrderDetails: () => ({ ...state, forceRefetch }),
      },
      "@/core/actions/order.actions": {},
      "@/presentation/components/TicketQRSection": {
        TicketQRSection: host("TicketQRSection"),
      },
      "./CachedDataNotice": { CachedDataNotice: host("CachedDataNotice") },
      "@/core/offline/connectivity": {
        useConnectivityStore: (select) => select({ isOnline: online }),
      },
      "@expo/vector-icons": { Ionicons: "Ionicons" },
      "@/presentation/utils/auth-browser": {},
      "@/core/checkout/payment-policy": policy,
      "@/presentation/components/ui/Button": { Button: host("Button") },
      "@/presentation/components/ui/StateView": {
        StateView: host("StateView"),
      },
      "@/presentation/theme/Colors": { Theme: {}, CONTENT_MAX_WIDTH: 800 },
      "@/helpers/format": { formatCOP: String, plainText: String },
    },
  );
  let renderer;
  const render = async () =>
    act(async () => {
      const tree = React.createElement(OrderDetails, { orderId: "100" });
      if (renderer) renderer.update(tree);
      else renderer = create(tree);
    });
  try {
    // Query desactivada hasta que useFocusEffect entregue el foco: pendiente, sin fetch todavía.
    await render();
    assert.equal(renderer.root.findByType("StateView").props.loading, true);
    state = { isPending: true, isLoading: true, isPaused: false };
    await render();
    assert.equal(renderer.root.findByType("StateView").props.loading, true);
    state = {
      isPending: false,
      isLoading: false,
      isPaused: false,
      isError: true,
    };
    await render();
    assert.equal(
      renderer.root.findByType("StateView").props.title,
      "Error al cargar los detalles del pedido",
    );
    assert.equal(
      renderer.root.findByType("StateView").props.onAction,
      forceRefetch,
    );
    online = false;
    state = { isPending: true, isPaused: true };
    await render();
    assert.equal(
      renderer.root.findByType("StateView").props.title,
      "Sin conexión y sin datos guardados de este pedido",
    );
    online = true;
    state = {
      isPending: false,
      isError: true,
      data: {
        status: "completed",
        date_created: "2026-10-05T10:00:00",
        total: "20000",
        line_items: [
          {
            id: 1,
            product_id: 200,
            name: "Fixture",
            quantity: 1,
            total: "20000",
          },
        ],
      },
    };
    await render();
    assert.equal(renderer.root.findAllByType("StateView").length, 0);
    assert.equal(
      renderer.root.findByType("TicketQRSection").props.orderStatus,
      "completed",
    );
    assert.equal(
      renderer.root.findByType("CachedDataNotice").props.failed,
      true,
    );
  } finally {
    await act(async () => renderer?.unmount());
  }
});

test("pago: 10/30/60 s, fin a 30 min y parada en estados definitivos", () => {
  const start = 100000;
  for (const [elapsed, interval] of [
    [0, 10000],
    [119999, 10000],
    [120000, 30000],
    [299999, 30000],
    [300000, 60000],
    [1799999, 60000],
    [1800000, false],
  ]) {
    assert.equal(
      polling.getPaymentPollInterval("pending", start, start + elapsed),
      interval,
    );
    assert.equal(
      polling.getPaymentPollInterval("on-hold", start, start + elapsed),
      interval,
    );
  }
  for (const status of [
    "completed",
    "processing",
    "failed",
    "cancelled",
    "refunded",
    undefined,
  ])
    assert.equal(polling.getPaymentPollInterval(status, start, start), false);
});

function setup() {
  let active = true;
  let hydrated = true;
  const hydrationCallbacks = new Set();
  const auth = createStore(() => ({ user: { username: "fixture" } }));
  const codes = createStore((set, get) => ({
    codes: {},
    getCodes: (order, event) => get().codes[`${order}:${event}`],
    saveCodes: (order, event, qrCodes) =>
      set((state) => ({
        codes: {
          ...state.codes,
          [`${order}:${event}`]: { qrCodes, savedAt: Date.now() },
        },
      })),
  }));
  codes.persist = {
    hasHydrated: () => hydrated,
    onFinishHydration: (callback) => {
      hydrationCallbacks.add(callback);
      return () => hydrationCallbacks.delete(callback);
    },
  };
  const connectivity = createStore(() => ({ isOnline: true }));
  const calls = { recover: 0, generate: 0 };
  let recover = async () => ({});
  let generate = async () => ({ qrCodes: ["generated/200"] });
  const modules = {
    "@/core/stores/ticket-codes.store": { useTicketCodesStore: codes },
    "@/core/offline/connectivity": { useConnectivityStore: connectivity },
    "@/presentation/auth/store/useAuthStore": { useAuthStore: auth },
    "@/core/actions/order-tickets.action": {
      getOrderTickets: (...args) => {
        calls.recover++;
        return recover(...args);
      },
    },
    "@/core/actions/generate-ticket.action": {
      generateTicketQR: (...args) => {
        calls.generate++;
        return generate(...args);
      },
    },
    "@/core/checkout/payment-policy": policy,
    "./useScreenActive": { useScreenActive: () => active },
  };
  modules["./useGenerateTicket"] = load(
    "presentation/hooks/useGenerateTicket.ts",
    modules,
  );
  const { useTicketCodes } = load(
    "presentation/hooks/useTicketCodes.ts",
    modules,
  );
  const client = new query.QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  const states = {};
  function Section({ event }) {
    states[event] = useTicketCodes("100", event, "completed", 1);
    return null;
  }
  let renderer;
  const tree = (events) =>
    React.createElement(
      query.QueryClientProvider,
      { client },
      ...events.map((event) =>
        React.createElement(Section, { key: event, event }),
      ),
    );
  return {
    calls,
    client,
    states,
    auth,
    codes,
    connectivity,
    setRecover: (fn) => {
      recover = fn;
    },
    setGenerate: (fn) => {
      generate = fn;
    },
    setActive: (value) => {
      active = value;
    },
    setHydrated: (value) => {
      hydrated = value;
      if (value) for (const callback of hydrationCallbacks) callback();
    },
    render: async (events = ["200"]) => {
      await act(async () => {
        if (renderer) renderer.update(tree(events));
        else renderer = create(tree(events));
      });
    },
    flush: async () => {
      for (let i = 0; i < 4; i++)
        await act(async () => {
          await new Promise((done) => setTimeout(done, 5));
        });
    },
    close: async () => {
      await act(async () => {
        renderer?.unmount();
      });
      client.clear();
    },
  };
}

test("QR guardado aparece sin recuperar ni generar; espera hidratación del almacenamiento", async () => {
  const s = setup();
  try {
    s.setHydrated(false);
    await s.render();
    await s.flush();
    assert.equal(s.calls.recover, 0);
    await act(async () => {
      s.codes.getState().saveCodes("100", "200", ["saved/200"]);
      s.setHydrated(true);
    });
    await s.flush();
    assert.deepEqual(Array.from(s.states["200"].codes), ["saved/200"]);
    assert.equal(s.calls.recover, 0);
    assert.equal(s.calls.generate, 0);
  } finally {
    await s.close();
  }
});

test("varios eventos recuperan con una sola consulta y conservan todos los códigos", async () => {
  const s = setup();
  try {
    s.setRecover(async () => ({
      200: [{ qrCode: "a/200" }],
      201: [{ qrCode: "b/201" }, { qrCode: "c/201" }],
    }));
    await s.render(["200", "201"]);
    await s.flush();
    assert.equal(s.calls.recover, 1);
    assert.equal(s.calls.generate, 0);
    assert.deepEqual(Array.from(s.states["201"].codes), ["b/201", "c/201"]);
  } finally {
    await s.close();
  }
});

test("un error de recuperación no genera entradas; reintento genera solo el evento ausente", async () => {
  const s = setup();
  try {
    s.setRecover(async () => {
      throw new Error("fixture");
    });
    await s.render();
    await s.flush();
    assert.equal(s.calls.generate, 0);
    assert.equal(s.states["200"].failed, true);
    s.setRecover(async () => ({}));
    await act(async () => {
      s.states["200"].retry();
    });
    await s.flush();
    assert.equal(s.calls.generate, 1);
    assert.deepEqual(Array.from(s.states["200"].codes), ["generated/200"]);
    await s.render();
    await s.flush();
    assert.equal(s.calls.generate, 1);
  } finally {
    await s.close();
  }
});

test("recuperación pausada sin conexión o fuera de pantalla; respuesta tardía no guarda QR en otra cuenta", async () => {
  const s = setup();
  try {
    s.setActive(false);
    await s.render();
    await s.flush();
    assert.equal(s.calls.recover, 0);
    s.setActive(true);
    await act(async () => {
      s.connectivity.setState({ isOnline: false });
    });
    await s.render();
    await s.flush();
    assert.equal(s.calls.recover, 0);
    let resolveGenerate;
    s.setGenerate(
      () =>
        new Promise((resolve) => {
          resolveGenerate = resolve;
        }),
    );
    await act(async () => {
      s.connectivity.setState({ isOnline: true });
    });
    await s.flush();
    assert.equal(s.calls.generate, 1);
    await act(async () => {
      s.auth.setState({ user: undefined });
    });
    await act(async () => {
      resolveGenerate({ qrCodes: ["old-account/200"] });
    });
    await s.flush();
    assert.equal(s.codes.getState().getCodes("100", "200"), undefined);
  } finally {
    await s.close();
  }
});

test("una recuperación vacía antigua se actualiza antes de intentar generar", async () => {
  const s = setup();
  try {
    s.client.setQueryData(
      ["tickets", "order", "100", "fixture"],
      {},
      { updatedAt: Date.now() - 120000 },
    );
    let resolve;
    s.setRecover(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    await s.render();
    await s.flush();
    assert.equal(s.calls.recover, 1);
    assert.equal(s.calls.generate, 0);
    await act(async () => {
      resolve({ 200: [{ qrCode: "historical/200" }] });
    });
    await s.flush();
    assert.equal(s.calls.generate, 0);
    assert.deepEqual(Array.from(s.states["200"].codes), ["historical/200"]);
  } finally {
    await s.close();
  }
});

test("hook de pagos pausa por visibilidad y reanuda sin reiniciar la ventana; retorno explícito sí la reinicia", async () => {
  let active = true;
  let clock = 100000;
  const originalNow = Date.now;
  Date.now = () => clock;
  const connectivity = createStore(() => ({ isOnline: true }));
  const client = new query.QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } },
  });
  const calls = [];
  let options;
  let state;
  let status = "pending";
  const { useOrderDetails } = load("presentation/hooks/useOrders.ts", {
    "@tanstack/react-query": {
      ...query,
      useQuery: (opts) => {
        options = opts;
        return query.useQuery(opts);
      },
    },
    "./useScreenActive": { useScreenActive: () => active },
    "@/core/offline/connectivity": { useConnectivityStore: connectivity },
    "@/core/checkout/payment-polling": polling,
    "@/core/checkout/payment-policy": policy,
    "@/core/actions/order.actions": {
      getOrderByIdAction: async (_id, opts) => {
        calls.push(opts);
        return { id: 100, status };
      },
    },
    "@/core/stores/cart-store": {
      useCartStore: { getState: () => ({ completePendingOrder: () => {} }) },
    },
  });
  function Screen() {
    state = useOrderDetails("100");
    return null;
  }
  let renderer;
  const render = async () => {
    await act(async () => {
      const element = React.createElement(
        query.QueryClientProvider,
        { client },
        React.createElement(Screen),
      );
      if (renderer) renderer.update(element);
      else renderer = create(element);
    });
  };
  const flush = async () => {
    for (let i = 0; i < 4; i++)
      await act(async () => {
        await new Promise((done) => setTimeout(done, 5));
      });
  };
  const interval = () =>
    options.refetchInterval(
      client.getQueryCache().find({ queryKey: ["order", "100"] }),
    );
  try {
    await render();
    await flush();
    assert.equal(interval(), 10000);
    active = false;
    await render();
    await flush();
    assert.equal(options.enabled, false);
    assert.equal(interval(), false);
    const before = calls.length;
    clock += 31 * 60 * 1000;
    active = true;
    await render();
    await flush();
    assert.equal(calls.length, before + 1);
    assert.equal(calls.at(-1).fresh, true);
    assert.equal(interval(), false);
    await act(async () => {
      await state.watchPayment();
    });
    await flush();
    assert.equal(interval(), 10000);
    assert.equal(calls.at(-1).fresh, true);
    status = "completed";
    await act(async () => {
      await state.forceRefetch();
    });
    await flush();
    assert.equal(interval(), false);
    await act(async () => {
      connectivity.setState({ isOnline: false });
    });
    assert.equal(options.enabled, false);
  } finally {
    await act(async () => {
      renderer?.unmount();
    });
    client.clear();
    Date.now = originalNow;
  }
});
