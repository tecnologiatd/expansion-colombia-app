import { backendApi } from "@/core/api/wordpress-api";
import { Order } from "@/core/interfaces/order.interface";
import { AxiosError } from "axios";

// Marcador para que las pantallas distingan el bloqueo por mantenimiento
// del resto de errores al crear el pedido.
export const MAINTENANCE_ERROR = "MAINTENANCE";

export interface CreateOrderParams {
  idempotencyKey?: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
    state: string;
    email: string;
    phone: string;
  };
  line_items: {
    product_id: number;
    quantity: number;
  }[];
  // El payment_method es opcional
  payment_method?: string;
  // Campo para metadatos personalizados
  meta_data?: {
    key: string;
    value: string | number | boolean;
  }[];
}

export const createOrderAction = async (
  params: CreateOrderParams,
): Promise<Order> => {
  try {
    // Si no se proporciona payment_method, no lo incluimos en la petición
    const { idempotencyKey, ...body } = params;
    const { data } = await backendApi.post<Order>("/orders", body, {
      timeout: 65000,
      headers: idempotencyKey
        ? { "X-Idempotency-Key": idempotencyKey }
        : undefined,
    });
    return data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.status === 503) {
      // El backend bloquea la creación de pedidos en modo mantenimiento
      throw new Error(
        `${MAINTENANCE_ERROR}:${axiosError.response.data?.message ?? "Compras en pausa por mantenimiento"}`,
      );
    }
    console.error("Error creating order:", error);
    throw new Error(
      axiosError.response?.data?.message ??
        "No se pudo confirmar el pedido. Toca continuar para consultar el mismo intento de compra.",
    );
  }
};

export const getOrderByIdAction = async (
  orderId: string,
  opts: { fresh?: boolean } = {},
): Promise<Order> => {
  try {
    const { data } = await backendApi.get<Order>(`/orders/${orderId}`, {
      params: opts.fresh ? { fresh: 1 } : undefined,
    });
    return data;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};

export const updateOrderCheckoutAction = async (
  orderId: number,
  params: CreateOrderParams,
): Promise<Order> => {
  const { idempotencyKey, ...body } = params;
  const { data } = await backendApi.put<Order>(
    `/orders/${orderId}/checkout`,
    body,
  );
  return data;
};
