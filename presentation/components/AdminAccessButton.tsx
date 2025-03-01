import React, { useState } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../auth/store/useAuthStore";
import { NotificationSender } from "./NotificationSender";

export const AdminAccessButton = () => {
  const [showNotificationSender, setShowNotificationSender] = useState(false);
  const { user } = useAuthStore();

  // Verificar si el usuario tiene rol de administrador
  const isAdmin =
    user?.role === "administrator" || user?.role === "shop_manager";

  if (!isAdmin) {
    return null;
  }

  return (
    <View className="mt-8">
      <Text className="text-white text-xl font-bold mb-4">Administración</Text>

      <TouchableOpacity
        className="bg-purple-500 p-4 rounded-lg flex-row justify-between items-center mb-3"
        onPress={() => router.push("/(admin)/scan")}
      >
        <View className="flex-row items-center">
          <Ionicons name="qr-code" size={24} color="white" />
          <Text className="text-white font-medium ml-3">Validar Tickets</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-purple-500 p-4 rounded-lg flex-row justify-between items-center"
        onPress={() => setShowNotificationSender(true)}
      >
        <View className="flex-row items-center">
          <Ionicons name="notifications" size={24} color="white" />
          <Text className="text-white font-medium ml-3">
            Enviar Notificaciones
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="white" />
      </TouchableOpacity>

      <NotificationSender
        visible={showNotificationSender}
        onClose={() => setShowNotificationSender(false)}
      />
    </View>
  );
};
