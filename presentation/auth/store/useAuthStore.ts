import { create } from "zustand";
import { AuthStore, User } from "@/core/interfaces/auth";
import {authCheckStatus, authLogin, authRegister} from "@/core/auth/actions/auth-actions";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";

export const useAuthStore = create<AuthStore>()((set, get) => ({
  status: "checking",
  token: undefined,
  user: undefined,

  changeStatus: async (token?: string, user?: User) => {
    console.log("before if", token, user);
    if (!token || !user) {
      set({ status: "unauthenticated", token: undefined, user: undefined });
      await SecureStorageAdapter.deleteItem("token");
      return false;
    }
    console.log("after if", token, user);

    set({
      status: "authenticated",
      token: token,
      user: user,
    });

    await SecureStorageAdapter.setItem("token", token);
    console.log("after set", token, user);

    const toke = await SecureStorageAdapter.getItem("token", token);
    console.log("after set", toke);
    return true;
  },

  login: async (username: string, password: string) => {
    const resp = await authLogin(username, password);
    console.log("login: ", resp);

    return get().changeStatus(resp?.token, resp?.user);
  },
  register: async (username: string, email: string, password: string) => {
    const resp = await authRegister(username, email, password);
    console.log("register: ", resp);

    return get().changeStatus(resp?.token, resp?.user);
  },
  // TODO: Si es error de conexión, mantén el token y estado
  checkStatus: async () => {
    try {
      // 1. Verificar el token almacenado
      const storedToken = await SecureStorageAdapter.getItem("token");
      console.log("Token almacenado:", storedToken); // Debug

      if (!storedToken) {
        console.log("No hay token almacenado"); // Debug
        set({ status: "unauthenticated", token: undefined, user: undefined });
        return;
      }

      // 2. Validar el token
      console.log("Intentando validar token..."); // Debug
      const resp = await authCheckStatus();
      console.log("Respuesta de validación:", resp); // Debug

      if (!resp) {
        console.log("La validación del token falló"); // Debug
        set({ status: "unauthenticated", token: undefined, user: undefined });
        await SecureStorageAdapter.deleteItem("token");
        return;
      }

      // 3. Actualizar estado si es válido
      console.log("Token válido, actualizando estado"); // Debug
      set({
        status: "authenticated",
        token: resp.token,
        user: resp.user,
      });
    } catch (error) {
      console.log("Error en checkStatus:", error); // Debug
      set({ status: "unauthenticated", token: undefined, user: undefined });
      await SecureStorageAdapter.deleteItem("token");
    }
  },

  logout: async () => {
    await SecureStorageAdapter.deleteItem("token");
    set({ status: "unauthenticated", token: undefined, user: undefined });
  },
}));
