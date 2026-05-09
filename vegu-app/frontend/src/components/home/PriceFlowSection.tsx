'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingDown, Flame, Zap, TrendingUp, Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { syncAddToCart, syncUpdateCartItem } from '@/lib/cartSync';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SignalProduct {
  id: string; name: string; slug: string; price: number; comparePrice?: number | null;
  images: string[]; unit: string; stock: number; discount: number;
  signal: { type: string; label: string; badge: string; color: string };
}

const SIGNAL_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  PRICE_DROP:    { bg: 'bg-emerald-500', text: 'text-white', icon: <TrendingDown className="w-3 h-3" /> },
  HOT_DEAL:      { bg: 'bg-orange-500',  text: 'text-white', icon: <Flame className="w-3 h-3" /> },
  LIMITED_STOCK: { bg: 'bg-amber-500',   text: 'text-white', icon: <Zap className="w-3 h-3" /> },
  TRENDING:      { bg: 'bg-red-500',     text: 'text-white', icon: <TrendingUp className="w-3 h-3" /> },
};

function SignalCard({ product }: { product: SignalProduct }) {
  const { addItem, getItem, updateQuantity } = useCartStore();
  const cartItem = getItem(product.id);
  const style = SIGNAL_STYLES[product.signal.type] ?? SIGNAL_STYLES.HOT_DEAL;

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
          <div className={`absolute top-2 left-2 flex items-center gap-0.5 ${style.bg} ${style.text} text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none`}>
            {style.icon}
            <span>{product.signal.badge}</span>
          </div>
        </div>
        <div className="p-2.5">
          <p className="text-gray-800 text-xs font-semibold line-clamp-2 leading-snug mb-0.5">{product.name}</p>
          <p className="text-gray-400 text-[10px] mb-1.5">{product.unit}</p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-900 text-sm font-bold">{formatPrice(product.price)}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-gray-400 text-[10px] line-through ml-1">{formatPrice(product.comparePrice)}</span>
              )}
            </div>
            {cartItem ? (
              <div className="flex items-center border-2 border-veg rounded-lg overflow-hidden" onClick={e => e.preventDefault()}>
                <button type="button" aria-label="Decrease" onClick={handleDec} className="w-6 h-6 flex items-center justify-center text-veg">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-veg font-bold text-xs w-4 text-center">{cartItem.quantity}</span>
                <button type="button" aria-label="Increase" onClick={handleInc} disabled={cartItem.quantity >= product.stock} className="w-6 h-6 flex items-center justify-center bg-veg text-white disabled:opacity-40">
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

export default function PriceFlowSection() {
  const [products, setProducts] = useState<SignalProduct[]>([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${apiUrl}/api/products/price-signals`)
      .then(r => r.json())
      .then(j => { if (j.data?.all) setProducts(j.data.all); })
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="bg-white border-y border-gray-100 py-4">
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-emerald-500" />
            <h2 className="text-gray-900 font-bold text-base">Live Price Flow</h2>
          </div>
          <p className="text-gray-400 text-xs mt-0.5">Price drops, hot deals &amp; limited stock</p>
        </div>
        <div className="flex gap-1">
          {['PRICE_DROP', 'HOT_DEAL', 'LIMITED_STOCK'].map(t => {
            const count = products.filter(p => p.signal.type === t).length;
            if (!count) return null;
            const s = SIGNAL_STYLES[t];
            return (
              <span key={t} className={`${s.bg} ${s.text} text-[8px] font-bold px-1.5 py-0.5 rounded-full`}>{count}</span>
            );
          })}
        </div>
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto pb-1 scrollbar-hide">
        {products.map(p => <SignalCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
