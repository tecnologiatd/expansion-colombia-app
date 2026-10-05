// src/components/CartItem.tsx
import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { imageSource } from "@/helpers/image-source";
import {
  useCartStore,
  CartItem as CartItemType,
} from "@/core/stores/cart-store";
import { formatCOP, plainText } from "@/helpers/format";

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
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(160)}
      layout={LinearTransition.duration(200)}
      style={{ marginBottom: 12 }}
    >
      <View className="flex-row items-center bg-surface border border-line rounded-2xl p-3">
        <Image
          source={imageSource(item.imageUrl)}
          className="w-16 h-16 rounded-xl bg-surface-raised"
        />
        <View className="flex-1 ml-3">
          <Text
            className="text-white text-base font-semibold"
            numberOfLines={2}
          >
            {plainText(item.name)}
          </Text>
          <Text className="text-muted mt-1">
            {formatCOP(item.price * item.quantity)}
          </Text>
        </View>
        <View className="flex-row items-center bg-surface-raised rounded-full ml-2">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            onPress={handleDecrement}
            accessibilityRole="button"
            accessibilityLabel={
              item.quantity > 1 ? "Quitar una entrada" : "Eliminar del carrito"
            }
          >
            <Feather
              name={item.quantity > 1 ? "minus" : "trash-2"}
              size={16}
              color="white"
            />
          </TouchableOpacity>
          <Text
            className="text-white text-base font-bold text-center min-w-[24px]"
            maxFontSizeMultiplier={1.2}
          >
            {item.quantity}
          </Text>
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            onPress={handleIncrement}
            accessibilityRole="button"
            accessibilityLabel="Agregar una entrada"
          >
            <Feather name="plus" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};
