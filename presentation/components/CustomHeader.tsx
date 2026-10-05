import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NotificationModal } from "./NotificationModal";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import { NotificationBell } from "./NotificationBell";
import { Theme } from "@/presentation/theme/Colors";

interface Props {
  title?: string;
  navigation?: any;
  back?: boolean | { title?: string; href?: string };
}

const CustomHeader: React.FC<Props> = ({ title, navigation, back }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();
  const isTabRoot = ["/home", "/blog", "/cart", "/profile"].includes(pathname);

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
      "/home": "Eventos",
      "/blog": "Noticias",
      "/cart": "Carrito",
      "/profile": "Perfil",
      "/checkout/billing": "Facturación",
      "/checkout/payment": "Pago",
    };

    return routeTitles[pathname || ""] || "Expansión Colombia";
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.headerContainer}>
        <View className="flex-row items-center flex-1 mr-3">
          {back && (
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-2 -ml-2 w-10 h-10 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Volver"
              hitSlop={8}
            >
              <Feather name="chevron-left" size={24} color="white" />
            </TouchableOpacity>
          )}
          {isTabRoot && !back ? (
            <View accessible accessibilityLabel="Expansión Colombia">
              <Text
                className="font-fortuna text-white text-xl"
                maxFontSizeMultiplier={1.3}
              >
                EXPANSION
              </Text>
              <Text
                className="font-design-systemc text-muted text-xs tracking-widest"
                maxFontSizeMultiplier={1.3}
              >
                COLOMBIA
              </Text>
            </View>
          ) : (
            <Text
              className="text-white text-lg font-semibold flex-1"
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
            >
              {getHeaderTitle()}
            </Text>
          )}
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

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Theme.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.line,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    minHeight: 64,
    paddingVertical: 8,
    backgroundColor: Theme.background,
  },
});

export default CustomHeader;
