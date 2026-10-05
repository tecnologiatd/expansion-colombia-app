import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

export const useScreenActive = () => {
  const [focused, setFocused] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);
  return focused && (appState === null || appState === "active");
};
