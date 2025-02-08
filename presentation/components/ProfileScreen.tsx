import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useProfile } from "@/presentation/hooks/useProfile";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import EditProfileModal from "@/presentation/components/EditProfileModal";
import { LogoutButton } from "@/presentation/auth/components/LogoutIconButton";
import PurchasedEventCard from "@/presentation/components/PurchasedEventCard";
import { AdminAccessButton } from "@/presentation/components/AdminAccessButton";

const ProfileScreen = () => {
  const { profileQuery } = useProfile();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const handleRefresh = async () => {
    await profileQuery.refetch();
  };

  if (profileQuery.isLoading) {
    return (
      <View className="justify-center items-center flex-1">
        <ActivityIndicator size="large" color="#7B3DFF" />
      </View>
    );
  }

  const userData = profileQuery.data?.customer;

  if (!userData) {
    return (
      <View className="justify-center items-center flex-1 p-4">
        <Text className="text-white text-lg text-center mb-4">
          No se pudo cargar la información del perfil
        </Text>
        <TouchableOpacity
          className="bg-purple-500 px-6 py-3 rounded-lg"
          onPress={handleRefresh}
        >
          <Text className="text-white font-bold">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSaveProfile = () => {
    profileQuery.refetch();
    setIsEditModalVisible(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-900"
      refreshControl={
        <RefreshControl
          refreshing={profileQuery.isFetching}
          onRefresh={handleRefresh}
          tintColor="#7B3DFF"
        />
      }
    >
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
                {userData.billing?.first_name} {userData.billing?.last_name}
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
        <AdminAccessButton />

        {/* Quick Stats */}
        <View className="mt-4 flex-row justify-between mb-8">
          <View className="bg-gray-800 p-4 rounded-lg flex-1 mr-2 items-center">
            <Text className="text-purple-500 text-xl font-bold">
              {profileQuery.data?.orders?.length || 0}
            </Text>
            <Text className="text-gray-400">Ordenes</Text>
          </View>
        </View>

        {/* Purchased Events */}
        <View>
          <Text className="text-white text-xl font-bold mb-4">Mis Eventos</Text>
          {!profileQuery.data?.orders?.length ? (
            <View className="bg-gray-800 p-6 rounded-lg items-center">
              <Feather name="shopping-bag" size={48} color="#666" />
              <Text className="text-gray-400 mt-4 text-center">
                No has comprado ningún evento todavía
              </Text>
              <TouchableOpacity
                className="mt-4 bg-purple-500 px-6 py-3 rounded-lg"
                onPress={() => router.push("/(tabs)/home")}
              >
                <Text className="text-white font-bold">Explorar Eventos</Text>
              </TouchableOpacity>
            </View>
          ) : (
            profileQuery.data.orders.map((order) => (
              <PurchasedEventCard
                key={`${order.id}`}
                event={{
                  id: order.id,
                  name: order.line_items[0]?.name,
                  status: order.status,
                  image: order.line_items[0]?.image,
                }}
                onPress={() => router.push(`/order/${order.id}`)}
              />
            ))
          )}
        </View>

        {/* Settings Section */}
        <View className="mt-8">
          <Text className="text-white text-xl font-bold mb-4">Ajustes</Text>
          <LogoutButton />
        </View>
      </View>

      {userData && (
        <EditProfileModal
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          userData={userData}
          onSave={handleSaveProfile}
        />
      )}
    </ScrollView>
  );
};

export default ProfileScreen;
