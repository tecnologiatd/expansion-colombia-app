import {
  View,
  Text,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from "react-native";
import React from "react";
import { router } from "expo-router";

interface Props {}
const EventCard = () => {
  const { height, width } = useWindowDimensions();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="mb-8 bg-gray-800 w-full rounded-2xl shadow-lg self-center"
      style={{ maxWidth: width - 32 }}
      onPress={() => router.push("/event/1")}
    >
      <View className="relative">
        <Image
          className="rounded-t-2xl"
          source={{
            uri: "https://expansioncolombia.com/wp-content/uploads/2024/11/convencion_ticketx1.jpg",
          }}
          style={{ width: "100%", height: 200, resizeMode: "cover" }}
        />
        <View className="absolute top-4 left-4 bg-secondary px-3 py-1 rounded-md">
          <Text className="text-black font-medium">Convención Ticketx</Text>
        </View>
      </View>
      <View className="p-4">
        <Text className="text-white text-lg font-bold">Convención Ticketx</Text>
        <Text className="text-gray-400 text-base mt-2">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit...
        </Text>
        <View className="flex-row items-center justify-between mt-4">
          <Text className="text-white font-medium">$300.000</Text>
          <Text className="text-gray-400 font-medium">Nov 4-6</Text>
          <Text className="text-gray-400 font-medium">Cali</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default EventCard;
