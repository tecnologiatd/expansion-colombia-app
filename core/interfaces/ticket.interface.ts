export interface TicketStatus {
  isUsed: boolean;
  usedAt?: string;
  validatedBy?: string;
  orderId: string;
}

export interface TicketResponse {
  qrCodes: string[];
}

export interface TicketValidationResponse {
  message: string;
  orderId: string;
}

export interface GenerateTicketDto {
  orderId: string;
  eventId: string;
  quantity: number;
  usagesPerTicket: number;
}
