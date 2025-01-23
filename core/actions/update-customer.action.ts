import { backendApi } from "@/core/api/wordpress-api";
import { Customer } from "@/core/interfaces/customer.interface";

export const updateCustomerAction = async (customerData: Partial<Customer>): Promise<Customer> => {
    try {
        const { data } = await backendApi.put<Customer>('/customer', customerData);
        return data;
    } catch (error) {
        console.error('Error actualizando el cliente:', error);
        throw new Error('Falló la petición para actualizar los datos del cliente');
    }
};