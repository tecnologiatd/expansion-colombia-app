import { backendApi } from "@/core/api/wordpress-api";
import { TicketResponse, TicketStatus } from "../interfaces/ticket.interface";

export const getTicketStatus = async (
  qrCode: string,
): Promise<TicketStatus> => {
  try {
    const { data } = await backendApi.get<TicketStatus>(`/tickets/${qrCode}`);
    return data;
  } catch (error) {
    console.error("Error fetching ticket status:", error);
    throw new Error("No se pudo obtener el estado del ticket");
  }
};
