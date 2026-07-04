'use client';

import { Heart } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export default function WishlistButton({ productId, className = '' }: { productId: string; className?: string }) {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const { data } = useQuery({
    queryKey: ['wishlist-status', productId, isAuthenticated],
    queryFn: () => api.get(`/api/wishlist/${productId}/check`).then(r => r.data.data),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (data?.isWishlisted) {
        await api.delete(`/api/wishlist/${productId}`);
        return false;
      }
      await api.post('/api/wishlist', { productId });
      return true;
    },
    onSuccess: (isAdded) => {
      qc.invalidateQueries({ queryKey: ['wishlist-status', productId, isAuthenticated] });
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(isAdded ? 'Added to wishlist' : 'Removed from wishlist');
    },
    onError: () => {
      toast.error(isAuthenticated ? 'Could not update wishlist right now' : 'Please login to use wishlist');
    },
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to use wishlist');
      return;
    }
    if (!mutation.isPending) mutation.mutate();
  };

  const active = !!data?.isWishlisted;

  return (
    <button
      type="button"
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      onClick={handleClick}
      className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/90 text-gray-700 shadow-sm backdrop-blur ${className}`}
    >
      <Heart className={`h-4 w-4 ${active ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
    </button>
  );
}
