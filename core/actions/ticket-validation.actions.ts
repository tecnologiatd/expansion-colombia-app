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
  // Presentes solo cuando el estado viene del espejo local (escaneo offline)
  source?: "server" | "local";
  customerName?: string | null;
}

export interface TicketValidationResponse {
  message: string;
  orderId: string;
  eventId: string;
  usageCount: number;
  remainingUsages: number;
  // true cuando la validación quedó encolada para sincronizar después
  offline?: boolean;
}

export const getTicketStatus = async (
  qrCode: string,
  eventId: string,
  options?: { timeoutMs?: number },
): Promise<TicketStatus> => {
  try {
    console.log("Requesting ticket status with:", { qrCode, eventId });
    const { data } = await backendApi.get<TicketStatus>(
      `/tickets/${encodeURIComponent(qrCode)}/${eventId}`,
      options?.timeoutMs ? { timeout: options.timeoutMs } : undefined,
    );
    console.log("Ticket status response:", data);
    return data;
  } catch (error) {
    console.error("Error getting ticket status:", error);
    throw error;
  }
};

export interface ConflictTicket {
  id: string;
  orderId: string;
  eventId: string;
  qrCode: string;
  customerName: string | null;
  usageCount: number;
  maxUsages: number;
  usageHistory: {
    timestamp: string;
    validatedBy: string;
    validatedByName?: string;
    offline?: boolean;
    conflict?: boolean;
    deviceId?: string;
  }[];
  updatedAt: string;
}

export const getTicketConflicts = async (
  eventId?: string,
): Promise<ConflictTicket[]> => {
  const { data } = await backendApi.get<ConflictTicket[]>(
    "/tickets/conflicts",
    {
      params: eventId ? { eventId } : undefined,
    },
  );
  return data;
};

export const resolveTicketConflict = async (
  ticketId: string,
): Promise<{ message: string; id: string }> => {
  const { data } = await backendApi.post<{ message: string; id: string }>(
    `/tickets/${ticketId}/resolve-conflict`,
  );
  return data;
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
