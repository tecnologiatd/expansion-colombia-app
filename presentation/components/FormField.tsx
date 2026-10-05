import React, { useState, forwardRef } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "@/presentation/theme/Colors";

interface Props extends TextInputProps {
  title: string;
  value: string;
  errorMessage?: string;
}

const FormField = forwardRef<TextInput, Props>(
  (
    {
      title,
      value,
      onChangeText,
      secureTextEntry,
      errorMessage,
      ...props
    }: Props,
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(secureTextEntry);
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View className="mt-5">
        <Text className="text-gray-300 text-sm font-medium mb-2">{title}</Text>
        <View className="relative flex-row items-center">
          <TextInput
            ref={ref}
            className={`flex-1 w-full px-4 py-3.5 text-base text-white bg-surface-raised border rounded-xl ${secureTextEntry ? "pr-14" : ""} ${
              errorMessage
                ? "border-red-500"
                : isFocused
                  ? "border-brand"
                  : "border-line"
            }`}
            value={value}
            secureTextEntry={secureTextEntry ? showPassword : false}
            placeholderTextColor={Theme.placeholder}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            // Propiedades para mejorar la usabilidad del teclado
            autoCorrect={false}
            spellCheck={false}
            {...props}
          />
          {secureTextEntry && (
            <TouchableOpacity
              className="absolute right-1 w-12 h-full justify-center items-center"
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? "Mostrar contraseña" : "Ocultar contraseña"
              }
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={Theme.muted}
              />
            </TouchableOpacity>
          )}
        </View>
        {errorMessage && (
          <Text className="text-red-500 text-sm mt-1">{errorMessage}</Text>
        )}
      </View>
    );
  },
);

export default FormField;
