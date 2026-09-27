// core/stores/ticket-codes.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Códigos QR generados, persistidos para mostrarlos sin conexión.
// La generación en el backend es idempotente (misma orden/evento devuelve
// los mismos códigos), así que un código guardado nunca queda obsoleto.

interface SavedCodes {
  qrCodes: string[];
  savedAt: number;
}

interface TicketCodesStore {
  codes: Record<string, SavedCodes>;
  saveCodes: (orderId: string, eventId: string, qrCodes: string[]) => void;
  getCodes: (orderId: string, eventId: string) => SavedCodes | undefined;
  clearCodes: () => void;
}

const keyFor = (orderId: string, eventId: string) => `${orderId}:${eventId}`;

export const useTicketCodesStore = create<TicketCodesStore>()(
  persist(
    (set, get) => ({
      codes: {},

      saveCodes: (orderId, eventId, qrCodes) => {
        set((state) => ({
          codes: {
            ...state.codes,
            [keyFor(orderId, eventId)]: { qrCodes, savedAt: Date.now() },
          },
        }));
      },

      getCodes: (orderId, eventId) => get().codes[keyFor(orderId, eventId)],
      clearCodes: () => set({ codes: {} }),
    }),
    {
      name: "ticket-codes-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
