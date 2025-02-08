import React, { ReactNode } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../store/useAuthStore";

interface Props {
  children: ReactNode;
}

export function AdminGuard({ children }: Props) {
  const { user, status } = useAuthStore();

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status]);

  // Verificar si el usuario está autenticado y tiene rol de administrador
  if (status === "checking") {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <Text className="text-white">Verificando permisos...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
