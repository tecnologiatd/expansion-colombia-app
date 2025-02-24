import { View, ViewProps } from "react-native";

export type ThemedViewProps = ViewProps & {
  darkMode?: boolean; // Opción para forzar un modo oscuro específico
};

export function ThemedView({
  style,
  darkMode = true, // Por defecto siempre oscuro
  ...otherProps
}: ThemedViewProps) {
  // Siempre usamos fondo oscuro
  const backgroundColor = darkMode ? "#111111" : "#1F1F1F";

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
