// src/components/CartItem.tsx
import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import {
  useCartStore,
  CartItem as CartItemType,
} from "@/core/stores/cart-store";

interface CartItemProps {
  item: CartItemType;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCartStore();

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeFromCart(item.id);
    }
  };

  return (
    <View className="flex-row items-center justify-between bg-gray-800 rounded-lg p-4 mb-4 text-purple-500 relative">
      <View className="flex-row items-center">
        <Image
          source={{ uri: item.imageUrl }}
          className="w-16 h-16 rounded-lg mr-4"
        />
        <View>
          <Text className="text-white text-lg font-bold">{item.name}</Text>
          <View className="flex-row items-center mt-2">
            <TouchableOpacity
              className="bg-purple-500 rounded-full p-2 mr-2"
              onPress={handleDecrement}
            >
              <Feather name="minus" size={16} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold">
              {item.quantity}
            </Text>
            <TouchableOpacity
              className="bg-purple-500 rounded-full p-2 ml-2"
              onPress={handleIncrement}
            >
              <Feather name="plus" size={16} color="white" />

            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Text className="text-white text-lg font-bold absolute right-10 bottom-1/3">
        ${(item.price * item.quantity).toLocaleString() }
      </Text>
    </View>
  );
};
