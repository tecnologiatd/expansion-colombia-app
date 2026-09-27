// services/device.service.ts
import { Platform } from "react-native";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { backendApi } from "@/core/api/wordpress-api";
import * as Crypto from "expo-crypto";

export class DeviceService {
  private static PUSH_TOKEN_KEY = "pushToken";
  private static INSTALLATION_ID_KEY = "pushInstallationId";

  public static deviceInfo = {
    platform: Platform.OS,
    osVersion: Platform.Version,
  };

  // Guardar token push localmente
  static async savePushToken(token: string): Promise<void> {
    await SecureStorageAdapter.setItem(this.PUSH_TOKEN_KEY, token);
  }

  // Obtener token push almacenado
  static async getPushToken(): Promise<string | null> {
    return await SecureStorageAdapter.getItem(this.PUSH_TOKEN_KEY);
  }

  // Registrar dispositivo en el backend
  private static async getInstallationId(): Promise<string> {
    let id = await SecureStorageAdapter.getItem(this.INSTALLATION_ID_KEY);
    if (!id) {
      id = Crypto.randomUUID();
      await SecureStorageAdapter.setItem(this.INSTALLATION_ID_KEY, id);
    }
    return id;
  }

  static async registerDevice(): Promise<void> {
    const token = await this.getPushToken();
    if (token) {
      try {
        await backendApi.post("/devices/", {
          token,
          installationId: await this.getInstallationId(),
        });
      } catch (error) {
        console.error("Error registering device:", error);
        // Non-fatal: token saved locally, will retry on next login
      }
    }
  }

  static async detachCurrentUser(): Promise<void> {
    const token = await this.getPushToken();
    if (!token) return;
    try {
      await backendApi.delete("/devices/current", { data: { token } });
    } catch {
      // Broadcast registration remains valid; user association will be replaced on next login.
    }
  }
}
