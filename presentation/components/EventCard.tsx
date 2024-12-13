import {
  View,
  Text,
  TouchableOpacity,
  Image,
  useWindowDimensions, TouchableOpacityProps,
} from "react-native";
import React from "react";
import {Link, router} from "expo-router";
import { type Product} from "@/core/interfaces/product.interface";

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
      onPress={() => router.push({pathname: `/event/${product.id}`})}>

      <View className="relative">
        <Image
          className="rounded-t-2xl"
          source={{
            uri: product?.images[0]?.src,
          }}
          style={{ width: "100%", height: 200, resizeMode: "cover" }}
        />
        <View className="absolute top-4 left-4 bg-secondary px-3 py-1 rounded-md">
          <Text className="text-black font-medium">{product?.name}</Text>
        </View>
      </View>
      <View className="p-4">
        <Text className="text-white text-lg font-bold">{product?.name}</Text>
        <Text className="text-gray-400 text-base mt-2">
          {product?.description.substring(0, 50)}...
        </Text>
        <View className="flex-row items-center justify-between mt-4">
          <Text className="text-white font-medium">${product?.price}</Text>
          <Text className="text-gray-400 font-medium">Nov 4-6</Text>
          <Text className="text-gray-400 font-medium">Cali</Text>
        </View>
      </View>

    </TouchableOpacity>
  );
};

export default EventCard;
