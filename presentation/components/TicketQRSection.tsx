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
      <View className="items-center p-4">
        <Text className="text-white">Verificando estado del ticket...</Text>
      </View>
    );
  }

  if (ticketStatusQuery.isError) {
    return (
      <View className="items-center p-4">
        <Text className="text-red-500">
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
          className={`p-4 rounded-lg ${
            ticketStatus?.isUsed ? "bg-purple-500/20" : "bg-green-500/20"
          }`}
        >
          {ticketStatus?.isUsed ? (
            <View>
              <Text className="text-purple-500 text-center font-bold text-lg mb-2">
                Ticket Utilizado
              </Text>
              <Text className="text-gray-400 text-center">
                Ingresaste el{" "}
                {new Date(ticketStatus.usedAt).toLocaleDateString("es-CO", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              {ticketStatus.validatedBy && (
                <Text className="text-gray-400 text-center mt-1">
                  Validado por: {ticketStatus.validatedBy}
                </Text>
              )}
            </View>
          ) : (
            <View>
              <Text className="text-green-500 text-center font-bold text-lg">
                Ticket Válido
              </Text>
              <Text className="text-gray-400 text-center mt-1">
                Este ticket aún no ha sido utilizado
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
