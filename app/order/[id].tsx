import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import OrderDetails from "@/presentation/components/OrderDetails";

export default function OrderScreen() {
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1 bg-gray-900" edges={['bottom']}>
      <OrderDetails orderId={id as string} />
    </SafeAreaView>
  );
}
