// core/actions/generate-ticket.action.ts
import { backendApi } from "@/core/api/wordpress-api";

interface GenerateTicketDto {
  orderId: string;
  eventId: string;
  quantity: number;
  usagesPerTicket: number;
}

interface TicketResponse {
  qrCodes: string[];
}

export const generateTicketQR = async (
  params: GenerateTicketDto,
): Promise<TicketResponse> => {
  try {
    const { data } = await backendApi.post<TicketResponse>(
      "/tickets/generate",
      params,
    );
    return data;
  } catch (error) {
    console.error("Error generating ticket QR:", error);
    throw error;
  }
};
