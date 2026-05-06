import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const baseURL =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    : '';

const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // Always read from Zustand store so we get the latest refreshed token
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        // Use a plain axios call (not `api`) to avoid interceptor loop
        const { data } = await axios.post(`${baseURL}/api/auth/refresh`, { refreshToken });
        const { accessToken: newAccess, refreshToken: newRefresh } = data.data;

        // Update both Zustand store and localStorage atomically
        useAuthStore.getState().setTokens(newAccess, newRefresh);

        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
