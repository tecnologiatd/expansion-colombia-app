import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

export interface CartItem extends Product {
  quantity: number;
}

// Cart Store Interface
interface CartStore {
  items: CartItem[];
  pendingOrderId: number | null;
  pendingCartKey: string | null;
  checkoutAttemptKey: string | null;
  checkoutFingerprint: string | null;
  getCheckoutAttemptKey: (context: string) => string;
  completePendingOrder: (orderId: number) => void;
  setPendingOrder: (orderId: number) => void;
  getPendingOrderId: () => number | null;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  calculateTotal: () => number;
}

// Create Zustand Store with Persistence
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      pendingOrderId: null,
      pendingCartKey: null,
      checkoutAttemptKey: null,
      checkoutFingerprint: null,
      getCheckoutAttemptKey: (context) => {
        const state = get();
        const fingerprint = JSON.stringify([
          state.items
            .map((item) => [item.id, item.quantity])
            .sort((a, b) => a[0] - b[0]),
          context,
        ]);
        if (
          state.checkoutFingerprint === fingerprint &&
          state.checkoutAttemptKey
        )
          return state.checkoutAttemptKey;
        const key = Crypto.randomUUID();
        set({ checkoutAttemptKey: key, checkoutFingerprint: fingerprint });
        return key;
      },
      completePendingOrder: (orderId) => {
        if (
          get().pendingOrderId === orderId &&
          get().getPendingOrderId() === orderId
        )
          get().clearCart();
      },
      setPendingOrder: (orderId) =>
        set((state) => ({
          pendingOrderId: orderId,
          pendingCartKey: JSON.stringify(
            state.items
              .map((item) => [item.id, item.quantity])
              .sort((a, b) => Number(a[0]) - Number(b[0])),
          ),
        })),
      getPendingOrderId: () => {
        const state = get();
        const currentKey = JSON.stringify(
          state.items
            .map((item) => [item.id, item.quantity])
            .sort((a, b) => Number(a[0]) - Number(b[0])),
        );
        return currentKey === state.pendingCartKey
          ? state.pendingOrderId
          : null;
      },

      addToCart: (product) => {
        set((state) => {
          // Check if item already exists in cart
          const existingItem = state.items.find(
            (item) => item.id === product.id,
          );

          if (existingItem) {
            // If item exists, increase quantity
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item,
              ),
            };
          }

          // If item doesn't exist, add new item with quantity
          return {
            items: [...state.items, { ...product, quantity: 1 }],
          };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item,
          ),
        }));
      },

      clearCart: () => {
        set({
          items: [],
          pendingOrderId: null,
          pendingCartKey: null,
          checkoutAttemptKey: null,
          checkoutFingerprint: null,
        });
      },

      calculateTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );
      },
    }),
    {
      name: "cart-storage", // unique name
      storage: createJSONStorage(() => AsyncStorage),
      // Optional: specify which parts of the state to persist
      partialize: (state) => ({
        items: state.items,
        pendingOrderId: state.pendingOrderId,
        pendingCartKey: state.pendingCartKey,
        checkoutAttemptKey: state.checkoutAttemptKey,
        checkoutFingerprint: state.checkoutFingerprint,
      }),
    },
  ),
);
