import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'VENDOR' | 'DELIVERY' | 'ADMIN';
  phone?: string;
  avatar?: string;
  loyaltyPoints?: number;
  referralCode?: string;
  vendor?: {
    id: string;
    storeName: string;
    storeSlug: string;
    status: string;
    isActive: boolean;
  } | null;
}

interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  logout: () => void;
}

const safeStorage = {
  set: (key: string, value: string) => {
    try { if (typeof window !== 'undefined') localStorage.setItem(key, value); } catch {}
  },
  remove: (key: string) => {
    try { if (typeof window !== 'undefined') localStorage.removeItem(key); } catch {}
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        safeStorage.set('accessToken', accessToken);
        safeStorage.set('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setTokens: (accessToken, refreshToken) => {
        safeStorage.set('accessToken', accessToken);
        safeStorage.set('refreshToken', refreshToken);
        set({ accessToken, refreshToken });
      },

      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),

      logout: () => {
        safeStorage.remove('accessToken');
        safeStorage.remove('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'vegu-auth',
      // Persist only what's needed — don't store sensitive tokens in 2 places
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
