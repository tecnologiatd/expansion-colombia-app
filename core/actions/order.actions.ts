import { backendApi } from "@/core/api/wordpress-api";
import { Order } from "@/core/interfaces/order.interface";

export interface CreateOrderParams {
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
  // El payment_method ahora es opcional
  payment_method?: string;
}

export const createOrderAction = async (
  params: CreateOrderParams,
): Promise<Order> => {
  try {
    // Si no se proporciona payment_method, no lo incluimos en la petición
    const { data } = await backendApi.post<Order>("/orders", params);
    return data;
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error("Failed to create order");
  }
};

export const getOrderByIdAction = async (orderId: string): Promise<Order> => {
  try {
    const { data } = await backendApi.get<Order>(`/orders/${orderId}`);
    return data;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw new Error("Failed to fetch order details");
  }
};
