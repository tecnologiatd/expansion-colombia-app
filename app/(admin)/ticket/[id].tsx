import React from "react";
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTicketValidation } from "@/presentation/hooks/useTicketValidation";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOrderDetails } from "@/presentation/hooks/useOrders";

export default function TicketDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { ticketStatusQuery } = useTicketValidation(id as string);
  const { data: orderData } = useOrderDetails(ticketStatusQuery.data?.orderId);

  if (ticketStatusQuery.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#7B3DFF" />
      </View>
    );
  }

  if (ticketStatusQuery.error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "white" }}>
          Error al cargar los detalles del ticket
        </Text>
      </View>
    );
  }

  const ticket = ticketStatusQuery.data;

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <ScrollView className="p-4">
        <View className="bg-gray-800 rounded-lg p-4 mb-4">
          <Text className="text-white text-lg font-bold mb-2">
            Estado del Ticket
          </Text>
          <View
            className={`p-2 rounded ${ticket.isUsed ? "bg-red-500/20" : "bg-green-500/20"}`}
          >
            <Text className={ticket.isUsed ? "text-red-500" : "text-green-500"}>
              {ticket.isUsed ? "Usado" : "Válido"}
            </Text>
          </View>
          {ticket.isUsed && (
            <>
              <Text className="text-gray-400 mt-2">
                Usado el: {new Date(ticket.usedAt).toLocaleString()}
              </Text>
              <Text className="text-gray-400">
                Validado por: {ticket.validatedBy}
              </Text>
            </>
          )}
        </View>

        {orderData && (
          <View className="bg-gray-800 rounded-lg p-4">
            <Text className="text-white text-lg font-bold mb-4">
              Detalles de la Orden
            </Text>
            <Text className="text-gray-400">
              Cliente: {orderData.billing.first_name}{" "}
              {orderData.billing.last_name}
            </Text>
            <Text className="text-gray-400">
              Email: {orderData.billing.email}
            </Text>
            <Text className="text-gray-400">
              Teléfono: {orderData.billing.phone}
            </Text>
            <Text className="text-white text-lg font-bold mt-4 mb-2">
              Eventos
            </Text>
            {orderData.line_items.map((item) => (
              <View
                key={item.id}
                className="border-t border-gray-700 pt-2 mt-2"
              >
                <Text className="text-white">{item.name}</Text>
                <Text className="text-gray-400">Cantidad: {item.quantity}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
