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

        // Simplificamos la URL - para iOS es mejor no sobrecargar con parámetros
        if (Platform.OS === "ios") {
          setAuthUrl(paymentUrl);
        } else {
          // En Android seguimos añadiendo el token como parámetro
          if (storedToken && paymentUrl) {
            const url = new URL(paymentUrl);
            url.searchParams.append("auth_token", storedToken);
            setAuthUrl(url.toString());
          } else {
            setAuthUrl(paymentUrl);
          }
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
    if (webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  };

  // Script muy simplificado para iOS
  const getInjectedJavaScript = () => {
    // En iOS, usamos un script minimalista
    if (Platform.OS === "ios") {
      return `
        (function() {
          // Notificar página cargada
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'PAGE_LOADED'}));
          
          // Detectar confirmación o error
          function checkStatus() {
            if (window.location.href.includes('order-received') || 
                window.location.href.includes('thank-you')) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYMENT_COMPLETED', orderId: '${orderId}'
              }));
            }
            
            const errorElements = document.querySelectorAll('.woocommerce-error');
            if (errorElements.length > 0) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYMENT_ERROR', message: 'Error en el proceso de pago'
              }));
            }
          }
          
          // Ejecutar cuando el DOM esté listo
          if (document.readyState !== 'loading') {
            checkStatus();
          } else {
            document.addEventListener('DOMContentLoaded', checkStatus);
          }
          
          // Revisar de nuevo después de un tiempo
          setTimeout(checkStatus, 1000);
          
          return true;
        })();
      `;
    }

    // Para Android, usamos el script completo
    return `
      (function() {
        // Establecer token en cookies y localStorage
        document.cookie = "wp_auth_token=${token}; path=/";
        localStorage.setItem('wp_auth_token', '${token}');
        
        // Notificar al WebView
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PAGE_LOADED'
        }));
        
        // Detectar estado de página
        function checkPageStatus() {
          // Comprobar si estamos en una página de confirmación
          if (window.location.href.includes('/order-received/') || 
              window.location.href.includes('/thank-you/')) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_COMPLETED',
              orderId: '${orderId}'
            }));
          }
          
          // Detectar errores
          const errorElements = document.querySelectorAll('.woocommerce-error');
          if (errorElements.length > 0) {
            let errorMsg = '';
            errorElements.forEach(el => errorMsg += el.textContent + ' ');
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_ERROR',
              message: errorMsg.trim()
            }));
          }
        }
        
        // Ejecutar inicial
        checkPageStatus();
        
        // Ejecutar cuando haya cambios
        const observer = new MutationObserver(checkPageStatus);
        observer.observe(document.body, { 
          childList: true, 
          subtree: true 
        });
        
        return true;
      })();
    `;
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case "PAGE_LOADED":
          // Asegurar que el indicador de carga se oculte después de un tiempo prudente
          setTimeout(() => {
            setIsLoading(false);
            setProgressPercent(100);
          }, 500);
          break;

        case "PAYMENT_COMPLETED":
          onClose();
          router.replace(`/order/${orderId}`);
          break;

        case "PAYMENT_ERROR":
          Alert.alert(
            "Error en el pago",
            data.message || "Ha ocurrido un error procesando tu pago.",
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
          break;
      }
    } catch (error) {
      console.log("Error procesando mensaje del WebView:", error);
    }
  };

  const handleNavigationStateChange = (navState) => {
    // Detectar página de confirmación por URL
    if (
      navState.url.includes("/order-received/") ||
      navState.url.includes("/thank-you/")
    ) {
      onClose();
      router.replace(`/order/${orderId}`);
    }

    // Asegurar que isLoading se actualice correctamente
    if (navState.loading) {
      setProgressStage("Cargando " + navState.title || "página");
    } else if (!isLoading) {
      // Ya está cargado, no hacemos nada
    } else {
      // Forzar fin de carga después de un tiempo prudencial
      setTimeout(() => {
        setIsLoading(false);
        setProgressPercent(100);
      }, 500);
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setProgressPercent(10);
    setProgressStage("Iniciando conexión...");
  };

  const handleLoadEnd = () => {
    // Dar un poco más de tiempo antes de ocultar el indicador
    setTimeout(
      () => {
        setIsLoading(false);
        setProgressPercent(100);
      },
      Platform.OS === "ios" ? 1000 : 300,
    );
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    setError(`Error al cargar la página: ${nativeEvent.description}`);
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
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
          <Text style={styles.headerTitle}>Completar Pago</Text>
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
              javaScriptEnabled={true}
              domStorageEnabled={true}
              sharedCookiesEnabled={true}
              mediaPlaybackRequiresUserAction={true}
              allowsInlineMediaPlayback={true}
              userAgent={userAgent}
              // Cookies
              sharedCookiesEnabled={true}
              thirdPartyCookiesEnabled={Platform.OS === "android"}
              // iOS específico
              useWebKit={true}
              applicationNameForUserAgent="ExpansionColombia/1.0"
              decelerationRate="normal"
              allowsBackForwardNavigationGestures={true}
              // Evitar redibujados innecesarios
              cacheEnabled={true}
              cacheMode="LOAD_DEFAULT"
              incognito={false}
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
