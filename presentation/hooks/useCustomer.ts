import {useQuery} from "@tanstack/react-query";
import {getCostumer} from "@/core/actions/get-customer.action";

export const useCustomer = () => {

    const costumerQuery = useQuery({
        queryKey: ['customer'],
        queryFn: () => getCostumer(),
        staleTime: 1000 * 60,
    });

    return {
        costumerQuery,
    };
}