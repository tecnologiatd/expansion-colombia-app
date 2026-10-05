// presentation/components/OrderDetails.tsx
import React, { useRef, useState } from "react";
import { View, Text, ScrollView, RefreshControl, Alert } from "react-native";
import { useOrderDetails } from "@/presentation/hooks/useOrders";
import { getOrderByIdAction } from "@/core/actions/order.actions";
import { TicketQRSection } from "@/presentation/components/TicketQRSection";
import { OfflineBanner } from "@/presentation/components/OfflineBanner";
import { useConnectivityStore } from "@/core/offline/connectivity";
import { Ionicons } from "@expo/vector-icons";
import { AuthBrowser } from "@/presentation/utils/auth-browser";
import { isPayableOrder } from "@/core/checkout/payment-policy";
import { Button } from "@/presentation/components/ui/Button";
import { StateView } from "@/presentation/components/ui/StateView";
import { CONTENT_MAX_WIDTH, Theme } from "@/presentation/theme/Colors";
import { formatCOP, plainText } from "@/helpers/format";

const OrderDetails = ({ orderId }: { orderId: string }) => {
  const openingRef = useRef(false);
  const [opening, setOpening] = useState(false);
  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
    forceRefetch,
    watchPayment,
    isPaused,
    dataUpdatedAt,
  } = useOrderDetails(orderId);
  const isOnline = useConnectivityStore((state) => state.isOnline);

  if (isLoading && !isPaused) {
    return <StateView loading />;
  }

  if (isError || !order) {
    return (
      <StateView
        icon={isPaused ? "cloud-offline-outline" : "alert-circle-outline"}
        title={
          isPaused
            ? "Sin conexión y sin datos guardados de este pedido"
            : "Error al cargar los detalles del pedido"
        }
        actionLabel="Reintentar"
        onAction={forceRefetch}
      />
    );
  }

  const totalItems = order.line_items.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  const handlePayment = async () => {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(true);
    try {
      const currentOrder = await getOrderByIdAction(orderId, { fresh: true });
      if (!isPayableOrder(currentOrder.status)) {
        await forceRefetch();
        return;
      }
      const paymentUrl = currentOrder?.payment_url;
      if (!paymentUrl) {
        Alert.alert("Error", "No se pudo generar la URL de pago");
        return;
      }

      // Resuelve cuando el usuario vuelve del navegador de pago
      const opened = await AuthBrowser.openPaymentUrl(paymentUrl, orderId);
      void watchPayment();
    } catch (error) {
      console.error("Error al abrir URL de pago:", error);
      Alert.alert(
        "Error",
        "No se pudo abrir la página de pago. Por favor intenta nuevamente.",
      );
    } finally {
      openingRef.current = false;
      setOpening(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusConfig = (
    status: string,
  ): { color: string; icon: keyof typeof Ionicons.glyphMap; text: string } => {
    switch (status) {
      case "processing":
        return {
          color: "text-blue-400",
          icon: "time-outline",
          text: "En Proceso",
        };
      case "completed":
        return {
          color: "text-green-400",
          icon: "checkmark-circle",
          text: "Completado",
        };
      case "cancelled":
        return {
          color: "text-red-400",
          icon: "close-circle",
          text: "Cancelado",
        };
      case "pending":
        return {
          color: "text-yellow-400",
          icon: "alert-circle",
          text: "Pendiente",
        };
      case "on-hold":
        return {
          color: "text-yellow-400",
          icon: "time-outline",
          text: "Esperando confirmación del banco",
        };
      case "failed":
        return {
          color: "text-red-400",
          icon: "alert-circle",
          text: "Pago no completado",
        };
      default:
        return { color: "text-gray-400", icon: "help-circle", text: status };
    }
  };

  const statusConfig = getStatusConfig(order.status);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        width: "100%",
        maxWidth: CONTENT_MAX_WIDTH,
        alignSelf: "center",
        paddingBottom: 24,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={forceRefetch}
          tintColor={Theme.accent}
          colors={[Theme.accent]}
        />
      }
    >
      {(!isOnline || isPaused) && (
        <View className="pt-4">
          <OfflineBanner dataUpdatedAt={dataUpdatedAt || undefined} />
        </View>
      )}

      {/* Order Status and Info */}
      <View className="p-4 bg-gray-800 rounded-2xl border border-line m-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1 mr-3">
            <Text className="text-muted text-sm mb-1">Estado del pedido</Text>
            <Text className={`text-base font-semibold ${statusConfig.color}`}>
              <Ionicons name={statusConfig.icon} size={16} />{" "}
              {statusConfig.text}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-muted text-sm mb-1">Fecha</Text>
            <Text className="text-white">{formatDate(order.date_created)}</Text>
          </View>
        </View>

        <View className="border-t border-line pt-4">
          <Text className="text-white text-lg font-bold mb-2">Resumen</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400">Total</Text>
            <Text className="text-white text-lg font-bold">
              {formatCOP(order.total)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-400">Cantidad</Text>
            <Text className="text-white">
              {totalItems} {totalItems === 1 ? "entrada" : "entradas"}
            </Text>
          </View>
        </View>
      </View>

      {/* Line Items with Tickets */}
      {order.line_items.map((item) => (
        <View
          key={item.id}
          className="mx-4 mb-4 bg-gray-800 rounded-2xl border border-line p-4"
        >
          <Text className="text-white font-bold text-lg">
            {plainText(item.name)}
          </Text>
          <Text className="text-gray-400">Cantidad: {item.quantity}</Text>
          <Text className="text-white mt-1">{formatCOP(item.total)}</Text>

          <TicketQRSection
            orderId={orderId}
            orderStatus={order.status}
            eventId={item.product_id.toString()}
            quantity={item.quantity}
          />
        </View>
      ))}

      {/* Billing Info */}
      <View className="m-4 bg-gray-800 rounded-2xl border border-line p-4">
        <Text className="text-white text-lg font-bold mb-4">
          Detalles de facturación
        </Text>
        {order.billing && (
          <View className="space-y-2">
            <Text className="text-gray-400">
              {order.billing.first_name} {order.billing.last_name}
            </Text>
            <Text className="text-gray-400">
              <Ionicons name="mail-outline" size={16} /> {order.billing.email}
            </Text>
            <Text className="text-gray-400">
              <Ionicons name="call-outline" size={16} /> {order.billing.phone}
            </Text>
            <Text className="text-gray-400">
              <Ionicons name="location-outline" size={16} />
              {` ${order.billing.address_1}, ${order.billing.city}, ${order.billing.state}`}
            </Text>
          </View>
        )}
      </View>

      {/* Payment Action */}
      {["pending", "failed"].includes(order.status) && (
        <View className="m-4">
          <Button
            title={opening ? "Abriendo pago..." : "Completar pago"}
            icon="card-outline"
            onPress={handlePayment}
            loading={opening}
          />
        </View>
      )}
    </ScrollView>
  );
};

export default OrderDetails;
