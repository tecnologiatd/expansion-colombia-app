import {getProductById} from "@/core/actions/get-product-by-id.action";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useRef} from "react";

export const useProduct = (productId: string) => {

    const productQuery = useQuery({
        queryKey: ['products', productId],
        queryFn: () => getProductById(productId),
        staleTime: 1000 * 60 * 60, // 1 hora
    });

    return {
        productQuery,
    };
}