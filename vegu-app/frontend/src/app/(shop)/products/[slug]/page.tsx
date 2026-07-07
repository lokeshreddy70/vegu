'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, Share2, Minus, Plus, Star, Truck, Shield, RotateCcw, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { syncAddToCart, syncUpdateCartItem } from '@/lib/cartSync';
import { formatPrice } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import ProductImage from '@/components/product/ProductImage';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const { addItem, getItem, updateQuantity } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/api/products/${slug}`).then(r => r.data.data),
  });

  const product = data;

  useEffect(() => {
    let cancelled = false;

    const loadWishlistState = async () => {
      if (!product?.id) return;
      if (!isAuthenticated) {
        setIsWishlisted(false);
        return;
      }

      try {
        const res = await api.get(`/api/wishlist/${product.id}/check`);
        if (!cancelled) setIsWishlisted(!!res.data?.data?.isWishlisted);
      } catch {
        if (!cancelled) setIsWishlisted(false);
      }
    };

    loadWishlistState();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, product?.id]);

  if (isLoading) {
    return (
      <div className="pb-32">
        <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
        <div className="px-4 pt-4 space-y-3">
          <div className="h-6 w-3/4 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-8 w-1/3 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-gray-400 mb-4">Product not found</p>
        <button type="button" onClick={() => router.back()} className="bg-veg text-white font-bold px-6 py-3 rounded-2xl text-sm">
          Go Back
        </button>
      </div>
    );
  }

  const cartItem = getItem(product.id);

  const handleAddToCart = () => {
    addItem({ id: product.id, name: product.name, slug: product.slug, price: product.price, images: product.images, unit: product.unit, stock: product.stock }, qty);
    syncAddToCart(product.id, qty);
    toast.success(`${product.name} added to cart!`);
  };

  const handleInc = () => {
    if (cartItem) {
      const next = Math.min(cartItem.quantity + 1, product.stock);
      updateQuantity(product.id, next);
      syncUpdateCartItem(product.id, next);
    } else {
      setQty(q => Math.min(q + 1, product.stock));
    }
  };

  const handleDec = () => {
    if (cartItem) {
      const next = Math.max(0, cartItem.quantity - 1);
      updateQuantity(product.id, next);
      syncUpdateCartItem(product.id, next);
    } else {
      setQty(q => Math.max(1, q - 1));
    }
  };

  const displayQty = cartItem ? cartItem.quantity : qty;

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to use wishlist');
      router.push('/login');
      return;
    }
    if (wishlistBusy) return;

    setWishlistBusy(true);
    try {
      if (isWishlisted) {
        await api.delete(`/api/wishlist/${product.id}`);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post('/api/wishlist', { productId: product.id });
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Could not update wishlist right now');
    } finally {
      setWishlistBusy(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const payload = {
      title: product.name,
      text: `${product.name} on Vegu`,
      url,
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(payload);
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Product link copied');
        return;
      }
      toast.error('Share is not supported on this device');
    } catch {
      toast.error('Share canceled');
    }
  };

  return (
    <div className="pb-28 bg-[#F7F9FA] md:max-w-5xl md:mx-auto md:pb-10">
      {/* Image section */}
      <div className="relative bg-gray-100 md:rounded-3xl md:overflow-hidden md:mx-4 md:mt-4">
        <div className="aspect-[4/3] relative md:aspect-[16/8]">
          {product.images[imgIdx] ? (
            <ProductImage
              name={product.name}
              slug={product.slug}
              categoryName={product.category?.name}
              images={product.images[imgIdx] ? [product.images[imgIdx]] : product.images}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">🛒</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>

        {/* Overlay buttons */}
        <div className="absolute top-12 left-4 right-4 flex items-center justify-between md:top-6">
          <button type="button" aria-label="Go back" onClick={() => router.back()} className="w-9 h-9 bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center shadow-sm">
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Add to wishlist"
              onClick={handleToggleWishlist}
              disabled={wishlistBusy}
              className="w-9 h-9 bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center shadow-sm disabled:opacity-50"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} />
            </button>
            <button type="button" aria-label="Share product" onClick={handleShare} className="w-9 h-9 bg-white/80 backdrop-blur-md rounded-xl flex items-center justify-center shadow-sm">
              <Share2 className="w-4 h-4 text-gray-700" />
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
                className={`rounded-full transition-all ${i === imgIdx ? 'w-5 h-1.5 bg-veg' : 'w-1.5 h-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-4 md:pt-5">
        {/* Name + price */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {product.category && (
              <span className="text-veg text-xs font-bold uppercase tracking-wide">{product.category.name}</span>
            )}
            <h1 className="text-gray-900 text-xl font-bold mt-0.5 leading-tight">{product.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{product.unit}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-veg text-2xl font-extrabold">{formatPrice(product.price)}</p>
            {product.comparePrice && (
              <p className="text-gray-400 text-sm line-through">{formatPrice(product.comparePrice)}</p>
            )}
          </div>
        </div>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
              ))}
            </div>
            <span className="text-gray-700 text-xs font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-gray-400 text-xs">({product.reviewCount} reviews)</span>
          </div>
        )}

        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          <span className="flex items-center gap-1 bg-green-50 border border-green-100 text-veg text-xs font-semibold px-3 py-1 rounded-full">
            ✓ 100% Natural
          </span>
          <span className="flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-600 text-xs font-semibold px-3 py-1 rounded-full">
            ⭐ Premium Quality
          </span>
          {product.stock < 10 && product.stock > 0 && (
            <span className="bg-red-50 border border-red-100 text-red-500 text-xs font-semibold px-3 py-1 rounded-full">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-gray-700 text-sm font-semibold mb-1">About this product</p>
            <p className="text-gray-500 text-sm leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Guarantees */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Truck, label: '30 min', desc: 'Delivery' },
            { icon: Shield, label: '100%', desc: 'Fresh' },
            { icon: RotateCcw, label: 'Easy', desc: 'Returns' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center gap-1 shadow-sm">
              <Icon className="w-4 h-4 text-veg" />
              <p className="text-gray-900 text-xs font-bold">{label}</p>
              <p className="text-gray-400 text-[10px]">{desc}</p>
            </div>
          ))}
        </div>

        {/* Vendor */}
        {product.vendor && (
          <div className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-lg">🏪</div>
            <div>
              <p className="text-gray-400 text-xs">Sold by</p>
              <p className="text-gray-900 text-sm font-semibold">{product.vendor.storeName}</p>
            </div>
          </div>
        )}

        {/* Reviews */}
        {product.reviews?.length > 0 && (
          <div>
            <p className="text-gray-900 font-bold text-sm mb-3">Customer Reviews</p>
            <div className="space-y-3">
              {product.reviews.slice(0, 3).map((review: { id: string; user: { name: string }; rating: number; title?: string; comment?: string }) => (
                <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-veg/10 rounded-full flex items-center justify-center">
                      <span className="text-veg text-xs font-bold">{review.user.name[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-gray-900 text-xs font-semibold">{review.user.name}</p>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-2.5 h-2.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.comment && <p className="text-gray-500 text-xs leading-relaxed">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="keyboard-hide fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 flex items-center gap-3 shadow-lg md:static md:mt-6 md:mx-4 md:rounded-2xl md:border md:shadow-sm">
        <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2.5">
          <button type="button" aria-label="Decrease quantity" onClick={handleDec} className="w-7 h-7 flex items-center justify-center text-gray-600">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-gray-900 font-bold text-sm w-5 text-center">{displayQty}</span>
          <button type="button" aria-label="Increase quantity" onClick={handleInc} disabled={displayQty >= product.stock} className="w-7 h-7 flex items-center justify-center text-gray-600 disabled:opacity-40">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="flex-1 flex items-center justify-center gap-2 bg-veg text-white font-bold py-3 rounded-2xl text-sm disabled:opacity-40 shadow-lg shadow-veg/30"
        >
          <ShoppingBag className="w-4 h-4" />
          {product.stock === 0 ? 'Out of Stock' : cartItem ? `Update Cart (${cartItem.quantity})` : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
