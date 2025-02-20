// app/(admin)/scan.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
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

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const {
    ticketStatusQuery,
    orderDetailsQuery,
    validateTicketMutation,
    refreshData,
  } = useTicketValidation(qrData.code, qrData.eventId);

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    const parts = data.split("/");
    if (parts.length === 2) {
      setQrData({
        code: parts[0],
        eventId: parts[1],
      });
    } else {
      Alert.prompt(
        "Ingrese ID del Evento",
        "Este QR requiere un ID de evento para ser validado",
        [
          { text: "Cancelar", onPress: resetScan, style: "cancel" },
          {
            text: "Validar",
            onPress: (eventId?: string) => {
              if (!eventId) {
                Alert.alert("Error", "El ID del evento es requerido");
                resetScan();
                return;
              }
              setQrData({
                code: data,
                eventId: eventId,
              });
            },
          },
        ],
        "plain-text",
        "",
        "number-pad",
      );
    }
  };

  const resetScan = () => {
    setScanned(false);
    setQrData({ code: null, eventId: null });
  };

  // Procesar ticket cuando tenemos los datos
  useEffect(() => {
    if (!ticketStatusQuery.data || !qrData.code || !qrData.eventId) return;

    const ticket = ticketStatusQuery.data;
    const orderData = orderDetailsQuery.data;

    if (ticket.usageCount >= ticket.maxUsages) {
      Alert.alert(
        "Ticket Inválido",
        `Este ticket ya ha sido utilizado completamente.\n\nÚltimo uso: ${new Date(
          ticket.usageHistory[ticket.usageHistory.length - 1].timestamp,
        ).toLocaleString()}`,
        [
          // {
          //   text: "Ver detalles",
          //   onPress: () =>
          //     router.push(`/admin/ticket/${qrData.code}/${qrData.eventId}`),
          // },
          { text: "Escanear otro", onPress: resetScan },
        ],
      );
      return;
    }

    if (
      !orderData &&
      !orderDetailsQuery.isLoading &&
      !orderDetailsQuery.error
    ) {
      return; // Esperar a que los datos de la orden estén disponibles
    }

    if (orderData) {
      Alert.alert(
        "Validar Ticket",
        `¿Deseas validar este ticket?\n\n` +
          `Cliente: ${orderData.billing.first_name} ${orderData.billing.last_name}\n` +
          `Email: ${orderData.billing.email}\n` +
          `Teléfono: ${orderData.billing.phone}\n\n` +
          `Usos: ${ticket.usageCount} de ${ticket.maxUsages}\n` +
          `Usos restantes: ${ticket.maxUsages - ticket.usageCount}`,
        [
          { text: "Cancelar", style: "cancel", onPress: resetScan },
          // {
          //   text: "Ver Detalles",
          //   onPress: () =>
          //     router.push(`/admin/ticket/${qrData.code}/${qrData.eventId}`),
          // },
          {
            text: "Validar",
            style: "default",
            onPress: async () => {
              try {
                await validateTicketMutation.mutateAsync({
                  qrCode: `${qrData.code}/${qrData.eventId}`,
                  eventId: qrData.eventId!,
                });

                Alert.alert("Éxito", "Ticket validado correctamente", [
                  {
                    text: "Ver detalles",
                    onPress: () =>
                      router.push(
                        `/admin/ticket/${qrData.code}/${qrData.eventId}`,
                      ),
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
    }
  }, [ticketStatusQuery.data, orderDetailsQuery.data, qrData]);

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
          {scanned &&
            (ticketStatusQuery.isLoading || orderDetailsQuery.isLoading) && (
              <View className="flex-row items-center justify-center mb-3">
                <ActivityIndicator
                  size="small"
                  color="#7B3DFF"
                  animating={true}
                />
                <Text className="text-white ml-2">
                  {ticketStatusQuery.isLoading
                    ? "Verificando ticket..."
                    : "Cargando detalles de la orden..."}
                </Text>
              </View>
            )}

          {(ticketStatusQuery.error || orderDetailsQuery.error) && (
            <View className="mb-3 p-2 bg-red-500/20 rounded">
              <TouchableOpacity className="items-center" onPress={refreshData}>
                <Text className="text-red-400 text-center mb-2">
                  Error al cargar los detalles. Presiona para reintentar.
                </Text>
                <Ionicons name="refresh" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          <Text className="text-white text-center text-lg mb-3">
            {scanned
              ? "Procesando información del ticket..."
              : "Coloca el código QR dentro del marco"}
          </Text>

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
