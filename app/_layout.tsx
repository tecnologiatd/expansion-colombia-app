import { SplashScreen } from "expo-router";
import { Stack } from "expo-router/stack";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  queryClient,
  asyncStoragePersister,
  CACHE_MAX_AGE,
  PERSISTED_QUERY_PREFIXES,
} from "@/core/api/query-cache";
import { StatusBar, Platform } from "react-native";
import * as Sentry from "@sentry/react-native";
import "./global.css";
import { usePushNotifications } from "@/presentation/hooks/usePushNotifications";
import CustomHeader from "@/presentation/components/CustomHeader";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import AuthGuard from "@/presentation/auth/components/AuthGuard";
import { initConnectivity } from "@/core/offline/connectivity";
import { useAutomaticTicketSync } from "@/presentation/hooks/useTicketSync";
import { Theme } from "@/presentation/theme/Colors";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  // Solo en produccion: sin DSN o en desarrollo Sentry queda desactivado
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN && !__DEV__,
  // No enviar PII de los compradores en los eventos
  sendDefaultPii: false,
  tracesSampleRate: 0.2,
});

function Layout() {
  useAutomaticTicketSync();
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
      <StatusBar barStyle="light-content" backgroundColor={Theme.background} />
      <AuthGuard>
        <Stack
          screenOptions={{
            header: (props) => <CustomHeader {...props} />,
            headerStyle: {
              backgroundColor: Theme.background,
            },
            headerTintColor: "white",
            headerShadowVisible: false, // Esto es clave para eliminar la sombra
            contentStyle: {
              backgroundColor: Theme.background,
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
              headerTitle: "Eventos",
              contentStyle: { backgroundColor: Theme.background },
            }}
          />
          <Stack.Screen
            name="event/[id]"
            options={{
              headerTitle: "Detalles del Evento",
            }}
          />
          <Stack.Screen
            name="order/[id]"
            options={{
              headerTitle: "Detalle de la Orden",
              contentStyle: { backgroundColor: Theme.background },
            }}
          />
        </Stack>
      </AuthGuard>
    </PersistQueryClientProvider>
  );
}

// Sentry.wrap captura errores de render/navegación del árbol completo
export default Sentry.wrap(Layout);
