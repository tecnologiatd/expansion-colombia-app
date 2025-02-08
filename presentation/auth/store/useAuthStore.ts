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
        });
      } catch (error) {
        console.error("Error fetching user role:", error);
        // Si falla la obtención del rol, continuar con el login pero sin rol
        set({
          status: "authenticated",
          token: resp.token,
          user: resp.user,
        });
      }

      await SecureStorageAdapter.setItem("token", resp.token);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  },

  checkStatus: async () => {
    try {
      const storedToken = await SecureStorageAdapter.getItem("token");

      if (!storedToken) {
        set({ status: "unauthenticated", token: undefined, user: undefined });
        return false;
      }

      backendApi.defaults.headers.common["Authorization"] =
        `Bearer ${storedToken}`;

      const resp = await authCheckStatus();

      if (!resp?.user) {
        set({ status: "unauthenticated", token: undefined, user: undefined });
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
        });
      } catch (error) {
        console.error("Error fetching user role:", error);
        set({
          status: "authenticated",
          token: storedToken,
          user: resp.user,
        });
      }

      return true;
    } catch (error) {
      console.error("Check status error:", error);
      set({ status: "unauthenticated", token: undefined, user: undefined });
      await SecureStorageAdapter.deleteItem("token");
      return false;
    }
  },

  logout: async () => {
    await SecureStorageAdapter.deleteItem("token");
    delete backendApi.defaults.headers.common["Authorization"];
    set({ status: "unauthenticated", token: undefined, user: undefined });
  },
}));
