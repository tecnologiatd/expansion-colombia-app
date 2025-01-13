// app/(tabs)/blog.tsx
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import BlogList from '@/presentation/components/BlogList';

export default function BlogScreen() {
    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <BlogList />
        </SafeAreaView>
    );
}