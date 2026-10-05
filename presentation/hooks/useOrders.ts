import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useScreenActive } from "./useScreenActive";
import { useConnectivityStore } from "@/core/offline/connectivity";
import { getPaymentPollInterval } from "@/core/checkout/payment-polling";
import {
  createOrderAction,
  getOrderByIdAction,
} from "@/core/actions/order.actions";
import { useCartStore } from "@/core/stores/cart-store";
import { isPaidOrder, isWaitingOrder } from "@/core/checkout/payment-policy";

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { items } = useCartStore();

  const createOrderMutation = useMutation({
    meta: { errorOperation: "orders.create" },
    mutationFn: createOrderAction,
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      console.error("Order creation error:", error);
    },
  });

  const prepareOrderItems = () => {
    if (!items.length) {
      throw new Error("Cart is empty");
    }

    // Map cart items to order line items
    return items.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    }));
  };

  return {
    createOrderMutation,
    prepareOrderItems,
  };
};

// El intervalo baja progresivamente; salir de pantalla/app no reinicia la ventana.
export const useOrderDetails = (orderId: string) => {
  const forceFreshRef = useRef(false);
  const [watch, setWatch] = useState(() => ({
    orderId,
    startedAt: Date.now(),
  }));
  const queryClient = useQueryClient();
  const screenActive = useScreenActive();
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const active = screenActive && isOnline;
  const wasActive = useRef(false);

  useEffect(() => {
    setWatch({ orderId, startedAt: Date.now() });
    forceFreshRef.current = false;
    wasActive.current = false;
  }, [orderId]);

  const query = useQuery({
    queryKey: ["order", orderId],
    queryFn: async ({ signal }) => {
      const resumingPending =
        !wasActive.current &&
        isWaitingOrder(
          queryClient.getQueryData<{ status?: string }>(["order", orderId])
            ?.status,
        );
      const fresh = forceFreshRef.current || resumingPending;
      forceFreshRef.current = false;
      const order = await getOrderByIdAction(orderId, { fresh, signal });
      if (isPaidOrder(order.status))
        useCartStore.getState().completePendingOrder(order.id);
      return order;
    },
    enabled: !!orderId && active,
    staleTime: 1000 * 60,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: (query) =>
      active && watch.orderId === orderId
        ? getPaymentPollInterval(query.state.data?.status, watch.startedAt)
        : false,
    refetchIntervalInBackground: false,
  });

  const forceRefetch = useCallback(async () => {
    setWatch({ orderId, startedAt: Date.now() });
    forceFreshRef.current = true;
    await queryClient.invalidateQueries({ queryKey: ["ticket-status"] });
    return query.refetch();
  }, [orderId, query, queryClient]);

  // Retorno explícito del navegador: comprobación inmediata y nueva ventana.
  const watchPayment = useCallback(() => {
    setWatch({ orderId, startedAt: Date.now() });
    forceFreshRef.current = true;
    return queryClient.invalidateQueries(
      { queryKey: ["order", orderId], exact: true },
      { cancelRefetch: false },
    );
  }, [orderId, queryClient]);

  // Retorno a la pantalla o recuperación de conexión: una comprobación fresca
  // de pedidos pendientes, manteniendo la antigüedad de la ventana existente.
  useEffect(() => {
    if (active && !wasActive.current) {
      const order = queryClient.getQueryData<{ status?: string }>([
        "order",
        orderId,
      ]);
      if (isWaitingOrder(order?.status)) {
        forceFreshRef.current = true;
        void queryClient.invalidateQueries(
          { queryKey: ["order", orderId], exact: true },
          { cancelRefetch: false },
        );
      }
    }
    wasActive.current = active;
  }, [active, orderId, queryClient]);

  return { ...query, forceRefetch, watchPayment };
};
