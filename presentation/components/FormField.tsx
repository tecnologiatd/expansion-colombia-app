import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props extends TextInputProps {
  title: string;
  value: string;
  errorMessage?: string;
}

const FormField = ({
  title,
  value,
  onChangeText,
  secureTextEntry,
  errorMessage,
  ...props
}: Props) => {
  const [showPassword, setShowPassword] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="space-y-2 mt-7">
      <Text className="text-white font-medium mb-3">{title}</Text>
      <View className="relative flex-row items-centerx">
        <TextInput
          className={`flex-1 w-full p-4 text-base font-semibold text-white border-2 rounded-2xl ${
            errorMessage
              ? "border-red-500"
              : isFocused
                ? "border-purple-500"
                : "border-gray-700"
          }`}
          value={value}
          secureTextEntry={secureTextEntry ? showPassword : false}
          placeholderTextColor="#7b7b8b"
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            className="absolute right-4 w-8 h-full justify-center items-center"
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={24}
              color="#7b7b8b"
            />
          </TouchableOpacity>
        )}
      </View>
      {errorMessage && (
        <Text className="text-red-500 text-sm mt-1">{errorMessage}</Text>
      )}
    </View>
  );
};

export default FormField;
