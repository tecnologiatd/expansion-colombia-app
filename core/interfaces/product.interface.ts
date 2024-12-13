export interface Product {
    id: number;
    name: string;
    description: string;
    permalink: string;
    price: number;
    images?: Image[];
    categories: Category[];
    tags: [];
    status: string;
    featured: boolean;
    date_created: string;
}

export interface Image {
    id: number;
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
    src: string;
    name: string;
    alt: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
}