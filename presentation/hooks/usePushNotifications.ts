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
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7B3DFF',
    });
  }

  if (!Device.isDevice) {
    throw new Error('Debe usar un dispositivo físico para las notificaciones push');
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

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
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
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    registerForPushNotificationsAsync()
        .then(setExpoPushToken)
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
            router.push(data.route as string);
          }
        },
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    expoPushToken,
  };
};