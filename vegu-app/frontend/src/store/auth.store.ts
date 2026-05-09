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

const INACTIVITY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  lastActivity: number | null;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  logout: () => void;
  touchActivity: () => void;
}

const safeStorage = {
  set: (key: string, value: string) => {
    try { if (typeof window !== 'undefined') localStorage.setItem(key, value); } catch {}
  },
  remove: (key: string) => {
    try { if (typeof window !== 'undefined') localStorage.removeItem(key); } catch {}
  },
};

const BLANK: Pick<AuthStore, 'user' | 'accessToken' | 'refreshToken' | 'isAuthenticated' | 'lastActivity'> = {
  user: null, accessToken: null, refreshToken: null, isAuthenticated: false, lastActivity: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...BLANK,

      setAuth: (user, accessToken, refreshToken) => {
        if (user.role === 'DELIVERY') return;
        safeStorage.set('accessToken', accessToken);
        safeStorage.set('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true, lastActivity: Date.now() });
      },

      setTokens: (accessToken, refreshToken) => {
        safeStorage.set('accessToken', accessToken);
        safeStorage.set('refreshToken', refreshToken);
        set({ accessToken, refreshToken, lastActivity: Date.now() });
      },

      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),

      logout: () => {
        safeStorage.remove('accessToken');
        safeStorage.remove('refreshToken');
        set(BLANK);
      },

      touchActivity: () => set({ lastActivity: Date.now() }),
    }),
    {
      name: 'vegu-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // On every app start: if a DELIVERY user slipped into this store (stale data),
      // clear them — riders exclusively use vegu-rider-auth
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.user?.role === 'DELIVERY') {
          Object.assign(state, BLANK);
          return;
        }
        // Auto-logout after 30 days of inactivity
        if (state.lastActivity && Date.now() - state.lastActivity > INACTIVITY_MS) {
          Object.assign(state, BLANK);
        }
      },
    }
  )
);
