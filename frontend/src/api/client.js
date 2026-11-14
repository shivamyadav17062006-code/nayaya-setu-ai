import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 3e4,
  headers: {
    "Content-Type": "application/json"
  }
});
apiClient.interceptors.request.use((config) => {
  const lang = localStorage.getItem("nyayasaathi_lang") || "en";
  config.headers["Accept-Language"] = lang;
  const sessionId = sessionStorage.getItem("nyayasaathi_session_id");
  if (sessionId) {
    config.headers["X-Session-ID"] = sessionId;
  }
  return config;
});
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const data = error.response.data;
      const message = data?.message || "An error occurred. Please try again.";
      return Promise.reject(new Error(message));
    } else if (error.request) {
      return Promise.reject(new Error("Network error. Please check your connection."));
    }
    return Promise.reject(error);
  }
);
export default apiClient;
