import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useCartStore } from "@/core/stores/cart-store";
import { CartItem } from "@/presentation/components/CartItem";

const CartScreen = () => {
  const { items, calculateTotal, clearCart } = useCartStore();

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-2xl font-bold">Carrito</Text>
          {items.length > 0 && (
            <TouchableOpacity onPress={clearCart}>
              <Text className="text-red-500 text-lg">Vaciar Carrito</Text>
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
              Tu carrito está vacío
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
          className="bg-purple-500 rounded-lg py-4 mt-8 justify-center items-center"
          onPress={() => router.push("/payment")}
          disabled={items.length === 0}
        >
          <Text className="text-white font-bold text-lg">Pagar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CartScreen;
