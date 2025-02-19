// core/actions/generate-ticket.action.ts
import { backendApi } from "@/core/api/wordpress-api";
import {
  GenerateTicketDto,
  TicketResponse,
} from "@/core/interfaces/ticket.interface";

export const generateTicketQR = async (
  params: GenerateTicketDto,
): Promise<TicketResponse> => {
  try {
    console.log("Generating QR with params:", params);
    const { data } = await backendApi.post<TicketResponse>(
      "/tickets/generate",
      params,
    );
    console.log("QR Generated:", data);
    return data;
  } catch (error) {
    console.error("Error generating ticket QR:", error);
    throw error;
  }
};
