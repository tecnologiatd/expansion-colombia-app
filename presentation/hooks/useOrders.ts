import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import {
  createOrderAction,
  getOrderByIdAction,
} from "@/core/actions/order.actions";
import { useCartStore } from "@/core/stores/cart-store";

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { items } = useCartStore();

  const createOrderMutation = useMutation({
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

// Tras volver del pago, consultar el pedido mientras siga pendiente. Las
// consultas periódicas leen la caché del backend, que el webhook de estado
// de WordPress refresca, así que no cargan a WooCommerce.
const PAYMENT_WATCH_MS = 3 * 60 * 1000;
const PAYMENT_POLL_MS = 4000;

export const useOrderDetails = (orderId: string) => {
  // Ref flag: next queryFn call should hit backend with ?fresh=1
  const forceFreshRef = useRef(false);
  const watchUntilRef = useRef(0);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const fresh = forceFreshRef.current;
      forceFreshRef.current = false;
      return getOrderByIdAction(orderId, { fresh });
    },
    enabled: !!orderId,
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    retry: 2,
    refetchInterval: (query) =>
      query.state.data?.status === "pending" &&
      Date.now() < watchUntilRef.current
        ? PAYMENT_POLL_MS
        : false,
  });

  // User-triggered refresh: bypass BOTH React Query staleTime AND backend cache.
  // Also invalidates all ticket statuses so admin-validated tickets reflect as "used".
  const forceRefetch = useCallback(async () => {
    forceFreshRef.current = true;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["order", orderId] }),
      queryClient.invalidateQueries({ queryKey: ["ticket-status"] }),
    ]);
    return query.refetch();
  }, [orderId, query, queryClient]);

  // Llamar al volver del navegador de pago: lectura fresca y sondeo por unos minutos.
  const watchPayment = useCallback(() => {
    watchUntilRef.current = Date.now() + PAYMENT_WATCH_MS;
    forceFreshRef.current = true;
    return queryClient.invalidateQueries({ queryKey: ["order", orderId] });
  }, [orderId, queryClient]);

  useEffect(() => {
    watchUntilRef.current = Date.now() + PAYMENT_WATCH_MS;
    const subscription = AppState.addEventListener("change", (state) => {
      const order = queryClient.getQueryData<{ status?: string }>([
        "order",
        orderId,
      ]);
      if (state === "active" && order?.status === "pending") watchPayment();
    });
    return () => subscription.remove();
  }, [orderId, queryClient, watchPayment]);

  return { ...query, forceRefetch, watchPayment };
};
