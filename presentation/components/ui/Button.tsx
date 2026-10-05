import React from "react";
import { ActivityIndicator, StyleProp, Text, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "./PressableScale";
import { Theme } from "@/presentation/theme/Colors";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

const containerClasses: Record<Variant, string> = {
  primary: "bg-brand",
  secondary: "bg-surface border border-line",
  ghost: "",
  danger: "bg-red-500/15 border border-red-500/40",
};

const textClasses: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-white",
  ghost: "text-purple-400",
  danger: "text-red-400",
};

export const Button = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  className = "",
  containerStyle,
}: Props) => {
  const inactive = disabled || loading;
  const tint = variant === "ghost" ? "#C084FC" : Theme.text;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityState={{ disabled: inactive, busy: loading }}
      containerStyle={containerStyle}
      className={`min-h-[52px] px-5 rounded-xl flex-row items-center justify-center ${containerClasses[variant]} ${inactive ? "opacity-50" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tint} />
      ) : (
        icon && <Ionicons name={icon} size={20} color={tint} />
      )}
      <Text
        className={`font-semibold text-base text-center ${textClasses[variant]} ${loading || icon ? "ml-2" : ""}`}
        maxFontSizeMultiplier={1.3}
      >
        {title}
      </Text>
    </PressableScale>
  );
};
