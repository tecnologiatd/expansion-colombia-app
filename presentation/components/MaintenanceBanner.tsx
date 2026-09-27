import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MaintenanceBannerProps {
  message?: string | null;
}

// Aviso visible cuando las compras están pausadas por mantenimiento.
// No bloquea la navegación: los eventos se siguen viendo.
export default function MaintenanceBanner({ message }: MaintenanceBannerProps) {
  return (
    <View className="bg-amber-500/15 border border-amber-500/40 rounded-lg p-4 mb-4 flex-row items-start">
      <Ionicons
        name="construct-outline"
        size={22}
        color="#FBBF24"
        style={{ marginTop: 2 }}
      />
      <View className="flex-1 ml-3">
        <Text className="text-amber-300 font-bold mb-1">
          Compras en pausa por mantenimiento
        </Text>
        <Text className="text-amber-100/80 text-sm">
          {message ??
            "Puedes ver los eventos, pero la compra está pausada temporalmente. Intenta de nuevo más tarde."}
        </Text>
      </View>
    </View>
  );
}
