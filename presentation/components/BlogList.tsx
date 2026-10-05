import React from "react";
import { imageSource } from "@/helpers/image-source";
import { View, Text, FlatList, Image } from "react-native";
import { router } from "expo-router";
import { useBlogPosts } from "@/presentation/hooks/useBlogPosts";
import { BlogPost } from "@/core/interfaces/blog.interface";
import { decode } from "html-entities";
import { FadeInView } from "@/presentation/components/ui/FadeInView";
import { PressableScale } from "@/presentation/components/ui/PressableScale";
import { StateView } from "@/presentation/components/ui/StateView";
import { CONTENT_MAX_WIDTH, Theme } from "@/presentation/theme/Colors";

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
    return <StateView loading />;
  }

  if (blogPostsQuery.isError) {
    return (
      <StateView
        icon="cloud-offline-outline"
        title="No se pudieron cargar las noticias"
        actionLabel="Reintentar"
        onAction={() => blogPostsQuery.refetch()}
      />
    );
  }

  const renderItem = ({ item, index }: { item: BlogPost; index: number }) => {
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
      <FadeInView index={index} style={{ marginBottom: 16 }}>
        <PressableScale
          className="bg-surface rounded-2xl border border-line overflow-hidden"
          onPress={() => router.push(`/blog/${item.id}`)}
        >
          {item._embedded?.["wp:featuredmedia"]?.[0]?.source_url && (
            <Image
              source={imageSource(
                item._embedded["wp:featuredmedia"][0].source_url,
              )}
              style={{
                width: "100%",
                aspectRatio: 16 / 9,
                backgroundColor: Theme.surfaceRaised,
              }}
              resizeMode="cover"
            />
          )}
          <View className="p-4">
            <Text
              className="text-white text-lg font-bold mb-2"
              numberOfLines={3}
            >
              {decodedTitle}
            </Text>
            <Text className="text-muted text-sm mb-3" numberOfLines={2}>
              {decodedExcerpt}
            </Text>
            <View className="flex-row justify-between items-center">
              <Text className="text-purple-400 text-sm">{formattedDate}</Text>
              {item._embedded?.author?.[0]?.name && (
                <Text className="text-muted text-sm">
                  Por {item._embedded.author[0].name}
                </Text>
              )}
            </View>
          </View>
        </PressableScale>
      </FadeInView>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <FlatList
        style={{
          width: "100%",
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: "center",
        }}
        data={blogPostsQuery.data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshing={blogPostsQuery.isFetching}
        onRefresh={() => blogPostsQuery.refetch()}
      />
    </View>
  );
};

export default BlogList;
