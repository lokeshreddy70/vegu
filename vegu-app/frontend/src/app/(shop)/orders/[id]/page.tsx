'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Package, CheckCircle, Clock, Truck, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';
import Button from '@/components/ui/Button';

const statusSteps = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const stepIcons: Record<string, React.ElementType> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle,
  PREPARING: Package,
  READY_FOR_PICKUP: Package,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle,
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
      toast.success('Order cancelled');
      qc.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Cannot cancel order');
    },
  });

  if (isLoading) {
    return (
      <div className="container-page py-8 space-y-6">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-32 rounded-3xl" />
        <div className="skeleton h-48 rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-gray-500 mb-4">Order not found</p>
        <Button onClick={() => router.push('/orders')} variant="secondary">Back to Orders</Button>
      </div>
    );
  }

  const currentStepIdx = statusSteps.indexOf(order.status);

  return (
    <div className="container-page py-8">
      <button onClick={() => router.push('/orders')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-gray-500 text-sm mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`badge text-sm py-1.5 ${getStatusColor(order.status)}`}>{order.status.replace(/_/g, ' ')}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking */}
          {!['CANCELLED', 'REFUNDED'].includes(order.status) && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-6">Order Tracking</h2>
              <div className="flex items-center justify-between">
                {statusSteps.map((step, i) => {
                  const Icon = stepIcons[step] || CheckCircle;
                  const done = i <= currentStepIdx;
                  const active = i === currentStepIdx;
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${done ? 'bg-primary-600 shadow-lg shadow-primary-500/30' : 'bg-gray-100'} ${active ? 'ring-4 ring-primary-500/20' : ''}`}>
                          <Icon className={`w-4 h-4 ${done ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <p className={`text-[9px] font-semibold mt-1.5 text-center leading-tight max-w-[60px] ${done ? 'text-primary-600' : 'text-gray-400'}`}>
                          {step.replace(/_/g, ' ')}
                        </p>
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < currentStepIdx ? 'bg-primary-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">Items ({order.items.length})</h2>
            <div className="space-y-4">
              {order.items.map((item: { id: string; image?: string; name: string; product?: { slug: string }; price: number; quantity: number; total: number }) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🛒</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatPrice(item.price)} × {item.quantity}</p>
                  </div>
                  <p className="font-bold text-gray-900">{formatPrice(item.total)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Address */}
          {order.address && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary-600" />
                <h3 className="font-bold text-gray-900 text-sm">Delivery Address</h3>
              </div>
              <p className="font-semibold text-gray-900 text-sm">{order.address.fullName}</p>
              <p className="text-sm text-gray-600">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</p>
              <p className="text-sm text-gray-600">{order.address.city}, {order.address.state}</p>
              <p className="text-sm text-gray-500">{order.address.pincode} · {order.address.phone}</p>
            </div>
          )}

          {/* Price breakdown */}
          <div className="card p-5 space-y-3 text-sm">
            <h3 className="font-bold text-gray-900">Price Details</h3>
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span className={`font-semibold ${order.deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span className="font-semibold">-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-3 border-t border-gray-100">
              <span>Total</span>
              <span className="text-primary-600">{formatPrice(order.total)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Payment</span>
              <span className="font-medium text-gray-700">{order.paymentMethod}</span>
            </div>
          </div>

          {/* Cancel */}
          {['PENDING', 'CONFIRMED'].includes(order.status) && (
            <Button
              variant="danger"
              className="w-full"
              loading={isPending}
              onClick={() => cancel()}
            >
              <XCircle className="w-4 h-4" /> Cancel Order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
