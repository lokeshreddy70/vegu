'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, XCircle, Leaf, CheckCircle2 } from 'lucide-react';
import RiderRatingCard from '@/components/orders/RiderRatingCard';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';

const STEPS = [
  { key: 'PENDING',          label: 'Placed',    emoji: '📋', msg: 'Your order has been placed' },
  { key: 'CONFIRMED',        label: 'Confirmed', emoji: '✅', msg: 'Store confirmed your order' },
  { key: 'PREPARING',        label: 'Preparing', emoji: '🧑‍🍳', msg: 'Being carefully packed for you' },
  { key: 'OUT_FOR_DELIVERY', label: 'On the way',emoji: '🚀', msg: 'Rider is heading your way' },
  { key: 'DELIVERED',        label: 'Delivered', emoji: '🎉', msg: 'Enjoy your fresh groceries!' },
];

const STATUS_PILL: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50 border-amber-200',
  CONFIRMED: 'text-blue-600 bg-blue-50 border-blue-200',
  PREPARING: 'text-violet-600 bg-violet-50 border-violet-200',
  READY_FOR_PICKUP: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  OUT_FOR_DELIVERY: 'text-orange-600 bg-orange-50 border-orange-200',
  DELIVERED: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  CANCELLED: 'text-red-500 bg-red-50 border-red-200',
  REFUNDED: 'text-gray-500 bg-gray-50 border-gray-200',
};

const STAGE_BG: Record<string, string> = {
  PENDING: 'from-amber-400 to-yellow-400',
  CONFIRMED: 'from-blue-400 to-sky-400',
  PREPARING: 'from-violet-500 to-purple-400',
  OUT_FOR_DELIVERY: 'from-orange-400 to-amber-400',
  DELIVERED: 'from-emerald-400 to-green-400',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/api/orders/${id}?include=deliveryPartner`).then(r => r.data.data),
    // Poll every 30 s while order is active
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(status)) return false;
      return 30_000;
    },
  });

  const { mutate: cancel, isPending } = useMutation({
    mutationFn: () => api.patch(`/api/orders/${id}/cancel`),
    onSuccess: () => {
      toast.success('Order cancelled');
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Cannot cancel order');
    },
  });

  if (isLoading) {
    return (
      <div className="px-4 pt-12 space-y-4 min-h-screen bg-gray-50">
        <div className="h-8 w-40 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-40 bg-gray-200 rounded-3xl animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-3xl animate-pulse" />
        <div className="h-28 bg-gray-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50">
        <p className="text-gray-400 mb-4">Order not found</p>
        <button type="button" onClick={() => router.push('/orders')} className="bg-veg text-white font-bold px-6 py-3 rounded-2xl text-sm">
          Back to Orders
        </button>
      </div>
    );
  }

  const isCancelled = ['CANCELLED', 'REFUNDED'].includes(order.status);
  const stepIndex = STEPS.findIndex(s => s.key === order.status);
  const activeIndex = stepIndex === -1 ? (isCancelled ? -1 : STEPS.length - 1) : stepIndex;
  const activeStep = STEPS[activeIndex] ?? STEPS[0];
  // Fixed Tailwind classes — 5 steps = 20 / 40 / 60 / 80 / 100 %
  const PROGRESS_W = ['w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-full'] as const;
  const progressWidthClass = isCancelled ? 'w-0' : (PROGRESS_W[activeIndex] ?? 'w-full');
  const progressLabel = isCancelled ? '0%' : `${Math.round(((activeIndex + 1) / STEPS.length) * 100)}%`;
  const pillCls = STATUS_PILL[order.status] ?? 'text-gray-500 bg-gray-50 border-gray-200';
  const stageBg = STAGE_BG[order.status] ?? 'from-gray-300 to-gray-400';

  return (
    <div className="min-h-screen bg-gray-50 pb-8">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button type="button" aria-label="Go back" onClick={() => router.push('/orders')}
          className="w-9 h-9 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-gray-900 font-bold text-base">{order.orderNumber}</h1>
          <p className="text-gray-400 text-xs">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${pillCls}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Cinematic tracking card */}
      {!isCancelled && (
        <div className="mx-4 mb-4">
          {/* Stage hero */}
          <div className={`bg-gradient-to-r ${stageBg} rounded-t-3xl p-5`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl">
                {activeStep.emoji}
              </div>
              <div>
                <p className="text-white/70 text-[10px] font-bold tracking-widest uppercase">
                  {order.status === 'OUT_FOR_DELIVERY' ? '🔴 Live' : 'Status'}
                </p>
                <p className="text-white font-black text-xl leading-tight">{activeStep.label}</p>
                <p className="text-white/70 text-xs mt-0.5">{activeStep.msg}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-white/60 text-[10px] font-semibold">Progress</span>
                <span className="text-white text-[10px] font-bold">{progressLabel}</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className={`h-full bg-white rounded-full transition-all duration-700 ${progressWidthClass}`} />
              </div>
            </div>
          </div>

          {/* Steps timeline */}
          <div className="bg-white rounded-b-3xl border border-gray-100 p-5 shadow-sm">
            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const done = i <= activeIndex;
                const active = i === activeIndex;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      done ? (active ? 'bg-veg shadow-lg shadow-veg/30' : 'bg-veg/15') : 'bg-gray-100'
                    }`}>
                      {done ? (
                        <CheckCircle2 className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-veg'}`} strokeWidth={2.5} />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-300'}`}>{step.label}</p>
                      {active && <p className="text-veg text-xs mt-0.5">{step.msg}</p>}
                    </div>
                    <span className="text-lg">{done ? step.emoji : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cancelled state */}
      {isCancelled && (
        <div className="mx-4 mb-4 bg-red-50 border border-red-100 rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">❌</span>
            <div>
              <p className="text-red-600 font-bold">Order {order.status.toLowerCase()}</p>
              <p className="text-red-400 text-xs mt-0.5">Your payment will be refunded within 3–5 days</p>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="mx-4 mb-4 bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
        <p className="text-gray-900 font-bold text-sm mb-3">Items ({order.items.length})</p>
        <div className="space-y-3">
          {order.items.map((item: { id: string; image?: string; name: string; price: number; quantity: number; total: number }) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">🛒</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 text-sm font-semibold line-clamp-1">{item.name}</p>
                <p className="text-gray-400 text-xs">{formatPrice(item.price)} × {item.quantity}</p>
              </div>
              <p className="text-gray-900 font-bold text-sm shrink-0">{formatPrice(item.total)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery address */}
      {order.address && (
        <div className="mx-4 mb-4 bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-veg" />
            <p className="text-gray-900 font-bold text-sm">Delivering to</p>
          </div>
          <p className="text-gray-800 text-sm font-semibold">{order.address.fullName}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}
          </p>
          <p className="text-gray-500 text-xs">{order.address.city}, {order.address.state} — {order.address.pincode}</p>
        </div>
      )}

      {/* Price summary */}
      <div className="mx-4 mb-4 bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
        <p className="text-gray-900 font-bold text-sm mb-3">Bill Summary</p>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-800 font-semibold">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery</span>
            <span className={`font-semibold ${order.deliveryFee === 0 ? 'text-emerald-500' : 'text-gray-800'}`}>
              {order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Discount</span>
              <span className="text-emerald-500 font-semibold">−{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2.5 flex justify-between items-center">
            <span className="text-gray-900 font-bold">Total Paid</span>
            <span className="text-gray-900 font-extrabold text-lg">{formatPrice(order.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Payment</span>
            <span className="text-gray-600 font-medium">{order.paymentMethod}</span>
          </div>
        </div>
      </div>

      {/* Rider rating — shows after delivery */}
      {order.status === 'DELIVERED' && order.deliveryPartnerId && (
        <RiderRatingCard
          orderId={order.id}
          deliveryPartnerId={order.deliveryPartnerId}
          riderName={order.deliveryPartner?.user?.name}
        />
      )}

      {/* Cancel */}
      {['PENDING', 'CONFIRMED'].includes(order.status) && (
        <div className="mx-4 mb-4">
          <button type="button" onClick={() => cancel()} disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 border border-red-100 text-red-500 rounded-2xl font-semibold text-sm hover:bg-red-100 transition-colors disabled:opacity-50">
            <XCircle className="w-4 h-4" />
            {isPending ? 'Cancelling…' : 'Cancel Order'}
          </button>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 py-4">
        <Leaf className="w-3.5 h-3.5 text-veg" />
        <span className="text-gray-400 text-xs">VEGU — Fresh in 10 mins</span>
      </div>
    </div>
  );
}
