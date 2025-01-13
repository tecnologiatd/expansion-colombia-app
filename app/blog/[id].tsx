import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import BlogPost from '@/presentation/components/BlogPost';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BlogPostScreen() {
    const { id } = useLocalSearchParams();

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <BlogPost id={id as string} />
        </SafeAreaView>
    );
}