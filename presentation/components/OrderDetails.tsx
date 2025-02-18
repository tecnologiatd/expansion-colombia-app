import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useOrderDetails } from "@/presentation/hooks/useOrders";
import { TicketQR } from "@/presentation/components/TicketQR";
import { TicketQRSection } from "@/presentation/components/TicketQRSection";

const OrderStatus = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "processing":
        return { color: "text-blue-400", icon: "time-outline" };
      case "completed":
        return { color: "text-green-400", icon: "checkmark-circle" };
      case "cancelled":
        return { color: "text-red-400", icon: "close-circle" };
      case "pending":
        return { color: "text-yellow-400", icon: "alert-circle" };
      default:
        return { color: "text-gray-400", icon: "help-circle" };
    }
  };

  const { color, icon } = getStatusConfig(status);

  return (
    <Text className={`text-lg capitalize ${color}`}>
      <Ionicons name={icon} size={18} /> {status}
    </Text>
  );
};

const OrderDetails = ({ orderId }) => {
  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrderDetails(orderId);

  const renderTicketQR = () => {
    console.log(order);
    if (order?.status !== "processing") {
      return (
        <View className="m-4 bg-yellow-500/20 p-4 rounded-xl">
          <Text className="text-yellow-500 text-center">
            El QR estará disponible cuando se complete el pago
          </Text>
        </View>
      );
    }

    if (!order?.qrCode) {
      return (
        <View className="m-4 bg-yellow-500/20 p-4 rounded-xl">
          <Text className="text-yellow-500 text-center">
            QR no disponible. Por favor contacta a soporte.
          </Text>
        </View>
      );
    }

    return <TicketQR qrCode={order.qrCode} />;
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

  const handlePayment = async () => {
    if (order?.payment_url) {
      try {
        await Linking.openURL(order.payment_url);
      } catch (error) {
        console.error("Error abriendo URL de pago:", error);
      }
    }
  };

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

  return (
    <ScrollView
      className="flex-1 bg-gray-900"
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      {/* Status and Order Info */}
      <View className="m-4 bg-gray-800 rounded-xl p-4">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-gray-400">Estado</Text>
            <OrderStatus status={order.status} />
          </View>
          <View>
            <Text className="text-gray-400">Fecha</Text>
            <Text className="text-white">{formatDate(order.date_created)}</Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-gray-400">Total</Text>
            <Text className="text-white text-lg font-bold">
              {formatCurrency(order.total)}
            </Text>
          </View>
          <View>
            <Text className="text-gray-400">Items</Text>
            <Text className="text-white text-lg">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </Text>
          </View>
        </View>
      </View>
      {/* Products */}
      <View className="m-4 bg-gray-800 rounded-xl p-4">
        <Text className="text-white text-lg font-bold mb-4">Eventos</Text>
        {order.line_items.map((item) => (
          <View
            key={item.id}
            className="flex-row mb-4 border-b border-gray-700 pb-4"
          >
            {item.image && (
              <Image
                source={{ uri: item.image.src }}
                className="w-20 h-20 rounded-lg"
              />
            )}
            <View className="flex-1 ml-4">
              <Text className="text-white font-bold">{item.name}</Text>
              <Text className="text-gray-400">Cantidad: {item.quantity}</Text>
              <Text className="text-white mt-1">
                {formatCurrency(item.total)}
              </Text>
            </View>
          </View>
        ))}
      </View>
      {/* Billing Info */}
      <View className="m-4 bg-gray-800 rounded-xl p-4">
        <Text className="text-white text-lg font-bold mb-4">
          Detalles de facturación
        </Text>
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
            <Ionicons name="location-outline" size={16} />{" "}
            {[
              order.billing.address_1,
              order.billing.city,
              order.billing.state,
              order.billing.postcode,
              order.billing.country,
            ]
              .filter(Boolean)
              .join(", ")}
          </Text>
        </View>
      </View>
      {/* Payment Action */}
      {order.status === "pending" && order.payment_url && (
        <View className="m-4 mb-8">
          <TouchableOpacity
            className="bg-purple-500 p-4 rounded-xl flex-row justify-center items-center"
            onPress={handlePayment}
          >
            <Ionicons name="card-outline" size={20} color="white" />
            <Text className="text-white font-bold text-lg ml-2">
              Completar Pago
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Sección de QR */}
      {/* Ticket QR Section */}
      <TicketQRSection
        orderId={order.id.toString()}
        orderStatus={order.status}
        qrCode={order.qrCode}
      />
    </ScrollView>
  );
};

export default OrderDetails;
