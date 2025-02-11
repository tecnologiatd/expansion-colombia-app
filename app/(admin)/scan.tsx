// app/(admin)/scan.tsx
import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, Alert } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTicketValidation } from "@/presentation/hooks/useTicketValidation";
import { Ionicons } from "@expo/vector-icons";
import { useOrderDetails } from "@/presentation/hooks/useOrders";

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [currentQR, setCurrentQR] = useState<string | null>(null);

  // Hooks para obtener datos (se moverán al nivel superior)
  const { validateTicketMutation, ticketStatusQuery } =
    useTicketValidation(currentQR);
  const { data: orderData } = useOrderDetails(ticketStatusQuery.data?.orderId);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getBarCodeScannerPermissions();
  }, []);

  // Efecto para manejar los datos del ticket cuando están disponibles
  useEffect(() => {
    if (!currentQR || !ticketStatusQuery.data) return;

    const handleTicketData = async () => {
      const ticketStatus = ticketStatusQuery.data;

      if (ticketStatus.isUsed) {
        Alert.alert(
          "Ticket Usado",
          `Este ticket ya fue utilizado el ${new Date(
            ticketStatus.usedAt,
          ).toLocaleString()} por el administrador ${ticketStatus.validatedBy}`,
          [
            {
              text: "Ver detalles",
              onPress: () => router.push(`/admin/ticket/${currentQR}`),
            },
            {
              text: "Escanear otro",
              onPress: () => {
                setScanned(false);
                setCurrentQR(null);
              },
            },
          ],
        );
        return;
      }

      // Esperar a que los datos de la orden estén disponibles
      if (!orderData) return;

      // Mostrar detalles y confirmar validación
      Alert.alert(
        "Validar Ticket",
        `¿Deseas validar el ticket para?\n\n` +
          `Cliente: ${orderData.billing.first_name} ${orderData.billing.last_name}\n` +
          `Email: ${orderData.billing.email}\n` +
          `Teléfono: ${orderData.billing.phone}\n\n` +
          `Eventos:\n${orderData.line_items
            .map((item) => `- ${item.name}`)
            .join("\n")}`,
        [
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => {
              setScanned(false);
              setCurrentQR(null);
            },
          },
          {
            text: "Ver Detalles",
            onPress: () => {
              setScanned(false);
              setCurrentQR(null);
              router.push(`/admin/ticket/${currentQR}`);
            },
          },
          {
            text: "Validar",
            style: "default",
            onPress: async () => {
              try {
                await validateTicketMutation.mutateAsync(currentQR);
                Alert.alert("Éxito", "Ticket validado correctamente", [
                  {
                    text: "Ver detalles",
                    onPress: () => router.push(`/admin/ticket/${currentQR}`),
                  },
                  {
                    text: "Escanear otro",
                    onPress: () => {
                      setScanned(false);
                      setCurrentQR(null);
                    },
                  },
                ]);
              } catch (error) {
                Alert.alert(
                  "Error",
                  "Error al validar el ticket. Intente nuevamente.",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        setScanned(false);
                        setCurrentQR(null);
                      },
                    },
                  ],
                );
              }
            },
          },
        ],
      );
    };

    handleTicketData();
  }, [currentQR, ticketStatusQuery.data, orderData]);

  const handleBarCodeScanned = async ({
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned) return;
    setScanned(true);
    setCurrentQR(data);
  };

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
          <Text className="text-white text-center text-lg mb-2">
            {scanned
              ? "Procesando ticket..."
              : "Coloca el código QR dentro del marco"}
          </Text>
          {scanned && (
            <TouchableOpacity
              className="bg-purple-500 py-3 rounded-lg flex-row justify-center items-center"
              onPress={() => {
                setScanned(false);
                setCurrentQR(null);
              }}
            >
              <Ionicons name="scan" size={24} color="white" className="mr-2" />
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
