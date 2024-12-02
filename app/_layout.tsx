import { Slot, SplashScreen } from "expo-router";
import { Stack } from "expo-router/stack";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import "./global.css";

export default function Layout() {
  const [fontsLoaded, error] = useFonts({
    FortunaDotRegular: require("../assets/fonts/FortunaDotRegular.ttf"),
    DesignSystemC: require("../assets/fonts/DesignSystemC-500R.ttf"),
  });

  useEffect(() => {
    if (error) throw error;

    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#F9B233",
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
    </Stack>
  );
}
