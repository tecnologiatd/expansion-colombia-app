import React from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNotificationStore } from '@/core/stores/notification.store';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export const NotificationModal: React.FC<Props> = ({ visible, onClose }) => {
    const { notifications, markAsRead, clearAll } = useNotificationStore();

    const handleNotificationPress = (notification) => {
        markAsRead(notification.id);
        if (notification.route) {
            router.push(notification.route);
        }
        onClose();
    };

    const renderNotification = ({ item: notification }) => (
        <TouchableOpacity
            className={`p-4 border-b border-gray-700 ${
                notification.read ? 'opacity-50' : ''
            }`}
            onPress={() => handleNotificationPress(notification)}
        >
            <Text className="text-white text-lg font-bold">{notification.title}</Text>
            <Text className="text-gray-300 mt-1">{notification.body}</Text>
            <Text className="text-gray-400 text-sm mt-2">
                {new Date(notification.date).toLocaleDateString()}
            </Text>
            {!notification.read && (
                <View className="absolute top-4 right-4 w-2 h-2 rounded-full bg-purple-500" />
            )}
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-gray-900/95">
                <View className="flex-row items-center justify-between p-4 border-b border-gray-800">
                    <Text className="text-white text-xl font-bold">Notificaciones</Text>
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            className="p-2 mr-2"
                            onPress={clearAll}
                        >
                            <Ionicons name="trash-outline" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="p-2"
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {notifications.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <Ionicons name="notifications-off-outline" size={48} color="#666" />
                        <Text className="text-gray-400 mt-4 text-lg">
                            No hay notificaciones
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        renderItem={renderNotification}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ flexGrow: 1 }}
                    />
                )}
            </View>
        </Modal>
    );
};