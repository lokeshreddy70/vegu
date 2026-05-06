'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Star, Minus, Plus, ArrowLeft, Heart, Share2, Truck, Shield, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { formatPrice, getStatusColor } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const { addItem } = useCartStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/api/products/${slug}`).then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="container-page py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="skeleton aspect-square rounded-3xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4 rounded-xl" />
            <div className="skeleton h-4 w-1/2 rounded-xl" />
            <div className="skeleton h-12 w-1/3 rounded-xl" />
            <div className="skeleton h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-xl text-gray-500">Product not found.</p>
        <Button onClick={() => router.back()} variant="secondary" className="mt-4">Go Back</Button>
      </div>
    );
  }

  const product = data;

  const handleAddToCart = () => {
    addItem({ id: product.id, name: product.name, slug: product.slug, price: product.price, images: product.images, unit: product.unit, stock: product.stock }, qty);
    toast.success(`${product.name} added to cart`);
  };

  const guarantees = [
    { icon: Truck, label: '30 min delivery', desc: 'Express delivery available' },
    { icon: Shield, label: '100% fresh', desc: 'Quality guaranteed' },
    { icon: RotateCcw, label: 'Easy returns', desc: 'Within 24 hours' },
  ];

  return (
    <div className="container-page py-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 shadow-xl">
            {product.images[imgIdx] ? (
              <Image src={product.images[imgIdx]} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🛒</div>
            )}
            {product.discount > 0 && (
              <span className="absolute top-4 left-4 badge bg-red-500 text-white text-sm">{product.discount}% OFF</span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 mt-4">
              {product.images.map((img: string, i: number) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-primary-500 shadow-lg' : 'border-transparent'}`}>
                  <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div>
            {product.category && (
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wide">{product.category.name}</span>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mt-1 mb-2">{product.name}</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-gray-400">({product.reviewCount} reviews)</span>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <span className="text-4xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.comparePrice && (
              <span className="text-xl text-gray-400 line-through mb-1">{formatPrice(product.comparePrice)}</span>
            )}
            {product.comparePrice && (
              <span className="badge badge-green text-sm mb-1">Save {formatPrice(product.comparePrice - product.price)}</span>
            )}
          </div>

          <p className="text-sm text-gray-500 font-medium">Unit: {product.unit}</p>

          {product.description && (
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">Quantity:</span>
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-1">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-lg font-bold w-8 text-center">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <span className="text-sm text-gray-400">{product.stock} available</span>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleAddToCart} disabled={product.stock === 0} className="flex-1 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <button className="w-12 h-12 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <Heart className="w-5 h-5 text-gray-500" />
            </button>
            <button className="w-12 h-12 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <Share2 className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            {guarantees.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-center p-3 rounded-2xl bg-gray-50">
                <Icon className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>

          {product.vendor && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary-50 border border-primary-100">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-lg">🏪</div>
              <div>
                <p className="text-xs text-gray-500">Sold by</p>
                <p className="font-semibold text-gray-900">{product.vendor.storeName}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Reviews */}
      {product.reviews?.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.reviews.map((review: { id: string; user: { name: string; avatar?: string }; rating: number; title?: string; comment?: string; createdAt: string }) => (
              <div key={review.id} className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center font-bold text-primary-700">
                    {review.user.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{review.user.name}</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                {review.title && <p className="font-semibold text-gray-800 text-sm mb-1">{review.title}</p>}
                {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
