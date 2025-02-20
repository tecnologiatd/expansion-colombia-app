import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useGenerateTicket } from "../hooks/useGenerateTicket";
import { useTicketValidation } from "../hooks/useTicketValidation";

export const TicketQRCard = ({ qrCode, eventId, index, total }) => {
  const { ticketStatusQuery } = useTicketValidation(qrCode, eventId);

  if (ticketStatusQuery.isLoading) {
    return (
      <View className="bg-gray-800 rounded-lg p-4 mb-4">
        <ActivityIndicator size="small" color="#7B3DFF" />
      </View>
    );
  }

  const ticketStatus = ticketStatusQuery.data;

  return (
    <View className="bg-gray-800 rounded-lg p-6 mb-4">
      <Text className="text-white text-center mb-4">
        Ticket {index + 1} de {total}
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
            ticketStatus?.usageCount >= 1 ? "bg-red-500/20" : "bg-green-500/20"
          }`}
        >
          <Text
            className={`text-center text-lg font-bold ${
              ticketStatus?.usageCount >= 1 ? "text-red-500" : "text-green-500"
            }`}
          >
            {ticketStatus?.usageCount >= 1 ? "Ticket Usado" : "Ticket Válido"}
          </Text>
        </View>

        {ticketStatus?.usageHistory && ticketStatus.usageHistory.length > 0 && (
          <View className="mt-4">
            <Text className="text-white font-bold mb-2">Historial de uso:</Text>
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

export const TicketQRSection = ({
  orderId,
  orderStatus,
  eventId,
  quantity,
}) => {
  const { generateTicketMutation } = useGenerateTicket();
  const [generatedCodes, setGeneratedCodes] = useState([]);

  useEffect(() => {
    if (orderStatus === "processing") {
      generateTicketMutation.mutate({
        orderId,
        eventId,
        quantity,
        usagesPerTicket: 1,
      });
    }
  }, [orderId, orderStatus, eventId, quantity]);

  useEffect(() => {
    if (generateTicketMutation.data?.qrCodes) {
      setGeneratedCodes(generateTicketMutation.data.qrCodes);
    }
  }, [generateTicketMutation.data]);

  if (orderStatus !== "processing") {
    return (
      <View className="m-4 bg-yellow-500/20 p-4 rounded-xl">
        <Text className="text-yellow-500 text-center">
          Los códigos QR estarán disponibles cuando se complete el pago
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

  return (
    <View className="p-4">
      <Text className="text-white text-lg font-bold mb-4">
        Tickets ({generatedCodes.length})
      </Text>

      {generatedCodes.map((qrCode, index) => (
        <TicketQRCard
          key={qrCode}
          qrCode={qrCode}
          eventId={eventId}
          index={index}
          total={quantity}
        />
      ))}
    </View>
  );
};

export default TicketQRSection;
