import React from "react";
import {View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import {router} from "expo-router";
import {getCostumer} from "@/core/actions/get-costumer.action";
import {useCustomer} from "@/presentation/hooks/useCustomer";

const PurchasedEventCard = ({ event }) => (
  <TouchableOpacity className="bg-gray-800 rounded-lg p-4 mb-4 flex-row items-center" onPress={() => router.push("/event/order")}>
    <Image source={{ uri: event.image }} className="w-16 h-16 rounded-lg" />
    <View className="ml-4 flex-1">
      <Text className="text-white text-lg font-bold">{event.name}</Text>
      <Text className="text-gray-400">{event.date}</Text>
      <View className="flex-row items-center mt-2">
        <View
          className={`px-3 py-1 rounded-full ${
            event.status === "Confirmed"
              ? "bg-green-500/20"
              : event.status === "Pending"
                ? "bg-yellow-500/20"
                : "bg-purple-500/20"
          }`}
        >
          <Text
            className={`${
              event.status === "Confirmed"
                ? "text-green-500"
                : event.status === "Pending"
                  ? "text-yellow-500"
                  : "text-purple-500"
            } font-medium`}
          >
            {event.status}
          </Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const ProfileScreen = () => {
  // Mock data - replace with actual user data
 const {costumerQuery} =  useCustomer()
  if (costumerQuery.isLoading) {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size={30} />
        </View>
    );
  }

  const product = costumerQuery.data;

  const user = {
    name: "Usuario 1",
    email: "usuario.perez@example.com",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    purchasedEvents: [
      {
        id: 1,
        name: "Convensión 2025",
        date: "Nov 4-6, 2024",
        status: "Confirmed",
        image: "http://192.168.1.9:8000/wp-content/uploads/2024/12/convencion_ticketx1-300x300.jpg",
      },
      {
        id: 2,
        name: "Feria de Cali",
        date: "Dec 15, 2024",
        status: "Pending",
        image: "http://192.168.1.9:8000/wp-content/uploads/2024/12/Festival-Petronio-Alvarez-2024-300x300.jpg",
      },
    ],
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <ScrollView>
        <View className="p-4">
          {/* Profile Header */}
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row items-center">
              <Image
                source={{ uri: user.avatar }}
                className="w-20 h-20 rounded-full"
              />
              <View className="ml-4">
                <Text className="text-white text-xl font-bold">
                  {user.name}
                </Text>
                <Text className="text-gray-400">{user.email}</Text>
              </View>
            </View>
            <TouchableOpacity className="bg-gray-800 p-2 rounded-lg">
              <Feather name="edit-2" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View className="flex-row justify-between mb-8">
            <View className="bg-gray-800 p-4 rounded-lg flex-1 mr-2 items-center">
              <Text className="text-purple-500 text-xl font-bold">2</Text>
              <Text className="text-gray-400">Eventos</Text>
            </View>
            {/* <View className="bg-gray-800 p-4 rounded-lg flex-1 ml-2 items-center">
              <Text className="text-purple-500 text-xl font-bold">$90</Text>
              <Text className="text-gray-400">Spent</Text>
            </View> */}
          </View>

          {/* Purchased Events */}
          <View>
            <Text className="text-white text-xl font-bold mb-4">
              Mis eventos
            </Text>
            {user.purchasedEvents.map((event) => (
              <PurchasedEventCard key={event.id} event={event} />
            ))}
          </View>

          {/* Settings Section */}
          <View className="mt-8">
            <Text className="text-white text-xl font-bold mb-4">
              Configuración
            </Text>
            <TouchableOpacity className="bg-gray-800 p-4 rounded-lg mb-4 flex-row justify-between items-center">
              <Text className="text-white font-medium">Notificaciones</Text>
              <Feather name="chevron-right" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-800 p-4 rounded-lg mb-4 flex-row justify-between items-center">
              <Text className="text-white font-medium">Metodos de pago</Text>
              <Feather name="chevron-right" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-800 p-4 rounded-lg flex-row justify-between items-center">
              <Text className="text-red-500 font-medium">Cerrar sesión</Text>
              <Feather name="log-out" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
