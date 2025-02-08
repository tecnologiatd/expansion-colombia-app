import { backendApi } from "../api/wordpress-api";
import { TicketStatus } from "../interfaces/ticket.interface";

export const validateTicket = async (qrCode: string): Promise<TicketStatus> => {
  try {
    const { data } = await backendApi.post<TicketStatus>("/tickets/validate", {
      qrCode,
    });
    return data;
  } catch (error) {
    console.error("Error validating ticket:", error);
    throw error;
  }
};

export const getTicketStatus = async (
  qrCode: string,
): Promise<TicketStatus> => {
  try {
    const { data } = await backendApi.get<TicketStatus>(`/tickets/${qrCode}`);
    return data;
  } catch (error) {
    console.error("Error getting ticket status:", error);
    throw error;
  }
};
