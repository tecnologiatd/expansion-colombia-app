import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import axios, { AxiosError } from "axios";

const backendApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

backendApi.interceptors.request.use(async (config) => {
  const token = await SecureStorageAdapter.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

backendApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status, config } = error.response;
      const message =
        (error.response.data as { message?: string })?.message ??
        error.message;
      // 401 is expected when not logged in; avoid noisy full-object logs
      if (status === 401) {
        if (__DEV__) {
          console.warn(`API 401 ${config?.url ?? "request"}: ${message}`);
        }
      } else {
        console.error(`API Error ${status} ${config?.url ?? "request"}:`, message);
      }
    }
    return Promise.reject(error);
  }
);

export { backendApi };
