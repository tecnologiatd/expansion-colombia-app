import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  validateTicket,
  getTicketStatus,
} from "@/core/actions/ticket-validation.actions";
import { useOrderDetails } from "./useOrders";

interface TicketStatus {
  orderId: string;
  eventId: string;
  usageCount: number;
  maxUsages: number;
  remainingUsages: number;
  usageHistory: {
    timestamp: Date;
    validatedBy: string;
  }[];
}

export const useTicketValidation = (qrCode?: string, eventId?: string) => {
  const queryClient = useQueryClient();

  const ticketStatusQuery = useQuery<TicketStatus>({
    queryKey: ["ticket-status", qrCode, eventId],
    queryFn: () => getTicketStatus(qrCode!, eventId!),
    enabled: !!qrCode,
  });

  // Consulta adicional para obtener detalles de la orden asociada al ticket
  const orderDetailsQuery = useOrderDetails(ticketStatusQuery.data?.orderId);

  const validateTicketMutation = useMutation({
    mutationFn: (params: { qrCode: string; eventId: string }) =>
      validateTicket(params.qrCode, params.eventId),
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
