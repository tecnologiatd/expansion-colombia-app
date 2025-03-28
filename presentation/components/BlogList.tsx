import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useBlogPosts } from "@/presentation/hooks/useBlogPosts";
import { BlogPost } from "@/core/interfaces/blog.interface";
import { decode } from "html-entities";

// Función para decodificar entidades HTML
const decodeHtmlEntities = (text: string): string => {
  if (!text) return "";

  // Usando la librería html-entities
  return decode(text);
};

// Función para eliminar todas las etiquetas HTML
const stripHtml = (html: string): string => {
  if (!html) return "";
  return html.replace(/<\/?[^>]+(>|$)/g, "");
};

const BlogList = () => {
  const { blogPostsQuery } = useBlogPosts();

  if (blogPostsQuery.isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#7B3DFF" />
      </View>
    );
  }

  if (blogPostsQuery.isError) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-white text-lg">
          No se pudieron cargar las noticias
        </Text>
        <TouchableOpacity
          className="mt-4 bg-purple-500 px-6 py-3 rounded-lg"
          onPress={() => blogPostsQuery.refetch()}
        >
          <Text className="text-white font-medium">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }: { item: BlogPost }) => {
    // Decodificar el título y el contenido
    const decodedTitle = decodeHtmlEntities(item.title.rendered);
    const decodedExcerpt = decodeHtmlEntities(stripHtml(item.excerpt.rendered));

    // Formatear la fecha
    const formattedDate = new Date(item.date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

    return (
      <TouchableOpacity
        className="bg-gray-800 rounded-lg overflow-hidden mb-4 mx-4"
        onPress={() => router.push(`/blog/${item.id}`)}
      >
        {item._embedded?.["wp:featuredmedia"]?.[0]?.source_url && (
          <Image
            source={{ uri: item._embedded["wp:featuredmedia"][0].source_url }}
            className="w-full h-48"
            resizeMode="cover"
          />
        )}
        <View className="p-4">
          <Text className="text-white text-xl font-bold mb-2">
            {decodedTitle}
          </Text>
          <Text className="text-gray-400 text-base mb-3" numberOfLines={2}>
            {decodedExcerpt}
          </Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-purple-500">{formattedDate}</Text>
            {item._embedded?.author?.[0]?.name && (
              <Text className="text-gray-400">
                Por {item._embedded.author[0].name}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-900">
      <FlatList
        data={blogPostsQuery.data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshing={blogPostsQuery.isFetching}
        onRefresh={() => blogPostsQuery.refetch()}
      />
    </View>
  );
};

export default BlogList;
