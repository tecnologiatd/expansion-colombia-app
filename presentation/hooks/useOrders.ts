import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import {
  createOrderAction,
  getOrderByIdAction,
} from "@/core/actions/order.actions";
import { useCartStore } from "@/core/stores/cart-store";

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { items, clearCart } = useCartStore();

  const createOrderMutation = useMutation({
    mutationFn: createOrderAction,
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      // Clear cart only after successful order creation
      if (data?.id) {
        clearCart();
      }
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

export const useOrderDetails = (orderId: string) => {
  // Ref flag: next queryFn call should hit backend with ?fresh=1
  const forceFreshRef = useRef(false);
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

  return { ...query, forceRefetch };
};

// Función para generar la URL de pago correcta para una orden
export const getPaymentUrl = (orderId: string, orderKey: string): string => {
  // Formato correcto: https://expansioncolombia.com/finalizar-compra/order-pay/25209/?pay_for_order=true&key=wc_order_Q3lmjCLCiqKSC
  return `https://expansioncolombia.com/finalizar-compra/order-pay/${orderId}/?pay_for_order=true&key=${orderKey}`;
};
