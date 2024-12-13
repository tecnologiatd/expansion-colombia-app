import axios from "axios";

export const backendApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_URL,
});
