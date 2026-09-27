// presentation/auth/store/useAuthStore.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { AuthStore, User } from "@/core/interfaces/auth";
import {
  authCheckStatus,
  authLogin,
  authRegister,
} from "@/core/auth/actions/auth-actions";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { backendApi } from "@/core/api/wordpress-api";
import { DeviceService } from "@/core/auth/actions/register-device.action";
import { clearPrivateQueryCache } from "@/core/api/query-cache";
import { useTicketCodesStore } from "@/core/stores/ticket-codes.store";
import { useCartStore } from "@/core/stores/cart-store";
import { useNotificationStore } from "@/core/stores/notification.store";

const USER_SNAPSHOT_KEY = "auth-user-snapshot";

// Snapshot mínimo del usuario (sin token) para restaurar la sesión offline.
const saveUserSnapshot = async (user: User) => {
  try {
    await AsyncStorage.setItem(USER_SNAPSHOT_KEY, JSON.stringify(user));
  } catch {
    // best-effort: sin snapshot la app sigue funcionando online
  }
};

const loadUserSnapshot = async (): Promise<User | undefined> => {
  try {
    const raw = await AsyncStorage.getItem(USER_SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as User) : undefined;
  } catch {
    return undefined;
  }
};

const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    return typeof exp === "number" && exp * 1000 < Date.now();
  } catch {
    // Token ilegible: tratarlo como expirado
    return true;
  }
};

// Solo una respuesta 401/403 del backend prueba que el token es inválido.
// Errores de red, timeouts o 5xx no deben destruir la sesión.
const isAuthRejection = (error: any): boolean => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};

export const useAuthStore = create<AuthStore>()((set, get) => ({
  status: "unauthenticated",
  token: undefined,
  user: undefined,
  error: null,

  // Nuevo método para limpiar errores
  clearError: () => set({ error: null }),

  login: async (username: string, password: string) => {
    try {
      const resp = await authLogin(username, password);
      if (!resp?.token || !resp?.user) return false;
      if (get().user?.username && get().user?.username !== resp.user.username) {
        useCartStore.getState().clearCart();
        useTicketCodesStore.getState().clearCodes();
      }

      // Configurar el token
      backendApi.defaults.headers.common["Authorization"] =
        `Bearer ${resp.token}`;

      let user: User = resp.user;
      try {
        // Obtener información del usuario incluyendo el rol
        const customerResp = await backendApi.get("/customer");
        user = { ...resp.user, role: customerResp.data.role || "subscriber" };
      } catch (error) {
        console.error("Error fetching user role:", error);
        // Si falla la obtención del rol, continuar con el login pero sin rol
      }

      set({
        status: "authenticated",
        token: resp.token,
        user,
        error: null, // Resetear cualquier error previo
      });

      await SecureStorageAdapter.setItem("token", resp.token);
      await saveUserSnapshot(user);
      await clearPrivateQueryCache();
      void DeviceService.registerDevice();
      return true;
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage =
        "Credenciales inválidas. Por favor, intente nuevamente.";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      set({
        status: "unauthenticated",
        error: errorMessage,
      });
      return false;
    }
  },

  checkStatus: async () => {
    const storedToken = await SecureStorageAdapter.getItem("token");

    if (!storedToken) {
      if (await loadUserSnapshot()) useCartStore.getState().clearCart();
      await clearPrivateQueryCache();
      useTicketCodesStore.getState().clearCodes();
      set({
        status: "unauthenticated",
        token: undefined,
        user: undefined,
        error: null,
      });
      return false;
    }

    if (isTokenExpired(storedToken)) {
      useCartStore.getState().clearCart();
      await SecureStorageAdapter.deleteItem("token");
      await AsyncStorage.removeItem(USER_SNAPSHOT_KEY);
      await clearPrivateQueryCache();
      useTicketCodesStore.getState().clearCodes();
      set({
        status: "unauthenticated",
        token: undefined,
        user: undefined,
        error: null,
      });
      return false;
    }

    backendApi.defaults.headers.common["Authorization"] =
      `Bearer ${storedToken}`;

    try {
      const resp = await authCheckStatus();

      if (!resp?.user) {
        useCartStore.getState().clearCart();
        set({
          status: "unauthenticated",
          token: undefined,
          user: undefined,
          error: null,
        });
        await SecureStorageAdapter.deleteItem("token");
        await AsyncStorage.removeItem(USER_SNAPSHOT_KEY);
        await clearPrivateQueryCache();
        useTicketCodesStore.getState().clearCodes();
        return false;
      }

      let user: User = resp.user;
      try {
        // Obtener información del usuario incluyendo el rol
        const customerResp = await backendApi.get("/customer");
        const role = customerResp.data.role || "subscriber";
        user = { ...resp.user, role };
      } catch (error) {
        console.error("Error fetching user role:", error);
        // Sin rol fresco: conservar el del snapshot si existe
        const snapshot = await loadUserSnapshot();
        if (snapshot?.role) {
          user = { ...resp.user, role: snapshot.role };
        }
      }

      set({
        status: "authenticated",
        token: storedToken,
        user,
        error: null,
      });
      await saveUserSnapshot(user);
      void DeviceService.registerDevice();

      return true;
    } catch (error) {
      if (isAuthRejection(error)) {
        useCartStore.getState().clearCart();
        console.error("Check status error (token rechazado):", error);
        set({
          status: "unauthenticated",
          token: undefined,
          user: undefined,
          error: null,
        });
        await SecureStorageAdapter.deleteItem("token");
        await AsyncStorage.removeItem(USER_SNAPSHOT_KEY);
        await clearPrivateQueryCache();
        useTicketCodesStore.getState().clearCodes();
        return false;
      }

      // Error de red / backend caído o saturado: conservar el token y
      // restaurar la sesión desde el snapshot para operar offline.
      console.warn("Check status sin conexión, restaurando sesión local");
      const snapshot = await loadUserSnapshot();
      set({
        status: "authenticated",
        token: storedToken,
        user: snapshot ?? { username: "" },
        error: null,
      });
      return true;
    }
  },

  logout: async () => {
    await DeviceService.detachCurrentUser();
    await SecureStorageAdapter.deleteItem("token");
    await AsyncStorage.removeItem(USER_SNAPSHOT_KEY);
    await clearPrivateQueryCache();
    useTicketCodesStore.getState().clearCodes();
    useCartStore.getState().clearCart();
    useNotificationStore.getState().clearAll();
    delete backendApi.defaults.headers.common["Authorization"];
    set({
      status: "unauthenticated",
      token: undefined,
      user: undefined,
      error: null,
    });
  },

  register: async (username, email, password) => {
    try {
      set({ status: "checking", error: null });
      const resp = await authRegister(username, email, password);

      if (!resp.success) {
        // Guardamos el mensaje de error específico del backend
        set({
          status: "unauthenticated",
          error: resp.error.message || "Error durante el registro",
        });
        return false;
      }

      if (!resp.data?.token || !resp.data?.user) {
        set({ status: "unauthenticated", error: "Error durante el registro" });
        return false;
      }

      backendApi.defaults.headers.common["Authorization"] =
        `Bearer ${resp.data.token}`;

      let user: User = resp.data.user;
      try {
        const customerResp = await backendApi.get("/customer");
        user = {
          ...resp.data.user,
          role: customerResp.data.role || "subscriber",
        };
      } catch (error) {
        console.error("Error fetching user role:", error);
      }

      set({
        status: "authenticated",
        token: resp.data.token,
        user,
        error: null,
      });

      await SecureStorageAdapter.setItem("token", resp.data.token);
      await saveUserSnapshot(user);
      await clearPrivateQueryCache();
      void DeviceService.registerDevice();
      return true;
    } catch (error) {
      console.error("Register error:", error);
      // Manejar mejor los errores, intentando extraer el mensaje del error
      let errorMessage = "Error durante el registro";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      set({
        status: "unauthenticated",
        error: errorMessage,
      });
      return false;
    }
  },
}));
