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
  updateUser: (user: Partial<AuthUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        // Keep localStorage in sync for the axios interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'vegu-auth',
      // Re-sync localStorage whenever the persisted store rehydrates
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && typeof window !== 'undefined') {
          localStorage.setItem('accessToken', state.accessToken);
        }
        if (state?.refreshToken && typeof window !== 'undefined') {
          localStorage.setItem('refreshToken', state.refreshToken);
        }
      },
    }
  )
);
