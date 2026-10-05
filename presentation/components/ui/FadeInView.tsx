import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface Props {
  // Posición en una lista: escalona la entrada de los primeros elementos.
  index?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const STAGGER_MS = 60;
const MAX_STAGGERED = 6;

// Entrada suave (fade + leve desplazamiento). Reanimated la omite cuando el
// sistema tiene activado "reducir movimiento".
export const FadeInView = ({ index = 0, style, children }: Props) => (
  <Animated.View
    style={style}
    entering={FadeInDown.duration(260)
      .delay(Math.min(index, MAX_STAGGERED) * STAGGER_MS)
      .withInitialValues({ transform: [{ translateY: 10 }] })}
  >
    {children}
  </Animated.View>
);
