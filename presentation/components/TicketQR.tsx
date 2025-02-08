// presentation/components/TicketQR.tsx
import React from "react";
import { View, Text } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useTicketValidation } from "@/presentation/hooks/useTicketValidation";

interface Props {
  qrCode: string;
}

export const TicketQR: React.FC<Props> = ({ qrCode }) => {
  const { ticketStatusQuery } = useTicketValidation(qrCode);

  if (ticketStatusQuery.isLoading) {
    return (
      <View className="m-4 bg-gray-800 p-4 rounded-xl">
        <Text className="text-white text-center">
          Verificando estado del ticket...
        </Text>
      </View>
    );
  }

  if (ticketStatusQuery.isError) {
    return (
      <View className="m-4 bg-red-500/20 p-4 rounded-xl">
        <Text className="text-red-500 text-center">
          Error al verificar el estado del ticket
        </Text>
      </View>
    );
  }

  const ticketStatus = ticketStatusQuery.data;

  return (
    <View className="bg-gray-800 rounded-lg p-6 m-4">
      <View className="items-center mb-4">
        <QRCode
          value={qrCode}
          size={200}
          color="white"
          backgroundColor="transparent"
        />
      </View>

      <View className="mt-4">
        <Text className="text-white text-center text-lg mb-2">
          Estado del Ticket
        </Text>

        <View
          className={`p-2 rounded-lg ${
            ticketStatus?.isUsed ? "bg-red-500/20" : "bg-green-500/20"
          }`}
        >
          <Text
            className={`text-center ${
              ticketStatus?.isUsed ? "text-red-500" : "text-green-500"
            }`}
          >
            {ticketStatus?.isUsed ? "Ticket Usado" : "Ticket Válido"}
          </Text>
        </View>

        {ticketStatus?.isUsed && (
          <View className="mt-2">
            <Text className="text-gray-400 text-center">
              Usado el:{" "}
              {new Date(ticketStatus.usedAt).toLocaleDateString("es-CO")}
            </Text>
            {ticketStatus.validatedBy && (
              <Text className="text-gray-400 text-center mt-1">
                Validado por: {ticketStatus.validatedBy}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};
