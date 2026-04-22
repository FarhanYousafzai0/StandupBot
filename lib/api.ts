import axios, { isAxiosError, type InternalAxiosRequestConfig } from "axios";
import { getPublicApiUrl } from "./env";
import { useAuthStore } from "./auth-store";

const base = () => {
  const url = getPublicApiUrl();
  return url || undefined;
};

/**
 * API client. Attach Bearer from auth store; on 401 (except auth routes) clears session and redirects to /login.
 */
export const api = axios.create({
  baseURL: base(),
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const b = getPublicApiUrl();
  if (b) {
    config.baseURL = b;
  }
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }
    if (error.config.skipAuthRedirect) {
      return Promise.reject(error);
    }
    useAuthStore.getState().clearAuth();
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (!path.startsWith("/login") && !path.startsWith("/register")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export function isApiError(
  e: unknown
): e is { response?: { data?: { error?: { code?: string; message?: string } } } } {
  return isAxiosError(e);
}

export function getErrorMessage(e: unknown, fallback = "Something went wrong") {
  if (isApiError(e) && e.response?.data?.error?.message) {
    return String(e.response.data.error.message);
  }
  if (e instanceof Error) {
    return e.message;
  }
  return fallback;
}
