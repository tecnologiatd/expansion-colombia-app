import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCustomerAction } from '@/core/actions/update-customer.action';

export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();

    const updateCustomerMutation = useMutation({
        mutationFn: updateCustomerAction,
        onSuccess: () => {
            // Invalidate and refetch relevant queries
            queryClient.invalidateQueries({ queryKey: ['customer'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });

    return {
        updateCustomerMutation,
    };
};