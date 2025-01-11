import { backendApi } from "@/core/api/wordpress-api";
import {Customer} from "@/core/interfaces/customer.interface";

export const getCostumer = async (): Promise<Customer> => {
    try {
        const { data } = await backendApi.get<Customer>(`/customer`);

        return data;

    } catch (error) {
        console.log(error);
        throw "Cannot load customer data";
    }
};
