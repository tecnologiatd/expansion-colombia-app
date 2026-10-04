// presentation/utils/auth-browser.ts
import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";
import { browserReturned } from "@/core/checkout/payment-policy";

/**
 * Clase utilitaria para abrir el pago de WordPress en una sesión de navegador
 * dentro de la app.
 */
export class AuthBrowser {
  /**
   * Abre una URL en una sesión de navegador del sistema y espera a que se cierre
   * o a que la página redirija a `returnUrl`.
   * En iOS la sesión es efímera: no comparte cookies con Safari, así que una
   * sesión vieja de otra cuenta no puede bloquear el pago.
   * @returns true al retornar; nunca representa confirmación de pago.
   */
  static async openAuthUrl(
    url: string,
    returnUrl: string,
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
        Alert.alert(
          "Error",
          "Actualiza el pedido para obtener un enlace de pago nuevo.",
        );
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

      const openSession = async () => {
        try {
          const result = await WebBrowser.openAuthSessionAsync(
            authUrl,
            returnUrl,
            {
              preferEphemeralSession: true,
            },
          );
          // "locked": ya hay otra sesión de navegador abierta
          return browserReturned(result.type);
        } catch (error) {
          console.error("Error opening URL:", error);
          Alert.alert(
            "Error",
            "No se pudo abrir el navegador. Por favor intente nuevamente.",
          );
          return false;
        }
      };

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
                onPress: async () => resolve(await openSession()),
              },
            ],
          );
        });
      }

      // Abrir directamente sin alerta
      return await openSession();
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
   * Abre el pago del pedido y resuelve cuando el usuario vuelve a la app.
   */
  static async openPaymentUrl(
    paymentUrl: string,
    orderId: string,
  ): Promise<boolean> {
    try {
      // Usar directamente el esquema de la app para la URL de retorno
      const appReturnUrl = `expansioncolombia://order/${orderId}`;

      return this.openAuthUrl(paymentUrl, appReturnUrl, {
        showAlert: true,
        alertTitle: "Procesando Pago",
        alertMessage:
          "Se abrirá la página de pago segura. Al terminar volverás automáticamente a la aplicación.",
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
