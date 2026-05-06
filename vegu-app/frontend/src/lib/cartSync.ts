import api from './api';
import { useAuthStore } from '@/store/auth.store';

// Silently sync a cart action to the backend DB.
// Called alongside every Zustand cart mutation when the user is logged in.
// Errors are intentionally swallowed — the local store is the optimistic source.

export const syncAddToCart = (productId: string, quantity: number) => {
  if (!useAuthStore.getState().isAuthenticated) return;
  api.post('/api/cart', { productId, quantity }).catch(() => {});
};

export const syncUpdateCartItem = (productId: string, quantity: number) => {
  if (!useAuthStore.getState().isAuthenticated) return;
  if (quantity <= 0) {
    api.delete(`/api/cart/${productId}`).catch(() => {});
  } else {
    api.patch(`/api/cart/${productId}`, { quantity }).catch(() => {});
  }
};

export const syncRemoveFromCart = (productId: string) => {
  if (!useAuthStore.getState().isAuthenticated) return;
  api.delete(`/api/cart/${productId}`).catch(() => {});
};

export const syncClearCart = () => {
  if (!useAuthStore.getState().isAuthenticated) return;
  api.delete('/api/cart').catch(() => {});
};

// Push all items from Zustand local cart into DB — called after login
export const pushLocalCartToDB = async (
  items: { product: { id: string }; quantity: number }[]
) => {
  if (!useAuthStore.getState().isAuthenticated || items.length === 0) return;
  await Promise.all(
    items.map((i) =>
      api.post('/api/cart', { productId: i.product.id, quantity: i.quantity }).catch(() => {})
    )
  );
};
