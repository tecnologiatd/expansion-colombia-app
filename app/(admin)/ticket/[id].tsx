import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTicketValidation } from "@/presentation/hooks/useTicketValidation";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOrderDetails } from "@/presentation/hooks/useOrders";

export default function TicketDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [qrCode, setQrCode] = useState<string>(id as string);
  const [autoDetectedEventId, setAutoDetectedEventId] = useState<
    string | undefined
  >();

  // Extract eventId from the QR code if available
  useEffect(() => {
    if (typeof qrCode === "string" && qrCode.includes("/")) {
      const parts = qrCode.split("/");
      if (parts.length === 2) {
        setAutoDetectedEventId(parts[1]);
        console.log("Auto-detected eventId from QR:", parts[1]);
      }
    }
  }, [qrCode]);

  // Use provided eventId or extracted one
  const providedEventId = useLocalSearchParams().eventId as string | undefined;
  const eventId = providedEventId || autoDetectedEventId;

  const { ticketStatusQuery } = useTicketValidation(qrCode, eventId);

  const { data: orderData } = ticketStatusQuery.data?.orderId
    ? useOrderDetails(ticketStatusQuery.data?.orderId)
    : { data: null };

  if (ticketStatusQuery.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#7B3DFF" />
      </View>
    );
  }

  if (ticketStatusQuery.error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          Error al cargar los detalles del ticket
        </Text>
        <Text style={{ color: "gray", marginTop: 10, textAlign: "center" }}>
          {autoDetectedEventId
            ? `Usando eventId detectado: ${autoDetectedEventId}`
            : "No se detectó eventId en el código QR"}
        </Text>
      </View>
    );
  }

  const ticket = ticketStatusQuery.data;
  const isFullyUsed = ticket.usageCount >= ticket.maxUsages;

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <ScrollView className="p-4">
        {autoDetectedEventId && (
          <View className="bg-purple-500/20 rounded-lg p-2 mb-4">
            <Text className="text-purple-300">
              Evento ID detectado en QR: {autoDetectedEventId}
            </Text>
          </View>
        )}

        <View className="bg-gray-800 rounded-lg p-4 mb-4">
          <Text className="text-white text-lg font-bold mb-2">
            Estado del Ticket
          </Text>
          <View
            className={`p-2 rounded ${isFullyUsed ? "bg-red-500/20" : "bg-green-500/20"}`}
          >
            <Text className={isFullyUsed ? "text-red-500" : "text-green-500"}>
              {isFullyUsed ? "Completamente Usadao" : "Válido"}
            </Text>
          </View>

          <View className="mt-3">
            <Text className="text-gray-400">
              Usos: {ticket.usageCount} de {ticket.maxUsages}
            </Text>
            <Text className="text-gray-400">
              Usos restantes: {ticket.remainingUsages}
            </Text>
            <Text className="text-gray-400 mt-2">
              Evento ID: {ticket.eventId}
            </Text>
          </View>

          {ticket.usageHistory && ticket.usageHistory.length > 0 && (
            <View className="mt-4">
              <Text className="text-white text-lg font-bold mb-2">
                Historial de Usos
              </Text>
              {ticket.usageHistory.map((usage, index) => (
                <View key={index} className="bg-gray-700 p-2 rounded mt-2">
                  <Text className="text-gray-300">
                    Uso #{index + 1}:{" "}
                    {new Date(usage.timestamp).toLocaleString()}
                  </Text>
                  <Text className="text-gray-400">
                    Validado por: {usage.validatedBy}
                  </Text>
                </View>
              ))}
            </View>
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
