import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTicketValidation } from "@/presentation/hooks/useTicketValidation";
import { Ionicons } from "@expo/vector-icons";

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState<{
    code: string | null;
    eventId: string | null;
  }>({ code: null, eventId: null });

  // Check camera permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Setup validation hooks with proper dependencies
  const { ticketStatusQuery, validateTicketMutation, orderDetailsQuery } =
    useTicketValidation(qrData.code || undefined, qrData.eventId || undefined);

  // Handle scanned QR code
  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);

    // Parse QR code to extract eventId if present (format: hash/eventId)
    const parts = data.includes("/") ? data.split("/") : [data];
    const eventId = parts.length === 2 ? parts[1] : null;

    console.log("QR scanned:", data, "Detected eventId:", eventId);

    setQrData({
      code: data,
      eventId,
    });
  };

  // Reset the scanner state
  const resetScan = () => {
    setScanned(false);
    setQrData({ code: null, eventId: null });
  };

  // Process ticket validation when data is available
  useEffect(() => {
    if (!ticketStatusQuery.data || !qrData.code) return;

    const ticket = ticketStatusQuery.data;

    // Handle multiple events case
    if (ticket.events?.length > 1 && !qrData.eventId) {
      Alert.alert(
        "Seleccionar Evento",
        "Este ticket es válido para múltiples eventos. Seleccione uno:",
        [
          ...ticket.events.map((event) => ({
            text: `${event.name} (${event.quantity} entradas)`,
            onPress: () =>
              setQrData((prev) => ({ ...prev, eventId: event.id })),
          })),
          { text: "Cancelar", style: "cancel", onPress: resetScan },
        ],
      );
      return;
    }

    // Handle used ticket case
    if (ticket.isUsed) {
      Alert.alert(
        "Ticket Usado",
        `Este ticket ya fue utilizado el ${new Date(
          ticket.usedAt!,
        ).toLocaleString()} por ${ticket.validatedBy}`,
        [
          {
            text: "Ver detalles",
            onPress: () => router.push(`/admin/ticket/${qrData.code}`),
          },
          { text: "Escanear otro", onPress: resetScan },
        ],
      );
      return;
    }

    // Wait for order data before showing validation prompt
    if (orderDetailsQuery.data) {
      showValidationPrompt(ticket, orderDetailsQuery.data);
    }
  }, [ticketStatusQuery.data, orderDetailsQuery.data, qrData]);

  // Show validation confirmation dialog
  const showValidationPrompt = (ticket, orderData) => {
    const eventName =
      ticket.events?.find((e) => e.id === qrData.eventId)?.name ||
      "Desconocido";

    Alert.alert(
      "Validar Ticket",
      `¿Deseas validar el ticket para?\n\n` +
        `Cliente: ${orderData.billing.first_name} ${orderData.billing.last_name}\n` +
        `Email: ${orderData.billing.email}\n` +
        `Teléfono: ${orderData.billing.phone}\n\n` +
        `Evento: ${eventName}\n` +
        `Usos restantes: ${ticket.maxUsages - ticket.usageCount}`,
      [
        { text: "Cancelar", style: "cancel", onPress: resetScan },
        {
          text: "Ver Detalles",
          onPress: () => router.push(`/admin/ticket/${qrData.code}`),
        },
        {
          text: "Validar",
          style: "default",
          onPress: async () => {
            try {
              await validateTicketMutation.mutateAsync({
                qrCode: qrData.code!,
                eventId: qrData.eventId!,
              });

              Alert.alert("Éxito", "Ticket validado correctamente", [
                {
                  text: "Ver detalles",
                  // onPress: () => router.push(`/admin/ticket/${qrData.code}`),
                },
                { text: "Escanear otro", onPress: resetScan },
              ]);
            } catch (error) {
              console.error("Validation error:", error);
              Alert.alert(
                "Error",
                "Error al validar el ticket. Intente nuevamente.",
                [{ text: "OK", onPress: resetScan }],
              );
            }
          },
        },
      ],
    );
  };

  // Handle permission states
  if (hasPermission === null) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <Text className="text-white">Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900 p-4">
        <Text className="text-white text-center mb-4">
          Necesitamos acceso a la cámara para escanear los tickets
        </Text>
        <TouchableOpacity
          className="bg-purple-500 px-6 py-3 rounded-lg"
          onPress={() => BarCodeScanner.requestPermissionsAsync()}
        >
          <Text className="text-white font-bold">Dar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main scanner UI
  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1 m-4 rounded-2xl overflow-hidden">
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
          style={{ flex: 1 }}
        >
          <View className="flex-1 bg-transparent justify-center items-center">
            <View className="w-72 h-72 border-2 border-white/50 rounded-2xl">
              <View className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-purple-500" />
              <View className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-purple-500" />
              <View className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-purple-500" />
              <View className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-purple-500" />
            </View>
          </View>
        </BarCodeScanner>
      </View>

      <View className="p-4">
        <View className="bg-gray-800 rounded-lg p-4 mb-4">
          {/* Status indicators */}
          {scanned &&
            (qrData.code ||
              ticketStatusQuery.isLoading ||
              orderDetailsQuery.isLoading) && (
              <View className="flex-row items-center justify-center mb-3">
                <ActivityIndicator
                  size="small"
                  color="#7B3DFF"
                  animating={
                    ticketStatusQuery.isLoading || orderDetailsQuery.isLoading
                  }
                />
                <Text className="text-white ml-2">
                  {ticketStatusQuery.isLoading
                    ? "Verificando ticket..."
                    : orderDetailsQuery.isLoading
                      ? "Cargando detalles de la orden..."
                      : qrData.eventId
                        ? `QR procesado: ${qrData.code}`
                        : "Procesando QR..."}
                </Text>
              </View>
            )}

          {/* Error display */}
          {(ticketStatusQuery.error || orderDetailsQuery.error) && (
            <View className="mb-3 p-2 bg-red-500/20 rounded">
              <Text className="text-red-400 text-center">
                Error al procesar el ticket. Intente nuevamente.
              </Text>
            </View>
          )}

          {/* Instructions */}
          <Text className="text-white text-center text-lg mb-3">
            {scanned
              ? "Procesando información del ticket..."
              : "Coloca el código QR dentro del marco"}
          </Text>

          {/* Reset button */}
          {scanned && (
            <TouchableOpacity
              className="bg-purple-500 py-3 rounded-lg flex-row justify-center items-center"
              onPress={resetScan}
            >
              <Ionicons name="scan" size={24} color="white" />
              <Text className="text-white font-bold ml-2">
                Escanear otro ticket
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
