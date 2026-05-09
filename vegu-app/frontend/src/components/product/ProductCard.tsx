'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Zap, Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { syncAddToCart, syncUpdateCartItem } from '@/lib/cartSync';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  images: string[];
  unit: string;
  stock: number;
  discount: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  category?: { name: string; slug: string };
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, getItem, updateQuantity } = useCartStore();
  const cartItem = getItem(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.isAvailable || product.stock === 0) return;
    addItem({ id: product.id, name: product.name, slug: product.slug, price: product.price, images: product.images, unit: product.unit, stock: product.stock });
    syncAddToCart(product.id, 1);
    toast.success(`${product.name} added!`);
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
    <Link href={`/products/${product.slug}`} className="block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
        <div className="relative aspect-square bg-gray-50">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.discount > 0 && (
              <span className="bg-veg text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">{product.discount}% OFF</span>
            )}
            {product.isTrending && (
              <span className="bg-orange-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" /> Hot
              </span>
            )}
          </div>
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="bg-gray-100 text-gray-400 text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="p-2.5">
          {product.category && (
            <p className="text-veg text-[9px] font-bold uppercase tracking-wide mb-0.5">{product.category.name}</p>
          )}
          <h3 className="text-gray-800 text-xs font-semibold leading-tight line-clamp-2 mb-0.5">{product.name}</h3>
          <p className="text-gray-400 text-[10px]">{product.unit}</p>
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-gray-400 text-[10px]">{product.rating.toFixed(1)}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-1 mt-2">
            <div>
              <span className="text-gray-900 font-bold text-sm">{formatPrice(product.price)}</span>
              {product.comparePrice && (
                <span className="text-gray-400 text-xs line-through ml-1">{formatPrice(product.comparePrice)}</span>
              )}
            </div>
            {cartItem ? (
              <div className="flex items-center border-2 border-veg rounded-lg overflow-hidden" onClick={e => e.preventDefault()}>
                <button type="button" aria-label="Decrease quantity" onClick={handleDec} className="w-6 h-6 flex items-center justify-center text-veg">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-veg text-xs font-bold w-4 text-center">{cartItem.quantity}</span>
                <button type="button" aria-label="Increase quantity" onClick={handleInc} disabled={cartItem.quantity >= product.stock} className="w-6 h-6 flex items-center justify-center bg-veg text-white disabled:opacity-40">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                aria-label="Add to cart"
                onClick={handleAdd}
                disabled={!product.isAvailable || product.stock === 0}
                className="flex items-center gap-0.5 bg-veg text-white text-[10px] font-bold px-2 py-1.5 rounded-lg disabled:opacity-40 shrink-0"
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
