'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Trash2, Minus, Plus, Edit3, ShoppingBag, Tag } from 'lucide-react'; // Tag used in free-delivery banner
import { useCartStore, useCartSubtotal } from '@/store/cart.store';
import { syncUpdateCartItem, syncRemoveFromCart, syncClearCart } from '@/lib/cartSync';
import { formatPrice } from '@/lib/utils';
import { useHydrated } from '@/hooks/useHydrated';
import ProductImage from '@/components/product/ProductImage';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const subtotal = useCartSubtotal();
  const hydrated = useHydrated();
  const [note, setNote] = useState('');

  const deliveryFee = subtotal > 0 && subtotal < 500 ? 40 : 0;
  const total = subtotal + deliveryFee;

  const handleUpdateQty = (productId: string, qty: number) => {
    updateQuantity(productId, qty);
    syncUpdateCartItem(productId, qty);
  };

  const handleRemove = (productId: string) => {
    removeItem(productId);
    syncRemoveFromCart(productId);
  };

  if (!hydrated) {
    return (
      <div className="bg-[#F7F9FA] min-h-screen px-4 pt-14 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-[#F7F9FA] min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-gray-900 text-xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-sm mb-8 text-center">Add fresh groceries to get started</p>
        <Link href="/products" className="bg-veg text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-lg shadow-veg/30">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F9FA] min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center gap-3 px-4 pt-12 pb-4 sticky top-0 z-10">
        <Link href="/products" className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-gray-900 font-bold text-lg">My Cart</h1>
          <p className="text-gray-400 text-xs">{items.reduce((s, i) => s + i.quantity, 0)} items</p>
        </div>
        <button type="button" onClick={() => { clearCart(); syncClearCart(); }} className="text-red-400 text-xs font-semibold">
          Clear
        </button>
      </div>

      {/* Delivery note */}
      {subtotal > 0 && subtotal < 500 && (
        <div className="mx-4 mt-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <p className="text-orange-700 text-xs font-medium">
            Add <span className="font-bold">{formatPrice(500 - subtotal)}</span> more for free delivery
          </p>
        </div>
      )}

      {/* Items */}
      <div className="px-4 mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.product.id} className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
              {item.product.images[0] ? (
                <ProductImage name={item.product.name} slug={item.product.slug} images={item.product.images} fill className="object-cover" sizes="64px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 text-sm font-semibold line-clamp-1">{item.product.name}</p>
              <p className="text-gray-400 text-xs">{item.product.unit}</p>
              <p className="text-veg text-sm font-bold mt-1">{formatPrice(item.product.price)}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button type="button" aria-label="Remove item" onClick={() => handleRemove(item.product.id)}>
                <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400 transition-colors" />
              </button>
              <div className="flex items-center border-2 border-veg rounded-xl overflow-hidden">
                <button
                  type="button"
                  aria-label="Decrease"
                  onClick={() => handleUpdateQty(item.product.id, item.quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center text-veg"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-veg text-xs font-bold w-5 text-center">{item.quantity}</span>
                <button
                  type="button"
                  aria-label="Increase"
                  onClick={() => handleUpdateQty(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                  className="w-7 h-7 flex items-center justify-center bg-veg text-white disabled:opacity-40"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note field */}
      <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
        <Edit3 className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a delivery note..."
          autoComplete="on"
          autoCorrect="on"
          autoCapitalize="sentences"
          spellCheck
          enterKeyHint="done"
          className="bg-transparent flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none"
        />
      </div>

      {/* Price breakdown */}
      <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h3 className="text-gray-900 font-bold text-sm">Bill Details</h3>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Item total</span>
          <span className="text-gray-900 font-semibold">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Delivery fee</span>
          <span className={deliveryFee === 0 ? 'text-veg font-semibold' : 'text-gray-900 font-semibold'}>
            {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
          </span>
        </div>
        <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
          <span className="text-gray-900 font-bold">To Pay</span>
          <span className="text-gray-900 font-extrabold text-xl">{formatPrice(total)}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="mx-4 mt-4">
        <Link
          href="/checkout"
          className="w-full flex items-center justify-between bg-gradient-to-r from-veg to-[#22b85f] text-white font-bold py-4 px-5 rounded-2xl text-sm shadow-lg shadow-veg/30 border border-white/20"
        >
          <span>{items.reduce((s, i) => s + i.quantity, 0)} items · {formatPrice(total)}</span>
          <span className="text-base">Proceed to Checkout →</span>
        </Link>
      </div>
    </div>
  );
}
