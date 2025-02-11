// presentation/hooks/useTicketValidation.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  validateTicket,
  getTicketStatus,
} from "@/core/actions/ticket-validation.actions";
import { useOrderDetails } from "./useOrders";

export const useTicketValidation = (qrCode?: string) => {
  const queryClient = useQueryClient();

  const ticketStatusQuery = useQuery({
    queryKey: ["ticket-status", qrCode],
    queryFn: () => getTicketStatus(qrCode!),
    enabled: !!qrCode,
  });

  // Consulta adicional para obtener detalles de la orden
  const orderDetailsQuery = useQuery({
    queryKey: ["order", ticketStatusQuery.data?.orderId],
    queryFn: () => useOrderDetails(ticketStatusQuery.data?.orderId).refetch(),
    enabled: !!ticketStatusQuery.data?.orderId,
  });

  const validateTicketMutation = useMutation({
    mutationFn: validateTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-status", qrCode] });
      queryClient.invalidateQueries({ queryKey: ["order", data.orderId] });
    },
  });

  return {
    ticketStatusQuery,
    orderDetailsQuery,
    validateTicketMutation,
  };
};
