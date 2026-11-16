import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/features/auth/store/authStore";

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:8001/api";

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true, // send/receive the HttpOnly refresh cookie
  headers: { "Content-Type": "application/json" },
});

/**
 * Exchanges the HttpOnly refresh cookie for a new access token.
 * Concurrent callers share one in-flight request so a burst of 401s
 * triggers a single refresh.
 */
let refreshPromise: Promise<string> | null = null;
export const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access: string }>(`${API_URL}/auth/refresh/`, {}, { withCredentials: true })
      .then(({ data }) => {
        useAuthStore.getState().set_access_token(data.access);
        return data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AUTH_ENDPOINTS = ["auth/login/", "auth/refresh/", "auth/logout/"];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthEndpoint = AUTH_ENDPOINTS.some((p) => original?.url?.includes(p));

    if (error.response?.status === 402) {
      useAuthStore.getState().mark_subscription_inactive();
    }

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        // Session is over: clear local state; route guards redirect to /login.
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
