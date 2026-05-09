'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import api from '@/lib/api';
import { useCartItemCount } from '@/store/cart.store';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

const CATEGORY_META: Record<string, { subtitle: string; emoji: string }> = {
  'fruits':     { subtitle: 'Fresh & Organic',        emoji: '🍎' },
  'vegetables': { subtitle: 'Fresh & Organic',        emoji: '🥦' },
  'dairy':      { subtitle: 'Farm Fresh Daily',        emoji: '🥛' },
  'eggs':       { subtitle: 'Farm Fresh Daily',        emoji: '🥚' },
  'pantry':     { subtitle: 'Essentials for You',      emoji: '🫙' },
  'beverages':  { subtitle: 'Healthy & Refreshing',    emoji: '🧃' },
  'personal':   { subtitle: 'Natural & Gentle',        emoji: '🧴' },
  'care':       { subtitle: 'Natural & Gentle',        emoji: '🧴' },
  'bakery':     { subtitle: 'Baked Fresh Daily',       emoji: '🍞' },
  'meat':       { subtitle: 'Quality Cuts',            emoji: '🥩' },
  'seafood':    { subtitle: 'Ocean Fresh',             emoji: '🐟' },
  'snacks':     { subtitle: 'Tasty & Crunchy',         emoji: '🍿' },
  'frozen':     { subtitle: 'Quick & Convenient',      emoji: '🧊' },
  'household':  { subtitle: 'Home Essentials',         emoji: '🏠' },
  'baby':       { subtitle: 'Safe & Gentle',           emoji: '🍼' },
};

function getMeta(slug: string, name: string) {
  const lower = (slug + name).toLowerCase();
  for (const [key, meta] of Object.entries(CATEGORY_META)) {
    if (lower.includes(key)) return meta;
  }
  return { subtitle: 'Explore Now', emoji: '🛒' };
}

export default function CategoriesPage() {
  const router = useRouter();
  const cartCount = useCartItemCount();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then(r => r.data.data),
  });

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Go back" onClick={() => router.back()} className="w-9 h-9 bg-app-card border border-app-border rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-zinc-300" />
          </button>
          <h1 className="text-white font-bold text-xl">Categories</h1>
        </div>
        <Link href="/cart" className="relative w-9 h-9 bg-app-card border border-app-border rounded-xl flex items-center justify-center">
          <ShoppingCart className="w-4 h-4 text-zinc-300" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-black text-[10px] font-bold rounded-full flex items-center justify-center">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Category list */}
      {isLoading ? (
        <div className="px-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-app-card border border-app-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-3 pb-24">
          {categories.map((cat) => {
            const meta = getMeta(cat.slug, cat.name);
            return (
              <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                <div className="bg-app-card border border-app-border rounded-2xl p-4 flex items-center gap-4 hover:border-zinc-600 transition-colors active:scale-[0.99]">
                  {/* Icon / Image */}
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {cat.image ? (
                      <Image src={cat.image} alt={cat.name} width={56} height={56} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{meta.emoji}</span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{cat.name}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{cat.description || meta.subtitle}</p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
