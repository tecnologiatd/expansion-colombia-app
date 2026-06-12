import { SplashScreen } from "expo-router";
import { Stack } from "expo-router/stack";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar, Platform } from "react-native";
import "./global.css";
import { usePushNotifications } from "@/presentation/hooks/usePushNotifications";
import CustomHeader from "@/presentation/components/CustomHeader";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import AuthGuard from "@/presentation/auth/components/AuthGuard";
import { initConnectivity } from "@/core/offline/connectivity";

const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 días

// Queries que se restauran al abrir la app sin conexión
const PERSISTED_QUERY_PREFIXES = [
  "profile",
  "order",
  "ticket-status",
  "tickets",
  "products",
  "product",
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // gcTime debe superar maxAge del persister o nada se persiste
      gcTime: CACHE_MAX_AGE,
      retry: 1,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "rq-cache",
});

export default function Layout() {
  const { expoPushToken } = usePushNotifications();
  const { checkStatus } = useAuthStore();
  const [isAuthChecked, setIsAuthChecked] = React.useState(false);

  const [fontsLoaded, error] = useFonts({
    FortunaDotRegular: require("../assets/fonts/FortunaDotRegular.ttf"),
    DesignSystemC: require("../assets/fonts/DesignSystemC-500R.ttf"),
  });

  useEffect(() => {
    initConnectivity();
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      await checkStatus();
      setIsAuthChecked(true);
    };

    if (fontsLoaded) {
      initializeAuth();
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, checkStatus]);

  if (!fontsLoaded || !isAuthChecked) return null;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: CACHE_MAX_AGE,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" &&
            PERSISTED_QUERY_PREFIXES.includes(String(query.queryKey[0])),
        },
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1F2B43" />
      <AuthGuard>
        <Stack
          screenOptions={{
            header: (props) => <CustomHeader {...props} />,
            headerStyle: {
              backgroundColor: "#1F2B43",
            },
            headerTintColor: "white",
            headerShadowVisible: false, // Esto es clave para eliminar la sombra
            contentStyle: {
              backgroundColor: "#1F2B43",
            },
            // Opciones específicas para iOS para asegurar que no haya línea
            ...(Platform.OS === "ios"
              ? {
                  headerTransparent: false, // No hacerlo transparente
                  headerLargeTitle: false, // Desactivar título grande en iOS
                }
              : {}),
          }}
        >
          <Stack.Screen
            name="auth"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: true,
              headerTitle: "Events",
              contentStyle: { backgroundColor: "#111827" },
            }}
          />
          <Stack.Screen
            name="event/[id]"
            options={{
              headerTitle: "Event Details",
            }}
          />
          <Stack.Screen
            name="order/[id]"
            options={{
              headerTitle: "Order Details",
              contentStyle: { backgroundColor: "#111827" },
            }}
          />
        </Stack>
      </AuthGuard>
    </PersistQueryClientProvider>
  );
}
