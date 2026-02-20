import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Camera, CameraView } from "expo-camera";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTicketValidation } from "@/presentation/hooks/useTicketValidation";
import { Ionicons } from "@expo/vector-icons";

const SCAN_FRAME_SIZE = 260;
const CORNER_SIZE = 32;
const CORNER_THICKNESS = 4;
const CORNER_COLOR = "#A78BFA";
const CORNER_RADIUS = 6;

const cornerBase = {
  position: "absolute" as const,
  width: CORNER_SIZE,
  height: CORNER_SIZE,
  borderColor: CORNER_COLOR,
};

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState<{
    code: string | null;
    eventId: string | null;
  }>({ code: null, eventId: null });

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const {
    ticketStatusQuery,
    orderDetailsQuery,
    validateTicketMutation,
    refreshData,
  } = useTicketValidation(qrData.code ?? undefined, qrData.eventId ?? undefined);

  const resetScan = useCallback(() => {
    setScanned(false);
    setQrData({ code: null, eventId: null });
  }, []);

  const handleBarCodeScanned = useCallback(
    ({ data }: { type: string; data: string }) => {
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
    },
    [scanned, resetScan],
  );

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
        [{ text: "Escanear otro", onPress: resetScan }],
      );
      return;
    }

    if (
      !orderData &&
      !orderDetailsQuery.isLoading &&
      !orderDetailsQuery.error
    ) {
      return;
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
          {
            text: "Validar",
            style: "default",
            onPress: async () => {
              const scannedCode = qrData.code;
              const scannedEventId = qrData.eventId;
              if (!scannedCode || !scannedEventId) {
                Alert.alert("Error", "No se pudo leer el ticket correctamente.");
                resetScan();
                return;
              }

              try {
                await validateTicketMutation.mutateAsync({
                  qrCode: `${scannedCode}/${scannedEventId}`,
                  eventId: scannedEventId,
                });

                Alert.alert("Éxito", "Ticket validado correctamente", [
                  {
                    text: "Ver detalles",
                    onPress: () =>
                      router.push(
                        `/admin/ticket/${scannedCode}/${scannedEventId}`,
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
  }, [
    ticketStatusQuery.data,
    orderDetailsQuery.data,
    orderDetailsQuery.isLoading,
    orderDetailsQuery.error,
    qrData.code,
    qrData.eventId,
    validateTicketMutation,
    resetScan,
  ]);

  if (hasPermission === null) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color="#7B3DFF" />
        <Text className="text-white mt-4">Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900 p-8">
        <Ionicons name="camera-outline" size={64} color="#6B7280" />
        <Text className="text-white text-center text-lg font-bold mt-6 mb-2">
          Acceso a la cámara requerido
        </Text>
        <Text className="text-gray-400 text-center mb-8">
          Necesitamos acceso a la cámara para escanear los tickets
        </Text>
        <TouchableOpacity
          className="bg-purple-600 px-8 py-4 rounded-xl flex-row items-center"
          onPress={() => Camera.requestCameraPermissionsAsync()}
        >
          <Ionicons name="camera" size={20} color="white" />
          <Text className="text-white font-bold ml-2 text-base">Dar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLoading =
    scanned && (ticketStatusQuery.isLoading || orderDetailsQuery.isLoading);
  const hasError = ticketStatusQuery.error || orderDetailsQuery.error;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Camera — fills the space above the bottom panel */}
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        style={{ flex: 1 }}
      >
        {/* Spotlight overlay: 4 dim regions around the transparent scan frame */}
        <View style={{ flex: 1 }}>
          {/* Top dim region */}
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }} />

          {/* Middle row */}
          <View
            style={{
              flexDirection: "row",
              height: SCAN_FRAME_SIZE,
            }}
          >
            {/* Left dim */}
            <View
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }}
            />

            {/* Transparent scan frame with L-shaped corner markers */}
            <View style={{ width: SCAN_FRAME_SIZE, height: SCAN_FRAME_SIZE }}>
              {/* Top-left */}
              <View
                style={{
                  ...cornerBase,
                  top: 0,
                  left: 0,
                  borderTopWidth: CORNER_THICKNESS,
                  borderLeftWidth: CORNER_THICKNESS,
                  borderTopLeftRadius: CORNER_RADIUS,
                }}
              />
              {/* Top-right */}
              <View
                style={{
                  ...cornerBase,
                  top: 0,
                  right: 0,
                  borderTopWidth: CORNER_THICKNESS,
                  borderRightWidth: CORNER_THICKNESS,
                  borderTopRightRadius: CORNER_RADIUS,
                }}
              />
              {/* Bottom-left */}
              <View
                style={{
                  ...cornerBase,
                  bottom: 0,
                  left: 0,
                  borderBottomWidth: CORNER_THICKNESS,
                  borderLeftWidth: CORNER_THICKNESS,
                  borderBottomLeftRadius: CORNER_RADIUS,
                }}
              />
              {/* Bottom-right */}
              <View
                style={{
                  ...cornerBase,
                  bottom: 0,
                  right: 0,
                  borderBottomWidth: CORNER_THICKNESS,
                  borderRightWidth: CORNER_THICKNESS,
                  borderBottomRightRadius: CORNER_RADIUS,
                }}
              />
            </View>

            {/* Right dim */}
            <View
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }}
            />
          </View>

          {/* Bottom dim region — holds the instruction pill */}
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.65)",
              alignItems: "center",
              paddingTop: 28,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(0,0,0,0.55)",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 24,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name={scanned ? "hourglass-outline" : "qr-code-outline"}
                size={16}
                color="white"
              />
              <Text style={{ color: "white", marginLeft: 8, fontSize: 14 }}>
                {scanned
                  ? "Procesando ticket..."
                  : "Centra el código QR en el marco"}
              </Text>
            </View>
          </View>
        </View>
      </CameraView>

      {/* Bottom status panel */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#111827" }}>
        <View style={{ padding: 16 }}>
          {/* Loading row */}
          {isLoading && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                marginBottom: 8,
              }}
            >
              <ActivityIndicator size="small" color="#7B3DFF" />
              <Text style={{ color: "white", marginLeft: 10, fontSize: 15 }}>
                {ticketStatusQuery.isLoading
                  ? "Verificando ticket..."
                  : "Cargando detalles de la orden..."}
              </Text>
            </View>
          )}

          {/* Error row */}
          {hasError && (
            <TouchableOpacity
              onPress={refreshData}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(239,68,68,0.15)",
                padding: 14,
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
              <Text
                style={{ color: "#FCA5A5", marginLeft: 10, flex: 1, fontSize: 14 }}
              >
                Error al cargar el ticket. Toca para reintentar.
              </Text>
              <Ionicons name="refresh-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}

          {/* Primary action button */}
          <TouchableOpacity
            onPress={scanned ? resetScan : undefined}
            style={{
              backgroundColor: scanned ? "#7B3DFF" : "#1F2937",
              paddingVertical: 16,
              borderRadius: 14,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name={scanned ? "scan-outline" : "radio-button-on-outline"}
              size={22}
              color={scanned ? "white" : "#6B7280"}
            />
            <Text
              style={{
                color: scanned ? "white" : "#6B7280",
                fontWeight: "bold",
                marginLeft: 8,
                fontSize: 16,
              }}
            >
              {scanned ? "Escanear otro ticket" : "Listo para escanear"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
