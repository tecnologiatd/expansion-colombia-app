import type { ImageSourcePropType } from "react-native";

// Woo puede devolver src="". El recurso local evita una URI vacía sin red.
export const imageSource = (uri?: string | null): ImageSourcePropType =>
  typeof uri === "string" && uri.trim()
    ? { uri: uri.trim() }
    : require("../assets/images/icon.png");
