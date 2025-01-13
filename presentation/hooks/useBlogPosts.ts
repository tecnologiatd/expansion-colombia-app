import { useQuery } from "@tanstack/react-query";
import { getBlogPosts, getBlogPost } from "@/core/actions/get-blog-posts.action";

export const useBlogPosts = () => {
    const blogPostsQuery = useQuery({
        queryKey: ["blog-posts"],
        queryFn: getBlogPosts,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        blogPostsQuery,
    };
};

export const useBlogPost = (id: string) => {
    const blogPostQuery = useQuery({
        queryKey: ["blog-post", id],
        queryFn: () => getBlogPost(id),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        blogPostQuery,
    };
};