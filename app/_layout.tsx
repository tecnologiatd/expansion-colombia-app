import { Slot, SplashScreen } from "expo-router";
import { Stack } from "expo-router/stack";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./global.css";
import { usePushNotifications } from "@/presentation/hooks/usePushNotifications";

export default function Layout() {
  const { expoPushToken, notifications } = usePushNotifications();

  const [fontsLoaded, error] = useFonts({
    FortunaDotRegular: require("../assets/fonts/FortunaDotRegular.ttf"),
    DesignSystemC: require("../assets/fonts/DesignSystemC-500R.ttf"),
  });

  useEffect(() => {
    if (error) throw error;

    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) return null;

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "",
          },
          headerTintColor: "white",
        }}
      >
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: true, headerTitle: "Expansion Colombia" }}
        />
        <Stack.Screen
          name="event/[id]"
          options={{ headerTitle: "Concierto CALI" }}
        />
        <Stack.Screen name="payment" options={{ headerTitle: "Pagos" }} />
      </Stack>
    </QueryClientProvider>
  );
}
