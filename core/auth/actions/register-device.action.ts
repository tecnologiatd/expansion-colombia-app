// services/device.service.ts
import { Platform } from "react-native";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { backendApi } from "@/core/api/wordpress-api";

export class DeviceService {
  private static PUSH_TOKEN_KEY = "pushToken";

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
  static async registerDevice(userId?: string): Promise<void> {
    const token = await this.getPushToken();
    if (token) {
      try {
        await backendApi.post("/devices/", {
          token,
          userId,
        });
      } catch (error) {
        console.error("Error registering device:", error);
        // Non-fatal: token saved locally, will retry on next login
      }
    }
  }
}
