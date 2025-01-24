import {
  View,
  Text,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  TouchableOpacityProps,
} from "react-native";
import React from "react";
import { Link, router } from "expo-router";
import { type Product } from "@/core/interfaces/product.interface";
import removeTags from "@/helpers/removeHtml";

interface Props extends TouchableOpacityProps {
  product?: Product; //Avoid using ?
}
const EventCard = ({ product }: Props) => {
  const { height, width } = useWindowDimensions();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="mb-8 bg-gray-800 w-full rounded-2xl shadow-lg self-center"
      style={{ maxWidth: width - 32 }}
      onPress={() => router.push({ pathname: `/event/${product.id}` })}
    >
      <View className="relative">
        <Image
          className="rounded-t-2xl"
          source={{
            uri: product?.images[0]?.src,
          }}
          style={{ width: "100%", height: 200, resizeMode: "cover" }}
        />
        <View className="absolute top-4 left-4 bg-secondary px-3 py-1 rounded-md">
          <Text className="text-black font-medium">{product?.price.toLocaleString('es-CO', {style:"currency", currency:"COP"})}</Text>
        </View>
      </View>
      <View className="p-4">
        <Text className="text-white text-lg font-bold">{product?.name}</Text>
        <Text className="text-gray-400 text-base mt-2">
          {removeTags(product?.description).toString().trim().substring(0, 50)}...
        </Text>
        <View className="flex-row items-center justify-center mt-4">
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default EventCard;
