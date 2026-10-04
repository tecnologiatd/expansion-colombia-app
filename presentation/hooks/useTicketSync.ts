// presentation/hooks/useTicketSync.ts
// Orquestador del sync de escaneo offline: primero PUSH (drena la cola de
// validaciones offline), luego PULL (espejo incremental de tickets).
// El orden push→pull garantiza que el pull ya refleje lo subido.
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { create } from "zustand";
import {
  fetchTicketSyncPage,
  getDeviceId,
  pushValidationBatch,
} from "@/core/actions/ticket-sync.actions";
import {
  getLastSyncAt,
  getPendingCount,
  getPendingValidations,
  pruneEventsNotIn,
  removePendingValidations,
  setLastSyncAt,
  upsertTickets,
} from "@/core/offline/ticket-db";
import { useConnectivityStore } from "@/core/offline/connectivity";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { ensureScannerOwner } from "@/core/offline/ticket-db";
import {
  canSyncTickets,
  nextSyncDelay,
  SYNC_JITTER_MS,
} from "@/core/offline/sync-schedule";
const PUSH_CHUNK_SIZE = 200;

interface TicketSyncState {
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  syncError: string | null;
  refreshCounts: () => void;
}

export const useTicketSyncStore = create<TicketSyncState>()((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  pendingCount: 0,
  syncError: null,
  refreshCounts: () =>
    set({ pendingCount: getPendingCount(), lastSyncAt: getLastSyncAt() }),
}));

// Mutex a nivel de módulo: un solo sync a la vez aunque haya varios triggers
let syncInFlight: Promise<boolean> | null = null;
const automaticSchedule = {
  token: undefined as string | undefined,
  lastAttemptAt: null as number | null,
  failures: 0,
};

const runSync = async (signal?: AbortSignal): Promise<boolean> => {
  const session = useAuthStore.getState();
  if (
    !canSyncTickets(session.status, session.user?.role) ||
    !session.token ||
    !session.user?.username
  )
    return false;
  if (!useConnectivityStore.getState().isOnline || signal?.aborted)
    return false;
  const operator = session.user!.username;
  const sameSession = () => {
    const current = useAuthStore.getState();
    return (
      current.token === session.token &&
      current.user?.username === operator &&
      canSyncTickets(current.status, current.user?.role)
    );
  };
  const assertCurrent = () => {
    if (signal?.aborted || !sameSession()) throw new Error("Sync cancelled");
  };
  automaticSchedule.token = session.token;
  automaticSchedule.lastAttemptAt = Date.now();

  useTicketSyncStore.setState({ isSyncing: true, syncError: null });

  try {
    ensureScannerOwner(operator);
    // 1. PUSH: drenar la cola. Solo se borran filas con resultado por ítem
    //    del servidor (duplicate/applied/not_found cuentan como procesadas),
    //    así matar la app a mitad de sync nunca pierde ni duplica validaciones.
    const deviceId = await getDeviceId();
    assertCurrent();
    let pending = getPendingValidations();
    while (pending.length > 0) {
      const chunk = pending.slice(0, PUSH_CHUNK_SIZE);
      const response = await pushValidationBatch(deviceId, chunk, signal);
      assertCurrent();
      removePendingValidations(response.results.map((r) => r.localId));
      if (response.results.length === 0) break;
      pending = getPendingValidations();
    }
    if (getPendingCount() > 0)
      throw new Error(
        "Quedan escaneos pendientes. Vuelve a sincronizar antes de descargar el catálogo.",
      );

    // 2. PULL incremental: cursor = serverTime devuelto por el servidor
    //    (nunca el reloj del dispositivo).
    const since = getLastSyncAt();
    let page = 1;
    let serverTime: string | null = null;
    let activeEventIds: string[] | null = null;
    let cursor: string | undefined;
    let until: string | undefined;

    for (;;) {
      assertCurrent();
      const data = await fetchTicketSyncPage(
        since,
        page,
        cursor,
        until,
        signal,
      );
      assertCurrent();
      upsertTickets(data.tickets);
      serverTime ??= data.serverTime;
      until ??= data.snapshotUntil;
      activeEventIds = data.activeEventIds;
      if (data.nextCursor !== undefined) {
        if (!data.nextCursor) break;
        if (data.nextCursor === cursor)
          throw new Error("El catálogo no avanzó. Vuelve a sincronizar.");
        cursor = data.nextCursor;
      } else if (page >= data.totalPages || data.tickets.length === 0) break;
      page += 1;
    }

    if (activeEventIds) {
      pruneEventsNotIn(activeEventIds);
    }
    if (serverTime) {
      setLastSyncAt(serverTime);
    }
    automaticSchedule.failures = 0;
    return true;
  } catch (error: any) {
    if (signal?.aborted || !sameSession()) {
      if (automaticSchedule.token === session.token)
        automaticSchedule.lastAttemptAt = null;
      return false;
    }
    automaticSchedule.failures += 1;
    const status = error?.response?.status;
    useTicketSyncStore.setState({
      syncError:
        status === 401 || status === 403
          ? "Sesión expirada — inicia sesión para sincronizar"
          : "No se pudo sincronizar. Se reintentará automáticamente.",
    });
    console.warn("Ticket sync failed:", error?.message ?? error);
    return false;
  } finally {
    useTicketSyncStore.setState({
      isSyncing: false,
      pendingCount: getPendingCount(),
      lastSyncAt: getLastSyncAt(),
    });
  }
};

export const syncTickets = (signal?: AbortSignal): Promise<boolean> => {
  if (syncInFlight) return syncInFlight;
  const operation = runSync(signal);
  syncInFlight = operation;
  void operation.finally(() => {
    if (syncInFlight === operation) syncInFlight = null;
  });
  return operation;
};

// Montar UNA vez en el layout raíz. Solo operadores autenticados, online y
// en primer plano: incremental cada cinco minutos, jitter y backoff de errores.
export const useAutomaticTicketSync = () => {
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.user?.role);
  const token = useAuthStore((state) => state.token);
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const [appState, setAppState] = useState(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (
      !canSyncTickets(status, role) ||
      !token ||
      !isOnline ||
      (appState !== null && appState !== "active")
    )
      return;
    if (automaticSchedule.token !== token) {
      automaticSchedule.token = token;
      automaticSchedule.lastAttemptAt = null;
      automaticSchedule.failures = 0;
    }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    const schedule = () => {
      if (stopped) return;
      timer = setTimeout(
        run,
        nextSyncDelay(
          automaticSchedule.lastAttemptAt,
          automaticSchedule.failures,
        ) +
          Math.random() * SYNC_JITTER_MS,
      );
    };
    const run = async () => {
      if (stopped) return;
      // Un sync manual puede haberse ejecutado mientras esperaba este timer.
      if (
        nextSyncDelay(
          automaticSchedule.lastAttemptAt,
          automaticSchedule.failures,
        ) === 0
      )
        await syncTickets(controller.signal);
      schedule();
    };
    schedule();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [status, role, token, isOnline, appState]);
};

// Consumidores del escáner: solo estado/acción; no crean timers adicionales.
export const useTicketSync = () => {
  const { isSyncing, lastSyncAt, pendingCount, syncError, refreshCounts } =
    useTicketSyncStore();
  const syncNow = useCallback(() => syncTickets(), []);
  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  return { isSyncing, lastSyncAt, pendingCount, syncError, syncNow };
};
