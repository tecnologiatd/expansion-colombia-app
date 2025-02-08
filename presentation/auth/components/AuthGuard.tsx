import React, { useEffect, ReactNode } from "react";
import { View, ActivityIndicator } from "react-native";
import { router, usePathname } from "expo-router";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

const protectedRoutes: string[] = ["/checkout", "/profile", "/order"];

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const pathname = usePathname();
  const { status, checkStatus } = useAuthStore();

  useEffect(() => {
    const validateSession = async () => {
      const isProtectedRoute = protectedRoutes.some((route) =>
        pathname?.startsWith(route),
      );

      if (isProtectedRoute && status === "unauthenticated") {
        router.replace("/auth/login");
      }
    };

    validateSession();
  }, [pathname, status]);

  // No redirigir inmediatamente cuando el status es 'checking'
  if (status === "checking") {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color="#7B3DFF" />
      </View>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
