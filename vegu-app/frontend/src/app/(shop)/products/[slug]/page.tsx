'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, Share2, Minus, Plus, Star, Truck, Shield, RotateCcw, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { syncAddToCart } from '@/lib/cartSync';
import { formatPrice } from '@/lib/utils';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const { addItem, getItem, updateQuantity } = useCartStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/api/products/${slug}`).then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="pb-32">
        <div className="aspect-[4/3] bg-zinc-900 animate-pulse" />
        <div className="px-4 pt-4 space-y-3">
          <div className="h-6 w-3/4 bg-app-card rounded-xl animate-pulse" />
          <div className="h-4 w-1/2 bg-app-card rounded-xl animate-pulse" />
          <div className="h-8 w-1/3 bg-app-card rounded-xl animate-pulse" />
          <div className="h-24 bg-app-card rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-zinc-400 mb-4">Product not found</p>
        <button type="button" onClick={() => router.back()} className="bg-gold text-black font-bold px-6 py-3 rounded-2xl text-sm">
          Go Back
        </button>
      </div>
    );
  }

  const product = data;
  const cartItem = getItem(product.id);

  const handleAddToCart = () => {
    addItem({ id: product.id, name: product.name, slug: product.slug, price: product.price, images: product.images, unit: product.unit, stock: product.stock }, qty);
    syncAddToCart(product.id, qty);
    toast.success(`${product.name} added to cart!`, {
      style: { background: '#1A1A1A', color: '#fff', border: '1px solid #272727' },
    });
  };

  const handleInc = () => {
    if (cartItem) updateQuantity(product.id, Math.min(cartItem.quantity + 1, product.stock));
    else setQty(q => Math.min(q + 1, product.stock));
  };

  const handleDec = () => {
    if (cartItem) updateQuantity(product.id, cartItem.quantity - 1);
    else setQty(q => Math.max(1, q - 1));
  };

  const displayQty = cartItem ? cartItem.quantity : qty;

  return (
    <div className="pb-28">
      {/* Image section */}
      <div className="relative bg-zinc-900">
        <div className="aspect-[4/3] relative">
          {product.images[imgIdx] ? (
            <Image src={product.images[imgIdx]} alt={product.name} fill className="object-cover" sizes="100vw" priority />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">🛒</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-transparent to-transparent" />
        </div>

        {/* Overlay buttons */}
        <div className="absolute top-12 left-4 right-4 flex items-center justify-between">
          <button type="button" aria-label="Go back" onClick={() => router.back()} className="w-9 h-9 bg-black/50 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex gap-2">
            <button type="button" aria-label="Add to wishlist" className="w-9 h-9 bg-black/50 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
              <Heart className="w-4 h-4 text-white" />
            </button>
            <button type="button" aria-label="Share product" className="w-9 h-9 bg-black/50 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Discount badge */}
        {product.discount > 0 && (
          <span className="absolute top-14 left-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-xl">
            {product.discount}% OFF
          </span>
        )}

        {/* Thumbnail row */}
        {product.images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {product.images.map((_: string, i: number) => (
              <button key={i} type="button" aria-label={`Image ${i + 1}`} onClick={() => setImgIdx(i)}
                className={`rounded-full transition-all ${i === imgIdx ? 'w-5 h-1.5 bg-gold' : 'w-1.5 h-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-4">
        {/* Name + price */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {product.category && (
              <span className="text-gold text-xs font-bold uppercase tracking-wide">{product.category.name}</span>
            )}
            <h1 className="text-white text-xl font-bold mt-0.5 leading-tight">{product.name}</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{product.unit}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-gold text-2xl font-extrabold">{formatPrice(product.price)}</p>
            {product.comparePrice && (
              <p className="text-zinc-600 text-sm line-through">{formatPrice(product.comparePrice)}</p>
            )}
          </div>
        </div>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? 'text-gold fill-gold' : 'text-zinc-700 fill-zinc-700'}`} />
              ))}
            </div>
            <span className="text-zinc-300 text-xs font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-zinc-600 text-xs">({product.reviewCount} reviews)</span>
          </div>
        )}

        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
            ✓ 100% Natural
          </span>
          <span className="flex items-center gap-1 bg-gold/10 border border-gold/20 text-gold text-xs font-semibold px-3 py-1 rounded-full">
            ⭐ Premium Quality
          </span>
          {product.stock < 10 && product.stock > 0 && (
            <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold px-3 py-1 rounded-full">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-app-card border border-app-border rounded-2xl p-4">
            <p className="text-zinc-300 text-sm font-semibold mb-1">About this product</p>
            <p className="text-zinc-500 text-sm leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Guarantees */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Truck, label: '30 min', desc: 'Delivery' },
            { icon: Shield, label: '100%', desc: 'Fresh' },
            { icon: RotateCcw, label: 'Easy', desc: 'Returns' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-app-card border border-app-border rounded-xl p-3 flex flex-col items-center gap-1">
              <Icon className="w-4 h-4 text-gold" />
              <p className="text-white text-xs font-bold">{label}</p>
              <p className="text-zinc-600 text-[10px]">{desc}</p>
            </div>
          ))}
        </div>

        {/* Vendor */}
        {product.vendor && (
          <div className="bg-app-card border border-app-border rounded-2xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center text-lg">🏪</div>
            <div>
              <p className="text-zinc-500 text-xs">Sold by</p>
              <p className="text-white text-sm font-semibold">{product.vendor.storeName}</p>
            </div>
          </div>
        )}

        {/* Reviews */}
        {product.reviews?.length > 0 && (
          <div>
            <p className="text-white font-bold text-sm mb-3">Customer Reviews</p>
            <div className="space-y-3">
              {product.reviews.slice(0, 3).map((review: { id: string; user: { name: string }; rating: number; title?: string; comment?: string }) => (
                <div key={review.id} className="bg-app-card border border-app-border rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-gold/20 rounded-full flex items-center justify-center">
                      <span className="text-gold text-xs font-bold">{review.user.name[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-white text-xs font-semibold">{review.user.name}</p>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-2.5 h-2.5 ${i < review.rating ? 'text-gold fill-gold' : 'text-zinc-700 fill-zinc-700'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.comment && <p className="text-zinc-400 text-xs leading-relaxed">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-app-bg/95 backdrop-blur-md border-t border-app-border px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-app-card border border-app-border rounded-2xl px-3 py-2.5">
          <button type="button" aria-label="Decrease quantity" onClick={handleDec} className="w-7 h-7 flex items-center justify-center text-zinc-300">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-white font-bold text-sm w-5 text-center">{displayQty}</span>
          <button type="button" aria-label="Increase quantity" onClick={handleInc} disabled={displayQty >= product.stock} className="w-7 h-7 flex items-center justify-center text-zinc-300 disabled:opacity-40">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="flex-1 flex items-center justify-center gap-2 bg-gold text-black font-bold py-3 rounded-2xl text-sm disabled:opacity-40"
        >
          <ShoppingBag className="w-4 h-4" />
          {product.stock === 0 ? 'Out of Stock' : cartItem ? `Update Cart (${cartItem.quantity})` : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
