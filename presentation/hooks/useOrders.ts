// presentation/hooks/useOrder.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrderAction, getOrderByIdAction } from '@/core/actions/order.actions';
import { useCartStore } from '@/core/stores/cart-store';

export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    const { items, clearCart } = useCartStore();

    const createOrderMutation = useMutation({
        mutationFn: createOrderAction,
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });

            // Clear cart only after successful order creation and navigation
            if (data?.id) {
                clearCart();
            }
        },
        onError: (error) => {
            console.error('Order creation error:', error);
            // Error handling is done in the component
        },
    });

    const prepareOrderItems = () => {
        if (!items.length) {
            throw new Error('Cart is empty');
        }

        return items.map(item => ({
            product_id: item.id,
            quantity: item.quantity
        }));
    };

    return {
        createOrderMutation,
        prepareOrderItems,
    };
};

export const useOrderDetails = (orderId: string) => {
    return useQuery({
        queryKey: ['order', orderId],
        queryFn: () => getOrderByIdAction(orderId),
        enabled: !!orderId,
        staleTime: 1000 * 60, // Consider data fresh for 1 minute
        retry: 2, // Retry failed requests twice
        onError: (error) => {
            console.error('Error fetching order details:', error);
        },
    });
};