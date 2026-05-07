import axios from 'axios';
import { useRiderAuthStore } from '@/store/rider-auth.store';

const baseURL =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    : '';

const riderApi = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  refreshQueue = [];
}

riderApi.interceptors.request.use((config) => {
  const token = useRiderAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

riderApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return riderApi(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = useRiderAuthStore.getState().refreshToken;
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${baseURL}/api/auth/refresh`, { refreshToken });
      const { accessToken: newAccess, refreshToken: newRefresh } = data.data;

      useRiderAuthStore.getState().setTokens(newAccess, newRefresh);

      processQueue(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return riderApi(original);
    } catch (err) {
      processQueue(err, null);
      useRiderAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/rider/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default riderApi;
