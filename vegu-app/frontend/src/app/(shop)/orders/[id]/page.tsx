'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Clock, CheckCircle, Package, Truck, XCircle, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';

const STEPS = [
  { key: 'PENDING',          label: 'Placed',    icon: Clock },
  { key: 'CONFIRMED',        label: 'Confirmed', icon: CheckCircle },
  { key: 'PREPARING',        label: 'Preparing', icon: Package },
  { key: 'OUT_FOR_DELIVERY', label: 'On the way',icon: Truck },
  { key: 'DELIVERED',        label: 'Delivered', icon: CheckCircle },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-400/10',
  CONFIRMED: 'text-blue-400 bg-blue-400/10',
  PREPARING: 'text-violet-400 bg-violet-400/10',
  READY_FOR_PICKUP: 'text-cyan-400 bg-cyan-400/10',
  OUT_FOR_DELIVERY: 'text-orange-400 bg-orange-400/10',
  DELIVERED: 'text-emerald-400 bg-emerald-400/10',
  CANCELLED: 'text-red-400 bg-red-400/10',
  REFUNDED: 'text-zinc-400 bg-zinc-400/10',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/api/orders/${id}`).then(r => r.data.data),
  });

  const { mutate: cancel, isPending } = useMutation({
    mutationFn: () => api.patch(`/api/orders/${id}/cancel`),
    onSuccess: () => {
      toast.success('Order cancelled', { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #272727' } });
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Cannot cancel order');
    },
  });

  if (isLoading) {
    return (
      <div className="px-4 pt-12 space-y-4">
        <div className="h-8 w-40 bg-app-card rounded-xl animate-pulse" />
        <div className="h-28 bg-app-card rounded-2xl animate-pulse" />
        <div className="h-40 bg-app-card rounded-2xl animate-pulse" />
        <div className="h-32 bg-app-card rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-zinc-400 mb-4">Order not found</p>
        <button type="button" onClick={() => router.push('/orders')} className="bg-gold text-black font-bold px-6 py-3 rounded-2xl text-sm">
          Back to Orders
        </button>
      </div>
    );
  }

  const isCancelled = ['CANCELLED', 'REFUNDED'].includes(order.status);
  const stepIndex = STEPS.findIndex(s => s.key === order.status);
  const activeIndex = stepIndex === -1 ? (isCancelled ? -1 : STEPS.length - 1) : stepIndex;
  const statusCls = STATUS_COLOR[order.status] ?? 'text-zinc-400 bg-zinc-400/10';

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button type="button" aria-label="Go back" onClick={() => router.push('/orders')} className="w-9 h-9 bg-app-card border border-app-border rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-zinc-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg">{order.orderNumber}</h1>
          <p className="text-zinc-500 text-xs">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusCls}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Tracking stepper — only for active orders */}
      {!isCancelled && (
        <div className="mx-4 mb-4 bg-app-card border border-app-border rounded-2xl p-4">
          <p className="text-white font-bold text-sm mb-4">Order Tracking</p>
          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const done = i <= activeIndex;
              const active = i === activeIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      done ? 'bg-gold' : 'bg-zinc-800'
                    } ${active ? 'ring-4 ring-gold/20' : ''}`}>
                      <Icon className={`w-3.5 h-3.5 ${done ? 'text-black' : 'text-zinc-600'}`} strokeWidth={done ? 2.5 : 1.8} />
                    </div>
                    <p className={`text-[9px] font-semibold mt-1.5 text-center leading-tight max-w-[52px] ${
                      done ? 'text-gold' : 'text-zinc-600'
                    }`}>{step.label}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 rounded-full mb-4 ${i < activeIndex ? 'bg-gold' : 'bg-zinc-800'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="mx-4 mb-4 bg-app-card border border-app-border rounded-2xl p-4">
        <p className="text-white font-bold text-sm mb-3">Items ({order.items.length})</p>
        <div className="space-y-3">
          {order.items.map((item: { id: string; image?: string; name: string; price: number; quantity: number; total: number; product?: { slug: string } }) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">🛒</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold line-clamp-1">{item.name}</p>
                <p className="text-zinc-500 text-xs">{formatPrice(item.price)} × {item.quantity}</p>
              </div>
              <p className="text-white font-bold text-sm shrink-0">{formatPrice(item.total)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery address */}
      {order.address && (
        <div className="mx-4 mb-4 bg-app-card border border-app-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-gold" />
            <p className="text-white font-bold text-sm">Delivery Address</p>
          </div>
          <p className="text-zinc-300 text-sm font-semibold">{order.address.fullName}</p>
          <p className="text-zinc-500 text-xs mt-0.5">
            {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}
          </p>
          <p className="text-zinc-500 text-xs">{order.address.city}, {order.address.state} — {order.address.pincode}</p>
          <p className="text-zinc-600 text-xs mt-0.5">{order.address.phone}</p>
        </div>
      )}

      {/* Price summary */}
      <div className="mx-4 mb-4 bg-app-card border border-app-border rounded-2xl p-4 space-y-2.5">
        <p className="text-white font-bold text-sm mb-1">Price Details</p>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Subtotal</span>
          <span className="text-white font-semibold">{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Delivery Fee</span>
          <span className={`font-semibold ${order.deliveryFee === 0 ? 'text-emerald-400' : 'text-white'}`}>
            {order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}
          </span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Discount</span>
            <span className="text-emerald-400 font-semibold">−{formatPrice(order.discount)}</span>
          </div>
        )}
        <div className="border-t border-app-border pt-2.5 flex justify-between items-center">
          <span className="text-white font-bold">Total</span>
          <span className="text-gold font-extrabold text-lg">{formatPrice(order.total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Payment</span>
          <span className="text-zinc-300 font-medium">{order.paymentMethod}</span>
        </div>
      </div>

      {/* Cancel button */}
      {['PENDING', 'CONFIRMED'].includes(order.status) && (
        <div className="mx-4 mb-4">
          <button
            type="button"
            onClick={() => cancel()}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl font-semibold text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            {isPending ? 'Cancelling…' : 'Cancel Order'}
          </button>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 py-6">
        <Leaf className="w-3.5 h-3.5 text-gold" />
        <span className="text-zinc-600 text-xs">VEGU — Fresh Groceries</span>
      </div>
    </>
  );
}
