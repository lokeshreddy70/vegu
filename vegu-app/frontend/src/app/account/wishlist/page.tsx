'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';

type WishlistItem = {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number | null;
    images: string[];
    unit: string;
    stock: number;
    isAvailable: boolean;
  };
};

export default function WishlistPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login');
  }, [hasHydrated, isAuthenticated, router]);

  const { data: items = [], isLoading } = useQuery<WishlistItem[]>({
    queryKey: ['wishlist'],
    queryFn: () => api.get('/api/wishlist').then((r) => r.data.data ?? []),
    enabled: hasHydrated && isAuthenticated,
  });

  const removeItem = useMutation({
    mutationFn: (productId: string) => api.delete(`/api/wishlist/${productId}`),
    onSuccess: () => {
      toast.success('Removed from wishlist');
      qc.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: () => toast.error('Could not remove wishlist item'),
  });

  const moveToCart = (item: WishlistItem) => {
    const p = item.product;
    if (!p.isAvailable || p.stock <= 0) {
      toast.error('This product is currently unavailable');
      return;
    }
    addItem({ id: p.id, name: p.name, slug: p.slug, price: p.price, images: p.images, unit: p.unit, stock: p.stock }, 1);
    toast.success('Added to cart');
  };

  if (!hasHydrated || !isAuthenticated) return null;

  return (
    <div className="container-page py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Wishlist</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-800 font-semibold">Your wishlist is empty</p>
          <p className="text-gray-500 text-sm mt-1">Save products to buy later</p>
          <Link href="/products" className="inline-flex mt-5 bg-veg text-white rounded-xl px-4 py-2 text-sm font-semibold">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const p = item.product;
            return (
              <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3">
                <Link href={`/products/${p.slug}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {p.images?.[0] ? (
                    <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${p.slug}`} className="font-semibold text-gray-900 line-clamp-1">{p.name}</Link>
                  <p className="text-xs text-gray-400">{p.unit}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-veg font-bold">₹{p.price}</span>
                    {p.comparePrice ? <span className="text-xs line-through text-gray-400">₹{p.comparePrice}</span> : null}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => moveToCart(item)}
                    className="px-3 py-2 text-xs rounded-xl bg-veg text-white font-semibold flex items-center gap-1"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Add
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem.mutate(p.id)}
                    className="px-3 py-2 text-xs rounded-xl border border-red-100 text-red-500 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
