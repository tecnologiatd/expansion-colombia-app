// presentation/components/OrderDetails.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { getPaymentUrl, useOrderDetails } from "@/presentation/hooks/useOrders";
import { TicketQRSection } from "@/presentation/components/TicketQRSection";
import { Ionicons } from "@expo/vector-icons";
import { AuthBrowser } from "@/presentation/utils/auth-browser";

const OrderDetails = ({ orderId }) => {
  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrderDetails(orderId);

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#7B3DFF" />
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center p-4">
        <Text className="text-white text-lg text-center mb-4">
          Error al cargar los detalles del pedido
        </Text>
        <TouchableOpacity
          className="bg-purple-500 px-6 py-3 rounded-lg"
          onPress={refetch}
        >
          <Text className="text-white font-bold">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalItems = order.line_items.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  const handlePayment = async () => {
    try {
      // Construir la URL de pago correcta
      let paymentUrl;

      if (order.order_key && order.id) {
        // Usamos la nueva función para generar la URL correcta
        paymentUrl = getPaymentUrl(order.id.toString(), order.order_key);
      } else if (order?.payment_url) {
        // Fallback a la URL proporcionada por la API
        paymentUrl = order.payment_url;
      } else {
        Alert.alert("Error", "No se pudo generar la URL de pago");
        return;
      }

      console.log("Abriendo URL de pago:", paymentUrl);

      // Utilizar AuthBrowser para abrir el navegador con autenticación
      const opened = await AuthBrowser.openPaymentUrl(paymentUrl, orderId);

      if (opened) {
        // Informar al usuario sobre el proceso
        Alert.alert(
          "Pago en Proceso",
          "Una vez completado el pago, serás redirigido automáticamente de vuelta a la aplicación.",
          [{ text: "Entendido" }],
        );

        // Después de que el usuario regrese, refrescar los datos
        setTimeout(() => {
          refetch();
        }, 1000);
      }
    } catch (error) {
      console.error("Error al abrir URL de pago:", error);
      Alert.alert(
        "Error",
        "No se pudo abrir la página de pago. Por favor intenta nuevamente.",
      );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const getStatusConfig = (status) => {
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
      default:
        return { color: "text-gray-400", icon: "help-circle", text: status };
    }
  };

  const statusConfig = getStatusConfig(order.status);

  return (
    <ScrollView
      className="flex-1 bg-gray-900"
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      {/* Order Status and Info */}
      <View className="p-4 bg-gray-800 rounded-lg m-4">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-gray-400">Estado del pedido</Text>
            <Text className={`text-lg capitalize ${statusConfig.color}`}>
              <Ionicons name={statusConfig.icon} size={18} />{" "}
              {statusConfig.text}
            </Text>
          </View>
          <View>
            <Text className="text-gray-400">Fecha</Text>
            <Text className="text-white">{formatDate(order.date_created)}</Text>
          </View>
        </View>

        <View className="border-t border-gray-700 pt-4">
          <Text className="text-white text-lg font-bold mb-2">Resumen</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400">Total</Text>
            <Text className="text-white text-lg font-bold">
              {formatCurrency(order.total)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-400">Cantidad</Text>
            <Text className="text-white">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </Text>
          </View>
        </View>
      </View>

      {/* Line Items with Tickets */}
      {order.line_items.map((item) => (
        <View key={item.id} className="mx-4 mb-4 bg-gray-800 rounded-lg p-4">
          <Text className="text-white font-bold text-lg">{item.name}</Text>
          <Text className="text-gray-400">Cantidad: {item.quantity}</Text>
          <Text className="text-white mt-1">{formatCurrency(item.total)}</Text>

          <TicketQRSection
            orderId={orderId}
            orderStatus={order.status}
            eventId={item.product_id.toString()}
            quantity={item.quantity}
          />
        </View>
      ))}

      {/* Billing Info */}
      <View className="m-4 bg-gray-800 rounded-lg p-4">
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
      {order.status === "pending" && (
        <View className="m-4">
          <TouchableOpacity
            className="bg-purple-500 p-4 rounded-lg flex-row justify-center items-center"
            onPress={handlePayment}
          >
            <Ionicons name="card-outline" size={20} color="white" />
            <Text className="text-white font-bold text-lg ml-2">
              Completar Pago
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default OrderDetails;
