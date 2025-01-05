import { SplashScreen } from "expo-router";
import { Stack } from "expo-router/stack";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import "./global.css";
import { usePushNotifications } from "@/presentation/hooks/usePushNotifications";

const CustomHeader = ({ title, navigation, back }) => {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-gray-900">
      <View className="flex-row items-center">
        {back && (
          <TouchableOpacity onPress={navigation.goBack} className="mr-4">
            <Feather name="chevron-left" size={24} color="white" />
          </TouchableOpacity>
        )}
        <Text className="text-white text-xl font-bold">{title}</Text>
      </View>
      <TouchableOpacity>
        <Feather name="bell" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

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
      <StatusBar barStyle="light-content" />

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
          name="payment"
          options={{
            headerTitle: "Payment",
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
