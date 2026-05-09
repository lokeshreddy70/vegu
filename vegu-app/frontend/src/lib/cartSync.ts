import api from './api';
import { useAuthStore } from '@/store/auth.store';

// Retry an async operation up to `attempts` times with exponential back-off.
const withRetry = async (fn: () => Promise<unknown>, attempts = 3): Promise<void> => {
  for (let i = 0; i < attempts; i++) {
    try {
      await fn();
      return;
    } catch (err: unknown) {
      // 4xx errors are definitive (stock exceeded, product gone) — don't retry
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status && status >= 400 && status < 500) return;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, 300 * 2 ** i));
    }
  }
};

const isLoggedIn = () => useAuthStore.getState().isAuthenticated;

export const syncAddToCart = (productId: string, quantity: number): void => {
  if (!isLoggedIn()) return;
  void withRetry(() => api.post('/api/cart', { productId, quantity }));
};

export const syncUpdateCartItem = (productId: string, quantity: number): void => {
  if (!isLoggedIn()) return;
  if (quantity <= 0) {
    void withRetry(() => api.delete(`/api/cart/${productId}`));
  } else {
    void withRetry(() => api.patch(`/api/cart/${productId}`, { quantity }));
  }
};

export const syncRemoveFromCart = (productId: string): void => {
  if (!isLoggedIn()) return;
  void withRetry(() => api.delete(`/api/cart/${productId}`));
};

export const syncClearCart = (): void => {
  if (!isLoggedIn()) return;
  void withRetry(() => api.delete('/api/cart'));
};

// Push all local-store items into DB — called once after login
export const pushLocalCartToDB = async (
  items: { product: { id: string }; quantity: number }[]
): Promise<void> => {
  if (!isLoggedIn() || items.length === 0) return;
  await Promise.allSettled(
    items.map((i) =>
      withRetry(() => api.post('/api/cart', { productId: i.product.id, quantity: i.quantity }))
    )
  );
};
