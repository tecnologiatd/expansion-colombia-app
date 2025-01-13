export interface BlogPost {
    id: number;
    title: {
        rendered: string;
    };
    content: {
        rendered: string;
    };
    excerpt: {
        rendered: string;
    };
    date: string;
    featured_media: number;
    _embedded?: {
        author: Array<{
            name: string;
            avatar_urls: {
                [key: string]: string;
            };
        }>;
        'wp:featuredmedia'?: Array<{
            source_url: string;
        }>;
    };
}