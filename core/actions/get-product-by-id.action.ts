import { backendApi } from "@/core/api/wordpress-api";
import {Product} from "@/core/interfaces/product.interface";

export const getProductById = async (id: string): Promise<Product> => {
    try {
        const { data } = await backendApi.get<Product>(`/products/${id}`);

        console.log(JSON.stringify(data, null, 2));
        return data;


    } catch (error) {
        console.log(error);
        throw "Cannot load now playing movies";
    }
};
