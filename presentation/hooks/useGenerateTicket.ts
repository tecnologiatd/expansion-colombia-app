import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateTicketQR } from "@/core/actions/generate-ticket.action";

export const useGenerateTicket = () => {
  const queryClient = useQueryClient();

  const generateTicketMutation = useMutation({
    mutationFn: generateTicketQR,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });

  return {
    generateTicketMutation,
  };
};
