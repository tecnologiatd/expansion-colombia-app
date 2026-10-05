import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
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

export const TicketQRCard = ({
  qrCode,
  eventId,
  index,
  total,
}: {
  qrCode: string;
  eventId: string;
  index: number;
  total: number;
}) => {
  const { ticketStatusQuery } = useTicketValidation(qrCode, eventId);
  const { width } = useWindowDimensions();
  // Cabe en pantallas angostas (320 px) sin perder tamaño en las grandes
  const qrSize = Math.max(160, Math.min(220, width - 128));

  const statusLoading =
    ticketStatusQuery.isLoading && !ticketStatusQuery.isPaused;

  const ticketStatus = ticketStatusQuery.data;
  const statusTimeAgo =
    ticketStatusQuery.isError || ticketStatusQuery.isPaused
      ? formatTimeAgo(ticketStatusQuery.dataUpdatedAt || undefined)
      : null;

  return (
    <View className="bg-gray-800 rounded-2xl border border-line p-6 mb-4">
      <Text className="text-muted text-center mb-4">
        Ticket {index + 1} de {total}
      </Text>

      {/* QR oscuro sobre blanco con margen: es lo que mejor leen los lectores */}
      <Animated.View
        entering={FadeIn.duration(200)}
        style={{ alignItems: "center", marginBottom: 16 }}
      >
        <View className="bg-white p-4 rounded-2xl">
          <QRCode
            value={qrCode}
            size={qrSize}
            color="#0F1422"
            backgroundColor="#FFFFFF"
          />
        </View>
      </Animated.View>

      <View className="mt-4">
        {statusLoading ? (
          <View className="p-4 rounded-xl bg-gray-700/50">
            <ActivityIndicator size="small" color="#7B3DFF" />
          </View>
        ) : ticketStatus ? (
          <View
            className={`p-4 rounded-xl ${
              ticketStatus.revoked ||
              ticketStatus.usageCount >= ticketStatus.maxUsages
                ? "bg-red-500/20"
                : "bg-green-500/20"
            }`}
          >
            <Text
              className={`text-center text-lg font-bold ${
                ticketStatus.revoked ||
                ticketStatus.usageCount >= ticketStatus.maxUsages
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {ticketStatus.revoked
                ? "Ticket Revocado"
                : ticketStatus.usageCount >= ticketStatus.maxUsages
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
          <View className="p-4 rounded-xl bg-gray-700/50">
            <Text className="text-gray-300 text-center">
              Estado no disponible sin conexión
            </Text>
          </View>
        )}

        {ticketStatus?.usageHistory && ticketStatus.usageHistory.length > 0 && (
          <View className="mt-4">
            <Text className="text-white font-bold mb-2">Historial de uso:</Text>
            {ticketStatus.usageHistory.map((usage, i) => (
              <View key={i} className="bg-gray-700/50 p-2 rounded-xl mb-2">
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
}: {
  orderId: string;
  orderStatus: string;
  eventId: string;
  quantity: number;
  eventName?: string;
}) => {
  const { generateTicketMutation } = useGenerateTicket();
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const cachedCodes = useTicketCodesStore((state) =>
    state.getCodes(String(orderId), String(eventId)),
  );
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [isPackage, setIsPackage] = useState(false);
  const [ticketsPerUnit, setTicketsPerUnit] = useState(1);
  const eventAvailable =
    Number.isSafeInteger(Number(eventId)) && Number(eventId) > 0;

  useEffect(() => {
    // Sin conexión no tiene sentido pedir la generación; usamos el cache
    if (
      eventAvailable &&
      isOnline &&
      VALID_ORDER_STATUSES.includes(orderStatus?.toLowerCase())
    ) {
      generateTicketMutation.mutate({
        orderId,
        eventId,
        quantity,
        usagesPerTicket: 1,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, orderStatus, eventId, quantity, isOnline, eventAvailable]);

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
      setIsPackage(codes.length > quantity);
      setTicketsPerUnit(
        quantity > 0 ? Math.max(1, Math.round(codes.length / quantity)) : 1,
      );
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

  if (!eventAvailable) {
    return (
      <View className="m-4 bg-yellow-500/20 p-4 rounded-xl">
        <Text className="text-yellow-500 text-center">
          El evento de esta compra ya no está disponible. No se pueden generar
          nuevas entradas.
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
          No se pudieron cargar las entradas. Toca reintentar.
        </Text>
        <TouchableOpacity
          className="mt-3"
          onPress={() =>
            generateTicketMutation.mutate({
              orderId,
              eventId,
              quantity,
              usagesPerTicket: 1,
            })
          }
        >
          <Text className="text-white text-center font-bold">
            Reintentar QR
          </Text>
        </TouchableOpacity>
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
          <View className="bg-purple-500/20 px-3 py-1 rounded-xl">
            <Text className="text-purple-300">
              Paquete: {quantity} × {ticketsPerUnit} entradas
            </Text>
          </View>
        )}
      </View>

      {/* Todas las entradas de la compra (o del paquete) quedan a la vista */}
      {generatedCodes.map((code, index) => (
        <TicketQRCard
          key={code}
          qrCode={code}
          eventId={eventId}
          index={index}
          total={generatedCodes.length}
        />
      ))}
    </View>
  );
};
