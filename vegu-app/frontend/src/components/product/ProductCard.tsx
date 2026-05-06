'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart, Zap } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
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
  const { addItem, getItem } = useCartStore();
  const cartItem = getItem(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.isAvailable || product.stock === 0) return;
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      images: product.images,
      unit: product.unit,
      stock: product.stock,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="card group relative"
    >
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.discount > 0 && (
              <span className="badge bg-red-500 text-white text-xs">{product.discount}% OFF</span>
            )}
            {product.isTrending && (
              <span className="badge bg-orange-500 text-white text-xs flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" /> Hot
              </span>
            )}
          </div>

          <button className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110">
            <Heart className="w-4 h-4 text-gray-500 hover:text-red-500 transition-colors" />
          </button>

          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
              <span className="badge bg-gray-800 text-white">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="p-4">
          {product.category && (
            <p className="text-xs text-primary-600 font-semibold mb-1 uppercase tracking-wide">{product.category.name}</p>
          )}
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">{product.name}</h3>
          <p className="text-xs text-gray-500 mb-3">{product.unit}</p>

          <div className="flex items-center gap-1 mb-3">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-gray-700">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({product.reviewCount})</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.comparePrice && (
                <span className="text-xs text-gray-400 line-through ml-2">{formatPrice(product.comparePrice)}</span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <motion.button
          onClick={handleAddToCart}
          whileTap={{ scale: 0.95 }}
          disabled={!product.isAvailable || product.stock === 0}
          className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          {cartItem ? `In Cart (${cartItem.quantity})` : 'Add to Cart'}
        </motion.button>
      </div>
    </motion.div>
  );
}
