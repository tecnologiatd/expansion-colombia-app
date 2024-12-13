import { backendApi } from "@/core/api/wordpress-api";
import {Product} from "@/core/interfaces/product.interface";

export const getProductsActions = async () => {
  console.log(process.env.EXPO_PUBLIC_BACKEND_URL)
  try {
    const { data } = await backendApi.get<Product[]>("/products");

    console.log(JSON.stringify(data, null, 2));
    return data;


  } catch (error) {
    console.log(error);
    throw "Cannot load now playing movie";
  }
};
