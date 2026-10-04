export const isPaidOrder = (status?: string) =>
  status === "processing" || status === "completed";
export const isWaitingOrder = (status?: string) =>
  status === "pending" || status === "on-hold";
export const isPayableOrder = (status?: string) =>
  status === "pending" || status === "failed";

// La cancelación del consentimiento puede ocurrir antes de mostrar el navegador.
export const browserReturned = (type: string) =>
  type === "success" || type === "dismiss";
