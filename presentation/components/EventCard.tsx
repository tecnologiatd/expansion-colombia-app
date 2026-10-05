import { View, Text, Image } from "react-native";
import React from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type Product } from "@/core/interfaces/product.interface";
import { imageSource } from "@/helpers/image-source";
import { PressableScale } from "@/presentation/components/ui/PressableScale";
import { Theme } from "@/presentation/theme/Colors";
import { formatCOP, plainText } from "@/helpers/format";

interface Props {
  product?: Product; //Avoid using ?
}

const EventCard = ({ product }: Props) => {
  if (!product) return null;
  const name = plainText(product.name);
  const description = plainText(product.description);

  return (
    <PressableScale
      className="bg-surface w-full rounded-2xl border border-line overflow-hidden"
      accessibilityLabel={`${name}, ${formatCOP(product.price)}`}
      onPress={() =>
        router.push({
          pathname: "/event/[id]",
          params: { id: String(product.id) },
        })
      }
    >
      <Image
        source={imageSource(product.images?.[0]?.src)}
        style={{
          width: "100%",
          aspectRatio: 16 / 9,
          backgroundColor: Theme.surfaceRaised,
        }}
        resizeMode="cover"
      />
      <View className="p-4">
        <Text
          className="text-white text-lg font-bold"
          numberOfLines={2}
          maxFontSizeMultiplier={1.3}
        >
          {name}
        </Text>
        {description.length > 0 && (
          <Text className="text-muted text-sm mt-1" numberOfLines={2}>
            {description}
          </Text>
        )}
        <View className="flex-row items-center justify-between mt-4">
          <Text className="text-white text-base font-semibold">
            {formatCOP(product.price)}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-purple-400 font-semibold mr-1">
              Ver evento
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#C084FC" />
          </View>
        </View>
      </View>
    </PressableScale>
  );
};

export default EventCard;
