// core/offline/connectivity.ts
import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { create } from "zustand";

interface ConnectivityStore {
  isOnline: boolean;
  lastServerFailureAt: number | null;
  setOnline: (isOnline: boolean) => void;
  reportServerFailure: () => void;
}

export const useConnectivityStore = create<ConnectivityStore>()((set) => ({
  isOnline: true,
  lastServerFailureAt: null,
  setOnline: (isOnline) => set({ isOnline }),
  reportServerFailure: () => set({ lastServerFailureAt: Date.now() }),
}));

let initialized = false;

// Llamar una sola vez al arrancar la app (root layout).
export const initConnectivity = () => {
  if (initialized) return;
  initialized = true;

  NetInfo.addEventListener((state) => {
    const isOnline =
      state.isConnected === true && state.isInternetReachable !== false;
    useConnectivityStore.getState().setOnline(isOnline);
  });

  // TanStack Query pausa/reanuda queries según NetInfo
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      setOnline(
        state.isConnected === true && state.isInternetReachable !== false,
      );
    }),
  );
};

// "Backend caído o saturado" cuenta como offline aunque NetInfo diga que hay
// internet: sin respuesta (error de red / timeout) o 502/503/504.
export const isServerUnreachableError = (error: unknown): boolean => {
  const axiosError = error as AxiosError | undefined;
  if (!axiosError || !axiosError.isAxiosError) return false;
  if (!axiosError.response) return true;
  return [502, 503, 504].includes(axiosError.response.status);
};
