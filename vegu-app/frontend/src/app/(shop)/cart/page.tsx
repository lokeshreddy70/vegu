'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Tag } from 'lucide-react';
import { useCartStore, useCartSubtotal } from '@/store/cart.store';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const subtotal = useCartSubtotal();
  const deliveryFee = subtotal > 0 && subtotal < 500 ? 40 : 0;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-7xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Add fresh items to get started</p>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Cart <span className="text-gray-400 text-xl font-normal">({items.length} items)</span></h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Clear all</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                className="card p-4 flex items-center gap-4"
              >
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 shrink-0">
                  {item.product.images[0] ? (
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.slug}`} className="font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-1">
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-gray-500 mt-0.5">{item.product.unit}</p>
                  <p className="text-lg font-bold text-primary-600 mt-1">{formatPrice(item.product.price)}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="w-8 h-8 rounded-xl hover:bg-red-50 flex items-center justify-center transition-colors ml-1"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>

                <div className="text-right shrink-0 min-w-[80px]">
                  <p className="font-bold text-gray-900">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery fee</span>
                <span className={`font-semibold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                </span>
              </div>
              {subtotal < 500 && subtotal > 0 && (
                <p className="text-xs text-primary-600 bg-primary-50 rounded-xl px-3 py-2">
                  Add {formatPrice(500 - subtotal)} more for free delivery
                </p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary-600">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="flex gap-2 p-3 bg-gray-50 rounded-2xl">
              <Tag className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <input placeholder="Promo code" className="bg-transparent text-sm flex-1 outline-none text-gray-700 placeholder:text-gray-400" />
              <button className="text-xs font-semibold text-primary-600 hover:text-primary-700">Apply</button>
            </div>

            <Link href="/checkout">
              <Button className="w-full flex items-center gap-2">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/products" className="block text-center text-sm text-gray-500 hover:text-primary-600 transition-colors font-medium">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
