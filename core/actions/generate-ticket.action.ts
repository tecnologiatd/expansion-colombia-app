// core/actions/generate-ticket.action.ts
import { backendApi } from "@/core/api/wordpress-api";

export interface GenerateTicketDto {
  orderId: string;
  eventId: string;
  quantity: number;
  usagesPerTicket: number;
}

export interface TicketResponse {
  qrCodes: string[];
}

export const generateTicketQR = async (
  params: GenerateTicketDto,
): Promise<TicketResponse> => {
  try {
    console.log("Generando tickets con parámetros:", params);
    const { data } = await backendApi.post<TicketResponse>(
      "/tickets/generate",
      params,
    );

    console.log(`Se generaron ${data.qrCodes.length} tickets`);
    return data;
  } catch (error) {
    console.error("Error generating ticket QR:", error);
    throw error;
  }
};
