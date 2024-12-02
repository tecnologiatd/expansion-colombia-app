import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import React from "react";
import ThemedTextInput from "../theme/components/ThemedTextInput";
import { ThemedText } from "../theme/components/ThemedText";
import { Ionicons } from "@expo/vector-icons"; // Asegúrate de instalar @expo/vector-icons

interface Props extends TextInputProps {
  title: string;
  value: string;
}

const FormField = ({
  title,
  value,
  onChangeText,
  secureTextEntry,
  ...props
}: Props) => {
  const [showPassword, setShowPassword] = React.useState(secureTextEntry);

  return (
    <View className="space-y-2 mt-7">
      <ThemedText className="text-base font-medium mb-3">{title}</ThemedText>
      <View className="border-black-200 h-16 relative">
        <TextInput
          className="flex-1 w-full p-4 text-base font-semibold dark:border-white text-black dark:text-white focus:border-yellow-500 active:border-yellow-500 border-2 rounded-2xl"
          value={value}
          secureTextEntry={secureTextEntry ? showPassword : false}
          placeholderTextColor="#7b7b8b"
          onChangeText={onChangeText}
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
    </View>
  );
};

export default FormField;
