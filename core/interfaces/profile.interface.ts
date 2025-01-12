import {Customer} from "@/core/interfaces/customer.interface";
import {Order} from "@/core/interfaces/order.interface";

export default interface Profile{
    customer: Customer;
    orders: Order[];
}