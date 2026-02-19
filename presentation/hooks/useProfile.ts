import {useInfiniteQuery} from "@tanstack/react-query";
import {getProfileAction} from "@/core/actions/get-profile.action";
import {Order} from "@/core/interfaces/order.interface";

const PROFILE_ORDERS_PAGE_SIZE = 10;

export const useProfile = () => {

    const profileQuery = useInfiniteQuery({
        queryKey: ['profile', PROFILE_ORDERS_PAGE_SIZE],
        queryFn: ({ pageParam }) =>
            getProfileAction({ page: pageParam, perPage: PROFILE_ORDERS_PAGE_SIZE }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const currentPage =
                lastPage.pagination?.currentPage ?? allPages.length;
            const totalPages = lastPage.pagination?.totalPages;

            if (typeof totalPages === "number") {
                return currentPage < totalPages ? currentPage + 1 : undefined;
            }

            return lastPage.orders.length === PROFILE_ORDERS_PAGE_SIZE
                ? currentPage + 1
                : undefined;
        },
        staleTime: 1000 * 60,
    });

    const userData = profileQuery.data?.pages[0]?.customer;
    const ordersById = new Map<number, Order>();

    profileQuery.data?.pages.forEach((page) => {
        page.orders.forEach((order) => {
            ordersById.set(order.id, order);
        });
    });

    const orders = Array.from(ordersById.values());

    return {
        profileQuery,
        userData,
        orders,
    };
}