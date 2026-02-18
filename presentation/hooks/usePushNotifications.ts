// presentation/hooks/usePushNotifications.ts
import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { DeviceService } from '@/core/auth/actions/register-device.action';
import { useNotificationStore } from '@/core/stores/notification.store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7B3DFF',
    });
  }

  if (!Device.isDevice) {
    // Emulators/simulators cannot receive Expo push tokens.
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    throw new Error('Fallo al obtener el token push para la notificación');
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    throw new Error('ID del proyecto no encontrado');
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await DeviceService.savePushToken(token);
  await DeviceService.registerDevice();

  return token;
}

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    registerForPushNotificationsAsync()
        .then((token) => {
          if (token) {
            setExpoPushToken(token);
          }
        })
        .catch(console.error);

    notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          const { title, body, data } = notification.request.content;
          addNotification({
            title: title || '',
            body: body || '',
            route: data.route as string | undefined,
          });
        },
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const { data } = response.notification.request.content;
          if (data.route) {
            router.push(data.route as any);
          }
        },
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [addNotification]);

  return {
    expoPushToken,
  };
};