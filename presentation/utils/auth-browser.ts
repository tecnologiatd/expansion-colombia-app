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

      // Verificar si ya existe un parámetro auth_token
      const existingAuthToken = urlObj.searchParams.get("auth_token");

      // Solo añadir el token si no existe ya
      if (!existingAuthToken) {
        urlObj.searchParams.append("auth_token", token);
      }

      // Añadir parámetros adicionales si se proporcionan
      if (options.additionalParams) {
        Object.entries(options.additionalParams).forEach(([key, value]) => {
          // Verificar si ya existe el parámetro antes de añadirlo
          if (!urlObj.searchParams.has(key)) {
            urlObj.searchParams.append(key, value);
          }
        });
      }

      // Añadir parámetro para identificar origen (app móvil)
      if (!urlObj.searchParams.has("source")) {
        urlObj.searchParams.append("source", "mobile_app");
      }

      // URL final con todos los parámetros
      const authUrl = urlObj.toString();
      console.log("Opening payment URL:", authUrl); // Debug

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
                  try {
                    const opened = await Linking.openURL(authUrl);
                    resolve(!!opened);
                  } catch (error) {
                    console.error("Error opening URL:", error);
                    Alert.alert(
                      "Error",
                      "No se pudo abrir el navegador. Por favor intente nuevamente.",
                    );
                    resolve(false);
                  }
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
    try {
      // Usar directamente el esquema de la app para la URL de retorno
      const appReturnUrl = `expansioncolombia://order/${orderId}`;

      // Extraer URL base sin parámetros para evitar conflictos
      let baseUrl = paymentUrl;
      const questionMarkIndex = paymentUrl.indexOf("?");

      if (questionMarkIndex !== -1) {
        // Si ya tiene parámetros, usamos la URL completa
        // y confiamos en la verificación de parámetros duplicados
        baseUrl = paymentUrl;
      }

      return this.openAuthUrl(baseUrl, {
        showAlert: true,
        alertTitle: "Procesando Pago",
        alertMessage:
          "Se abrirá el navegador para completar el pago. Tu sesión se mantendrá automáticamente.",
        additionalParams: {
          order_id: orderId,
          return_url: appReturnUrl,
        },
      });
    } catch (error) {
      console.error("Error preparing payment URL:", error);
      Alert.alert(
        "Error",
        "No se pudo preparar la URL de pago. Por favor, intenta nuevamente.",
      );
      return false;
    }
  }
}
