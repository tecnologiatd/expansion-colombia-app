import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NotificationModal } from "./NotificationModal";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import { NotificationBell } from "./NotificationBell";

interface Props {
  title?: string;
  navigation?: any;
  back?: boolean;
}

const CustomHeader: React.FC<Props> = ({ title, navigation, back }) => {
  const [showNotifications, setShowNotifications] = useState(false);
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

        <NotificationBell onPress={() => setShowNotifications(true)} />
      </View>

      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </SafeAreaView>
  );
};

export default CustomHeader;
