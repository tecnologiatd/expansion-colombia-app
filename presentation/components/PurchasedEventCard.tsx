import { Image, Text, TouchableOpacity, View } from "react-native";
import React from "react";

const PurchasedEventCard = ({ event, onPress }) => (
  <TouchableOpacity
    className="bg-gray-800 rounded-lg p-4 mb-4 flex-row items-center"
    onPress={onPress}
  >
    {event.image && (
      <Image
        source={{ uri: event.image.src }}
        className="w-16 h-16 rounded-lg"
      />
    )}
    <View className="ml-4 flex-1">
      <Text className="text-white text-lg font-bold">{event.name}</Text>
      <Text className="text-gray-400">Orden #{event.id}</Text>
      <View className="flex-row items-center mt-2">
        <View
          className={`px-3 py-1 rounded-full ${
            event.status === "completed"
              ? "bg-green-500/20"
              : event.status === "processing"
                ? "bg-yellow-500/20"
                : "bg-purple-500/20"
          }`}
        >
          <Text
            className={`${
              event.status === "completed"
                ? "text-green-500"
                : event.status === "processing"
                  ? "text-yellow-500"
                  : "text-purple-500"
            } font-medium capitalize`}
          >
            {event.status}
          </Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

export default PurchasedEventCard;
