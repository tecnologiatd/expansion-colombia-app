import React, { useEffect, ReactNode } from "react";
import { router, usePathname } from "expo-router";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

// Define the type for the auth status. Adjust as needed based on your actual store

const protectedRoutes: string[] = ["/checkout", "/profile", "/order"];

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const pathname = usePathname();
  const { status } = useAuthStore(); // Make sure useAuthStore returns the correct type

  useEffect(() => {
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname?.startsWith(route),
    ); // Handle potential null pathname

    if (isProtectedRoute && status !== "authenticated") {
      router.replace("/auth/login");
    }
  }, [pathname, status]);

  return <>{children}</>; // Use a Fragment to avoid unnecessary divs
};

export default AuthGuard;
