import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Vibration,
  Animated,
  StyleSheet,
  Modal,
} from "react-native";
import { Camera, CameraView } from "expo-camera";
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

// Validation flow state — derived purely from queries/mutation, no side effects.
type ModalState =
  | { type: "hidden" }
  | { type: "loading"; stage: "ticket" | "order" }
  | { type: "error"; message: string }
  | { type: "used"; lastUsedAt?: string; usageCount: number; maxUsages: number }
  | {
      type: "ready";
      customer: { name: string; email: string; phone: string };
      usageCount: number;
      maxUsages: number;
    }
  | { type: "validating" }
  | { type: "success" }
  | { type: "failed"; message: string };

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [qrData, setQrData] = useState<{
    code: string | null;
    eventId: string | null;
  }>({ code: null, eventId: null });

  // Ref-based guard — prevents handler recreation (and native-scanner re-registration)
  // that used to cause missed frames and require multiple scan attempts.
  const scannedRef = useRef(false);
  const flashAnim = useRef(new Animated.Value(0)).current;

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
    scannedRef.current = false;
    setScanned(false);
    setQrData({ code: null, eventId: null });
    // Reset mutation so next scan doesn't start in success/failure state
    validateTicketMutation.reset();
  }, [validateTicketMutation]);

  const handleBarCodeScanned = useCallback(
    ({ data }: { type: string; data: string }) => {
      // Ref guard — synchronous, doesn't depend on React state timing
      if (scannedRef.current) return;
      scannedRef.current = true;
      setScanned(true);

      // Feedback: short vibration + success flash
      Vibration.vibrate(50);
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      const parts = data.split("/");
      if (parts.length === 2) {
        setQrData({ code: parts[0], eventId: parts[1] });
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
                setQrData({ code: data, eventId });
              },
            },
          ],
          "plain-text",
          "",
          "number-pad",
        );
      }
    },
    [resetScan, flashAnim],
  );

  // Pure derivation — the modal is a function of query + mutation state.
  // No useEffect, no side effects, no re-firing.
  const modalState: ModalState = useMemo(() => {
    if (!scanned || !qrData.code || !qrData.eventId) {
      return { type: "hidden" };
    }

    // Mutation states take priority once the admin has pressed "Validar".
    // These persist until resetScan() calls validateTicketMutation.reset().
    if (validateTicketMutation.isPending) return { type: "validating" };
    if (validateTicketMutation.isSuccess) return { type: "success" };
    if (validateTicketMutation.isError) {
      const err = validateTicketMutation.error as Error | undefined;
      return {
        type: "failed",
        message: err?.message || "Error al validar el ticket.",
      };
    }

    // Ticket status query
    if (ticketStatusQuery.isLoading) {
      return { type: "loading", stage: "ticket" };
    }
    if (ticketStatusQuery.error) {
      return {
        type: "error",
        message: "No se pudo verificar el ticket. Toca reintentar.",
      };
    }
    const ticket: any = ticketStatusQuery.data;
    if (!ticket) return { type: "loading", stage: "ticket" };

    // Already fully used
    if (ticket.usageCount >= ticket.maxUsages) {
      const history = ticket.usageHistory ?? [];
      const last = history[history.length - 1];
      return {
        type: "used",
        lastUsedAt: last?.timestamp,
        usageCount: ticket.usageCount,
        maxUsages: ticket.maxUsages,
      };
    }

    // Order details query
    if (orderDetailsQuery.isLoading) {
      return { type: "loading", stage: "order" };
    }
    if (orderDetailsQuery.error) {
      return {
        type: "error",
        message: "No se pudieron cargar los datos del cliente.",
      };
    }
    const order: any = orderDetailsQuery.data;
    if (!order) return { type: "loading", stage: "order" };

    return {
      type: "ready",
      customer: {
        name: `${order.billing.first_name} ${order.billing.last_name}`,
        email: order.billing.email,
        phone: order.billing.phone,
      },
      usageCount: ticket.usageCount,
      maxUsages: ticket.maxUsages,
    };
  }, [
    scanned,
    qrData.code,
    qrData.eventId,
    ticketStatusQuery.isLoading,
    ticketStatusQuery.error,
    ticketStatusQuery.data,
    orderDetailsQuery.isLoading,
    orderDetailsQuery.error,
    orderDetailsQuery.data,
    validateTicketMutation.isPending,
    validateTicketMutation.isSuccess,
    validateTicketMutation.isError,
    validateTicketMutation.error,
  ]);

  const handleConfirmValidate = useCallback(() => {
    const { code, eventId } = qrData;
    if (!code || !eventId) return;
    validateTicketMutation.mutate({
      qrCode: `${code}/${eventId}`,
      eventId,
    });
  }, [qrData, validateTicketMutation]);

  const handleRetryValidation = useCallback(() => {
    // Clear failed mutation so modal returns to "ready" state
    validateTicketMutation.reset();
  }, [validateTicketMutation]);

  // Permission states
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
          <Text className="text-white font-bold ml-2 text-base">
            Dar Permiso
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isBusy = modalState.type === "validating";

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Camera — handler stays attached the whole time; ref guard prevents reprocessing */}
      <CameraView
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        enableTorch={torchOn}
        style={{ flex: 1 }}
      >
        {/* Spotlight overlay */}
        <View style={{ flex: 1 }}>
          {/* Top dim region — holds torch toggle */}
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.55)",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              paddingRight: 20,
              paddingBottom: 16,
            }}
          >
            <TouchableOpacity
              onPress={() => setTorchOn((v) => !v)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: torchOn
                  ? "rgba(251,191,36,0.95)"
                  : "rgba(0,0,0,0.55)",
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityLabel={
                torchOn ? "Apagar linterna" : "Encender linterna"
              }
            >
              <Ionicons
                name={torchOn ? "flashlight" : "flashlight-outline"}
                size={22}
                color={torchOn ? "#111" : "white"}
              />
            </TouchableOpacity>
          </View>

          {/* Middle row */}
          <View style={{ flexDirection: "row", height: SCAN_FRAME_SIZE }}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
            <View style={{ width: SCAN_FRAME_SIZE, height: SCAN_FRAME_SIZE }}>
              <Animated.View
                pointerEvents="none"
                style={{
                  ...StyleSheet.absoluteFillObject,
                  backgroundColor: "#A78BFA",
                  opacity: flashAnim,
                  borderRadius: 12,
                }}
              />
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
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
          </View>

          {/* Bottom dim region */}
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.55)",
              alignItems: "center",
              paddingTop: 28,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(0,0,0,0.65)",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 24,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name={scanned ? "checkmark-circle" : "qr-code-outline"}
                size={16}
                color={scanned ? "#A78BFA" : "white"}
              />
              <Text style={{ color: "white", marginLeft: 8, fontSize: 14 }}>
                {scanned ? "Ticket detectado" : "Centra el QR en el marco"}
              </Text>
            </View>
          </View>
        </View>
      </CameraView>

      {/* Simplified bottom panel — modal handles all post-scan UI now */}
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#111827" }}>
        <View style={{ padding: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 14,
            }}
          >
            <Ionicons
              name="scan-outline"
              size={20}
              color={scanned ? "#A78BFA" : "#6B7280"}
            />
            <Text
              style={{
                color: scanned ? "#A78BFA" : "#9CA3AF",
                marginLeft: 8,
                fontSize: 15,
                fontWeight: "500",
              }}
            >
              {scanned ? "Procesando..." : "Listo para escanear"}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Validation Modal — fully declarative, no side effects */}
      <Modal
        visible={modalState.type !== "hidden"}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          // Block back-button dismiss while validating to avoid orphan mutations
          if (isBusy) return;
          resetScan();
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#1F2937",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 36,
            }}
          >
            <ModalBody
              state={modalState}
              onConfirm={handleConfirmValidate}
              onCancel={resetScan}
              onRetry={refreshData}
              onRetryValidation={handleRetryValidation}
              onScanAnother={resetScan}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Modal Body Renderers ────────────────────────────────────────────────

function ModalBody({
  state,
  onConfirm,
  onCancel,
  onRetry,
  onRetryValidation,
  onScanAnother,
}: {
  state: ModalState;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onRetryValidation: () => void;
  onScanAnother: () => void;
}) {
  switch (state.type) {
    case "loading":
      return (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color="#7B3DFF" />
          <Text className="text-white text-base mt-4">
            {state.stage === "ticket"
              ? "Verificando ticket..."
              : "Cargando datos del cliente..."}
          </Text>
        </View>
      );

    case "error":
      return (
        <View className="items-center py-2">
          <View className="w-16 h-16 rounded-full bg-red-500/20 items-center justify-center mb-4">
            <Ionicons name="alert-circle" size={36} color="#EF4444" />
          </View>
          <Text className="text-white text-lg font-bold mb-2">
            No se pudo cargar
          </Text>
          <Text className="text-gray-400 text-center mb-6">
            {state.message}
          </Text>
          <View className="flex-row w-full">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 bg-gray-700 py-4 rounded-xl mr-2"
            >
              <Text className="text-white text-center font-bold">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRetry}
              className="flex-1 bg-purple-500 py-4 rounded-xl ml-2"
            >
              <Text className="text-white text-center font-bold">
                Reintentar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    case "used":
      return (
        <View className="items-center py-2">
          <View className="w-16 h-16 rounded-full bg-red-500/20 items-center justify-center mb-4">
            <Ionicons name="close-circle" size={40} color="#EF4444" />
          </View>
          <Text className="text-white text-xl font-bold mb-2">
            Ticket ya utilizado
          </Text>
          <View className="bg-gray-800 rounded-xl p-4 w-full mb-6">
            <Row label="Usos" value={`${state.usageCount} de ${state.maxUsages}`} />
            {state.lastUsedAt && (
              <Row
                label="Último uso"
                value={new Date(state.lastUsedAt).toLocaleString()}
              />
            )}
          </View>
          <TouchableOpacity
            onPress={onScanAnother}
            className="bg-purple-500 py-4 rounded-xl w-full"
          >
            <Text className="text-white text-center font-bold text-base">
              Escanear otro
            </Text>
          </TouchableOpacity>
        </View>
      );

    case "ready":
      return (
        <View>
          <Text className="text-white text-xl font-bold mb-1">
            Validar Ticket
          </Text>
          <Text className="text-gray-400 mb-4">
            Revisa los datos antes de validar
          </Text>
          <View className="bg-gray-800 rounded-xl p-4 mb-4">
            <Row label="Cliente" value={state.customer.name} />
            <Row label="Email" value={state.customer.email} />
            <Row label="Teléfono" value={state.customer.phone} />
          </View>
          <View className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6 flex-row items-center">
            <Ionicons
              name="ticket-outline"
              size={20}
              color="#A78BFA"
            />
            <Text className="text-white ml-3 flex-1">
              Usos: {state.usageCount} de {state.maxUsages}
              {"  "}
              <Text className="text-gray-400">
                ({state.maxUsages - state.usageCount} restante
                {state.maxUsages - state.usageCount === 1 ? "" : "s"})
              </Text>
            </Text>
          </View>
          <View className="flex-row">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 bg-gray-700 py-4 rounded-xl mr-2"
            >
              <Text className="text-white text-center font-bold">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              className="flex-1 bg-purple-500 py-4 rounded-xl ml-2 flex-row items-center justify-center"
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text className="text-white text-center font-bold ml-1">
                Validar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    case "validating":
      return (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color="#7B3DFF" />
          <Text className="text-white text-lg font-bold mt-4">
            Validando ticket...
          </Text>
          <Text className="text-gray-400 mt-1">No cierres esta ventana</Text>
        </View>
      );

    case "success":
      return (
        <View className="items-center py-2">
          <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-4">
            <Ionicons name="checkmark-circle" size={44} color="#22C55E" />
          </View>
          <Text className="text-white text-xl font-bold mb-2">
            ¡Ticket validado!
          </Text>
          <Text className="text-gray-400 text-center mb-6">
            El acceso ha sido registrado correctamente.
          </Text>
          <TouchableOpacity
            onPress={onScanAnother}
            className="bg-purple-500 py-4 rounded-xl w-full"
          >
            <Text className="text-white text-center font-bold text-base">
              Escanear otro
            </Text>
          </TouchableOpacity>
        </View>
      );

    case "failed":
      return (
        <View className="items-center py-2">
          <View className="w-16 h-16 rounded-full bg-red-500/20 items-center justify-center mb-4">
            <Ionicons name="close-circle" size={40} color="#EF4444" />
          </View>
          <Text className="text-white text-xl font-bold mb-2">
            Error al validar
          </Text>
          <Text className="text-gray-400 text-center mb-6">{state.message}</Text>
          <View className="flex-row w-full">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 bg-gray-700 py-4 rounded-xl mr-2"
            >
              <Text className="text-white text-center font-bold">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRetryValidation}
              className="flex-1 bg-purple-500 py-4 rounded-xl ml-2"
            >
              <Text className="text-white text-center font-bold">
                Reintentar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    default:
      return null;
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-gray-400">{label}</Text>
      <Text
        className="text-white font-medium ml-4 flex-1 text-right"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
