// core/actions/generate-ticket.action.ts
import { backendApi } from "@/core/api/wordpress-api";
import { TicketResponse } from "@/core/interfaces/ticket.interface";

export const generateTicketQR = async (
  orderId: string,
): Promise<TicketResponse> => {
  if (!orderId) {
    throw new Error("OrderId es requerido");
  }

  console.log("Generando QR para orden:", orderId);
  console.log("URL base:", process.env.EXPO_PUBLIC_BACKEND_URL);

  try {
    const { data } = await backendApi.post<TicketResponse>(
      `/tickets/generate/${orderId}`,
    );
    console.log("Respuesta del servidor:", data);
    return data;
  } catch (error) {
    console.error("Error completo:", error);
    console.error(
      "URL completa:",
      `${process.env.EXPO_PUBLIC_BACKEND_URL}/tickets/generate/${orderId}`,
    );
    throw error;
  }
};
