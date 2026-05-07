'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

function SessionValidator() {
  const pathname = usePathname();
  const { isAuthenticated, user, setAuth, logout } = useAuthStore();
  const validated = useRef(false);

  useEffect(() => {
    // Skip validation on rider portal — it manages its own session via vegu-rider-auth
    if (pathname?.startsWith('/rider')) return;
    if (!isAuthenticated || validated.current) return;
    validated.current = true;

    api.get('/api/auth/me')
      .then((res) => {
        const freshUser = res.data.data;
        // If the stored user is somehow a DELIVERY role, the store's setAuth guard
        // will refuse to store it (and the onRehydrateStorage already cleared it).
        // Just re-sync non-rider users.
        if (freshUser.role !== 'DELIVERY') {
          const store = useAuthStore.getState();
          if (store.accessToken && store.refreshToken) {
            setAuth(freshUser, store.accessToken, store.refreshToken);
          }
        } else {
          // A DELIVERY user ended up in the wrong store — clear it
          logout();
        }
      })
      .catch(() => {
        // Token invalid or expired beyond refresh
        logout();
      });
  }, [isAuthenticated, user, pathname, setAuth, logout]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: (failureCount, error: unknown) => {
              // Don't retry 401/403/404 — those are definitive responses
              const status = (error as { response?: { status?: number } })?.response?.status;
              if (status === 401 || status === 403 || status === 404) return false;
              return failureCount < 2;
            },
          },
          mutations: { retry: 0 },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <SessionValidator />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '16px', fontFamily: 'inherit', fontSize: '14px', fontWeight: '500' },
          success: { style: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' } },
          error: { style: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' } },
        }}
      />
    </QueryClientProvider>
  );
}
