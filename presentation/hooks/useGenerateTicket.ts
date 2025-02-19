// presentation/hooks/useGenerateTicket.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateTicketQR } from "@/core/actions/generate-ticket.action";
import {
  GenerateTicketDto,
  TicketResponse,
} from "@/core/interfaces/ticket.interface";

interface GenerateTicketParams {
  orderId: string;
  eventId: string;
  quantity: number;
  usagesPerTicket: number;
}

export const useGenerateTicket = () => {
  const generateTicketMutation = useMutation<
    TicketResponse,
    Error,
    GenerateTicketDto
  >({
    mutationFn: generateTicketQR,
  });

  return { generateTicketMutation };
};
