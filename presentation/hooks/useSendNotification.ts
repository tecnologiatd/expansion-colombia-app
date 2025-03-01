import { useMutation } from "@tanstack/react-query";
import {
  sendNotificationAction,
  SendNotificationParams,
} from "@/core/actions/send-notification.action";
import { useNotificationStore } from "@/core/stores/notification.store";

export const useSendNotification = () => {
  const { addNotification } = useNotificationStore();

  const sendNotificationMutation = useMutation({
    mutationFn: sendNotificationAction,
    onSuccess: (_, variables) => {
      // Añadir la notificación a la tienda local también para feedback inmediato
      addNotification({
        title: variables.title,
        body: variables.body,
        route: variables.route,
      });
    },
  });

  return {
    sendNotificationMutation,
  };
};
