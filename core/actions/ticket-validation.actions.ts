import { backendApi } from "../api/wordpress-api";
import {
  TicketStatus,
  TicketValidationResponse,
} from "../interfaces/ticket.interface";

export const validateTicket = async (
  qrCode: string,
): Promise<TicketValidationResponse> => {
  try {
    const encodedQR = encodeURIComponent(qrCode);
    const { data } = await backendApi.post<TicketValidationResponse>(
      "/tickets/validate",
      {
        qrCode: encodedQR,
      },
    );
    return data;
  } catch (error) {
    console.error("Error validating ticket:", error);
    throw error;
  }
};

// core/actions/ticket-validation.actions.ts
export const getTicketStatus = async (
  qrCode: string,
): Promise<TicketStatus> => {
  try {
    const encodedQR = encodeURIComponent(qrCode);
    console.log("QR Code scanned:", qrCode); // Log del QR original
    console.log("Encoded QR:", encodedQR); // Log del QR codificado
    console.log(
      "Requesting ticket status:",
      `${backendApi.defaults.baseURL}/tickets/${encodedQR}`,
    );

    const { data } = await backendApi.get<TicketStatus>(
      `/tickets/${encodedQR}`,
    );
    return data;
  } catch (error) {
    console.error("Error getting ticket status:", error);
    if (error.response) {
      console.error("Error response:", error.response.data); // Log de la respuesta de error
    }
    throw error;
  }
};
