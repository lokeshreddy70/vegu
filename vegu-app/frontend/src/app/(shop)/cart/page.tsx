'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart, Trash2, Minus, Plus, Edit3, Leaf, ShoppingBag } from 'lucide-react';
import { useCartStore, useCartSubtotal } from '@/store/cart.store';
import { syncUpdateCartItem, syncRemoveFromCart, syncClearCart } from '@/lib/cartSync';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const subtotal = useCartSubtotal();
  const [hydrated, setHydrated] = useState(false);
  const [note, setNote] = useState('');

  const deliveryFee = subtotal > 0 && subtotal < 500 ? 40 : 0;
  const discount = subtotal > 1000 ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + deliveryFee - discount;
  const pointsEarned = Math.floor(total / 10);

  useEffect(() => { setHydrated(true); }, []);

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
      <div className="px-4 pt-12 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-app-card border border-app-border rounded-2xl h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-24 h-24 bg-app-card border border-app-border rounded-3xl flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-zinc-600" />
        </div>
        <h2 className="text-white text-xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-zinc-500 text-sm mb-8 text-center">Add fresh items to get started</p>
        <Link href="/products" className="bg-gold text-black font-bold px-8 py-3 rounded-2xl text-sm">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/products" className="w-9 h-9 bg-app-card border border-app-border rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-zinc-300" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-lg">My Cart</h1>
            <p className="text-zinc-500 text-xs">{items.reduce((s, i) => s + i.quantity, 0)} items</p>
          </div>
        </div>
        <button type="button" title="Save for later" className="w-9 h-9 bg-app-card border border-app-border rounded-xl flex items-center justify-center">
          <Heart className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Items */}
      <div className="px-4 space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.product.id} className="bg-app-card border border-app-border rounded-2xl p-3 flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
              {item.product.images[0] ? (
                <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="64px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold line-clamp-1">{item.product.name}</p>
              <p className="text-zinc-500 text-xs">{item.product.unit}</p>
              <p className="text-gold text-sm font-bold mt-1">{formatPrice(item.product.price)}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button type="button" aria-label="Remove item" onClick={() => handleRemove(item.product.id)} className="w-6 h-6 flex items-center justify-center">
                <Trash2 className="w-3.5 h-3.5 text-zinc-600 hover:text-red-400 transition-colors" />
              </button>
              <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-2 py-1">
                <button
                  type="button"
                  aria-label="Decrease"
                  onClick={() => handleUpdateQty(item.product.id, item.quantity - 1)}
                  className="w-5 h-5 flex items-center justify-center text-zinc-300"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-white text-xs font-bold w-4 text-center">{item.quantity}</span>
                <button
                  type="button"
                  aria-label="Increase"
                  onClick={() => handleUpdateQty(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                  className="w-5 h-5 flex items-center justify-center text-zinc-300 disabled:opacity-40"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note field */}
      <div className="mx-4 mb-4 bg-app-card border border-app-border rounded-2xl px-4 py-3 flex items-center gap-3">
        <Edit3 className="w-4 h-4 text-zinc-500 shrink-0" />
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note for delivery..."
          className="bg-transparent flex-1 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none"
        />
      </div>

      {/* Price breakdown */}
      <div className="mx-4 mb-4 bg-app-card border border-app-border rounded-2xl p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Subtotal</span>
          <span className="text-white font-semibold">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Delivery Fee</span>
          <span className={deliveryFee === 0 ? 'text-green-400 font-semibold' : 'text-white font-semibold'}>
            {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Discount</span>
            <span className="text-green-400 font-semibold">−{formatPrice(discount)}</span>
          </div>
        )}
        {subtotal > 0 && subtotal < 500 && (
          <p className="text-[11px] text-gold/80 bg-gold/10 rounded-xl px-3 py-2">
            Add {formatPrice(500 - subtotal)} more for free delivery
          </p>
        )}
        <div className="border-t border-app-border pt-3 flex justify-between items-center">
          <span className="text-white font-bold text-base">Total</span>
          <span className="text-gold font-extrabold text-xl">{formatPrice(total)}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="mx-4 mb-3">
        <Link href="/checkout" className="w-full flex items-center justify-center gap-2 bg-gold text-black font-bold py-4 rounded-2xl text-sm">
          Proceed to Checkout <span className="text-lg">›</span>
        </Link>
      </div>

      {/* Points info */}
      {pointsEarned > 0 && (
        <div className="mx-4 mb-4 flex items-center justify-center gap-2">
          <Leaf className="w-3.5 h-3.5 text-gold" />
          <p className="text-zinc-400 text-xs">
            You&apos;ll earn <span className="text-gold font-bold">{pointsEarned} points</span> on this order
          </p>
        </div>
      )}

      {/* Clear cart */}
      <div className="mx-4 mb-4 text-center">
        <button type="button" onClick={() => { clearCart(); syncClearCart(); }} className="text-zinc-600 text-xs hover:text-red-400 transition-colors">
          Clear cart
        </button>
      </div>
    </>
  );
}
