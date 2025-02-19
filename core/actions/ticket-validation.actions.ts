import { backendApi } from "../api/wordpress-api";
import {
  TicketStatus,
  TicketValidationResponse,
} from "../interfaces/ticket.interface";

export const validateTicket = async (
  qrCode: string,
  eventId: string,
): Promise<TicketValidationResponse> => {
  try {
    const { data } = await backendApi.post<TicketValidationResponse>(
      "/tickets/validate",
      {
        qrCode,
        eventId,
      },
    );
    return data;
  } catch (error) {
    console.error("Error validating ticket:", error);
    throw error;
  }
};

export const getTicketStatus = async (
  qrCode: string,
  eventId: string,
): Promise<TicketStatus> => {
  try {
    const encodedQR = encodeURIComponent(qrCode);
    console.log("QR Code scanned:", qrCode);
    console.log("Encoded QR:", encodedQR);

    // For QR codes that already contain eventId in format hash/eventId,
    // we can extract the eventId from the QR code if needed
    if (qrCode.includes("/")) {
      const parts = qrCode.split("/");
      if (parts.length === 2 && !eventId) {
        // If no eventId was provided but it's in the QR, use that
        eventId = parts[1];
        console.log("Using eventId from QR code:", eventId);
      }
    }

    console.log(
      "Requesting ticket status:",
      `${backendApi.defaults.baseURL}/tickets/${encodedQR}/${eventId}`,
    );

    const { data } = await backendApi.get<TicketStatus>(
      `/tickets/${encodedQR}/${eventId}`,
    );
    return data;
  } catch (error) {
    console.error("Error getting ticket status:", error);
    if (error.response) {
      console.error("Error response:", error.response.data);
    }
    throw error;
  }
};
