import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import {
  router,
  useLocalSearchParams,
  Stack,
  useNavigation,
} from "expo-router";
import { CommonActions } from "expo-router/react-navigation";
import { useCreateOrder } from "@/presentation/hooks/useOrders";
import { useSiteStatus } from "@/presentation/hooks/useSiteStatus";
import MaintenanceBanner from "@/presentation/components/MaintenanceBanner";
import {
  MAINTENANCE_ERROR,
  getOrderByIdAction,
  updateOrderCheckoutAction,
} from "@/core/actions/order.actions";
import { useCartStore } from "@/core/stores/cart-store";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { isPaidOrder, isPayableOrder } from "@/core/checkout/payment-policy";
import { AuthBrowser } from "@/presentation/utils/auth-browser";
import { Button } from "@/presentation/components/ui/Button";
import { FadeInView } from "@/presentation/components/ui/FadeInView";
import { CONTENT_MAX_WIDTH, Theme } from "@/presentation/theme/Colors";
import { formatCOP } from "@/helpers/format";

export default function PaymentScreen() {
  const { billingData, sponsorshipLine } = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const { createOrderMutation, prepareOrderItems } = useCreateOrder();
  const {
    calculateTotal,
    clearCart,
    getPendingOrderId,
    setPendingOrder,
    getCheckoutAttemptKey,
  } = useCartStore();
  const { isMaintenance, maintenanceMessage } = useSiteStatus();
  const navigation = useNavigation();

  const showOrder = (id: number) =>
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: "(tabs)" },
          { name: "order/[id]", params: { id: String(id) } },
        ],
      }),
    );

  const handleContinueToPayment = async () => {
    if (processingRef.current) return;
    if (isMaintenance) {
      Alert.alert(
        "Mantenimiento",
        maintenanceMessage ??
          "Las compras están pausadas por mantenimiento. Intenta de nuevo más tarde.",
      );
      return;
    }
    processingRef.current = true;
    try {
      setIsProcessing(true);
      const parsedBilling = JSON.parse(billingData as string);
      const orderItems = prepareOrderItems();

      const params = {
        billing: parsedBilling,
        line_items: orderItems,
        meta_data: [
          { key: "linea_de_auspicio", value: String(sponsorshipLine ?? "") },
        ],
        idempotencyKey: getCheckoutAttemptKey(
          JSON.stringify([parsedBilling, sponsorshipLine ?? ""]),
        ),
      };
      const pendingOrderId = getPendingOrderId();
      let order = pendingOrderId
        ? await getOrderByIdAction(String(pendingOrderId), { fresh: true })
        : await createOrderMutation.mutateAsync(params);
      setPendingOrder(order.id);
      if (isPaidOrder(order.status)) {
        clearCart();
        showOrder(order.id);
        return;
      }
      if (!isPayableOrder(order.status)) {
        // PSE/3DS puede estar esperando al banco. No abrir otro cargo ni crear
        // otro pedido por el mismo carrito, aunque la app se haya reiniciado.
        showOrder(order.id);
        return;
      }
      if (pendingOrderId)
        order = await updateOrderCheckoutAction(order.id, params);
      if (!isPayableOrder(order.status)) {
        showOrder(order.id);
        return;
      }
      if (!order.payment_url)
        throw new Error(
          "No se recibió el enlace de pago. Actualiza el pedido para volver a intentarlo.",
        );
      const returned = await AuthBrowser.openPaymentUrl(
        order.payment_url,
        String(order.id),
      );
      // El carrito se completa únicamente cuando Woo confirma processing/completed.
      if (returned) showOrder(order.id);
    } catch (error) {
      console.error("Error al procesar la orden:", error);
      const message =
        error instanceof Error && error.message.startsWith(MAINTENANCE_ERROR)
          ? error.message.split(":").slice(1).join(":").trim() ||
            "Las compras están pausadas por mantenimiento. Intenta de nuevo más tarde."
          : error instanceof Error
            ? error.message
            : "Hubo un problema procesando tu orden. Por favor intenta de nuevo.";
      Alert.alert(
        error instanceof Error && error.message.startsWith(MAINTENANCE_ERROR)
          ? "Mantenimiento"
          : "Error",
        message,
      );
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Configuración del header de navegación */}
      <Stack.Screen
        options={{
          title: "Confirmar Compra",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView
        className="flex-1 bg-background"
        edges={["left", "right", "bottom"]}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        >
          <FadeInView
            style={{
              width: "100%",
              maxWidth: CONTENT_MAX_WIDTH,
              alignSelf: "center",
            }}
          >
            {isMaintenance && (
              <MaintenanceBanner message={maintenanceMessage} />
            )}
            {/* Resumen de compra */}
            <View className="bg-surface border border-line p-5 rounded-2xl mb-4">
              <Text className="text-white text-lg font-bold mb-4">
                Resumen de la compra
              </Text>

              <View className="flex-row justify-between mb-3">
                <Text className="text-muted">Subtotal</Text>
                <Text className="text-white">
                  {formatCOP(calculateTotal())}
                </Text>
              </View>

              <View className="flex-row justify-between mb-3">
                <Text className="text-muted">Impuestos</Text>
                <Text className="text-white">Incluidos</Text>
              </View>

              {/* Mostrar la línea de auspicio seleccionada */}
              <View className="flex-row justify-between mb-3">
                <Text className="text-muted mr-4">Línea de auspicio</Text>
                <Text className="text-white flex-1 text-right">
                  {sponsorshipLine}
                </Text>
              </View>

              <View className="h-px bg-line my-3" />

              <View className="flex-row justify-between items-center">
                <Text className="text-white font-semibold">Total a pagar</Text>
                <Text
                  className="text-white text-2xl font-bold"
                  maxFontSizeMultiplier={1.3}
                >
                  {formatCOP(calculateTotal())}
                </Text>
              </View>
            </View>

            {/* Información sobre el pago */}
            <View className="bg-surface border border-line p-5 rounded-2xl">
              <Text className="text-white text-lg font-bold mb-2">
                Métodos de pago
              </Text>
              <Text className="text-muted mb-4">
                Al continuar se abre la pasarela de pago segura, donde eliges
                cómo pagar.
              </Text>

              <View className="flex-row items-center bg-surface-raised p-4 rounded-xl mb-2">
                <Ionicons name="card-outline" size={22} color="#C084FC" />
                <View className="flex-1 ml-3">
                  <Text className="text-white font-semibold">
                    Tarjeta de crédito o débito
                  </Text>
                  <Text className="text-muted text-sm">
                    Paga de forma segura con tu tarjeta
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center bg-surface-raised p-4 rounded-xl">
                <Ionicons name="business-outline" size={22} color="#C084FC" />
                <View className="flex-1 ml-3">
                  <Text className="text-white font-semibold">PSE</Text>
                  <Text className="text-muted text-sm">
                    Paga directamente desde tu cuenta bancaria
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-center mt-4">
              <Ionicons
                name="lock-closed-outline"
                size={14}
                color={Theme.muted}
              />
              <Text className="text-muted text-xs ml-1.5">
                Pago procesado por Openpay
              </Text>
            </View>
          </FadeInView>
        </ScrollView>

        {/* Botón fijo en la parte inferior */}
        <View className="px-4 pt-3 pb-3 bg-background border-t border-line">
          <View
            className="w-full self-center"
            style={{ maxWidth: CONTENT_MAX_WIDTH }}
          >
            <Button
              title={
                isProcessing
                  ? "Procesando..."
                  : isMaintenance
                    ? "Compras en pausa"
                    : "Continuar al pago"
              }
              onPress={handleContinueToPayment}
              loading={isProcessing}
              disabled={isMaintenance}
            />
          </View>
        </View>

        {/* Processing Indicator */}
        {isProcessing && (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(140)}
            style={StyleSheet.absoluteFill}
          >
            <View className="flex-1 bg-black/60 justify-center items-center p-6">
              <View className="bg-surface border border-line p-6 rounded-2xl items-center">
                <ActivityIndicator size="large" color={Theme.accent} />
                <Text className="text-white font-semibold mt-4 text-center">
                  Creando tu orden...
                </Text>
                <Text className="text-muted mt-2 text-center text-sm">
                  En breve serás redirigido a la pasarela de pago
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </>
  );
}
