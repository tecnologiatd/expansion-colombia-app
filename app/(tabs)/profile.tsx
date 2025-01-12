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

const PurchasedEventCard = ({ event }) => (
    <TouchableOpacity
        className="bg-gray-800 rounded-lg p-4 mb-4 flex-row items-center"
        onPress={() => router.push("/event/order")}
    >
      <Image source={{ uri: event.image.src }} className="w-16 h-16 rounded-lg" />
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

const EditProfileModal = ({ visible, onClose, userData, onSave }) => {
  const [editedData, setEditedData] = useState(userData);

  const handleSave = () => {
    onSave(editedData);
    onClose();
  };

  return (
      <Modal
          animationType="slide"
          transparent={true}
          visible={visible}
          onRequestClose={onClose}
      >
        <View className="flex-1 justify-end">
          <View className="bg-gray-800 rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-bold">Edit Profile</Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-gray-400 mb-2">First Name</Text>
                <TextInput
                    className="bg-gray-700 p-4 rounded-lg text-white"
                    editable={false}
                    value={editedData.billing.first_name}
                    onChangeText={(text) =>
                        setEditedData({
                          ...editedData,
                          billing: { ...editedData.billing, first_name: text },
                        })
                    }
                    placeholderTextColor="#666"
                />
              </View>

              <View>
                <Text className="text-gray-400 mb-2">Last Name</Text>
                <TextInput
                    className="bg-gray-700 p-4 rounded-lg text-white"
                    value={editedData.billing.last_name}
                    onChangeText={(text) =>
                        setEditedData({
                          ...editedData,
                          billing: { ...editedData.billing, last_name: text },
                        })
                    }
                    placeholderTextColor="#666"
                />
              </View>

              <View>
                <Text className="text-gray-400 mb-2">Email</Text>
                <TextInput
                    className="bg-gray-700 p-4 rounded-lg text-white"
                    value={editedData.email}
                    onChangeText={(text) =>
                        setEditedData({ ...editedData, email: text })
                    }
                    keyboardType="email-address"
                    placeholderTextColor="#666"
                />
              </View>

              <View>
                <Text className="text-gray-400 mb-2">Phone</Text>
                <TextInput
                    className="bg-gray-700 p-4 rounded-lg text-white"
                    value={editedData.billing.phone}
                    onChangeText={(text) =>
                        setEditedData({
                          ...editedData,
                          billing: { ...editedData.billing, phone: text },
                        })
                    }
                    keyboardType="phone-pad"
                    placeholderTextColor="#666"
                />
              </View>

              <TouchableOpacity
                  className="bg-purple-500 p-4 rounded-lg mt-4"
                  onPress={handleSave}
              >
                <Text className="text-white text-center font-bold">Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
  );
};

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
                <Text className="text-gray-400">Orders</Text>
              </View>
            </View>

            {/* Purchased Events */}
            <View>
              <Text className="text-white text-xl font-bold mb-4">My Orders</Text>
              {profileQuery.data.orders.map((order) =>
                  order.line_items.map((item) => (
                      <PurchasedEventCard
                          key={`${order.id}-${item.id}`}
                          event={{
                            id: item.id,
                            name: item.name,
                            status: order.status,
                            image: item.image,
                          }}
                      />
                  ))
              )}
            </View>
            {/* Settings Section */}
            <View className="mt-8">
              <Text className="text-white text-xl font-bold mb-4">Settings</Text>
              <TouchableOpacity className="bg-gray-800 p-4 rounded-lg mb-4 flex-row justify-between items-center">
                <Text className="text-white font-medium">Notifications</Text>
                <Feather name="chevron-right" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity className="bg-gray-800 p-4 rounded-lg mb-4 flex-row justify-between items-center">
                <Text className="text-white font-medium">Payment Methods</Text>
                <Feather name="chevron-right" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity className="bg-gray-800 p-4 rounded-lg flex-row justify-between items-center">
                <Text className="text-red-500 font-medium">Log Out</Text>
                <Feather name="log-out" size={20} color="#EF4444" />
              </TouchableOpacity>
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