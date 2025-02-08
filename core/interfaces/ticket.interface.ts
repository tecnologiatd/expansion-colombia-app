export interface TicketStatus {
  isUsed: boolean;
  usedAt?: string;
  validatedBy?: string;
  orderId: string;
}

export interface TicketResponse {
  qrCode: string;
}

export interface TicketValidationResponse {
  message: string;
  orderId: string;
}
