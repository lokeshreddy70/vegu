'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Search } from 'lucide-react';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

const CATEGORY_META: Record<string, { subtitle: string; emoji: string; color: string }> = {
  'fruits':     { subtitle: 'Fresh & Organic',      emoji: '🍎', color: 'bg-red-50' },
  'vegetables': { subtitle: 'Farm Fresh Daily',     emoji: '🥦', color: 'bg-green-50' },
  'dairy':      { subtitle: 'Farm Fresh Dairy',     emoji: '🥛', color: 'bg-blue-50' },
  'eggs':       { subtitle: 'Farm Fresh Eggs',      emoji: '🥚', color: 'bg-yellow-50' },
  'pantry':     { subtitle: 'Everyday Essentials',  emoji: '🫙', color: 'bg-amber-50' },
  'beverages':  { subtitle: 'Healthy & Refreshing', emoji: '🧃', color: 'bg-cyan-50' },
  'personal':   { subtitle: 'Natural & Gentle',     emoji: '🧴', color: 'bg-purple-50' },
  'care':       { subtitle: 'Natural & Gentle',     emoji: '🧴', color: 'bg-purple-50' },
  'bakery':     { subtitle: 'Baked Fresh Daily',    emoji: '🍞', color: 'bg-orange-50' },
  'meat':       { subtitle: 'Quality Cuts',         emoji: '🥩', color: 'bg-red-50' },
  'seafood':    { subtitle: 'Ocean Fresh',          emoji: '🐟', color: 'bg-blue-50' },
  'snacks':     { subtitle: 'Tasty & Crunchy',      emoji: '🍿', color: 'bg-yellow-50' },
  'frozen':     { subtitle: 'Quick & Convenient',   emoji: '🧊', color: 'bg-sky-50' },
  'household':  { subtitle: 'Home Essentials',      emoji: '🏠', color: 'bg-gray-50' },
  'baby':       { subtitle: 'Safe & Gentle',        emoji: '🍼', color: 'bg-pink-50' },
};

function getMeta(slug: string, name: string) {
  const lower = (slug + name).toLowerCase();
  for (const [key, meta] of Object.entries(CATEGORY_META)) {
    if (lower.includes(key)) return meta;
  }
  return { subtitle: 'Explore Now', emoji: '🛒', color: 'bg-gray-50' };
}

export default function CategoriesPage() {
  const router = useRouter();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then(r => r.data.data),
  });

  return (
    <div className="bg-[#F7F9FA] min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button type="button" aria-label="Go back" onClick={() => router.back()} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <h1 className="text-gray-900 font-bold text-xl flex-1">All Categories</h1>
        </div>
        <div className="px-4 pb-3">
          <Link href="/search" className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-gray-400 text-sm">Search for products...</span>
          </Link>
        </div>
      </div>

      {/* Category list */}
      {isLoading ? (
        <div className="px-4 mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-2">
          {categories.map((cat) => {
            const meta = getMeta(cat.slug, cat.name);
            return (
              <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex items-center gap-4 hover:border-veg/30 active:scale-[0.99] transition-all">
                  <div className={`w-14 h-14 rounded-2xl ${meta.color} overflow-hidden shrink-0 flex items-center justify-center`}>
                    {cat.image ? (
                      <Image src={cat.image} alt={cat.name} width={56} height={56} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{meta.emoji}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-bold text-sm">{cat.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{cat.description || meta.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
