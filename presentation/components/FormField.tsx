import { View, Text, TextInputProps, TextInput } from "react-native";
import React from "react";

interface Props extends TextInputProps {
  title: string;
  value: string;
}

const FormField = ({ title, value, onChangeText, ...props }: Props) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <View className="space-y-2 mt-7">
      <Text className="text-base text-gray-100 font-medium">{title}</Text>
      <View className="border-2 border-black-200 w-full h-16 px-4 bg-black rounded-2xl focus:border-yellow-500 active:border-yellow-500">
        <TextInput
          className="flex-1 text-white text-base font-semibold"
          value={value}
          secureTextEntry={showPassword}
          placeholderTextColor="#7b7b8b"
          onChangeText={onChangeText}
          {...props}
        ></TextInput>
      </View>
    </View>
  );
};

export default FormField;
