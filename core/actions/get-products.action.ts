import { backendApi } from "@/core/api/wordpress-api";
import { Product } from "@/core/interfaces/product.interface";

export const getProductsActions = async () => {
  try {
    const { data } = await backendApi.get<Product[]>("/products");

    return data;
  } catch (error) {
    console.log(error);
    throw "Cannot load now playing movie";
  }
};
