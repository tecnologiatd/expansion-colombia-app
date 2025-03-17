// presentation/hooks/useGenerateTicket.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateTicketQR } from "@/core/actions/generate-ticket.action";

export const useGenerateTicket = () => {
  const queryClient = useQueryClient();

  const generateTicketMutation = useMutation({
    mutationFn: generateTicketQR,
    onSuccess: (data, variables) => {
      // Al generar tickets exitosamente, invalidamos la caché para forzar una recarga
      queryClient.invalidateQueries({
        queryKey: ["tickets", variables.orderId, variables.eventId],
      });

      // También podríamos guardar los tickets generados en la caché
      if (data.qrCodes?.length) {
        queryClient.setQueryData(
          ["tickets", variables.orderId, variables.eventId],
          data.qrCodes,
        );
      }
    },
    onError: (error) => {
      console.error("Error en la generación de tickets:", error);
    },
  });

  return { generateTicketMutation };
};
