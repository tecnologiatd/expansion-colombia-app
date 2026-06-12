import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useGenerateTicket } from "../hooks/useGenerateTicket";
import { useTicketValidation } from "../hooks/useTicketValidation";
import { useTicketCodesStore } from "@/core/stores/ticket-codes.store";
import {
  isServerUnreachableError,
  useConnectivityStore,
} from "@/core/offline/connectivity";
import { OfflineBanner, formatTimeAgo } from "./OfflineBanner";

const VALID_ORDER_STATUSES = ["processing", "completed"];

export const TicketQRCard = ({ qrCode, eventId, index, total }) => {
  const { ticketStatusQuery } = useTicketValidation(qrCode, eventId);

  if (ticketStatusQuery.isLoading && !ticketStatusQuery.isPaused) {
    return (
      <View className="bg-gray-800 rounded-lg p-4 mb-4">
        <ActivityIndicator size="small" color="#7B3DFF" />
      </View>
    );
  }

  const ticketStatus = ticketStatusQuery.data;
  const statusTimeAgo =
    ticketStatusQuery.isError || ticketStatusQuery.isPaused
      ? formatTimeAgo(ticketStatusQuery.dataUpdatedAt || undefined)
      : null;

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
        {ticketStatus ? (
          <View
            className={`p-4 rounded-lg ${
              ticketStatus.usageCount >= ticketStatus.maxUsages
                ? "bg-red-500/20"
                : "bg-green-500/20"
            }`}
          >
            <Text
              className={`text-center text-lg font-bold ${
                ticketStatus.usageCount >= ticketStatus.maxUsages
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {ticketStatus.usageCount >= ticketStatus.maxUsages
                ? "Ticket Usado"
                : "Ticket Válido"}
            </Text>
            {statusTimeAgo && (
              <Text className="text-yellow-500 text-center text-xs mt-1">
                Estado actualizado {statusTimeAgo}
              </Text>
            )}
          </View>
        ) : (
          <View className="p-4 rounded-lg bg-gray-700/50">
            <Text className="text-gray-300 text-center">
              Estado no disponible sin conexión
            </Text>
          </View>
        )}

        {ticketStatus?.usageHistory && ticketStatus.usageHistory.length > 0 && (
          <View className="mt-4">
            <Text className="text-white font-bold mb-2">Historial de uso:</Text>
            {ticketStatus.usageHistory.map((usage, i) => (
              <View key={i} className="bg-gray-700/50 p-2 rounded-lg mb-2">
                <Text className="text-gray-400">
                  Usado el: {new Date(usage.timestamp).toLocaleString("es-co")}
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
  eventName,
}) => {
  const { generateTicketMutation } = useGenerateTicket();
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const cachedCodes = useTicketCodesStore((state) =>
    state.getCodes(String(orderId), String(eventId)),
  );
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [isPackage, setIsPackage] = useState(false);
  const [ticketsPerUnit, setTicketsPerUnit] = useState(1);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);

  useEffect(() => {
    // Sin conexión no tiene sentido pedir la generación; usamos el cache
    if (isOnline && VALID_ORDER_STATUSES.includes(orderStatus?.toLowerCase())) {
      generateTicketMutation.mutate({
        orderId,
        eventId,
        quantity,
        usagesPerTicket: 1,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, orderStatus, eventId, quantity, isOnline]);

  // El backend no entregó códigos (offline o caído): usar los persistidos.
  // La generación es idempotente, así que los códigos guardados son los mismos
  // que devolvería el servidor.
  const serverFailed =
    !isOnline ||
    (generateTicketMutation.isError &&
      isServerUnreachableError(generateTicketMutation.error));
  const usingCachedCodes =
    serverFailed && !generateTicketMutation.data?.qrCodes && !!cachedCodes;

  useEffect(() => {
    const codes = generateTicketMutation.data?.qrCodes
      ? generateTicketMutation.data.qrCodes
      : usingCachedCodes
        ? cachedCodes.qrCodes
        : null;

    if (codes) {
      setGeneratedCodes(codes);

      // Determinar si es un paquete basado en la cantidad de códigos generados
      if (codes.length > quantity) {
        setIsPackage(true);
        setTicketsPerUnit(Math.round(codes.length / quantity));
      }
    }
  }, [generateTicketMutation.data, quantity, usingCachedCodes, cachedCodes]);

  // Si la orden no está en un estado válido
  if (!VALID_ORDER_STATUSES.includes(orderStatus?.toLowerCase())) {
    return (
      <View className="m-4 bg-yellow-500/20 p-4 rounded-xl">
        <Text className="text-yellow-500 text-center">
          Los códigos QR estarán disponibles cuando se complete el pago
        </Text>
      </View>
    );
  }

  if (generateTicketMutation.isPending && !usingCachedCodes) {
    return (
      <View className="m-4 bg-gray-800 p-4 rounded-xl items-center">
        <ActivityIndicator size="large" color="#7B3DFF" />
        <Text className="text-white mt-2">Generando códigos QR...</Text>
      </View>
    );
  }

  if (generateTicketMutation.isError && !usingCachedCodes) {
    return (
      <View className="m-4 bg-red-500/20 p-4 rounded-xl">
        <Text className="text-red-500 text-center">
          Error al generar los códigos QR. Por favor, intente de nuevo más
          tarde.
        </Text>
      </View>
    );
  }

  // Sin conexión y sin códigos guardados de una sesión anterior
  if (serverFailed && generatedCodes.length === 0) {
    return (
      <View className="m-4 bg-yellow-500/20 p-4 rounded-xl">
        <Text className="text-yellow-500 text-center">
          Sin conexión. Los códigos QR estarán disponibles cuando vuelva la
          conexión. Abre esta pantalla con internet al menos una vez para
          guardarlos en el dispositivo.
        </Text>
      </View>
    );
  }

  // Mostrar un ticket a la vez en lugar de usar FlatList o ScrollView anidados
  const currentTicket = generatedCodes[currentTicketIndex];

  // Funciones para navegación entre tickets
  const goToNextTicket = () => {
    if (currentTicketIndex < generatedCodes.length - 1) {
      setCurrentTicketIndex(currentTicketIndex + 1);
    }
  };

  const goToPrevTicket = () => {
    if (currentTicketIndex > 0) {
      setCurrentTicketIndex(currentTicketIndex - 1);
    }
  };

  return (
    <View className="p-4">
      {usingCachedCodes && (
        <OfflineBanner
          message="Mostrando tickets guardados — sin conexión"
          dataUpdatedAt={cachedCodes?.savedAt}
        />
      )}

      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-lg font-bold">
          Tickets ({generatedCodes.length})
        </Text>

        {isPackage && (
          <View className="bg-purple-500/20 px-3 py-1 rounded-lg">
            <Text className="text-purple-300">
              Paquete: {quantity} × {ticketsPerUnit} entradas
            </Text>
          </View>
        )}
      </View>

      {/* Mostrar el ticket actual */}
      {currentTicket && (
        <View>
          <TicketQRCard
            qrCode={currentTicket}
            eventId={eventId}
            index={currentTicketIndex}
            total={generatedCodes.length}
          />

          {/* Controles de navegación para múltiples tickets */}
          {generatedCodes.length > 1 && (
            <View className="flex-row justify-between mt-2 mb-4">
              <TouchableOpacity
                onPress={goToPrevTicket}
                disabled={currentTicketIndex === 0}
                className={`bg-gray-800 py-2 px-4 rounded-lg ${currentTicketIndex === 0 ? "opacity-50" : ""}`}
              >
                <Text className="text-white">← Anterior</Text>
              </TouchableOpacity>

              <Text className="text-white text-center self-center">
                {currentTicketIndex + 1} / {generatedCodes.length}
              </Text>

              <TouchableOpacity
                onPress={goToNextTicket}
                disabled={currentTicketIndex === generatedCodes.length - 1}
                className={`bg-gray-800 py-2 px-4 rounded-lg ${currentTicketIndex === generatedCodes.length - 1 ? "opacity-50" : ""}`}
              >
                <Text className="text-white">Siguiente →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};
