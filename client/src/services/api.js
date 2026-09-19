import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log the actual request data being sent
  if (config.url?.includes("registration/team")) {
    console.group("📡 AXIOS REQUEST INTERCEPTOR - registration/team");
    console.log("URL:", config.url);
    console.log("Method:", config.method);
    console.log("Data being sent:", config.data);
    if (config.data) {
      const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      console.log("Parsed data:", data);
      console.log("collegeName in data:", data?.collegeName);
    }
    console.groupEnd();
  }
  
  return config;
});
