// presentation/components/TicketQRSection.tsx
import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useTicketValidation } from "../hooks/useTicketValidation";
import { useGenerateTicket } from "../hooks/useGenerateTicket";

interface Props {
  orderId: string;
  orderStatus: string;
}

export const TicketQRSection: React.FC<Props> = ({ orderId, orderStatus }) => {
  const { generateTicketMutation } = useGenerateTicket();
  const { ticketStatusQuery } = useTicketValidation(
    generateTicketMutation.data?.qrCode,
  );

  // Generar QR cuando el componente se monta y el estado es 'processing'
  useEffect(() => {
    if (orderStatus === "processing") {
      generateTicketMutation.mutate(orderId);
    }
  }, [orderId, orderStatus]);

  if (orderStatus !== "processing") {
    return (
      <View className="m-4 bg-yellow-500/20 p-4 rounded-xl">
        <Text className="text-yellow-500 text-center">
          El QR estará disponible cuando se complete el pago
        </Text>
      </View>
    );
  }

  if (generateTicketMutation.isPending) {
    return (
      <View className="m-4 bg-gray-800 p-4 rounded-xl items-center">
        <ActivityIndicator size="large" color="#7B3DFF" />
        <Text className="text-white mt-2">Generando código QR...</Text>
      </View>
    );
  }

  if (generateTicketMutation.isError || !generateTicketMutation.data?.qrCode) {
    return (
      <View className="m-4 bg-red-500/20 p-4 rounded-xl">
        <Text className="text-red-500 text-center">
          Error al generar el código QR. Por favor contacta a soporte.
        </Text>
      </View>
    );
  }

  const ticketStatus = ticketStatusQuery.data;

  return (
    <View className="bg-gray-800 rounded-lg p-6 m-4">
      <View className="items-center mb-4">
        <QRCode
          value={generateTicketMutation.data.qrCode}
          size={200}
          color="white"
          backgroundColor="transparent"
        />
      </View>
      <View className="mt-4">
        <View
          className={`p-4 rounded-lg ${
            ticketStatus?.isUsed ? "bg-red-500/20" : "bg-green-500/20"
          }`}
        >
          <Text
            className={`text-center text-lg font-bold ${
              ticketStatus?.isUsed ? "text-red-500" : "text-green-500"
            }`}
          >
            {ticketStatus?.isUsed ? "Ticket Usado" : "Ticket Válido"}
          </Text>
          {ticketStatus?.isUsed && (
            <>
              <Text className="text-gray-400 text-center mt-2">
                Usado el: {new Date(ticketStatus.usedAt).toLocaleDateString()}
              </Text>
              <Text className="text-gray-400 text-center">
                Validado por: {ticketStatus.validatedBy}
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
};
