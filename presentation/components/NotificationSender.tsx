import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSendNotification } from "@/presentation/hooks/useSendNotification";
import { BlogSelector } from "./BlogSelector";
import { ProductSelector } from "./ProductSelector";

interface NotificationSenderProps {
  visible: boolean;
  onClose: () => void;
}

type RouteType = "none" | "blog" | "event";

export const NotificationSender: React.FC<NotificationSenderProps> = ({
  visible,
  onClose,
}) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [routeType, setRouteType] = useState<RouteType>("none");
  const [routeId, setRouteId] = useState<string | null>(null);
  const [routeName, setRouteName] = useState<string | null>(null);
  const [showBlogSelector, setShowBlogSelector] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);

  const { sendNotificationMutation } = useSendNotification();

  const resetForm = () => {
    setTitle("");
    setBody("");
    setRouteType("none");
    setRouteId(null);
    setRouteName(null);
  };

  const handleSend = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "El título es obligatorio");
      return;
    }

    if (!body.trim()) {
      Alert.alert("Error", "El mensaje es obligatorio");
      return;
    }

    try {
      // Crear la ruta basada en la selección
      let route: string | undefined;
      if (routeType === "blog" && routeId) {
        route = `/blog/${routeId}`;
      } else if (routeType === "event" && routeId) {
        route = `/event/${routeId}`;
      }

      await sendNotificationMutation.mutateAsync({
        title,
        body,
        route,
      });

      Alert.alert("Éxito", "Notificación enviada correctamente", [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            onClose();
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar la notificación");
    }
  };

  const handleSelectBlog = (blogId: string, blogTitle: string) => {
    setRouteType("blog");
    setRouteId(blogId);
    setRouteName(blogTitle);
  };

  const handleSelectProduct = (productId: string, productName: string) => {
    setRouteType("event");
    setRouteId(productId);
    setRouteName(productName);
  };

  const getRouteDescription = () => {
    switch (routeType) {
      case "blog":
        return `Blog: ${routeName}`;
      case "event":
        return `Evento: ${routeName}`;
      default:
        return "Sin destino";
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-gray-800 rounded-t-3xl p-6 max-h-[90%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-xl font-bold">
              Enviar Notificación
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView className="mb-6">
            <View className="mb-4">
              <Text className="text-white text-base mb-2">Título</Text>
              <TextInput
                className="bg-gray-700 p-4 rounded-lg text-white"
                placeholder="Título de la notificación"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View className="mb-4">
              <Text className="text-white text-base mb-2">Mensaje</Text>
              <TextInput
                className="bg-gray-700 p-4 rounded-lg text-white min-h-24"
                placeholder="Contenido de la notificación..."
                placeholderTextColor="#999"
                value={body}
                onChangeText={setBody}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View className="mb-6">
              <Text className="text-white text-base mb-2">Enlazar a</Text>
              <View className="flex-row justify-between mb-3">
                <TouchableOpacity
                  className={`flex-1 p-3 mr-2 rounded-lg ${
                    routeType === "none" ? "bg-purple-500" : "bg-gray-700"
                  }`}
                  onPress={() => {
                    setRouteType("none");
                    setRouteId(null);
                    setRouteName(null);
                  }}
                >
                  <Text className="text-white text-center">Ninguno</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 p-3 mr-2 rounded-lg ${
                    routeType === "blog" ? "bg-purple-500" : "bg-gray-700"
                  }`}
                  onPress={() => setShowBlogSelector(true)}
                >
                  <Text className="text-white text-center">Blog</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 p-3 rounded-lg ${
                    routeType === "event" ? "bg-purple-500" : "bg-gray-700"
                  }`}
                  onPress={() => setShowProductSelector(true)}
                >
                  <Text className="text-white text-center">Evento</Text>
                </TouchableOpacity>
              </View>

              {routeType !== "none" && routeName && (
                <View className="bg-gray-700 p-3 rounded-lg">
                  <Text className="text-white">{getRouteDescription()}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              className={`bg-purple-500 p-4 rounded-lg ${
                sendNotificationMutation.isPending ? "opacity-50" : ""
              }`}
              onPress={handleSend}
              disabled={sendNotificationMutation.isPending}
            >
              {sendNotificationMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-bold text-lg">
                  Enviar a Todos
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          <BlogSelector
            visible={showBlogSelector}
            onClose={() => setShowBlogSelector(false)}
            onSelect={handleSelectBlog}
          />

          <ProductSelector
            visible={showProductSelector}
            onClose={() => setShowProductSelector(false)}
            onSelect={handleSelectProduct}
          />
        </View>
      </View>
    </Modal>
  );
};
