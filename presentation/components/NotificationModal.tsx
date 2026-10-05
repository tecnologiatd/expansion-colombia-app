import { View, Text, Modal, TouchableOpacity, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNotificationStore,
  type Notification,
} from "@/core/stores/notification.store";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatTimeAgo } from "@/presentation/components/OfflineBanner";
import { CONTENT_MAX_WIDTH, Theme } from "@/presentation/theme/Colors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<Props> = ({ visible, onClose }) => {
  const { notifications, markAsRead, clearAll } = useNotificationStore();
  // Un Modal vive en otra jerarquía nativa: SafeAreaView puede medir 0 durante
  // la animación y dejar el contenido bajo el notch. Los insets del hook
  // vienen del provider raíz y son estables en iOS y Android.
  const insets = useSafeAreaInsets();

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.route) {
      router.push(notification.route as Href);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      // Android dibuja de borde a borde: el contenido se separa con los insets
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View
        className="flex-1 bg-background"
        style={{
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <View
          className="flex-1 w-full self-center"
          style={{ maxWidth: CONTENT_MAX_WIDTH }}
        >
          <View className="flex-row items-center justify-between pl-4 pr-2 min-h-[52px] border-b border-line">
            <Text
              className="text-white text-lg font-semibold flex-1"
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
            >
              Notificaciones
            </Text>
            {notifications.length > 0 && (
              <TouchableOpacity
                className="h-11 px-3 justify-center"
                onPress={clearAll}
                accessibilityRole="button"
              >
                <Text className="text-purple-400 font-medium">Borrar todo</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="w-11 h-11 items-center justify-center"
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar notificaciones"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <FlatList
            className="flex-1"
            data={notifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: insets.bottom + 16,
            }}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center p-8">
                <Ionicons
                  name="notifications-off-outline"
                  size={44}
                  color={Theme.muted}
                />
                <Text className="text-white text-lg font-semibold mt-4 text-center">
                  No hay notificaciones
                </Text>
                <Text className="text-muted mt-2 text-center">
                  Aquí verás las novedades de tus compras y eventos.
                </Text>
              </View>
            }
            renderItem={({ item: notification }) => (
              <TouchableOpacity
                className="flex-row px-4 py-4 border-b border-line"
                activeOpacity={0.7}
                onPress={() => handleNotificationPress(notification)}
              >
                <View
                  className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                    notification.read ? "bg-transparent" : "bg-brand"
                  }`}
                />
                <View className="flex-1">
                  <Text
                    className={`text-base ${
                      notification.read
                        ? "text-gray-300 font-medium"
                        : "text-white font-semibold"
                    }`}
                  >
                    {notification.title}
                  </Text>
                  <Text className="text-muted mt-1">{notification.body}</Text>
                  <Text className="text-muted text-xs mt-2">
                    {formatTimeAgo(new Date(notification.date).getTime())}
                  </Text>
                </View>
                {notification.route && (
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Theme.muted}
                    style={{ marginLeft: 8, alignSelf: "center" }}
                  />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};
