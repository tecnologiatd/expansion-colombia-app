// core/actions/generate-ticket.action.ts
import { backendApi } from "@/core/api/wordpress-api";
import { TicketResponse } from "@/core/interfaces/ticket.interface";

// core/actions/generate-ticket.action.ts
export const generateTicketQR = async (
  orderId: string,
): Promise<TicketResponse> => {
  try {
    console.log("Generating QR for order:", orderId); // Añadir log
    const { data } = await backendApi.post<TicketResponse>(
      `/tickets/generate/${orderId}`,
    );
    console.log("QR Generated:", data); // Añadir log
    return data;
  } catch (error) {
    console.error("Error generating ticket QR:", error);
    throw error;
  }
};
