// presentation/hooks/useTicketSync.ts
// Orquestador del sync de escaneo offline: primero PUSH (drena la cola de
// validaciones offline), luego PULL (espejo incremental de tickets).
// El orden push→pull garantiza que el pull ya refleje lo subido.
import { useCallback, useEffect } from "react";
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

const SYNC_INTERVAL_MS = 5 * 60 * 1000;
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
let syncInFlight = false;

export const syncTickets = async (): Promise<void> => {
  if (syncInFlight) return;
  if (!useConnectivityStore.getState().isOnline) return;

  syncInFlight = true;
  useTicketSyncStore.setState({ isSyncing: true, syncError: null });

  try {
    // 1. PUSH: drenar la cola. Solo se borran filas con resultado por ítem
    //    del servidor (duplicate/applied/not_found cuentan como procesadas),
    //    así matar la app a mitad de sync nunca pierde ni duplica validaciones.
    const deviceId = await getDeviceId();
    let pending = getPendingValidations();
    while (pending.length > 0) {
      const chunk = pending.slice(0, PUSH_CHUNK_SIZE);
      const response = await pushValidationBatch(deviceId, chunk);
      removePendingValidations(response.results.map((r) => r.localId));
      if (response.results.length === 0) break;
      pending = getPendingValidations();
    }

    // 2. PULL incremental: cursor = serverTime devuelto por el servidor
    //    (nunca el reloj del dispositivo).
    const since = getLastSyncAt();
    let page = 1;
    let serverTime: string | null = null;
    let activeEventIds: string[] | null = null;

    for (;;) {
      const data = await fetchTicketSyncPage(since, page);
      upsertTickets(data.tickets);
      serverTime = data.serverTime;
      activeEventIds = data.activeEventIds;
      if (page >= data.totalPages || data.tickets.length === 0) break;
      page += 1;
    }

    if (activeEventIds) {
      pruneEventsNotIn(activeEventIds);
    }
    if (serverTime) {
      setLastSyncAt(serverTime);
    }
  } catch (error: any) {
    const status = error?.response?.status;
    useTicketSyncStore.setState({
      syncError:
        status === 401 || status === 403
          ? "Sesión expirada — inicia sesión para sincronizar"
          : "No se pudo sincronizar. Se reintentará automáticamente.",
    });
    console.warn("Ticket sync failed:", error?.message ?? error);
  } finally {
    syncInFlight = false;
    useTicketSyncStore.setState({
      isSyncing: false,
      pendingCount: getPendingCount(),
      lastSyncAt: getLastSyncAt(),
    });
  }
};

/**
 * Montar en el layout admin: dispara el sync al entrar, al recuperar
 * conexión, al volver la app a primer plano y cada 5 minutos.
 */
export const useTicketSync = () => {
  const { isSyncing, lastSyncAt, pendingCount, syncError, refreshCounts } =
    useTicketSyncStore();
  const isOnline = useConnectivityStore((state) => state.isOnline);

  const syncNow = useCallback(() => syncTickets(), []);

  // Al montar (entrar al área admin) y al reconectar
  useEffect(() => {
    refreshCounts();
    if (isOnline) {
      syncTickets();
    }
  }, [isOnline, refreshCounts]);

  // Al volver la app a primer plano
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncTickets();
      }
    });
    return () => subscription.remove();
  }, []);

  // Intervalo mientras el área admin esté montada
  useEffect(() => {
    const interval = setInterval(() => syncTickets(), SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return { isSyncing, lastSyncAt, pendingCount, syncError, syncNow };
};
