import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from './auth.store';

interface RiderAuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  logout: () => void;
}

const BLANK: Pick<RiderAuthStore, 'user' | 'accessToken' | 'refreshToken' | 'isAuthenticated'> = {
  user: null, accessToken: null, refreshToken: null, isAuthenticated: false,
};

export const useRiderAuthStore = create<RiderAuthStore>()(
  persist(
    (set) => ({
      ...BLANK,

      setAuth: (user, accessToken, refreshToken) => {
        // Only DELIVERY users belong here
        if (user.role !== 'DELIVERY') return;
        try { localStorage.setItem('rider-accessToken', accessToken); } catch {}
        try { localStorage.setItem('rider-refreshToken', refreshToken); } catch {}
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setTokens: (accessToken, refreshToken) => {
        try { localStorage.setItem('rider-accessToken', accessToken); } catch {}
        try { localStorage.setItem('rider-refreshToken', refreshToken); } catch {}
        set({ accessToken, refreshToken });
      },

      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),

      logout: () => {
        try { localStorage.removeItem('rider-accessToken'); } catch {}
        try { localStorage.removeItem('rider-refreshToken'); } catch {}
        set(BLANK);
      },
    }),
    {
      name: 'vegu-rider-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // On every app start: if a non-DELIVERY user slipped in, clear them
      onRehydrateStorage: () => (state) => {
        if (state?.user && state.user.role !== 'DELIVERY') {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
        }
      },
    }
  )
);
