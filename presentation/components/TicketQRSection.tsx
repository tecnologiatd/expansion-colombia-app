import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, FlatList } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useTicketValidation } from "../hooks/useTicketValidation";
import { useGenerateTicket } from "../hooks/useGenerateTicket";

interface Props {
  orderId: string;
  orderStatus: string;
  eventId: string;
  quantity: number;
}

export const TicketQRSection: React.FC<Props> = ({
  orderId,
  orderStatus,
  eventId,
  quantity,
}) => {
  const { generateTicketMutation } = useGenerateTicket();
  const { ticketStatusQuery } = useTicketValidation(
    generateTicketMutation.data?.qrCodes?.[0],
    eventId,
  );

  useEffect(() => {
    if (orderStatus === "processing") {
      generateTicketMutation.mutate({
        orderId,
        eventId,
        quantity,
        usagesPerTicket: 1, // You might want to make this configurable
      });
    }
  }, [orderId, orderStatus, eventId, quantity]);

  if (orderStatus !== "processing") {
    return (
      <View className="m-4 bg-yellow-500/20 p-4 rounded-xl">
        <Text className="text-yellow-500 text-center">
          Los QR estarán disponibles cuando se complete el pago
        </Text>
      </View>
    );
  }

  if (generateTicketMutation.isPending) {
    return (
      <View className="m-4 bg-gray-800 p-4 rounded-xl items-center">
        <ActivityIndicator size="large" color="#7B3DFF" />
        <Text className="text-white mt-2">Generando códigos QR...</Text>
      </View>
    );
  }

  if (generateTicketMutation.isError || !generateTicketMutation.data?.qrCodes) {
    return (
      <View className="m-4 bg-red-500/20 p-4 rounded-xl">
        <Text className="text-red-500 text-center">
          Error al generar los códigos QR. Por favor contacta a soporte.
        </Text>
      </View>
    );
  }

  const renderTicket = ({ item: qrCode, index }) => {
    const ticketStatus = ticketStatusQuery.data;
    console.log(ticketStatus);
    console.log(546454);
    return (
      <View className="bg-gray-800 rounded-lg p-6 mb-4">
        <Text className="text-white text-center mb-4">
          Ticket {index + 1} de {quantity}
          {JSON.stringify(ticketStatus, null, 2)}
        </Text>
        <View className="items-center mb-4">
          <QRCode
            value={qrCode}
            size={200}
            color="white"
            backgroundColor="transparent"
          />
        </View>
        <View className="mt-4">
          <View
            className={`p-4 rounded-lg ${
              ticketStatus?.usageCount >= ticketStatus?.maxUsages
                ? "bg-red-500/20"
                : "bg-green-500/20"
            }`}
          >
            <Text
              className={`text-center text-lg font-bold ${
                ticketStatus?.usageCount >= ticketStatus?.maxUsages
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {ticketStatus?.usageCount >= ticketStatus?.maxUsages
                ? "Ticket Completamente Usado"
                : `Usos restantes: ${ticketStatus?.maxUsages - ticketStatus?.usageCount}`}
            </Text>
          </View>
          {ticketStatus?.usageHistory && (
            <View className="mt-4">
              <Text className="text-white font-bold mb-2">
                Historial de uso:
              </Text>
              {ticketStatus.usageHistory.map((usage, i) => (
                <View key={i} className="bg-gray-700/50 p-2 rounded-lg mb-2">
                  <Text className="text-gray-400">
                    Usado el: {new Date(usage.timestamp).toLocaleDateString()}
                  </Text>
                  <Text className="text-gray-400">
                    Validado por: {usage.validatedBy}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="m-4">
      <Text>{JSON.stringify(generateTicketMutation.data, null, 2)}</Text>
      <FlatList
        data={generateTicketMutation.data.qrCodes}
        renderItem={renderTicket}
        keyExtractor={(qrCode) => qrCode}
        ListHeaderComponent={
          <Text className="text-white text-lg font-bold mb-4">
            Tickets ({generateTicketMutation.data.qrCodes.length})
          </Text>
        }
      />
    </View>
  );
};
