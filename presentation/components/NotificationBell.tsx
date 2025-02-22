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
    <TouchableOpacity className="relative" onPress={onPress}>
      <Ionicons name="notifications-outline" size={24} color="white" />
      {unreadCount > 0 && (
        <View className="absolute -top-1 -right-1 bg-purple-500 rounded-full w-4 h-4 items-center justify-center">
          <Text className="text-white text-xs">{unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
