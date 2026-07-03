'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { syncAddToCart, syncUpdateCartItem } from '@/lib/cartSync';
import { resolveApiBase } from '@/lib/apiBase';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface BazaarProduct {
  id: string; name: string; slug: string; price: number; comparePrice?: number | null;
  images: string[]; unit: string; stock: number; discount: number;
  rating: number; reviewCount: number; createdAt: string;
  category?: { name: string; slug: string };
}
interface BazaarData {
  freshArrivals: BazaarProduct[];
  lowStock: BazaarProduct[];
  trending: BazaarProduct[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor(diff / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ago`;
  if (h >= 1) return `${h}h ago`;
  if (m >= 1) return `${m}m ago`;
  return 'Just now';
}

function BazaarCard({
  product,
  badge,
}: {
  product: BazaarProduct;
  badge: React.ReactNode;
}) {
  const { addItem, getItem, updateQuantity } = useCartStore();
  const cartItem = getItem(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
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
    <Link href={`/products/${product.slug}`} className="shrink-0 w-[148px]">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
        <div className="relative aspect-square bg-gray-50">
          {product.images[0] ? (
            <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="148px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🛒</div>
          )}
          <div className="absolute top-2 left-2">{badge}</div>
        </div>
        <div className="p-2.5">
          <p className="text-gray-800 text-xs font-semibold line-clamp-2 leading-snug mb-0.5">{product.name}</p>
          <p className="text-gray-400 text-[10px] mb-1.5">{product.unit}</p>
          <div className="flex items-center justify-between">
            <span className="text-gray-900 text-sm font-bold">{formatPrice(product.price)}</span>
            {cartItem ? (
              <div className="flex items-center border-2 border-veg rounded-lg overflow-hidden" onClick={e => e.preventDefault()}>
                <button type="button" aria-label="Decrease" onClick={handleDec} className="w-6 h-6 flex items-center justify-center text-veg font-bold">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-veg font-bold text-xs w-4 text-center">{cartItem.quantity}</span>
                <button type="button" aria-label="Increase" onClick={handleInc} disabled={cartItem.quantity >= product.stock} className="w-6 h-6 flex items-center justify-center bg-veg text-white font-bold disabled:opacity-40">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button type="button" aria-label="Add" onClick={handleAdd} className="flex items-center gap-0.5 bg-veg text-white text-[10px] font-bold px-2 py-1.5 rounded-lg">
                <Plus className="w-3 h-3" strokeWidth={3} /> ADD
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function BazaarRow({
  title,
  subtitle,
  items,
  badge,
}: {
  title: string;
  subtitle: string;
  items: BazaarProduct[];
  badge: (p: BazaarProduct) => React.ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-end justify-between px-4 mb-2.5">
        <div>
          <p className="text-gray-900 font-bold text-sm">{title}</p>
          <p className="text-gray-400 text-[10px] mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto pb-0.5 scrollbar-hide">
        {items.map(p => <BazaarCard key={p.id} product={p} badge={badge(p)} />)}
      </div>
    </div>
  );
}

export default function LiveBazaarSection() {
  const [data, setData] = useState<BazaarData | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const apiUrl = resolveApiBase('');
    const streamUrl = `${apiUrl}/api/products/bazaar/stream`;

    const fallbackFetch = () => {
      fetch(`${apiUrl}/api/products/bazaar`)
        .then(r => r.json())
        .then(j => { if (j.data) setData(j.data); })
        .catch(() => {});
    };

    fallbackFetch();

    const evt = new EventSource(streamUrl);
    evt.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data) as BazaarData;
        setData(parsed);
      } catch {
        // ignore malformed events
      }
    };
    evt.onerror = () => {
      evt.close();
      // Fallback polling when streaming is unavailable
      intervalRef.current = setInterval(fallbackFetch, 60000);
    };

    return () => {
      evt.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    // Keep LIVE pulse animation mounted
    return () => {};
  }, []);

  const hasAny = data && (data.freshArrivals.length > 0 || data.lowStock.length > 0 || data.trending.length > 0);
  if (!hasAny) return null;

  return (
    <div className="bg-white border-y border-gray-100 py-4 space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <p className="text-gray-900 font-black text-base tracking-tight">Live Bazaar</p>
        <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full tracking-wide uppercase">Live</span>
      </div>

      {/* Fresh arrivals */}
      {data.freshArrivals.length > 0 && (
        <BazaarRow
          title="Fresh Arrivals 🌿"
          subtitle="Restocked today"
          items={data.freshArrivals}
          badge={p => (
            <span className="bg-[#2ECC71] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none">
              {timeAgo(p.createdAt)}
            </span>
          )}
        />
      )}

      {/* Low stock */}
      {data.lowStock.length > 0 && (
        <BazaarRow
          title="Almost Gone ⚡"
          subtitle="Limited stock — grab fast"
          items={data.lowStock}
          badge={p => (
            <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none whitespace-nowrap">
              {p.stock} left
            </span>
          )}
        />
      )}

      {/* Trending */}
      {data.trending.length > 0 && (
        <BazaarRow
          title="Trending Near You 🔥"
          subtitle="Everyone's ordering this"
          items={data.trending}
          badge={() => (
            <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none">
              🔥 Hot
            </span>
          )}
        />
      )}
    </div>
  );
}
