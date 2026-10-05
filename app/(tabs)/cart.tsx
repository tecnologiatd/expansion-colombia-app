// app/(tabs)/cart.tsx
import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useCartStore } from "@/core/stores/cart-store";
import { CartItem } from "@/presentation/components/CartItem";
import MaintenanceBanner from "@/presentation/components/MaintenanceBanner";
import { useCustomer } from "@/presentation/hooks/useCustomer";
import { useSiteStatus } from "@/presentation/hooks/useSiteStatus";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/presentation/components/ui/Button";
import { CONTENT_MAX_WIDTH, Theme } from "@/presentation/theme/Colors";
import { formatCOP } from "@/helpers/format";

const CartScreen = () => {
  const { items, calculateTotal, clearCart } = useCartStore();
  const { costumerQuery } = useCustomer();
  const { status } = useAuthStore();
  const { isMaintenance, maintenanceMessage } = useSiteStatus();

  const handleCheckout = async () => {
    if (isMaintenance) {
      Alert.alert(
        "Mantenimiento",
        maintenanceMessage ??
          "Las compras están pausadas por mantenimiento. Intenta de nuevo más tarde.",
      );
      return;
    }
    if (status !== "authenticated") {
      Alert.alert(
        "Iniciar Sesión",
        "Debes iniciar sesión para continuar con la compra",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Iniciar Sesión",
            onPress: () => router.push("/auth/login"),
          },
        ],
      );
      return;
    }

    if (items.length === 0) {
      Alert.alert(
        "Carrito Vacío",
        "Agrega productos a tu carrito antes de continuar",
      );
      return;
    }

    if (costumerQuery.isLoading) {
      Alert.alert(
        "Cargando",
        "Por favor espera mientras cargamos tu información",
      );
      return;
    }

    router.replace("/checkout/billing");
  };

  const isEmpty = items.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      <View
        className="flex-1 w-full self-center px-4 pt-4"
        style={{ maxWidth: CONTENT_MAX_WIDTH }}
      >
        {isMaintenance && <MaintenanceBanner message={maintenanceMessage} />}
        <View className="flex-row justify-between items-center mb-4">
          <Text
            className="text-white text-2xl font-bold"
            maxFontSizeMultiplier={1.3}
          >
            Tu carrito
          </Text>
          {!isEmpty && (
            <TouchableOpacity
              onPress={clearCart}
              hitSlop={10}
              accessibilityRole="button"
            >
              <Text className="text-red-400 font-medium">Vaciar</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          className="flex-1"
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <CartItem item={item} />}
          contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12">
              <Ionicons name="cart-outline" size={44} color={Theme.muted} />
              <Text className="text-white text-lg font-semibold mt-4">
                Tu carrito está vacío
              </Text>
              <Text className="text-muted text-center mt-2">
                Agrega entradas desde la pestaña de eventos.
              </Text>
              <Button
                title="Ver eventos"
                variant="secondary"
                onPress={() => router.push("/(tabs)/home")}
                containerStyle={{ marginTop: 20, minWidth: 180 }}
              />
            </View>
          }
        />
        {!isEmpty && (
          <View className="border-t border-line pt-4 pb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-muted text-base">Total</Text>
              <Text
                className="text-white text-2xl font-bold"
                maxFontSizeMultiplier={1.3}
              >
                {formatCOP(calculateTotal())}
              </Text>
            </View>
            <Button
              title={isMaintenance ? "Compras en pausa" : "Continuar"}
              onPress={handleCheckout}
              disabled={isMaintenance}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default CartScreen;
