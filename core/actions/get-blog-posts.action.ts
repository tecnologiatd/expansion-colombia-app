import { backendApi } from "@/core/api/wordpress-api";
import { BlogPost } from "@/core/interfaces/blog.interface";

export const getBlogPosts = async (): Promise<BlogPost[]> => {
    try {
        const { data } = await backendApi.get<BlogPost[]>("/blog");
        return data;
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        throw new Error("Cannot load blog posts");
    }
};

export const getBlogPost = async (id: string): Promise<BlogPost> => {
    try {
        const { data } = await backendApi.get<BlogPost>(`/blog/${id}`);
        return data;
    } catch (error) {
        console.error("Error fetching blog post:", error);
        throw new Error("Cannot load blog post");
    }
};