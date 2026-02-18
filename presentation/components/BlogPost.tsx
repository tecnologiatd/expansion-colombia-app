import React from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useBlogPost } from '@/presentation/hooks/useBlogPosts';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

const blogTagsStyles = {
    body: { color: '#fff' },
    p: { color: '#fff', lineHeight: 24, marginBottom: 16 },
    h1: { color: '#fff', fontSize: 24, marginVertical: 16 },
    h2: { color: '#fff', fontSize: 20, marginVertical: 12 },
    a: { color: '#7B3DFF' },
};

interface Props {
    id: string;
}

const BlogPost = ({ id }: Props) => {
    const { width } = useWindowDimensions();
    const { blogPostQuery } = useBlogPost(id);

    if (blogPostQuery.isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#7B3DFF" />
            </View>
        );
    }

    if (blogPostQuery.isError) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text className="text-white text-lg">Failed to load blog post</Text>
                <TouchableOpacity
                    className="mt-4 bg-purple-500 px-6 py-3 rounded-lg"
                    onPress={() => blogPostQuery.refetch()}
                >
                    <Text className="text-white font-medium">Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const post = blogPostQuery.data;

    return (
        <ScrollView className="flex-1 bg-gray-900">
            {post._embedded?.['wp:featuredmedia']?.[0]?.source_url && (
                <Image
                    source={{ uri: post._embedded['wp:featuredmedia'][0].source_url }}
                    className="w-full h-64"
                    resizeMode="cover"
                />
            )}
            <View className="p-4">
                <Text className="text-white text-2xl font-bold mb-4">
                    {post.title.rendered}
                </Text>
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-purple-500">
                        {new Date(post.date).toLocaleDateString()}
                    </Text>
                    {post._embedded?.author?.[0]?.name && (
                        <Text className="text-gray-400">
                            By {post._embedded.author[0].name}
                        </Text>
                    )}
                </View>
                <RenderHtml
                    contentWidth={width - 32}
                    source={{ html: post.content.rendered }}
                    tagsStyles={blogTagsStyles}
                />
            </View>
        </ScrollView>
    );
};

export default BlogPost;