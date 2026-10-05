// presentation/components/NotificationBell.tsx
import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { useNotificationStore } from "@/core/stores/notification.store";
import { Ionicons } from "@expo/vector-icons";

interface NotificationBellProps {
  onPress: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onPress,
}) => {
  const { notifications } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <TouchableOpacity
      className="relative w-10 h-10 items-center justify-center"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Notificaciones"
      hitSlop={8}
    >
      <Ionicons name="notifications-outline" size={24} color="white" />
      {unreadCount > 0 && (
        <View className="absolute top-0.5 right-0.5 bg-brand rounded-full min-w-[16px] h-4 px-1 items-center justify-center">
          <Text
            className="text-white text-[10px] font-bold"
            allowFontScaling={false}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
