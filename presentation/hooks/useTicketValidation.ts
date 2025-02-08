// presentation/hooks/useTicketValidation.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  validateTicket,
  getTicketStatus,
} from "@/core/actions/ticket-validation.actions";
import {
  TicketStatus,
  TicketValidationResponse,
} from "@/core/interfaces/ticket.interface";

export const useTicketValidation = (qrCode?: string) => {
  const queryClient = useQueryClient();

  // Query para obtener el estado del ticket
  const ticketStatusQuery = useQuery<TicketStatus>({
    queryKey: ["ticket-status", qrCode],
    queryFn: () => getTicketStatus(qrCode!),
    enabled: !!qrCode, // Solo ejecutar si hay un qrCode
    staleTime: 1000 * 30, // Considerar los datos frescos por 30 segundos
  });

  // Mutation para validar el ticket
  const validateTicketMutation = useMutation<
    TicketValidationResponse,
    Error,
    string
  >({
    mutationFn: validateTicket,
    onSuccess: (data) => {
      // Invalidar la consulta del estado del ticket y de la orden
      queryClient.invalidateQueries({
        queryKey: ["ticket-status", data.orderId],
      });
      queryClient.invalidateQueries({ queryKey: ["order", data.orderId] });
    },
  });

  return {
    ticketStatusQuery,
    validateTicketMutation,
  };
};
