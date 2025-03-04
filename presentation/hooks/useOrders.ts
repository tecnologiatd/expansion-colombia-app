import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderByIdAction(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    retry: 2, // Retry failed requests twice
  });
};

// Función para generar la URL de pago correcta para una orden
export const getPaymentUrl = (orderId: string, orderKey: string): string => {
  // Formato correcto: https://expansioncolombia.com/finalizar-compra/order-pay/25209/?pay_for_order=true&key=wc_order_Q3lmjCLCiqKSC
  return `https://expansioncolombia.com/finalizar-compra/order-pay/${orderId}/?pay_for_order=true&key=${orderKey}`;
};
