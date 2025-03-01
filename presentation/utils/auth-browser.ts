// presentation/utils/auth-browser.ts
import * as Linking from "expo-linking";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { Alert, Platform } from "react-native";

/**
 * Clase utilitaria para manejar la autenticación a través del navegador externo
 */
export class AuthBrowser {
  /**
   * Abre una URL en el navegador externo con el token de autenticación
   * @param url URL base a abrir
   * @param options Opciones adicionales
   * @returns Promise que se resuelve cuando se ha abierto el navegador
   */
  static async openAuthUrl(
    url: string,
    options: {
      showAlert?: boolean;
      alertTitle?: string;
      alertMessage?: string;
      additionalParams?: Record<string, string>;
    } = {},
  ): Promise<boolean> {
    try {
      // Obtener el token almacenado
      const token = await SecureStorageAdapter.getItem("token");

      if (!token) {
        console.warn("No token available for authentication");
        // Si no hay token, abrimos la URL sin autenticación
        return await Linking.openURL(url);
      }

      // Construir URL con token de autenticación
      const urlObj = new URL(url);

      // Añadir token como parámetro de autenticación
      urlObj.searchParams.append("auth_token", token);

      // Añadir parámetros adicionales si se proporcionan
      if (options.additionalParams) {
        Object.entries(options.additionalParams).forEach(([key, value]) => {
          urlObj.searchParams.append(key, value);
        });
      }

      // Añadir parámetro para identificar origen (app móvil)
      urlObj.searchParams.append("source", "mobile_app");

      // URL final con todos los parámetros
      const authUrl = urlObj.toString();

      // Mostrar alerta antes de abrir el navegador (opcional)
      if (options.showAlert) {
        return new Promise((resolve) => {
          Alert.alert(
            options.alertTitle || "Abriendo navegador",
            options.alertMessage ||
              "Se abrirá el navegador para completar el proceso",
            [
              {
                text: "Cancelar",
                style: "cancel",
                onPress: () => resolve(false),
              },
              {
                text: "Continuar",
                onPress: async () => {
                  const opened = await Linking.openURL(authUrl);
                  resolve(!!opened);
                },
              },
            ],
          );
        });
      }

      // Abrir directamente sin alerta
      return await Linking.openURL(authUrl);
    } catch (error) {
      console.error("Error opening auth URL:", error);
      Alert.alert(
        "Error",
        "No se pudo abrir el navegador. Por favor, intenta nuevamente.",
      );
      return false;
    }
  }

  /**
   * Método especializado para abrir la URL de pago con autenticación
   */
  static async openPaymentUrl(
    paymentUrl: string,
    orderId: string,
  ): Promise<boolean> {
    return this.openAuthUrl(paymentUrl, {
      showAlert: true,
      alertTitle: "Procesando Pago",
      alertMessage:
        "Se abrirá el navegador para completar el pago. Tu sesión se mantendrá automáticamente.",
      additionalParams: {
        order_id: orderId,
        return_url: Linking.createURL("/order/" + orderId),
      },
    });
  }
}
