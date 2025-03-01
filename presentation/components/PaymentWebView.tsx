// presentation/components/PaymentWebView.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  BackHandler,
  Linking,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

interface PaymentWebViewProps {
  visible: boolean;
  paymentUrl: string;
  orderId: string;
  onClose: () => void;
}

export const PaymentWebView: React.FC<PaymentWebViewProps> = ({
  visible,
  paymentUrl,
  orderId,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progressStage, setProgressStage] = useState(
    "Preparando pasarela de pago...",
  );
  const [token, setToken] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isOpenPay, setIsOpenPay] = useState(false);

  // Función para simular progreso de carga
  const simulateProgress = () => {
    setProgressPercent(10);

    // Primer estado: Preparando pasarela (0-30%)
    const timer1 = setTimeout(() => {
      setProgressPercent(30);
      setProgressStage("Estableciendo conexión segura...");
    }, 1000);

    // Segundo estado: Estableciendo conexión (30-60%)
    const timer2 = setTimeout(() => {
      setProgressPercent(60);
      setProgressStage("Autenticando sesión...");
    }, 2500);

    // Tercer estado: Autenticando (60-90%)
    const timer3 = setTimeout(() => {
      setProgressPercent(90);
      setProgressStage("Cargando opciones de pago...");
    }, 4000);

    // Limpiar timers cuando se desmonta
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  useEffect(() => {
    // Iniciar la simulación de progreso
    const clearProgress = simulateProgress();

    // Cargar el token y preparar URL
    const loadToken = async () => {
      try {
        const storedToken = await SecureStorageAdapter.getItem("token");
        setToken(storedToken);

        if (storedToken && paymentUrl) {
          const url = new URL(paymentUrl);
          url.searchParams.append("auth_token", storedToken);
          setAuthUrl(url.toString());
        } else {
          setAuthUrl(paymentUrl);
        }
      } catch (e) {
        console.error("Error cargando token:", e);
        setAuthUrl(paymentUrl);
      }
    };

    loadToken();

    // Manejar el botón de retroceso en Android
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (visible) {
          handleGoBack();
          return true;
        }
        return false;
      },
    );

    return () => {
      backHandler.remove();
      clearProgress();
    };
  }, [visible, paymentUrl]);

  const handleGoBack = () => {
    if (isOpenPay) {
      // Si OpenPay está activo, mostrar una alerta especial
      Alert.alert("Procesando pago", "¿Estás seguro de que deseas cancelar?", [
        { text: "No", style: "cancel" },
        { text: "Sí, cancelar", style: "destructive", onPress: onClose },
      ]);
      return true;
    }

    if (webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  };

  // Script para inyectar en el WebView
  const getInjectedJavaScript = () => {
    if (!token) return "";

    return `
      (function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SCRIPT_LOADED',
          platform: '${Platform.OS}'
        }));
        
        // Establecer token para autenticación
        document.cookie = "wp_auth_token=${token}; path=/";
        try {
          localStorage.setItem('wp_auth_token', '${token}');
        } catch(e) {
          console.log('Error en localStorage', e);
        }
        
        // Detectar PSE o tarjetas
        function detectPaymentMethod() {
          if (document.querySelector('[name="payment_method"][value="openpay_pse"]')) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_METHOD_DETECTED',
              method: 'pse'
            }));
          } else if (document.querySelector('[name="payment_method"][value="openpay_cards"]')) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_METHOD_DETECTED',
              method: 'card'
            }));
          }
        }
        
        // Detectar página de éxito o error
        function checkPageStatus() {
          if (window.location.href.includes('/order-received/') || 
              window.location.href.includes('/thank-you/')) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_COMPLETED',
              orderId: '${orderId}'
            }));
          }
          
          const errorElements = document.querySelectorAll('.woocommerce-error, .payment-error');
          if (errorElements.length > 0) {
            let errorMsg = '';
            errorElements.forEach(el => errorMsg += el.textContent + ' ');
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_ERROR',
              message: errorMsg.trim()
            }));
          }
        }
        
        // Ejecutar cuando el DOM esté listo
        function onPageReady() {
          detectPaymentMethod();
          checkPageStatus();
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', onPageReady);
        } else {
          onPageReady();
        }
        
        // Observar cambios en el DOM
        try {
          const observer = new MutationObserver(function() {
            detectPaymentMethod();
            checkPageStatus();
          });
          
          observer.observe(document.body, { 
            childList: true, 
            subtree: true 
          });
        } catch(e) {
          console.log('Error con observer', e);
        }
        
        // Poner un mensaje de carga completada
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PAGE_LOADED'
        }));
        
        return true;
      })();
    `;
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case "SCRIPT_LOADED":
          console.log("Script cargado en:", data.platform);
          break;

        case "PAGE_LOADED":
          // Finalizar carga después de un tiempo prudencial
          setTimeout(() => {
            setIsLoading(false);
            setProgressPercent(100);
          }, 800);
          break;

        case "PAYMENT_METHOD_DETECTED":
          console.log("Método de pago detectado:", data.method);
          setIsOpenPay(true);
          if (data.method === "pse") {
            setProgressStage("Preparando pago PSE...");
          } else if (data.method === "card") {
            setProgressStage("Preparando pago con tarjeta...");
          }
          break;

        case "PAYMENT_COMPLETED":
          console.log("Pago completado");
          onClose();
          router.replace(`/order/${orderId}`);
          break;

        case "PAYMENT_ERROR":
          console.log("Error en pago:", data.message);
          // Si es error de OpenPay, ofrecer navegador externo
          if (
            data.message &&
            (data.message.includes("1002") ||
              data.message.toLowerCase().includes("openpay") ||
              data.message.toLowerCase().includes("pse"))
          ) {
            Alert.alert(
              "Error en la pasarela de pago",
              "Se ha detectado un problema con la pasarela de pago. ¿Deseas continuar en el navegador externo?",
              [
                { text: "Cancelar", style: "cancel", onPress: onClose },
                {
                  text: "Abrir en navegador",
                  onPress: async () => {
                    await Linking.openURL(paymentUrl);
                    onClose();
                  },
                },
              ],
            );
          } else {
            Alert.alert(
              "Error en el pago",
              data.message || "Ha ocurrido un error procesando tu pago.",
              [{ text: "OK", onPress: onClose }],
            );
          }
          break;
      }
    } catch (error) {
      console.log("Error procesando mensaje del WebView:", error);
    }
  };

  const handleNavigationStateChange = (navState) => {
    // Detectar página de éxito por URL
    if (
      navState.url.includes("/order-received/") ||
      navState.url.includes("/thank-you/")
    ) {
      console.log("Navegación a página de éxito");
      onClose();
      router.replace(`/order/${orderId}`);
    }

    // Detectar páginas de OpenPay
    if (
      navState.url.includes("openpay") ||
      navState.url.includes("bancolombia") ||
      navState.url.includes("pse")
    ) {
      console.log("Navegación a página de OpenPay o PSE");
      setIsOpenPay(true);
    }

    // Actualizar etapa de carga
    if (navState.loading) {
      setProgressStage(`Cargando ${navState.title || "página"}...`);
    } else if (progressPercent < 100) {
      setProgressPercent(99);
      setTimeout(() => {
        setIsLoading(false);
        setProgressPercent(100);
      }, 500);
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setProgressPercent(20);
  };

  const handleLoadEnd = () => {
    // Gradualmente ocultar la pantalla de carga para una experiencia más suave
    setTimeout(
      () => {
        setProgressPercent(95);
        setTimeout(() => {
          setIsLoading(false);
          setProgressPercent(100);
        }, 500);
      },
      Platform.OS === "ios" ? 1000 : 500,
    );
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView error:", nativeEvent);
    setError(
      `Error al cargar la página: ${nativeEvent.description || "Error desconocido"}`,
    );
    setIsLoading(false);
  };

  const openInBrowser = async () => {
    try {
      await Linking.openURL(paymentUrl);
      onClose();
    } catch (e) {
      Alert.alert("Error", "No se pudo abrir el navegador externo");
    }
  };

  // User Agent optimizado por plataforma
  const userAgent = Platform.select({
    ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    android: undefined, // Usar el default en Android
    default: undefined,
  });

  // Propiedades específicas de iOS
  const iosSpecificProps =
    Platform.OS === "ios"
      ? {
          allowsBackForwardNavigationGestures: true,
          applicationNameForUserAgent: "ExpansionColombia/1.0",
          decelerationRate: "normal",
          useWebKit: true,
        }
      : {};

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        Alert.alert(
          "Cancelar pago",
          "¿Estás seguro que deseas cancelar este pago?",
          [
            { text: "No", style: "cancel" },
            { text: "Sí", onPress: onClose },
          ],
        );
      }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              Alert.alert(
                "Cancelar pago",
                "¿Estás seguro que deseas cancelar este pago?",
                [
                  { text: "No", style: "cancel" },
                  { text: "Sí", onPress: onClose },
                ],
              );
            }}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isOpenPay ? "Procesando Pago" : "Completar Pago"}
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              if (webViewRef.current) {
                setIsLoading(true);
                setProgressPercent(0);
                simulateProgress();
                webViewRef.current.reload();
              }
            }}
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Pantalla de carga mejorada */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7B3DFF" />
            <Text style={styles.loadingText}>{progressStage}</Text>

            {/* Barra de progreso */}
            <View style={styles.progressBarContainer}>
              <View
                style={[styles.progressBar, { width: `${progressPercent}%` }]}
              />
            </View>

            {/* Mensaje de paciencia después de unos segundos */}
            {progressPercent > 60 && (
              <Text style={styles.loadingHint}>
                La pasarela de pago puede tardar unos segundos en cargar...
              </Text>
            )}

            {/* Botón alternativo después de 10 segundos */}
            {progressPercent > 80 && (
              <TouchableOpacity
                style={styles.alternateButton}
                onPress={openInBrowser}
              >
                <Text style={styles.alternateButtonText}>
                  Abrir en navegador externo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.errorButton}
              onPress={openInBrowser}
            >
              <Text style={styles.errorButtonText}>Abrir en navegador</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.errorButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.errorButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          authUrl && (
            <WebView
              ref={webViewRef}
              source={{ uri: authUrl }}
              style={styles.webView}
              onLoadStart={handleLoadStart}
              onLoadEnd={handleLoadEnd}
              injectedJavaScript={getInjectedJavaScript()}
              onMessage={handleMessage}
              onNavigationStateChange={handleNavigationStateChange}
              onError={handleError}
              // Props básicas para ambas plataformas
              javaScriptEnabled={true}
              domStorageEnabled={true}
              sharedCookiesEnabled={true}
              mediaPlaybackRequiresUserAction={true}
              allowsInlineMediaPlayback={true}
              userAgent={userAgent}
              // Configuración de caché
              cacheEnabled={true}
              // Props específicas de iOS
              {...iosSpecificProps}
            />
          )
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F1F1F",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  webView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111111",
    zIndex: 5,
    padding: 20,
  },
  loadingText: {
    color: "white",
    marginTop: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  loadingHint: {
    color: "#A3A3A3",
    marginTop: 20,
    fontSize: 14,
    textAlign: "center",
  },
  progressBarContainer: {
    width: "80%",
    height: 8,
    backgroundColor: "#333333",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#7B3DFF",
  },
  alternateButton: {
    marginTop: 30,
    backgroundColor: "#374151",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  alternateButtonText: {
    color: "white",
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#111111",
  },
  errorText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: "#7B3DFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#374151",
  },
  errorButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PaymentWebView;
