'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import SplashScreen from './SplashScreen';
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
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        // Only force logout on definite auth failures.
        if (status === 401 || status === 403) {
          logout();
        }
      });
  }, [isAuthenticated, user, pathname, setAuth, logout]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60_000,
            gcTime: 15 * 60_000,
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;
    const root = document.documentElement;
    const body = document.body;
    const threshold = 120;

    const setKeyboardOffset = (offset: number) => {
      root.style.setProperty('--vegu-keyboard-offset', `${Math.max(0, offset)}px`);
    };

    const isEditableField = (target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement => {
      return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    };

    const normalizeTextField = (field: HTMLInputElement | HTMLTextAreaElement) => {
      const tag = field.tagName.toLowerCase();
      const type = tag === 'textarea' ? 'textarea' : (field.getAttribute('type') || 'text').toLowerCase();
      const tokens = [
        field.name,
        field.id,
        field.placeholder,
        field.autocomplete,
        field.getAttribute('aria-label') || '',
        field.getAttribute('title') || '',
      ].join(' ').toLowerCase();

      const isPassword = type === 'password';
      const isEmail = type === 'email' || tokens.includes('email');
      const isPhone = type === 'tel' || /\b(phone|mobile|whatsapp|contact)\b/.test(tokens);
      const isUrl = type === 'url' || /\b(url|website|link|image)\b/.test(tokens);
      const isSearch = type === 'search' || tokens.includes('search');
      const isPostalCode = /\b(pincode|pin code|postcode|postal|zip)\b/.test(tokens);
      const isOtp = /\b(otp|verification code|one time)\b/.test(tokens);
      const isNumeric = type === 'number' || /\b(price|amount|stock|quantity|qty|discount|sort|threshold|limit|number)\b/.test(tokens);
      const isCodeLike = /\b(coupon|promo|sku|vehicle no|vehicle number|code)\b/.test(tokens);
      const isSlug = tokens.includes('slug');
      const isNameLike = /\b(name|city|state|address|street|landmark)\b/.test(tokens);
      const isMessageLike = /\b(message|note|comment|reply|question|description|policy|support)\b/.test(tokens);

      if (!field.getAttribute('enterkeyhint')) {
        if (isSearch) field.setAttribute('enterkeyhint', 'search');
        else if (isMessageLike && tag === 'textarea') field.setAttribute('enterkeyhint', 'send');
        else field.setAttribute('enterkeyhint', 'next');
      }

      if (!field.getAttribute('inputmode')) {
        if (isEmail) field.setAttribute('inputmode', 'email');
        else if (isPhone) field.setAttribute('inputmode', 'tel');
        else if (isUrl) field.setAttribute('inputmode', 'url');
        else if (isPostalCode || isOtp) field.setAttribute('inputmode', 'numeric');
        else if (isNumeric) field.setAttribute('inputmode', type === 'number' ? 'decimal' : 'numeric');
      }

      if (!field.getAttribute('autocomplete')) {
        if (isEmail) field.setAttribute('autocomplete', 'email');
        else if (isPhone) field.setAttribute('autocomplete', 'tel');
        else if (isUrl) field.setAttribute('autocomplete', 'url');
        else if (isPostalCode) field.setAttribute('autocomplete', 'postal-code');
        else if (isNameLike && tokens.includes('name')) field.setAttribute('autocomplete', 'name');
        else if (!isPassword && !isSearch) field.setAttribute('autocomplete', 'on');
      }

      if (!field.getAttribute('autocapitalize')) {
        if (isPassword || isEmail || isPhone || isUrl || isSearch || isPostalCode || isOtp || isNumeric || isSlug) {
          field.setAttribute('autocapitalize', 'none');
        } else if (isCodeLike) {
          field.setAttribute('autocapitalize', 'characters');
        } else if (isNameLike) {
          field.setAttribute('autocapitalize', 'words');
        } else {
          field.setAttribute('autocapitalize', 'sentences');
        }
      }

      if (!field.getAttribute('autocorrect')) {
        field.setAttribute('autocorrect', isPassword || isEmail || isPhone || isUrl || isSearch || isPostalCode || isOtp || isNumeric || isCodeLike || isSlug ? 'off' : 'on');
      }

      if (!field.hasAttribute('spellcheck')) {
        field.spellcheck = !(isPassword || isEmail || isPhone || isUrl || isSearch || isPostalCode || isOtp || isNumeric || isCodeLike || isSlug);
      }
    };

    const revealField = (target: HTMLInputElement | HTMLTextAreaElement) => {
      window.setTimeout(() => {
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
      }, 90);
    };

    const normalizeAllInputs = () => {
      document.querySelectorAll('input, textarea').forEach((node) => {
        if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
          normalizeTextField(node);
        }
      });
    };

    const syncKeyboardState = () => {
      const keyboardOffset = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
      const keyboardOpen = keyboardOffset > threshold;
      root.classList.toggle('keyboard-open', keyboardOpen);
      body.classList.toggle('keyboard-open', keyboardOpen);
      setKeyboardOffset(keyboardOpen ? keyboardOffset : 0);

      const active = document.activeElement;
      if (keyboardOpen && isEditableField(active)) {
        revealField(active);
      }
    };

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (!isEditableField(target)) return;
      normalizeTextField(target);
      revealField(target);
    };

    normalizeAllInputs();
    vv?.addEventListener('resize', syncKeyboardState);
    window.addEventListener('focusin', onFocusIn);
    window.addEventListener('orientationchange', syncKeyboardState);
    syncKeyboardState();

    return () => {
      vv?.removeEventListener('resize', syncKeyboardState);
      window.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('orientationchange', syncKeyboardState);
      root.classList.remove('keyboard-open');
      body.classList.remove('keyboard-open');
      setKeyboardOffset(0);
    };
  }, [pathname]);

  return (
    <QueryClientProvider client={client}>
      <SplashScreen />
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
