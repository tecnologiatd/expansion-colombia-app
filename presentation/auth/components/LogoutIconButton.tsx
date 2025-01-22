import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export const LogoutButton = () => {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro que deseas cerrar sesión?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Cerrar Sesión',
            style: 'destructive',
            onPress: async () => {
              await logout();
              router.replace('/auth/login');
            },
          },
        ]
    );
  };

  return (
      <TouchableOpacity
          className="bg-gray-800 p-4 rounded-lg flex-row justify-between items-center"
          onPress={handleLogout}
      >
        <Text className="text-red-500 font-medium">Cerrar Sesión</Text>
        <Feather name="log-out" size={20} color="#EF4444" />
      </TouchableOpacity>
  );
};