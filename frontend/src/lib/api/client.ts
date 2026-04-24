import axios, { AxiosError } from "axios";

// Resolve a URL da API sempre usando o hostname atual do browser + porta da API.
// Isso garante que mesmo que o bundle tenha sido compilado com "localhost",
// as chamadas vão para o servidor correto em produção.
function getApiUrl(): string {
  const baked = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  if (typeof window === "undefined") return baked; // SSR: mantém o baked
  try {
    const parsed = new URL(baked);
    const currentHost = window.location.hostname;
    // Se o hostname do bundle é diferente do hostname atual, corrige
    if (parsed.hostname !== currentHost) {
      parsed.hostname = currentHost;
      return parsed.origin; // ex: http://172.16.9.50:8080
    }
  } catch {}
  return baked;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Corrige o baseURL antes de cada request (client-side apenas)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.baseURL = getApiUrl();
  }
  return config;
});

// Request interceptor — attach access token from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — refresh token on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers!.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${getApiUrl()}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.accessToken;
        localStorage.setItem("accessToken", newToken);

        // Update auth store
        if (typeof window !== "undefined") {
          const { useAuthStore } = await import("@/lib/stores/authStore");
          useAuthStore.getState().setToken(newToken, data.user);
        }

        processQueue(null, newToken);
        originalRequest.headers!.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          const { useAuthStore } = await import("@/lib/stores/authStore");
          useAuthStore.getState().logout();
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
