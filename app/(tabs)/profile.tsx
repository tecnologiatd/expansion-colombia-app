import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileScreen from "@/presentation/components/ProfileScreen";

export default function Profile() {
  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <ProfileScreen />
    </SafeAreaView>
  );
}
