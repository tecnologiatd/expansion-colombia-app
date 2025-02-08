// app/_layout.tsx
import { SplashScreen } from "expo-router";
import { Stack } from "expo-router/stack";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "react-native";
import "./global.css";
import { usePushNotifications } from "@/presentation/hooks/usePushNotifications";
import CustomHeader from "@/presentation/components/CustomHeader";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

export default function Layout() {
  const { expoPushToken } = usePushNotifications();
  const { checkStatus } = useAuthStore();
  const [isAuthChecked, setIsAuthChecked] = React.useState(false);

  const [fontsLoaded, error] = useFonts({
    FortunaDotRegular: require("../assets/fonts/FortunaDotRegular.ttf"),
    DesignSystemC: require("../assets/fonts/DesignSystemC-500R.ttf"),
  });

  useEffect(() => {
    const initializeAuth = async () => {
      await checkStatus();
      setIsAuthChecked(true);
    };

    if (fontsLoaded) {
      initializeAuth();
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || !isAuthChecked) return null;

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar barStyle="dark-content" />
      <Stack
        screenOptions={{
          header: (props) => <CustomHeader {...props} />,
          headerStyle: {
            backgroundColor: "#111111",
          },
          headerTintColor: "white",
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: "#111111",
          },
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
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
