import React, { useEffect, useState } from "react";
import { Stack } from "expo-router/stack";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

const AuthLayout = () => {
  const { status, checkStatus } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      try {
        await checkStatus();
      } catch (error) {
        console.log("Error checking status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [status]);

  // Manejo del estado de carga
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      ></View>
    );
  }

  // Redirección si no está autenticado
  if (status === "authenticated") {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
    </Stack>
  );
};

export default AuthLayout;
