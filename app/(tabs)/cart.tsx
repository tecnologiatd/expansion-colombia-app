// app/(tabs)/cart.tsx
import React from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useCartStore } from "@/core/stores/cart-store";
import { CartItem } from "@/presentation/components/CartItem";
import { useCustomer } from "@/presentation/hooks/useCustomer";

const CartScreen = () => {
  const { items, calculateTotal, clearCart } = useCartStore();
  const { costumerQuery } = useCustomer();

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert("Cart Empty", "Please add items to your cart before checkout");
      return;
    }

    if (costumerQuery.isLoading) {
      Alert.alert("Loading", "Please wait while we load your information");
      return;
    }

    if (costumerQuery.isError) {
      Alert.alert("Error", "Failed to load customer information. Please try again.");
      return;
    }

    // Check if billing information is complete
    const requiredFields = [
      'first_name',
      'last_name',
      'address_1',
      'city',
      'country',
      'state',
      'email',
      'phone'
    ];

    const missingFields = requiredFields.filter(
        field => !costumerQuery.data?.billing[field] ||
            costumerQuery.data?.billing[field].trim() === ''
    );

    router.push("/checkout/billing");
  };

  return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-2xl font-bold">Cart</Text>
            {items.length > 0 && (
                <TouchableOpacity onPress={clearCart}>
                  <Text className="text-red-500 text-lg">Clear Cart</Text>
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
                    Your cart is empty
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
              onPress={handleCheckout}
              disabled={items.length === 0}
          >
            <Text className="text-white font-bold text-lg">Checkout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
  );
};

export default CartScreen;