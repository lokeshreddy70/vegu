'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, ChevronRight, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatPrice, formatDate } from '@/lib/utils';

interface Order {
  id: string; orderNumber: string; status: string; total: number;
  createdAt: string; items: { name: string; quantity: number; image?: string }[];
  vendor?: { storeName: string };
}

const STATUS_CONFIG: Record<string, { label: string; textColor: string; bgColor: string; icon: React.ElementType }> = {
  PENDING:          { label: 'Pending',         textColor: 'text-amber-600',  bgColor: 'bg-amber-50',   icon: Clock },
  CONFIRMED:        { label: 'Confirmed',        textColor: 'text-blue-600',   bgColor: 'bg-blue-50',    icon: CheckCircle },
  PREPARING:        { label: 'Preparing',        textColor: 'text-violet-600', bgColor: 'bg-violet-50',  icon: Package },
  READY_FOR_PICKUP: { label: 'Ready',            textColor: 'text-cyan-600',   bgColor: 'bg-cyan-50',    icon: Package },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', textColor: 'text-orange-600', bgColor: 'bg-orange-50',  icon: Truck },
  DELIVERED:        { label: 'Delivered',        textColor: 'text-veg',        bgColor: 'bg-green-50',   icon: CheckCircle },
  CANCELLED:        { label: 'Cancelled',        textColor: 'text-red-500',    bgColor: 'bg-red-50',     icon: XCircle },
  REFUNDED:         { label: 'Refunded',         textColor: 'text-gray-500',   bgColor: 'bg-gray-50',    icon: XCircle },
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/api/orders').then(r => r.data),
    enabled: isAuthenticated,
  });

  const orders: Order[] = data?.data || [];

  return (
    <div className="bg-[#F7F9FA] min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 flex items-center gap-3 px-4 pt-12 pb-4 sticky top-0 z-10">
        <button type="button" aria-label="Go back" onClick={() => router.back()} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-gray-900 font-bold text-lg">My Orders</h1>
          <p className="text-gray-400 text-xs">{orders.length} total orders</p>
        </div>
      </div>

      {isLoading ? (
        <div className="px-4 mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <div className="w-20 h-20 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center mb-5">
            <Package className="w-9 h-9 text-gray-300" />
          </div>
          <h3 className="text-gray-900 font-bold text-lg mb-1">No orders yet</h3>
          <p className="text-gray-500 text-sm mb-6 text-center">Your orders will appear here once you start shopping</p>
          <Link href="/products" className="bg-veg text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-lg shadow-veg/30">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-3">
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
            const StatusIcon = cfg.icon;
            const preview = order.items.slice(0, 2).map(i => i.name).join(', ');
            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-veg/20 transition-colors">
                  <div className={`w-11 h-11 rounded-2xl ${cfg.bgColor} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${cfg.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-gray-900 font-bold text-sm">{order.orderNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bgColor} ${cfg.textColor}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs line-clamp-1">{preview}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-gray-900 font-bold text-sm">{formatPrice(order.total)}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
