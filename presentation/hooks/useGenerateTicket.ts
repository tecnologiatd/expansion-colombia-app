// presentation/hooks/useGenerateTicket.ts
import { useMutation } from "@tanstack/react-query";
import { generateTicketQR } from "@/core/actions/generate-ticket.action";

export const useGenerateTicket = () => {
  const generateTicketMutation = useMutation({
    mutationFn: generateTicketQR,
  });

  return { generateTicketMutation };
};
