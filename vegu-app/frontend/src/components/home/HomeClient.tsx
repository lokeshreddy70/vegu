'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, Search, Heart, Plus, Star, Leaf, Minus } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
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

function ProductCard({ product }: { product: Product }) {
  const { addItem, getItem, updateQuantity } = useCartStore();
  const cartItem = getItem(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.isAvailable || product.stock === 0) return;
    addItem({ id: product.id, name: product.name, slug: product.slug, price: product.price, images: product.images, unit: product.unit, stock: product.stock });
    toast.success(`${product.name} added!`, { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #272727' } });
  };

  const handleInc = (e: React.MouseEvent) => {
    e.preventDefault();
    if (cartItem && cartItem.quantity < product.stock) updateQuantity(product.id, cartItem.quantity + 1);
  };

  const handleDec = (e: React.MouseEvent) => {
    e.preventDefault();
    if (cartItem) updateQuantity(product.id, cartItem.quantity - 1);
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="bg-app-card border border-app-border rounded-2xl overflow-hidden group">
        <div className="relative aspect-square overflow-hidden bg-zinc-800">
          {product.images[0] ? (
            <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 33vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
          )}
          {product.discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">{product.discount}% OFF</span>
          )}
          <button onClick={(e) => { e.preventDefault(); }} className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Heart className="w-3.5 h-3.5 text-white" />
          </button>
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-xs font-bold text-zinc-300 bg-zinc-800 px-2 py-1 rounded-lg">Out of Stock</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-white text-sm font-semibold line-clamp-2 leading-tight">{product.name}</p>
          <p className="text-zinc-500 text-xs mt-0.5">{product.unit}</p>
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-white text-sm font-bold">{formatPrice(product.price)}</span>
              {product.comparePrice && (
                <span className="text-zinc-600 text-xs line-through ml-1">{formatPrice(product.comparePrice)}</span>
              )}
            </div>
            {cartItem ? (
              <div className="flex items-center gap-1.5 bg-gold/10 border border-gold/30 rounded-xl px-1.5 py-1" onClick={e => e.preventDefault()}>
                <button onClick={handleDec} className="w-5 h-5 flex items-center justify-center text-gold">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-gold text-xs font-bold w-4 text-center">{cartItem.quantity}</span>
                <button onClick={handleInc} className="w-5 h-5 flex items-center justify-center text-gold">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button onClick={handleAdd} disabled={!product.isAvailable || product.stock === 0} className="w-7 h-7 bg-gold rounded-xl flex items-center justify-center hover:bg-gold-light transition-colors disabled:opacity-40">
                <Plus className="w-4 h-4 text-black font-bold" strokeWidth={2.5} />
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

  const heroSlides = [
    {
      bg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&q=80',
      label: 'PURE. FRESH. NATURAL.',
      title: 'Elevate your lifestyle with real goodness.',
      sub: 'Handpicked freshness for a healthier you.',
    },
    {
      bg: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=700&q=80',
      label: 'DAILY ESSENTIALS',
      title: 'Farm-fresh dairy delivered daily.',
      sub: 'From farm to your doorstep in 30 minutes.',
    },
    {
      bg: 'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=700&q=80',
      label: 'TROPICAL FRUITS',
      title: 'Seasonal fruits, freshly picked.',
      sub: 'Nature\'s sweetness at your fingertips.',
    },
  ];

  const allProducts = [...featured, ...trending.filter(p => !featured.find(f => f.id === p.id))];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gold rounded-xl flex items-center justify-center">
            <Leaf className="w-4 h-4 text-black" />
          </div>
          <span className="text-white font-bold text-xl tracking-wide">vegu</span>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Link href="/notifications" className="w-9 h-9 bg-app-card border border-app-border rounded-xl flex items-center justify-center">
              <Bell className="w-4 h-4 text-zinc-400" />
            </Link>
          )}
          <Link href="/search" className="w-9 h-9 bg-app-card border border-app-border rounded-xl flex items-center justify-center">
            <Search className="w-4 h-4 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* Greeting */}
      {isAuthenticated && (
        <div className="px-4 mb-4">
          <p className="text-zinc-400 text-sm">Good day, <span className="text-white font-semibold">{user?.name?.split(' ')[0]}</span> 👋</p>
        </div>
      )}

      {/* Search bar */}
      <div className="px-4 mb-4">
        <Link href="/search" className="flex items-center gap-3 bg-app-card border border-app-border rounded-2xl px-4 py-3">
          <Search className="w-4 h-4 text-zinc-500" />
          <span className="text-zinc-500 text-sm">Search for products...</span>
        </Link>
      </div>

      {/* Hero carousel */}
      <div className="px-4 mb-6">
        <div className="relative rounded-2xl overflow-hidden h-48">
          <Image
            src={heroSlides[activeHero].bg}
            alt="hero"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 p-5 flex flex-col justify-end">
            <span className="text-gold text-[10px] font-bold tracking-widest mb-1">{heroSlides[activeHero].label}</span>
            <h2 className="text-white font-bold text-lg leading-tight mb-1 max-w-[220px]">{heroSlides[activeHero].title}</h2>
            <p className="text-zinc-300 text-xs mb-3 max-w-[200px]">{heroSlides[activeHero].sub}</p>
            <Link href="/products" className="inline-flex items-center gap-1.5 bg-gold text-black text-xs font-bold px-4 py-2 rounded-xl w-fit">
              Shop Now →
            </Link>
          </div>
          {/* Dots */}
          <div className="absolute bottom-3 right-4 flex gap-1">
            {heroSlides.map((_, i) => (
              <button key={i} onClick={() => setActiveHero(i)} className={`rounded-full transition-all ${i === activeHero ? 'w-4 h-1.5 bg-gold' : 'w-1.5 h-1.5 bg-white/40'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-white font-bold text-base">Shop by Category</h2>
            <Link href="/products" className="text-gold text-xs font-semibold">See all</Link>
          </div>
          <div className="flex gap-4 px-4 overflow-x-auto scroll-hidden pb-1">
            {categories.slice(0, 8).map((cat) => (
              <Link key={cat.id} href={`/products?categoryId=${cat.id}`} className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-16 h-16 bg-app-card border border-app-border rounded-2xl flex items-center justify-center overflow-hidden">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{getCategoryIcon(cat.slug, cat.name)}</span>
                  )}
                </div>
                <span className="text-zinc-300 text-[10px] font-medium text-center leading-tight max-w-[64px]">
                  {cat.name.length > 12 ? cat.name.slice(0, 10) + '…' : cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Top Picks */}
      {allProducts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-white font-bold text-base">Top Picks for You</h2>
            <Link href="/products" className="text-gold text-xs font-semibold">View all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4">
            {allProducts.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Promo Banner */}
      <div className="mx-4 mb-6">
        <div className="relative rounded-2xl overflow-hidden h-28 bg-gradient-to-r from-zinc-800 to-zinc-900 border border-app-border">
          <div className="absolute inset-0 p-5 flex flex-col justify-center">
            <p className="text-zinc-400 text-xs font-semibold">Save up to</p>
            <p className="text-white text-2xl font-extrabold">30% OFF</p>
            <p className="text-zinc-400 text-xs">on selected items</p>
            <Link href="/products?featured=true" className="inline-flex items-center gap-1 text-gold text-xs font-bold mt-2">
              Explore Deals →
            </Link>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-20 h-20 bg-gold/20 border-2 border-gold rounded-full flex items-center justify-center">
            <span className="text-gold font-extrabold text-sm text-center leading-tight">30%<br/>OFF</span>
          </div>
        </div>
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-white font-bold text-base">Trending Now 🔥</h2>
            <Link href="/products?trending=true" className="text-gold text-xs font-semibold">View all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4">
            {trending.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Features bar */}
      <div className="mx-4 mb-4 grid grid-cols-2 gap-3">
        {[
          { icon: '🌱', title: 'Premium Quality', desc: 'Handpicked & fresh' },
          { icon: '🔒', title: 'Secure & Safe', desc: '100% secure payments' },
          { icon: '🚚', title: 'Fast Delivery', desc: 'Quick & reliable' },
          { icon: '🎁', title: 'Best Offers', desc: 'Exclusive deals' },
        ].map((f) => (
          <div key={f.title} className="bg-app-card border border-app-border rounded-2xl p-3 flex items-center gap-3">
            <span className="text-xl">{f.icon}</span>
            <div>
              <p className="text-gold text-xs font-bold">{f.title}</p>
              <p className="text-zinc-500 text-[10px]">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ratings row */}
      <div className="mx-4 mb-8 flex items-center gap-2 justify-center">
        <div className="flex">
          {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 text-gold fill-gold" />)}
        </div>
        <span className="text-zinc-400 text-xs">4.8 · 10K+ happy customers</span>
      </div>
    </>
  );
}
