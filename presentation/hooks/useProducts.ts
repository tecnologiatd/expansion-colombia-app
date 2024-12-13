import { getProductsActions } from "@/core/actions/get-products.action";
import { useQuery } from "@tanstack/react-query";

export const useProducts = () => {
  // Queries
  const productsQuery = useQuery({
    queryKey: ["events"],
    queryFn: getProductsActions,
    staleTime: 1000 * 60, // 1 minute
  });

  return {
    productsQuery,
  };
};
