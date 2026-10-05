import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./Button";
import { Theme } from "@/presentation/theme/Colors";

interface Props {
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// Estado de pantalla completa: cargando, error o vacío.
export const StateView = ({
  loading,
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: Props) => (
  <View className="flex-1 bg-background items-center justify-center p-8">
    {loading ? (
      <ActivityIndicator size="large" color={Theme.accent} />
    ) : (
      icon && <Ionicons name={icon} size={44} color={Theme.muted} />
    )}
    {title && (
      <Text className="text-white text-lg font-semibold text-center mt-4">
        {title}
      </Text>
    )}
    {message && <Text className="text-muted text-center mt-2">{message}</Text>}
    {actionLabel && onAction && (
      <Button
        title={actionLabel}
        onPress={onAction}
        variant="secondary"
        containerStyle={{ marginTop: 20, minWidth: 180 }}
      />
    )}
  </View>
);
