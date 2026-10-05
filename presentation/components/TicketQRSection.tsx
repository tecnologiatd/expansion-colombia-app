import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import QRCode from "react-native-qrcode-svg";
import { useTicketCodes } from "../hooks/useTicketCodes";
import { useTicketUsageStatuses } from "../hooks/useTicketUsageStatuses";
import { TicketUsageStatus } from "@/core/actions/ticket-validation.actions";
import { useConnectivityStore } from "@/core/offline/connectivity";
import { OfflineBanner, formatTimeAgo } from "./OfflineBanner";

const VALID_ORDER_STATUSES = ["processing", "completed"];

export const TicketQRCard = ({
  qrCode,
  index,
  total,
  ticketStatus,
  statusLoading,
  statusTimeAgo,
}: {
  qrCode: string;
  index: number;
  total: number;
  ticketStatus?: TicketUsageStatus;
  statusLoading: boolean;
  statusTimeAgo: string | null;
}) => {
  const { width } = useWindowDimensions();
  // Cabe en pantallas angostas (320 px) sin perder tamaño en las grandes
  const qrSize = Math.max(160, Math.min(220, width - 128));

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
              Estado no disponible
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
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const {
    codes: generatedCodes,
    cachedCodes,
    eventAvailable,
    retry,
    loading,
    failed,
  } = useTicketCodes(orderId, eventId, orderStatus, quantity);
  const paid = VALID_ORDER_STATUSES.includes(orderStatus?.toLowerCase());
  const ticketStatusesQuery = useTicketUsageStatuses(
    paid ? generatedCodes : [],
  );
  const statusesByCode = new Map(
    ticketStatusesQuery.data?.map((status) => [status.qrCode, status]),
  );
  const statusTimeAgo =
    !isOnline || ticketStatusesQuery.isError || ticketStatusesQuery.isPaused
      ? formatTimeAgo(ticketStatusesQuery.dataUpdatedAt || undefined)
      : null;
  const isPackage = generatedCodes.length > quantity;
  const ticketsPerUnit =
    quantity > 0
      ? Math.max(1, Math.round(generatedCodes.length / quantity))
      : 1;

  if (!paid) {
    return (
      <View className="m-4 bg-yellow-500/20 p-4 rounded-xl">
        <Text className="text-yellow-500 text-center">
          Los códigos QR estarán disponibles cuando se complete el pago
        </Text>
      </View>
    );
  }

  // Los códigos existentes se muestran incluso si está cargando otra consulta.
  if (!generatedCodes.length) {
    if (loading) {
      return (
        <View className="m-4 bg-gray-800 p-4 rounded-xl items-center">
          <ActivityIndicator size="large" color="#7B3DFF" />
          <Text className="text-white mt-2">Cargando entradas...</Text>
        </View>
      );
    }
    if (!isOnline) {
      return (
        <View className="m-4 bg-yellow-500/20 p-4 rounded-xl">
          <Text className="text-yellow-500 text-center">
            Sin conexión. Abre esta pantalla con internet al menos una vez para
            guardar tus entradas en el dispositivo.
          </Text>
        </View>
      );
    }
    if (failed) {
      return (
        <View className="m-4 bg-red-500/20 p-4 rounded-xl">
          <Text className="text-red-500 text-center">
            No se pudieron cargar las entradas. Toca reintentar.
          </Text>
          <TouchableOpacity className="mt-3" onPress={retry}>
            <Text className="text-white text-center font-bold">
              Reintentar QR
            </Text>
          </TouchableOpacity>
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
    return null;
  }

  return (
    <View className="p-4">
      {!isOnline && cachedCodes && (
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
          index={index}
          total={generatedCodes.length}
          ticketStatus={statusesByCode.get(code)}
          statusLoading={ticketStatusesQuery.isLoading}
          statusTimeAgo={statusTimeAgo}
        />
      ))}
    </View>
  );
};
