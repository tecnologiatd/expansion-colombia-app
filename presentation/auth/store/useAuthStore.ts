// presentation/auth/store/useAuthStore.ts
import { create } from "zustand";
import { AuthStore, User } from "@/core/interfaces/auth";
import {
  authCheckStatus,
  authLogin,
  authRegister,
} from "@/core/auth/actions/auth-actions";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { backendApi } from "@/core/api/wordpress-api";

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

      // Configurar el token
      backendApi.defaults.headers.common["Authorization"] =
        `Bearer ${resp.token}`;

      try {
        // Obtener información del usuario incluyendo el rol
        const customerResp = await backendApi.get("/customer");
        const role = customerResp.data.role || "subscriber";

        // Actualizar el estado con la información completa
        set({
          status: "authenticated",
          token: resp.token,
          user: {
            ...resp.user,
            role,
          },
          error: null, // Resetear cualquier error previo
        });
      } catch (error) {
        console.error("Error fetching user role:", error);
        // Si falla la obtención del rol, continuar con el login pero sin rol
        set({
          status: "authenticated",
          token: resp.token,
          user: resp.user,
          error: null, // Resetear cualquier error previo
        });
      }

      await SecureStorageAdapter.setItem("token", resp.token);
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
    try {
      const storedToken = await SecureStorageAdapter.getItem("token");

      if (!storedToken) {
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

      const resp = await authCheckStatus();

      if (!resp?.user) {
        set({
          status: "unauthenticated",
          token: undefined,
          user: undefined,
          error: null,
        });
        await SecureStorageAdapter.deleteItem("token");
        return false;
      }

      try {
        // Obtener información del usuario incluyendo el rol
        const customerResp = await backendApi.get("/customer");
        const role = customerResp.data.role || "subscriber";

        set({
          status: "authenticated",
          token: storedToken,
          user: {
            ...resp.user,
            role,
          },
          error: null,
        });
      } catch (error) {
        console.error("Error fetching user role:", error);
        set({
          status: "authenticated",
          token: storedToken,
          user: resp.user,
          error: null,
        });
      }

      return true;
    } catch (error) {
      console.error("Check status error:", error);
      set({
        status: "unauthenticated",
        token: undefined,
        user: undefined,
        error: null,
      });
      await SecureStorageAdapter.deleteItem("token");
      return false;
    }
  },

  logout: async () => {
    await SecureStorageAdapter.deleteItem("token");
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

      try {
        const customerResp = await backendApi.get("/customer");
        const role = customerResp.data.role || "subscriber";

        set({
          status: "authenticated",
          token: resp.data.token,
          user: {
            ...resp.data.user,
            role,
          },
          error: null,
        });
      } catch (error) {
        console.error("Error fetching user role:", error);
        set({
          status: "authenticated",
          token: resp.data.token,
          user: resp.data.user,
          error: null,
        });
      }

      await SecureStorageAdapter.setItem("token", resp.data.token);
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
