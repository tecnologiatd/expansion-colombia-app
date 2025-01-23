// app/(tabs)/cart.tsx
import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useCartStore } from "@/core/stores/cart-store";
import { CartItem } from "@/presentation/components/CartItem";
import { useCustomer } from "@/presentation/hooks/useCustomer";
import {useAuthStore} from "@/presentation/auth/store/useAuthStore";

const CartScreen = () => {
  const { items, calculateTotal, clearCart } = useCartStore();
  const { costumerQuery } = useCustomer();
    const { status } = useAuthStore();

  const handleCheckout = async () => {
      console.log('Checkout', status);
    if (status !== 'authenticated') {
      Alert.alert(
          'Iniciar Sesión',
          'Debes iniciar sesión para continuar con la compra',
          [
            {
              text: 'Cancelar',
              style: 'cancel'
            },
            {
              text: 'Iniciar Sesión',
              onPress: () => router.push('/auth/login')
            }
          ]
      );
      return;
    }

    if (items.length === 0) {
      Alert.alert('Carrito Vacío', 'Agrega productos a tu carrito antes de continuar');
      return;
    }

    if (costumerQuery.isLoading) {
      Alert.alert('Cargando', 'Por favor espera mientras cargamos tu información');
      return;
    }

    router.push('/checkout/billing');
  };

  return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-2xl font-bold">Carrito de Compras</Text>
            {items.length > 0 && (
                <TouchableOpacity onPress={clearCart}>
                  <Text className="text-red-500 text-lg">Eliminar Elementos</Text>
                </TouchableOpacity>
            )}
          </View>
          <FlatList
              data={items}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <CartItem item={item} />}
              contentContainerStyle={{ paddingBottom: 24 }}
              ListEmptyComponent={() => (
                  <Text className="text-white text-center mt-8">
                    No hay eventos agregados
                  </Text>
              )}
          />
          <View className="bg-gray-800 rounded-lg p-4 flex-row items-center justify-between">
            <Text className="text-white text-lg font-bold">Total</Text>
            <Text className="text-white text-lg font-bold">
              ${calculateTotal().toLocaleString()}
            </Text>
          </View>
            <TouchableOpacity
                className={`rounded-lg py-4 mt-8 justify-center items-center ${
                    items.length === 0 ? 'bg-purple-400' : 'bg-purple-500'
                }`}
                onPress={handleCheckout}
                disabled={items.length === 0}
            >
                <Text className="text-white font-bold text-lg">Continuar</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
  );
};

export default CartScreen;