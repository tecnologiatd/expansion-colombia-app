import {Customer} from "@/core/interfaces/customer.interface";
import {Order} from "@/core/interfaces/order.interface";

export interface ProfilePagination {
    currentPage?: number;
    totalPages?: number;
    perPage?: number;
    totalOrders?: number;
}

export default interface Profile{
    customer: Customer;
    orders: Order[];
    pagination?: ProfilePagination;
}