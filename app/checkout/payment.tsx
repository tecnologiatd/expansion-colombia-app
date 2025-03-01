// app/checkout/payment.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useCreateOrder } from "@/presentation/hooks/useOrders";
import { useCartStore } from "@/core/stores/cart-store";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthBrowser } from "@/presentation/utils/auth-browser";

export default function PaymentScreen() {
  const { billingData } = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const { createOrderMutation, prepareOrderItems } = useCreateOrder();
  const { calculateTotal, clearCart } = useCartStore();

  const handleContinueToPayment = async () => {
    try {
      setIsProcessing(true);
      const parsedBilling = JSON.parse(billingData as string);
      const orderItems = prepareOrderItems();

      // Crear la orden sin especificar el método de pago
      const response = await createOrderMutation.mutateAsync({
        billing: parsedBilling,
        line_items: orderItems,
      });

      if (response?.payment_url) {
        // Abrir la URL en el navegador con autenticación automática
        const opened = await AuthBrowser.openPaymentUrl(
          response.payment_url,
          response.id.toString(),
        );

        if (opened) {
          // Al volver del navegador, redirigir a la página de detalles del pedido
          router.replace(`/order/${response.id.toString()}`);

          // Limpiar el carrito para evitar compras duplicadas
          clearCart();
        }
      } else {
        Alert.alert("Error", "No se recibió la URL de pago del servidor");
      }
    } catch (error) {
      console.error("Error al procesar la orden:", error);
      Alert.alert(
        "Error",
        "Hubo un problema procesando tu orden. Por favor intenta de nuevo.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-full bg-gray-800"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">
            Confirmar Compra
          </Text>
        </View>

        {/* Resumen de compra */}
        <View className="bg-gray-800 p-6 rounded-lg mb-6">
          <Text className="text-white text-xl font-bold mb-4">
            Resumen de la Compra
          </Text>

          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-400">Subtotal</Text>
            <Text className="text-white">
              ${calculateTotal().toLocaleString()}
            </Text>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-400">Impuestos</Text>
            <Text className="text-white">Incluidos</Text>
          </View>

          <View className="h-px bg-gray-700 my-3" />

          <View className="flex-row justify-between">
            <Text className="text-white font-bold">Total a pagar</Text>
            <Text className="text-white text-xl font-bold">
              ${calculateTotal().toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Información sobre el pago */}
        <View className="bg-gray-800 p-6 rounded-lg mb-6">
          <View className="flex-row items-center mb-4">
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#7B3DFF"
            />
            <Text className="text-white text-lg font-bold ml-2">
              Información de Pago
            </Text>
          </View>

          <Text className="text-gray-300 mb-4">
            Al continuar, serás redirigido a la pasarela de pago donde podrás
            elegir entre diferentes métodos de pago:
          </Text>

          <View className="bg-gray-700 p-4 rounded-lg mb-2">
            <Text className="text-white font-bold">
              • Tarjeta de Crédito/Débito
            </Text>
            <Text className="text-gray-400">
              Paga de forma segura con tu tarjeta
            </Text>
          </View>

          <View className="bg-gray-700 p-4 rounded-lg">
            <Text className="text-white font-bold">
              • PSE (Pagos Seguros en Línea)
            </Text>
            <Text className="text-gray-400">
              Paga directamente desde tu cuenta bancaria
            </Text>
          </View>
        </View>

        {/* Botón principal */}
        <TouchableOpacity
          className={`bg-purple-500 p-4 rounded-lg mt-auto ${isProcessing ? "opacity-50" : ""}`}
          onPress={handleContinueToPayment}
          disabled={isProcessing}
        >
          <Text className="text-white text-center font-bold text-lg">
            {isProcessing ? "Procesando..." : "Continuar al Pago"}
          </Text>
        </TouchableOpacity>

        {/* Processing Indicator */}
        {isProcessing && (
          <View className="absolute inset-0 bg-black/50 justify-center items-center">
            <View className="bg-gray-800 p-6 rounded-lg items-center">
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text className="text-white mt-4 text-center">
                Creando tu orden...
              </Text>
              <Text className="text-gray-400 mt-2 text-center text-sm">
                En breve serás redirigido a la pasarela de pago
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
