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
  const [token, setToken] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [openpayActive, setOpenpayActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar el token y preparar URL con autenticación
    const loadToken = async () => {
      try {
        const storedToken = await SecureStorageAdapter.getItem("token");
        setToken(storedToken);

        if (storedToken && paymentUrl) {
          // Añadir token como parámetro de URL para que el plugin lo detecte
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

    return () => backHandler.remove();
  }, [visible, paymentUrl]);

  const handleGoBack = () => {
    if (openpayActive) {
      // Si OpenPay está activo, mostrar una alerta especial
      Alert.alert(
        "Procesando pago",
        "Hay un proceso de pago en curso. ¿Estás seguro de que deseas cancelar?",
        [
          { text: "No", style: "cancel" },
          { text: "Sí, cancelar", style: "destructive", onPress: onClose },
        ],
      );
      return true;
    }

    if (webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  };

  // Script para inyectar en el WebView con manejo especial para OpenPay
  const getInjectedJavaScript = () => {
    if (!token) return "";

    return `
      (function() {
        console.log('Iniciando integración mejorada para OpenPay...');
        
        // 1. Establecer cookies para autenticación
        document.cookie = "wp_auth_token=${token}; path=/";
        
        // 2. Almacenar token en localStorage
        localStorage.setItem('wp_auth_token', '${token}');
        
        // Variables para estado
        let loginDetected = false;
        let openpayDetected = false;
        let checkoutForm = null;
        
        // Función para manejar formularios de login
        function handleLoginForms() {
          if (loginDetected) return;
          
          const loginForms = document.querySelectorAll('form.login, form.woocommerce-form-login, #loginform');
          if (loginForms.length > 0) {
            console.log('Formulario de login detectado');
            loginDetected = true;
            
            // Notificar a la app
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'LOGIN_FORM_DETECTED',
              url: window.location.href
            }));
            
            // Intentar agregar un campo oculto con el token
            loginForms.forEach(form => {
              const tokenInput = document.createElement('input');
              tokenInput.type = 'hidden';
              tokenInput.name = 'auth_token';
              tokenInput.value = '${token}';
              form.appendChild(tokenInput);
              
              // Auto-enviar formulario después de un retraso
              setTimeout(() => {
                form.submit();
              }, 500);
            });
          }
        }
        
        // Función para detectar y mejorar la integración con OpenPay
        function enhanceOpenPay() {
          // Detectar formularios de OpenPay
          const openpayElements = document.querySelectorAll(
            '.openpay-payment-form, .payment_method_openpay_cards, .payment_method_openpay_pse, form#add_payment_method'
          );
          
          if (openpayElements.length > 0 && !openpayDetected) {
            console.log('OpenPay detectado en la página');
            openpayDetected = true;
            
            // Notificar a la app
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'OPENPAY_DETECTED'
            }));
            
            // Agregar variables para depuración
            window.openPayDebug = {
              token: '${token}',
              loggedIn: !!document.querySelector('.woocommerce-MyAccount-content')
            };
            
            // Optimizaciones específicas para OpenPay
            try {
              // 1. Asegurar que las cookies estén disponibles para OpenPay
              document.cookie = "wordpress_logged_in_token=${token}; path=/";
              
              // 2. Mejorar el estado de la sesión
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('wp_session_active', 'true');
                sessionStorage.setItem('wp_customer_session', '${token}');
              }
              
              // 3. Pre-llenar campos ocultos si existen
              const hiddenFields = document.querySelectorAll('input[type="hidden"]');
              hiddenFields.forEach(field => {
                if (field.name.includes('nonce') || field.name.includes('token') || field.name.includes('auth')) {
                  console.log('Encontrado campo:', field.name);
                  // Si el campo está vacío, intentar llenarlo desde datos de sesión
                  if (!field.value && field.name.includes('nonce')) {
                    const nonceElements = document.querySelectorAll('[data-nonce], [data-security]');
                    nonceElements.forEach(el => {
                      const nonce = el.getAttribute('data-nonce') || el.getAttribute('data-security');
                      if (nonce) field.value = nonce;
                    });
                  }
                }
              });
            } catch (e) {
              console.error('Error optimizando OpenPay:', e);
            }
          }
        }
        
        // Función para verificar el checkout
        function enhanceCheckoutProcess() {
          // Buscar el formulario de checkout
          const checkoutForms = document.querySelectorAll('form.checkout, form.woocommerce-checkout');
          
          if (checkoutForms.length > 0 && !checkoutForm) {
            checkoutForm = checkoutForms[0];
            console.log('Formulario de checkout detectado');
            
            // Asegurar nonces y tokens
            const nonceFields = checkoutForm.querySelectorAll('input[name*="nonce"]');
            if (nonceFields.length === 0) {
              console.log('No se encontraron campos nonce en el checkout');
              
              // Intentar obtener nonce de la página
              const nonceData = document.querySelector('[data-nonce]');
              if (nonceData) {
                const nonce = nonceData.getAttribute('data-nonce');
                if (nonce) {
                  const nonceInput = document.createElement('input');
                  nonceInput.type = 'hidden';
                  nonceInput.name = 'woocommerce-process-checkout-nonce';
                  nonceInput.value = nonce;
                  checkoutForm.appendChild(nonceInput);
                  console.log('Nonce añadido al formulario:', nonce);
                }
              }
            }
            
            // Añadir campo de token de usuario si no existe
            const userTokenField = checkoutForm.querySelector('input[name="user_token"]');
            if (!userTokenField) {
              const tokenInput = document.createElement('input');
              tokenInput.type = 'hidden';
              tokenInput.name = 'user_token';
              tokenInput.value = '${token}';
              checkoutForm.appendChild(tokenInput);
              console.log('Token de usuario añadido al formulario');
            }
            
            // Monitorear envío del formulario
            checkoutForm.addEventListener('submit', function(e) {
              console.log('Formulario de checkout enviado');
              // Notificar a la app
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CHECKOUT_SUBMITTED'
              }));
            });
          }
        }
        
        // Función principal para mejorar toda la experiencia
        function enhancePaymentExperience() {
          handleLoginForms();
          enhanceOpenPay();
          enhanceCheckoutProcess();
          
          // Detectar confirmación de pago
          if (window.location.href.includes('/order-received/') || 
              window.location.href.includes('/thank-you/') ||
              document.querySelector('.woocommerce-order-received')) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_COMPLETED',
              orderId: '${orderId}'
            }));
          }
          
          // Detectar errores
          const errorElements = document.querySelectorAll('.woocommerce-error, .payment-error, .woocommerce-NoticeGroup-checkout .woocommerce-error');
          if (errorElements.length > 0) {
            let errorMessage = '';
            errorElements.forEach(el => {
              errorMessage += el.textContent + ' ';
            });
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_ERROR',
              message: errorMessage.trim()
            }));
          }
        }
        
        // Ejecutar cuando el DOM esté listo
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', enhancePaymentExperience);
        } else {
          enhancePaymentExperience();
        }
        
        // Observar cambios en el DOM
        const observer = new MutationObserver(enhancePaymentExperience);
        observer.observe(document.body, { 
          childList: true, 
          subtree: true 
        });
        
        // Monitorear eventos de pago de OpenPay
        window.addEventListener('message', function(event) {
          try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            
            if (data && data.type) {
              if (data.type.includes('openpay') || data.action && data.action.includes('openpay')) {
                console.log('Evento de OpenPay detectado:', data.type || data.action);
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'OPENPAY_EVENT',
                  data: data
                }));
              }
            }
          } catch (e) {
            // Ignorar errores de parseo
          }
        });
        
        true;
      })();
    `;
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case "PAYMENT_COMPLETED":
          // Cerrar WebView y navegar a la página de detalles del pedido
          onClose();
          router.replace(`/order/${orderId}`);
          break;

        case "PAYMENT_ERROR":
          const errorMsg =
            data.message || "Ha ocurrido un error procesando tu pago.";

          // Si es error específico de OpenPay 1002, mostrar mensaje y opciones específicas
          if (
            errorMsg.includes("1002") ||
            errorMsg.toLowerCase().includes("openpay")
          ) {
            Alert.alert(
              "Error en la pasarela de pago",
              "Se ha detectado un problema con la pasarela de pago (error 1002). ¿Deseas continuar en el navegador externo?",
              [
                { text: "Cancelar", style: "cancel" },
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
            Alert.alert("Error en el pago", errorMsg, [{ text: "OK" }]);
          }
          break;

        case "OPENPAY_DETECTED":
          console.log("OpenPay detectado en la página");
          setOpenpayActive(true);
          break;

        case "OPENPAY_EVENT":
          console.log("Evento de OpenPay:", data.data);
          break;

        case "LOGIN_FORM_DETECTED":
          console.log("Formulario de login detectado en:", data.url);
          break;

        case "CHECKOUT_SUBMITTED":
          console.log("Formulario de checkout enviado");
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

    // Detectar páginas de OpenPay
    if (navState.url.includes("openpay") || navState.url.includes("payment")) {
      setOpenpayActive(true);
    } else {
      setOpenpayActive(false);
    }

    // Si hay errores de carga
    if (navState.title && navState.title.includes("Error")) {
      setError("Error al cargar la página de pago");
    }
  };

  const handleError = (error) => {
    console.error("Error de WebView:", error);
    setError("Error al cargar la página de pago: " + error.description);
  };

  const openInBrowser = async () => {
    try {
      await Linking.openURL(paymentUrl);
      onClose();
    } catch (e) {
      Alert.alert("Error", "No se pudo abrir el navegador externo");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleGoBack}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleGoBack}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {openpayActive ? "Procesando Pago" : "Completar Pago"}
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              if (webViewRef.current) {
                webViewRef.current.reload();
              }
            }}
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7B3DFF" />
            <Text style={styles.loadingText}>Cargando pasarela de pago...</Text>
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
              style={[styles.webView, isLoading ? styles.hidden : {}]}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              injectedJavaScript={getInjectedJavaScript()}
              onMessage={handleMessage}
              onNavigationStateChange={handleNavigationStateChange}
              onError={handleError}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              sharedCookiesEnabled={true}
              thirdPartyCookiesEnabled={true}
              cacheEnabled={false}
              incognito={false} // Usar false para mantener cookies entre sesiones
              userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
            />
          )
        )}

        {/* Botón de fallback para abrir en navegador externo */}
        {!error && !isLoading && (
          <TouchableOpacity
            style={styles.browserButton}
            onPress={openInBrowser}
          >
            <Text style={styles.browserButtonText}>
              Abrir en navegador externo
            </Text>
          </TouchableOpacity>
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
  },
  hidden: {
    display: "none",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111111",
  },
  loadingText: {
    color: "white",
    marginTop: 16,
    fontSize: 16,
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
  browserButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(31, 31, 31, 0.8)",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  browserButtonText: {
    color: "white",
    fontSize: 14,
  },
});

export default PaymentWebView;
