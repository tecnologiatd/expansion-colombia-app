import { Stack } from "expo-router";
import { AdminGuard } from "@/presentation/auth/components/AdminGuard";

export default function AdminLayout() {
  return (
    <AdminGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="scan"
          options={{
            title: "Escanear Ticket",
            headerStyle: {
              backgroundColor: "#111111",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="ticket/[id]"
          options={{
            title: "Detalles del Ticket",
            headerStyle: {
              backgroundColor: "#111111",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="sponsorship-lines"
          options={{
            title: "Líneas de Auspicio",
            headerStyle: {
              backgroundColor: "#111111",
            },
            headerTintColor: "#fff",
          }}
        />
      </Stack>
    </AdminGuard>
  );
}
