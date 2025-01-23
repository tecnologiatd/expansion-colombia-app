import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationStore, Notification } from '../interfaces/notification.interface';

export const useNotificationStore = create<NotificationStore>()(
    persist(
        (set) => ({
            notifications: [],

            addNotification: (notification) => set((state) => ({
                notifications: [
                    {
                        ...notification,
                        id: Math.random().toString(),
                        date: new Date(),
                        read: false,
                    },
                    ...state.notifications,
                ].slice(0, 50), // Mantener solo las últimas 50 notificaciones
            })),

            markAsRead: (id) => set((state) => ({
                notifications: state.notifications.map((notification) =>
                    notification.id === id ? { ...notification, read: true } : notification
                ),
            })),

            clearAll: () => set({ notifications: [] }),
        }),
        {
            name: 'notification-storage',
            storage: createJSONStorage(() => AsyncStorage),
        },
    ),
);