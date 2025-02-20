// core/actions/ticket-validation.actions.ts
import { backendApi } from "@/core/api/wordpress-api";

export interface TicketStatus {
  orderId: string;
  eventId: string;
  usageCount: number;
  maxUsages: number;
  remainingUsages: number;
  usageHistory: {
    timestamp: Date;
    validatedBy: string;
  }[];
}

export interface TicketValidationResponse {
  message: string;
  orderId: string;
  eventId: string;
  usageCount: number;
  remainingUsages: number;
}

export const getTicketStatus = async (
  qrCode: string,
  eventId: string,
): Promise<TicketStatus> => {
  try {
    console.log("Requesting ticket status with:", { qrCode, eventId });
    const { data } = await backendApi.get<TicketStatus>(
      `/tickets/${encodeURIComponent(qrCode)}/${eventId}`,
    );
    console.log("Ticket status response:", data);
    return data;
  } catch (error) {
    console.error("Error getting ticket status:", error);
    throw error;
  }
};

export const validateTicket = async (params: {
  qrCode: string;
  eventId: string;
}): Promise<TicketValidationResponse> => {
  try {
    console.log("Validating ticket with params:", params);
    const { data } = await backendApi.post<TicketValidationResponse>(
      "/tickets/validate",
      params,
    );
    console.log("Validation response:", data);
    return data;
  } catch (error) {
    console.error("Error validating ticket:", error);
    throw error;
  }
};
