import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Button,
} from "react-native";
import * as Updates from "expo-updates";
import { Feather } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";

export const CheckForUpdateButton = () => {
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckForUpdate = async () => {
    if (!Updates.isEnabled) {
      Alert.alert(
        "Actualizaciones",
        "No disponible en este entorno (modo desarrollo).",
      );
      return;
    }

    setIsChecking(true);
    try {
      const { isAvailable } = await Updates.checkForUpdateAsync();

      if (!isAvailable) {
        Alert.alert("Actualizaciones", "Ya tienes la última versión.");
        return;
      }

      await Updates.fetchUpdateAsync();
      Alert.alert(
        "Actualización disponible",
        "Se descargó una nueva versión. ¿Reiniciar la app ahora para aplicarla?",
        [
          { text: "Después", style: "cancel" },
          { text: "Reiniciar", onPress: () => Updates.reloadAsync() },
        ],
      );
    } catch {
      Alert.alert(
        "Actualizaciones",
        "No se pudo verificar actualizaciones. Intenta más tarde.",
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Button
      title="Try!"
      onPress={() => {
        Sentry.captureException(new Error("First error"));
      }}
    />
  );
};
