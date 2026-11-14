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
  const token = localStorage.getItem("nyayasaathi_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        // Clear expired or invalid token
        localStorage.removeItem("nyayasaathi_token");
        return Promise.reject(new Error(data?.error || data?.message || "Your session has expired. Please log in again."));
      }

      if (status === 403) {
        return Promise.reject(new Error("Access denied: You do not have permission to access this resource."));
      }

      const message = data?.error || data?.message || "An error occurred while processing your request. Please try again.";
      return Promise.reject(new Error(message));
    } else if (error.request) {
      return Promise.reject(new Error("Network error. Please check your connection."));
    }
    return Promise.reject(error);
  }
);
export default apiClient;
