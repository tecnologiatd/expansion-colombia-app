import { View, Text } from "react-native";
import React from "react";
import "./global.css";

const RootLayout = () => {
  return (
    <View>
      <Text className="text-cyan-500 text-3xl text-center">
        If You see this text center and with cyan color its working
        NativeWindCSS
      </Text>
    </View>
  );
};

export default RootLayout;
