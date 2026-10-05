import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Theme } from "@/presentation/theme/Colors";

interface Props {
  style?: StyleProp<ViewStyle>;
}

// Bloque de carga con un pulso de opacidad.
export const Skeleton = ({ style }: Props) => {
  const opacity = useSharedValue(0.9);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(withTiming(0.45, { duration: 800 }), -1, true);
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { backgroundColor: Theme.surfaceRaised, borderRadius: 12 },
        style,
        animatedStyle,
      ]}
    />
  );
};
