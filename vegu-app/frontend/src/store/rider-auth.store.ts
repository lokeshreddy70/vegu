import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from './auth.store';

const INACTIVITY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface RiderAuthStore {
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

const BLANK: Pick<RiderAuthStore, 'user' | 'accessToken' | 'refreshToken' | 'isAuthenticated' | 'lastActivity'> = {
  user: null, accessToken: null, refreshToken: null, isAuthenticated: false, lastActivity: null,
};

export const useRiderAuthStore = create<RiderAuthStore>()(
  persist(
    (set) => ({
      ...BLANK,

      setAuth: (user, accessToken, refreshToken) => {
        if (user.role !== 'DELIVERY') return;
        try { localStorage.setItem('rider-accessToken', accessToken); } catch {}
        try { localStorage.setItem('rider-refreshToken', refreshToken); } catch {}
        set({ user, accessToken, refreshToken, isAuthenticated: true, lastActivity: Date.now() });
      },

      setTokens: (accessToken, refreshToken) => {
        try { localStorage.setItem('rider-accessToken', accessToken); } catch {}
        try { localStorage.setItem('rider-refreshToken', refreshToken); } catch {}
        set({ accessToken, refreshToken, lastActivity: Date.now() });
      },

      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),

      logout: () => {
        try { localStorage.removeItem('rider-accessToken'); } catch {}
        try { localStorage.removeItem('rider-refreshToken'); } catch {}
        set(BLANK);
      },

      touchActivity: () => set({ lastActivity: Date.now() }),
    }),
    {
      name: 'vegu-rider-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.user && state.user.role !== 'DELIVERY') {
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
