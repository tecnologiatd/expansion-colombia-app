import React from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface Props extends PressableProps {
  className?: string;
  // Layout del contenedor animado (márgenes, flex). El aspecto va en className.
  containerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// Botón táctil con una reducción de escala breve al presionar.
export const PressableScale = ({
  containerStyle,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...props
}: Props) => {
  const pressed = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * 0.12,
    transform: [{ scale: reduceMotion ? 1 : 1 - pressed.value * 0.03 }],
  }));

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPressIn={(event) => {
          pressed.value = withTiming(1, { duration: 90 });
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          pressed.value = withTiming(0, { duration: 160 });
          onPressOut?.(event);
        }}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};
