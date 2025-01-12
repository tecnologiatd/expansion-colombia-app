export interface Customer {
    id: number;
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    username: string;
    billing: BillingAddress;
    shipping: ShippingAddress;
    is_paying_customer: boolean;
    avatar_url: string;
    meta_data: MetaData[];
    _links: Links;
}

export interface BillingAddress {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
    state: string;
    email: string;
    phone: string;
}

export interface ShippingAddress {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
    state: string;
    phone: string;
}

interface MetaData {
    id: number;
    key: string;
    value: any; // Can be a string, object, or array
}

interface Links {
    self: Link[];
    collection: Link[];
}

interface Link {
    href: string;
    targetHints?: {
        allow: string[];
    };
}