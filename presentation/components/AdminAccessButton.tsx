import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../auth/store/useAuthStore";

export const AdminAccessButton = () => {
  const { user } = useAuthStore();
  console.log("Current user role:", user?.role); // Debug log

  // Verificar si el usuario tiene rol de administrador
  const isAdmin =
    user?.role === "administrator" || user?.role === "shop_manager";

  if (!isAdmin) {
    console.log("User is not admin, not showing button"); // Debug log
    return null;
  }

  return (
    <View className="mt-8">
      <Text className="text-white text-xl font-bold mb-4">Administración</Text>
      <TouchableOpacity
        className="bg-purple-500 p-4 rounded-lg flex-row justify-between items-center"
        onPress={() => router.push("/(admin)/scan")}
      >
        <View className="flex-row items-center">
          <Ionicons name="qr-code" size={24} color="white" />
          <Text className="text-white font-medium ml-3">Validar Tickets</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};
