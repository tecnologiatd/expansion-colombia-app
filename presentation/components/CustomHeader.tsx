import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NotificationModal } from "./NotificationModal";
import { useNotificationStore } from "@/core/stores/notification.store";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";

interface Props {
  title?: string;
  navigation?: any;
  back?: boolean;
}

const CustomHeader: React.FC<Props> = ({ title, navigation, back }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const pathname = usePathname();

  // Función para obtener el título dinámico
  const getHeaderTitle = () => {
    // Si hay un título proporcionado, úsalo
    if (title) return title;

    // Manejo específico para rutas de orden
    if (pathname?.startsWith("/order/")) {
      const orderId = pathname.split("/").pop();
      return `Orden #${orderId}`;
    }

    // Manejo específico para rutas de evento
    if (pathname?.startsWith("/event/")) {
      return "Detalles del Evento";
    }

    // Títulos predeterminados para otras rutas
    const routeTitles: { [key: string]: string } = {
      "/blog": "Blog",
      "/cart": "Carrito",
      "/profile": "Perfil",
      "/checkout/billing": "Facturación",
      "/checkout/payment": "Pago",
    };

    return routeTitles[pathname || ""] || "Expansión Colombia";
  };

  return (
    <SafeAreaView>
      <View className="flex-row items-center justify-between px-4 py-3 bg-gray-900">
        <View className="flex-row items-center">
          {back && (
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Feather name="chevron-left" size={24} color="white" />
            </TouchableOpacity>
          )}
          <Text className="text-white text-xl font-bold">
            {getHeaderTitle()}
          </Text>
        </View>
        <TouchableOpacity
          className="relative"
          onPress={() => setShowNotifications(true)}
        >
          <Feather name="bell" size={24} color="white" />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-purple-500 rounded-full w-4 h-4 items-center justify-center">
              <Text className="text-white text-xs">{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </SafeAreaView>
  );
};

export default CustomHeader;
