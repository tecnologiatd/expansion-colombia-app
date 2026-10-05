import { backendApi } from "@/core/api/wordpress-api";

export interface OrderTicket {
  ticketId: string;
  qrCode: string;
  usageCount: number;
  maxUsages: number;
  used: boolean;
}

export type OrderTickets = Record<string, OrderTicket[]>;

export const getOrderTickets = async (
  orderId: string,
  signal?: AbortSignal,
) => {
  const { data } = await backendApi.get<OrderTickets>(
    `/tickets/order/${encodeURIComponent(orderId)}`,
    { signal },
  );
  return data;
};
