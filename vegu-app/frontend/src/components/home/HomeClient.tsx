'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, Search, Heart, Plus, Star, Leaf, Minus, SlidersHorizontal, ChevronRight } from 'lucide-react';
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
    toast.success(`${product.name} added!`, { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #272727' } });
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
      <div className="bg-app-card border border-app-border rounded-2xl overflow-hidden">
        {/* Image */}
        <div className="relative aspect-square bg-zinc-900">
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
          {/* Discount badge */}
          {product.discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-lg">{product.discount}% OFF</span>
          )}
          {/* Heart — always visible */}
          <button
            type="button"
            aria-label="Add to wishlist"
            onClick={e => e.preventDefault()}
            className="absolute top-2 right-2 w-7 h-7 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <Heart className="w-3.5 h-3.5 text-white" />
          </button>
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-xs font-bold text-zinc-300 bg-zinc-800 px-2 py-1 rounded-lg">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-white text-sm font-semibold line-clamp-2 leading-snug mb-0.5">{product.name}</p>
          <p className="text-zinc-500 text-xs mb-2">{product.unit}</p>
          <div className="flex items-center justify-between gap-1">
            <div>
              <span className="text-white text-sm font-bold">{formatPrice(product.price)}</span>
              {product.comparePrice && (
                <span className="text-zinc-600 text-xs line-through ml-1">{formatPrice(product.comparePrice)}</span>
              )}
            </div>
            {cartItem ? (
              <div
                className="flex items-center gap-1 bg-gold/10 border border-gold/30 rounded-xl px-1.5 py-1"
                onClick={e => e.preventDefault()}
              >
                <button type="button" aria-label="Decrease" onClick={handleDec} className="w-5 h-5 flex items-center justify-center text-gold">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-gold text-xs font-bold w-4 text-center">{cartItem.quantity}</span>
                <button type="button" aria-label="Increase" onClick={handleInc} disabled={cartItem.quantity >= product.stock} className="w-5 h-5 flex items-center justify-center text-gold disabled:opacity-40">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                aria-label="Add to cart"
                onClick={handleAdd}
                disabled={!product.isAvailable || product.stock === 0}
                className="w-7 h-7 bg-gold rounded-xl flex items-center justify-center disabled:opacity-40 shrink-0"
              >
                <Plus className="w-4 h-4 text-black" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

const heroSlides = [
  {
    bg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    tag: 'PURE. FRESH. NATURAL.',
    title: 'Elevate your lifestyle with real goodness.',
    sub: 'Handpicked freshness for a healthier you.',
    href: '/products',
  },
  {
    bg: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80',
    tag: 'DAILY ESSENTIALS',
    title: 'Farm-fresh dairy, delivered daily.',
    sub: 'From farm to your doorstep in 30 minutes.',
    href: '/products?category=dairy',
  },
  {
    bg: 'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=800&q=80',
    tag: 'SEASONAL PICKS',
    title: 'Seasonal fruits, freshly picked.',
    sub: "Nature's sweetness at your fingertips.",
    href: '/products?category=fruits',
  },
];

export default function HomeClient({ categories, featured, trending }: {
  categories: Category[]; featured: Product[]; trending: Product[];
}) {
  const { user, isAuthenticated } = useAuthStore();
  const [activeHero, setActiveHero] = useState(0);

  const allProducts = [...featured, ...trending.filter(p => !featured.find(f => f.id === p.id))];

  return (
    <div className="bg-app-bg min-h-screen">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gold rounded-xl flex items-center justify-center shadow-lg shadow-gold/30">
            <Leaf className="w-4 h-4 text-black" />
          </div>
          <span className="text-white font-bold text-xl tracking-wide italic">vegú</span>
        </div>
        <Link href="/notifications" aria-label="Notifications" className="relative w-9 h-9 bg-app-card border border-app-border rounded-xl flex items-center justify-center">
          <Bell className="w-4 h-4 text-zinc-400" />
          {/* notification dot */}
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-gold rounded-full" />
        </Link>
      </div>

      {/* ── Greeting ── */}
      {isAuthenticated && user?.name && (
        <div className="px-4 mb-3">
          <p className="text-zinc-400 text-sm">Good day, <span className="text-white font-semibold">{user.name.split(' ')[0]}</span> 👋</p>
        </div>
      )}

      {/* ── Search bar ── */}
      <div className="px-4 mb-5">
        <Link href="/search" className="flex items-center gap-3 bg-app-card border border-app-border rounded-2xl px-4 py-3.5">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <span className="text-zinc-500 text-sm flex-1">Search for products...</span>
          <div className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
          </div>
        </Link>
      </div>

      {/* ── Hero Carousel ── */}
      <div className="px-4 mb-6">
        <div className="relative rounded-3xl overflow-hidden h-[220px]">
          <Image
            src={heroSlides[activeHero].bg}
            alt="hero"
            fill
            className="object-cover transition-opacity duration-500"
            priority
            sizes="100vw"
          />
          {/* Dark overlay — stronger on left */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 p-5 flex flex-col justify-end pb-6">
            <span className="inline-block text-gold/90 text-[9px] font-bold tracking-[0.2em] mb-2 bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-full w-fit">
              {heroSlides[activeHero].tag}
            </span>
            <h2 className="text-white font-extrabold text-[20px] leading-[1.2] mb-1.5 max-w-[240px]">
              {heroSlides[activeHero].title}
            </h2>
            <p className="text-zinc-300 text-xs mb-4 max-w-[200px] leading-relaxed">
              {heroSlides[activeHero].sub}
            </p>
            <Link
              href={heroSlides[activeHero].href}
              className="inline-flex items-center gap-2 bg-gold text-black text-xs font-bold px-5 py-2.5 rounded-2xl w-fit shadow-lg shadow-gold/30"
            >
              Shop Now <span className="text-sm">→</span>
            </Link>
          </div>

          {/* Dot indicators */}
          <div className="absolute bottom-4 right-4 flex gap-1.5">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setActiveHero(i)}
                className={`rounded-full transition-all duration-300 ${i === activeHero ? 'w-5 h-1.5 bg-gold' : 'w-1.5 h-1.5 bg-white/30'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-white font-bold text-[15px]">Shop by Category</h2>
            <Link href="/categories" className="text-gold text-xs font-semibold flex items-center gap-0.5">
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 px-4 overflow-x-auto pb-1 scrollbar-hide">
            {categories.slice(0, 8).map((cat) => (
              <Link key={cat.id} href={`/products?category=${cat.slug}`} className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-[60px] h-[60px] bg-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-700">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} width={60} height={60} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{getCategoryIcon(cat.slug, cat.name)}</span>
                  )}
                </div>
                <span className="text-zinc-300 text-[9px] font-semibold text-center leading-tight max-w-[60px]">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Top Picks ── */}
      {allProducts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-white font-bold text-[15px]">Top Picks for You</h2>
            <Link href="/products" className="text-gold text-xs font-semibold flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 px-4">
            {allProducts.slice(0, 6).map((product) => (
              <HomeProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* ── Promo Banner ── */}
      <div className="mx-4 mb-6">
        <div className="relative rounded-3xl overflow-hidden bg-[#1A2A1A] border border-[#2A3A2A] h-[120px]">
          {/* Background subtle food image */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-40">
            <Image
              src="https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&q=60"
              alt="promo"
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A2A1A] via-[#1A2A1A]/90 to-transparent" />

          {/* Text */}
          <div className="absolute inset-0 p-4 flex flex-col justify-center">
            <p className="text-zinc-400 text-xs font-semibold">Save up to</p>
            <p className="text-white text-[28px] font-extrabold leading-none">30% OFF</p>
            <p className="text-zinc-400 text-xs mb-3">on selected items</p>
            <Link href="/products?featured=true" className="inline-flex items-center gap-1.5 bg-gold text-black text-xs font-bold px-4 py-2 rounded-xl w-fit">
              Explore Deals <span>→</span>
            </Link>
          </div>

          {/* Badge circle */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 w-16 h-16 bg-gold/20 border-2 border-gold/50 rounded-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gold font-extrabold text-base leading-none">30%</p>
              <p className="text-gold font-extrabold text-[10px] leading-none">OFF</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Trending ── */}
      {trending.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-white font-bold text-[15px]">Trending Now 🔥</h2>
            <Link href="/products?trending=true" className="text-gold text-xs font-semibold flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 px-4">
            {trending.slice(0, 4).map((product) => (
              <HomeProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* ── Feature tiles ── */}
      <div className="mx-4 mb-6 grid grid-cols-2 gap-3">
        {[
          { emoji: '🌱', title: 'Premium Quality', desc: 'Handpicked & fresh products' },
          { emoji: '🔒', title: 'Secure & Safe', desc: '100% secure payments & easy returns' },
          { emoji: '🚚', title: 'Fast Delivery', desc: 'Quick & reliable at your doorstep' },
          { emoji: '🎁', title: 'Best Offers', desc: 'Exclusive deals & exciting offers' },
        ].map((f) => (
          <div key={f.title} className="bg-app-card border border-app-border rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-9 h-9 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-lg">{f.emoji}</span>
            </div>
            <div>
              <p className="text-gold text-xs font-bold leading-tight">{f.title}</p>
              <p className="text-zinc-500 text-[10px] mt-0.5 leading-tight">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Rating strip ── */}
      <div className="mx-4 mb-8 flex items-center gap-2 justify-center bg-app-card border border-app-border rounded-2xl py-3">
        <div className="flex">
          {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 text-gold fill-gold" />)}
        </div>
        <span className="text-zinc-400 text-xs font-medium">4.8 · 10K+ happy customers</span>
      </div>
    </div>
  );
}
