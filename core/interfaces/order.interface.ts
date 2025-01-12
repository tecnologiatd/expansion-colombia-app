import {BillingAddress, ShippingAddress} from "@/core/interfaces/customer.interface";

export interface Order {
    id: number;
    parent_id: number;
    status: string;
    currency: string;
    version: string;
    prices_include_tax: boolean;
    date_created: string;
    date_modified: string;
    discount_total: string;
    discount_tax: string;
    total: string;
    customer_id: number;
    order_key: string;
    billing: BillingAddress;
    shipping: ShippingAddress;
    payment_method: string;
    payment_method_title: string;
    transaction_id: string;
    created_via: string;
    date_completed: string | null;
    date_paid: string | null;
    number: string;
    line_items: LineItem[];
    refunds: any[]; // Can be an array of objects with specific properties based on WooCommerce configuration
    payment_url: string;
    is_editable: boolean;
    needs_payment: boolean;
    needs_processing: boolean;
    date_created_gmt: string;
    date_modified_gmt: string;
    date_completed_gmt: string | null;
    date_paid_gmt: string | null;
    currency_symbol: string;
}

interface LineItem {
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    tax_class: string;
    subtotal: string;
    subtotal_tax: string;
    total: string;
    total_tax: string;
    taxes: any[]; // Can be an array of objects with specific properties based on WooCommerce configuration
    meta_data: any[]; // Can be an array of objects with specific properties based on WooCommerce configuration
    sku: string;
    price: number;
    image: {
        id: number;
        src: string;
    };
    parent_name: string | null;
}