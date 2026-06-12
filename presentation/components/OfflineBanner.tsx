import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const formatTimeAgo = (timestamp?: number): string | null => {
  if (!timestamp) return null;
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days === 1 ? "" : "s"}`;
};

interface OfflineBannerProps {
  message?: string;
  dataUpdatedAt?: number;
}

export const OfflineBanner = ({
  message = "Datos sin conexión",
  dataUpdatedAt,
}: OfflineBannerProps) => {
  const timeAgo = formatTimeAgo(dataUpdatedAt);

  return (
    <View className="flex-row items-center bg-yellow-500/20 px-4 py-2 mx-4 mb-2 rounded-lg">
      <Ionicons name="cloud-offline-outline" size={16} color="#EAB308" />
      <Text className="text-yellow-500 ml-2 flex-1">
        {message}
        {timeAgo ? ` · actualizado ${timeAgo}` : ""}
      </Text>
    </View>
  );
};
