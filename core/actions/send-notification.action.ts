import { backendApi } from "@/core/api/wordpress-api";

export interface SendNotificationParams {
  title: string;
  body: string;
  route?: string;
}

export interface SendNotificationResponse {
  done: boolean;
  tickets: any[];
}

export const sendNotificationAction = async (
  params: SendNotificationParams,
): Promise<SendNotificationResponse> => {
  try {
    const { data } = await backendApi.post<SendNotificationResponse>(
      "/notifications/send-all",
      params,
    );
    return data;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw new Error("Failed to send notification");
  }
};
