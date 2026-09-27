// presentation/utils/auth-browser.ts
import * as Linking from "expo-linking";
import { Alert } from "react-native";

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
      // El backend entrega un permiso de pago breve y limitado al pedido.
      const urlObj = new URL(url);
      if (!urlObj.searchParams.has("auth_token")) {
        Alert.alert("Error", "Actualiza el pedido para obtener un enlace de pago nuevo.");
        return false;
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

      return this.openAuthUrl(paymentUrl, {
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
