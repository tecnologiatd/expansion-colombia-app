import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useBlogPosts } from "@/presentation/hooks/useBlogPosts";
import { Ionicons } from "@expo/vector-icons";

interface BlogSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (blogId: string, title: string) => void;
}

export const BlogSelector: React.FC<BlogSelectorProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const { blogPostsQuery } = useBlogPosts();

  const handleSelect = (id: number, title: string) => {
    onSelect(id.toString(), title);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-gray-800 rounded-t-3xl h-3/4 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">
              Seleccionar Artículo
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {blogPostsQuery.isLoading ? (
            <ActivityIndicator size="large" color="#7B3DFF" />
          ) : blogPostsQuery.data ? (
            <FlatList
              data={blogPostsQuery.data}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="bg-gray-700 p-4 rounded-lg mb-2"
                  onPress={() => handleSelect(item.id, item.title.rendered)}
                >
                  <Text className="text-white font-bold">
                    {item.title.rendered}
                  </Text>
                  <Text className="text-gray-400 mt-1" numberOfLines={1}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text className="text-white text-center">
              No hay artículos disponibles
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};
