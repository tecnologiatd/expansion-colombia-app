import React, {useEffect, useState} from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import {useProfile} from "@/presentation/hooks/useProfile";
import {LogoutButton} from "@/presentation/auth/components/LogoutIconButton";
import EditProfileModal from "@/presentation/components/EditProfileModal";

const PurchasedEventCard = ({ event }) => (
    <TouchableOpacity
        className="bg-gray-800 rounded-lg p-4 mb-4 flex-row items-center"
        onPress={() => router.push("/order/" + event.id)}
    >
      <Image source={{ uri: event.image?.src }} className="w-16 h-16 rounded-lg" />
      <View className="ml-4 flex-1">
        <Text className="text-white text-lg font-bold">{event.name}</Text>
        <Text className="text-gray-400">Order #{event.id}</Text>
        <View className="flex-row items-center mt-2">
          <View
              className={`px-3 py-1 rounded-full ${
                  event.status === "completed"
                      ? "bg-green-500/20"
                      : event.status === "processing"
                          ? "bg-yellow-500/20"
                          : "bg-purple-500/20"
              }`}
          >
            <Text
                className={`${
                    event.status === "completed"
                        ? "text-green-500"
                        : event.status === "processing"
                            ? "text-yellow-500"
                            : "text-purple-500"
                } font-medium capitalize`}
            >
              {event.status}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
);


const ProfileScreen = () => {
  const { profileQuery } = useProfile();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (profileQuery.data) {
      setUserData(profileQuery.data.customer);
    }
  }, [profileQuery.data]);

  if (profileQuery.isLoading) {
    return (
        <View className="justify-center items-center flex-1">
          <ActivityIndicator color="purple" size={40} />
        </View>
    );
  }

  if (!userData) {
    return null; // Add a fallback or loading indicator if needed
  }

  const handleSaveProfile = (editedData) => {
    setUserData(editedData);
    Alert.alert("Success", "Profile updated successfully!");
  };

  return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <ScrollView>
          <View className="p-4">
            {/* Profile Header */}
            <View className="flex-row items-center justify-between mb-8">
              <View className="flex-row items-center">
                <Image
                    source={{ uri: userData.avatar_url }}
                    className="w-20 h-20 rounded-full"
                />
                <View className="ml-4">
                  <Text className="text-white text-xl font-bold">
                    {userData.billing.first_name} {userData.billing.last_name}
                  </Text>
                  <Text className="text-gray-400">{userData.email}</Text>
                </View>
              </View>
              <TouchableOpacity
                  className="bg-gray-800 p-2 rounded-lg"
                  onPress={() => setIsEditModalVisible(true)}
              >
                <Feather name="edit-2" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Quick Stats */}
            <View className="flex-row justify-between mb-8">
              <View className="bg-gray-800 p-4 rounded-lg flex-1 mr-2 items-center">
                <Text className="text-purple-500 text-xl font-bold">
                  {profileQuery.data.orders.length}
                </Text>
                <Text className="text-gray-400">Ordenes</Text>
              </View>
            </View>

            {/* Purchased Events */}
            <View>
              <Text className="text-white text-xl font-bold mb-4">Mis Eventos</Text>
              {profileQuery.data?.orders.map((order) =>
                      <PurchasedEventCard
                          key={`${order.id}`}
                          event={{
                            id: order.id,
                            name: order.line_items[0]?.name,
                            status: order.status,
                            image: order.line_items[0]?.image ?? null,
                          }}
                      />
              )}
            </View>
            {/* Settings Section */}
            <View className="mt-8">
              <Text className="text-white text-xl font-bold mb-4">Ajustes</Text>
              <TouchableOpacity className="bg-gray-800 p-4 rounded-lg mb-4 flex-row justify-between items-center hidden">
                <Text className="text-white font-medium">Notificaciones</Text>
                <Feather name="chevron-right" size={20} color="white" />
              </TouchableOpacity>
              <LogoutButton/>
            </View>

          </View>
        </ScrollView>

        <EditProfileModal
            visible={isEditModalVisible}
            onClose={() => setIsEditModalVisible(false)}
            userData={userData}
            onSave={handleSaveProfile}
        />
      </SafeAreaView>
  );
};


export default ProfileScreen;