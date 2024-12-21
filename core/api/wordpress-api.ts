import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import axios from "axios";

const backendApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_URL,
});

backendApi.interceptors.request.use(async (config) => {
  const token = await SecureStorageAdapter.getItem("token");
  console.log("Token en interceptor:", token); // Debug
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { backendApi };
