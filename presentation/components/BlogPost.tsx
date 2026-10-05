import React from "react";
import { imageSource } from "@/helpers/image-source";
import { View, Text, ScrollView, Image } from "react-native";
import { useBlogPost } from "@/presentation/hooks/useBlogPosts";
import RenderHtml from "react-native-render-html";
import { useWindowDimensions } from "react-native";
import { StateView } from "@/presentation/components/ui/StateView";
import { CONTENT_MAX_WIDTH, Theme } from "@/presentation/theme/Colors";
import { plainText } from "@/helpers/format";

const blogTagsStyles = {
  body: { color: "#fff" },
  p: { color: "#fff", lineHeight: 24, marginBottom: 16 },
  h1: { color: "#fff", fontSize: 24, marginVertical: 16 },
  h2: { color: "#fff", fontSize: 20, marginVertical: 12 },
  a: { color: "#C084FC" },
};

interface Props {
  id: string;
}

const BlogPost = ({ id }: Props) => {
  const { width } = useWindowDimensions();
  const { blogPostQuery } = useBlogPost(id);

  if (blogPostQuery.isLoading) {
    return <StateView loading />;
  }

  if (blogPostQuery.isError || !blogPostQuery.data) {
    return (
      <StateView
        icon="cloud-offline-outline"
        title="No se pudo cargar la noticia"
        actionLabel="Reintentar"
        onAction={() => blogPostQuery.refetch()}
      />
    );
  }

  const post = blogPostQuery.data;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        width: "100%",
        maxWidth: CONTENT_MAX_WIDTH,
        alignSelf: "center",
        paddingBottom: 24,
      }}
    >
      {post._embedded?.["wp:featuredmedia"]?.[0]?.source_url && (
        <Image
          source={imageSource(post._embedded["wp:featuredmedia"][0].source_url)}
          style={{
            width: "100%",
            aspectRatio: 16 / 10,
            backgroundColor: Theme.surfaceRaised,
          }}
          resizeMode="cover"
        />
      )}
      <View className="p-4">
        <Text className="text-white text-2xl font-bold mb-4">
          {plainText(post.title.rendered)}
        </Text>
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-purple-400">
            {new Date(post.date).toLocaleDateString("es-CO")}
          </Text>
          {post._embedded?.author?.[0]?.name && (
            <Text className="text-gray-400">
              Por {post._embedded.author[0].name}
            </Text>
          )}
        </View>
        <RenderHtml
          contentWidth={Math.min(width, CONTENT_MAX_WIDTH) - 32}
          source={{ html: post.content.rendered }}
          tagsStyles={blogTagsStyles}
        />
      </View>
    </ScrollView>
  );
};

export default BlogPost;
