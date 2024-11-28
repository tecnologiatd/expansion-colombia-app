import {
  View,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import React from "react";

interface Props extends TouchableOpacityProps {
  title: string;
  className?: string;
  onPress: () => void;
}

const CustomButton = ({ title, className, ...props }: Props) => {
  return (
    <TouchableOpacity
      className={`bg-cafetero rounded-xl min-h-16 justify-center items-center ${className}`}
      {...props}
    >
      <Text className="font-bold text-lg">{title}</Text>
    </TouchableOpacity>
  );
};

export default CustomButton;
