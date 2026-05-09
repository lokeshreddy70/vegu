'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, Search, Plus, Minus, ChevronRight, MapPin, Zap, Star, Tag } from 'lucide-react';
import LiveBazaarSection from './LiveBazaarSection';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { syncAddToCart, syncUpdateCartItem } from '@/lib/cartSync';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Category { id: string; name: string; slug: string; image?: string; }
interface Product {
  id: string; name: string; slug: string; price: number; comparePrice?: number | null;
  images: string[]; unit: string; stock: number; discount: number;
  rating: number; reviewCount: number; isAvailable: boolean;
  category?: { name: string };
}

const CATEGORY_ICONS: Record<string, string> = {
  'fruits': '🍎', 'vegetables': '🥦', 'dairy': '🥛', 'eggs': '🥚',
  'pantry': '🫙', 'beverages': '🧃', 'personal': '🧴', 'care': '🧴',
  'bakery': '🍞', 'meat': '🥩', 'seafood': '🐟', 'snacks': '🍿',
  'frozen': '🧊', 'household': '🏠', 'baby': '🍼',
};

function getCategoryIcon(slug: string, name: string): string {
  const lower = (slug + name).toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '🛒';
}

function HomeProductCard({ product }: { product: Product }) {
  const { addItem, getItem, updateQuantity } = useCartStore();
  const cartItem = getItem(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.isAvailable || product.stock === 0) return;
    addItem({ id: product.id, name: product.name, slug: product.slug, price: product.price, images: product.images, unit: product.unit, stock: product.stock });
    syncAddToCart(product.id, 1);
    toast.success(`${product.name} added!`, { style: { background: '#fff', color: '#1A1A1A', border: '1px solid #E8E8E8' } });
  };

  const handleInc = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cartItem) return;
    const next = Math.min(cartItem.quantity + 1, product.stock);
    updateQuantity(product.id, next);
    syncUpdateCartItem(product.id, next);
  };

  const handleDec = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cartItem) return;
    updateQuantity(product.id, cartItem.quantity - 1);
    syncUpdateCartItem(product.id, cartItem.quantity - 1);
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
          )}
          {product.discount > 0 && (
            <span className="absolute top-2 left-2 bg-veg text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
              {product.discount}% OFF
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5">
          <p className="text-gray-800 text-xs font-semibold line-clamp-2 leading-snug mb-0.5">{product.name}</p>
          <p className="text-gray-400 text-[10px]">{product.unit}</p>
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-gray-900 text-sm font-bold">{formatPrice(product.price)}</span>
              {product.comparePrice && (
                <span className="text-gray-400 text-xs line-through ml-1">{formatPrice(product.comparePrice)}</span>
              )}
            </div>
            {cartItem ? (
              <div
                className="flex items-center border-2 border-veg rounded-lg overflow-hidden"
                onClick={e => e.preventDefault()}
              >
                <button type="button" aria-label="Decrease" onClick={handleDec} className="w-7 h-7 flex items-center justify-center text-veg font-bold text-sm">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-veg font-bold text-xs w-5 text-center">{cartItem.quantity}</span>
                <button
                  type="button"
                  aria-label="Increase"
                  onClick={handleInc}
                  disabled={cartItem.quantity >= product.stock}
                  className="w-7 h-7 flex items-center justify-center bg-veg text-white font-bold disabled:opacity-40"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                aria-label="Add to cart"
                onClick={handleAdd}
                disabled={!product.isAvailable || product.stock === 0}
                className="flex items-center gap-0.5 bg-veg text-white text-xs font-bold px-2.5 py-1.5 rounded-lg disabled:opacity-40"
              >
                <Plus className="w-3 h-3" strokeWidth={3} /> ADD
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomeClient({ categories, featured, trending }: {
  categories: Category[]; featured: Product[]; trending: Product[];
}) {
  const { user, isAuthenticated } = useAuthStore();
  const [activeHero, setActiveHero] = useState(0);

  const allProducts = [...featured, ...trending.filter(p => !featured.find(f => f.id === p.id))];

  const banners = [
    { gradient: 'from-[#2ECC71] to-[#27AE60]', emoji: '🥦', tag: 'FRESH DEALS', title: 'Up to 30% OFF on vegetables', sub: 'Farm fresh, delivered in 10 mins', href: '/products' },
    { gradient: 'from-[#F97316] to-[#EA580C]', emoji: '🍎', tag: 'FRUITS FEST', title: 'Seasonal fruits, best prices', sub: 'Handpicked freshness every morning', href: '/products?category=fruits' },
    { gradient: 'from-[#8B5CF6] to-[#7C3AED]', emoji: '🥛', tag: 'DAIRY DEALS', title: 'Daily fresh dairy products', sub: 'From farm to your doorstep', href: '/products?category=dairy' },
  ];

  return (
    <div className="bg-[#F7F9FA] min-h-screen">

      {/* ── Sticky Green Header ── */}
      <div className="bg-veg sticky top-0 z-40">
        <div className="px-4 pt-12 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-black text-2xl italic tracking-wide">vegú</span>
            <Link href="/notifications" aria-label="Notifications" className="relative w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Bell className="w-4.5 h-4.5 text-white" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full" />
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-white/80 shrink-0" />
            <span className="text-white text-xs font-medium">
              {isAuthenticated && user?.name ? `Hello, ${user.name.split(' ')[0]}! ` : ''}
              <span className="font-bold">Delivering in 10 mins</span>
            </span>
            <Zap className="w-3 h-3 text-white/80" />
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <Link href="/search" className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-gray-400 text-sm">Search for groceries, vegetables…</span>
          </Link>
        </div>
      </div>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-gray-100 py-4">
          <div className="flex gap-4 px-4 overflow-x-auto pb-0.5 scrollbar-hide">
            {categories.slice(0, 10).map((cat) => (
              <Link key={cat.id} href={`/products?category=${cat.slug}`} className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#F0FBF4] border-2 border-transparent flex items-center justify-center overflow-hidden">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} width={56} height={56} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-2xl">{getCategoryIcon(cat.slug, cat.name)}</span>
                  )}
                </div>
                <span className="text-gray-700 text-[10px] font-semibold text-center leading-tight max-w-[60px]">{cat.name}</span>
              </Link>
            ))}
            <Link href="/categories" className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-transparent flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-gray-500 text-[10px] font-semibold">See all</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Hero Banner ── */}
      <div className="px-4 pt-4 pb-2">
        <div className={`relative rounded-3xl overflow-hidden h-[140px] bg-gradient-to-r ${banners[activeHero].gradient}`}>
          {/* Decorative emoji */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-30 select-none">{banners[activeHero].emoji}</div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl select-none">{banners[activeHero].emoji}</div>

          {/* Content */}
          <div className="absolute inset-0 p-5 flex flex-col justify-center">
            <span className="text-white/80 text-[9px] font-bold tracking-widest uppercase mb-1">{banners[activeHero].tag}</span>
            <h2 className="text-white font-extrabold text-lg leading-tight mb-2 max-w-[200px]">{banners[activeHero].title}</h2>
            <Link
              href={banners[activeHero].href}
              className="inline-flex items-center gap-1.5 bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-xl w-fit shadow-sm"
            >
              Shop Now →
            </Link>
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Banner ${i + 1}`}
                onClick={() => setActiveHero(i)}
                className={`rounded-full transition-all duration-300 ${i === activeHero ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Live Bazaar ── */}
      <LiveBazaarSection />

      {/* ── Top Picks ── */}
      {allProducts.length > 0 && (
        <div className="pt-4 pb-2">
          <div className="flex items-center justify-between px-4 mb-3">
            <div>
              <h2 className="text-gray-900 font-bold text-base">Top Picks for You</h2>
              <p className="text-gray-400 text-xs">Handpicked fresh products</p>
            </div>
            <Link href="/products" className="text-veg text-xs font-bold flex items-center gap-0.5">
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 px-4">
            {allProducts.slice(0, 6).map((product) => (
              <HomeProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* ── Promo strip ── */}
      <div className="mx-4 my-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3">
          {[
            { icon: '⚡', label: '10 min', sub: 'delivery' },
            { icon: '🌿', label: 'Fresh', sub: 'produce' },
            { icon: '🎁', label: 'Free', sub: 'above ₹500' },
            { icon: '⭐', label: '4.8★', sub: '10K reviews' },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center flex-1">
              <span className="text-lg leading-none mb-0.5">{f.icon}</span>
              <span className="text-gray-800 text-[10px] font-bold">{f.label}</span>
              <span className="text-gray-400 text-[9px]">{f.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Deals Banner ── */}
      <div className="mx-4 mb-4">
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200 p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Tag className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-orange-500 text-xs font-bold uppercase tracking-wide">Today's Deals</span>
            </div>
            <p className="text-gray-900 font-bold text-sm">Save up to 30% on select items</p>
            <Link href="/products?featured=true" className="inline-flex items-center gap-1 text-orange-500 text-xs font-bold mt-1.5">
              Explore Deals <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <span className="text-5xl opacity-80">🛒</span>
        </div>
      </div>

      {/* ── Trending ── */}
      {trending.length > 0 && (
        <div className="pb-4">
          <div className="flex items-center justify-between px-4 mb-3">
            <div>
              <h2 className="text-gray-900 font-bold text-base">Trending Now 🔥</h2>
              <p className="text-gray-400 text-xs">Most ordered this week</p>
            </div>
            <Link href="/products" className="text-veg text-xs font-bold flex items-center gap-0.5">
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 px-4">
            {trending.slice(0, 4).map((product) => (
              <HomeProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* ── Rating strip ── */}
      <div className="mx-4 mb-8 bg-white rounded-2xl border border-gray-100 shadow-sm py-3 flex items-center justify-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
        </div>
        <span className="text-gray-500 text-xs font-medium">4.8 · 10K+ happy customers</span>
      </div>

    </div>
  );
}
