import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Referencias para los inputs
  const bodyInputRef = useRef<TextInput>(null);
  // Animación para el botón de cerrar teclado
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { sendNotificationMutation } = useSendNotification();

  // Detectar cuando el teclado aparece/desaparece
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      },
    );

    // Limpiar listeners cuando el componente se desmonte
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [fadeAnim]);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setRouteType("none");
    setRouteId(null);
    setRouteName(null);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
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
      // Cerrar el teclado antes de enviar
      Keyboard.dismiss();

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
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View className="flex-1 justify-end bg-black/50">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
            className="flex-1 justify-end"
          >
            <View className="bg-gray-800 rounded-t-3xl p-6 max-h-[90%]">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-white text-xl font-bold">
                  Enviar Notificación
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView className="mb-6" keyboardShouldPersistTaps="handled">
                <View className="mb-4">
                  <Text className="text-white text-base mb-2">Título</Text>
                  <TextInput
                    className="bg-gray-700 p-4 rounded-lg text-white"
                    placeholder="Título de la notificación"
                    placeholderTextColor="#999"
                    value={title}
                    onChangeText={setTitle}
                    returnKeyType="next"
                    onSubmitEditing={() => bodyInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-white text-base mb-2">Mensaje</Text>
                  <TextInput
                    ref={bodyInputRef}
                    className="bg-gray-700 p-4 rounded-lg text-white min-h-24"
                    placeholder="Contenido de la notificación..."
                    placeholderTextColor="#999"
                    value={body}
                    onChangeText={setBody}
                    multiline
                    textAlignVertical="top"
                    returnKeyType="done"
                    onSubmitEditing={dismissKeyboard}
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
                      onPress={() => {
                        dismissKeyboard();
                        setShowBlogSelector(true);
                      }}
                    >
                      <Text className="text-white text-center">Blog</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`flex-1 p-3 rounded-lg ${
                        routeType === "event" ? "bg-purple-500" : "bg-gray-700"
                      }`}
                      onPress={() => {
                        dismissKeyboard();
                        setShowProductSelector(true);
                      }}
                    >
                      <Text className="text-white text-center">Evento</Text>
                    </TouchableOpacity>
                  </View>

                  {routeType !== "none" && routeName && (
                    <View className="bg-gray-700 p-3 rounded-lg">
                      <Text className="text-white">
                        {getRouteDescription()}
                      </Text>
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

                {/* Espaciado para evitar que el botón de enviar quede oculto por el teclado */}
                {Platform.OS === "ios" && <View className="h-32" />}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>

          {/* Botón flotante para cerrar el teclado en iOS */}
          {Platform.OS === "ios" && (
            <Animated.View
              style={{
                opacity: fadeAnim,
                position: "absolute",
                bottom: keyboardVisible ? 20 : -50,
                alignSelf: "center",
              }}
            >
              <TouchableOpacity
                className="bg-gray-700 p-3 rounded-full shadow-lg"
                onPress={dismissKeyboard}
              >
                <Ionicons name="chevron-down" size={24} color="white" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </TouchableWithoutFeedback>

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
    </Modal>
  );
};

export default NotificationSender;
