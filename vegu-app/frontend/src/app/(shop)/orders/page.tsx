'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, ChevronRight, Clock, CheckCircle, Truck, XCircle, Leaf } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatPrice, formatDate } from '@/lib/utils';

interface Order {
  id: string; orderNumber: string; status: string; total: number;
  createdAt: string; items: { name: string; quantity: number; image?: string }[];
  vendor?: { storeName: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING:          { label: 'Pending',          color: 'text-amber-400',  bg: 'bg-amber-400/10',  icon: Clock },
  CONFIRMED:        { label: 'Confirmed',         color: 'text-blue-400',   bg: 'bg-blue-400/10',   icon: CheckCircle },
  PREPARING:        { label: 'Preparing',         color: 'text-violet-400', bg: 'bg-violet-400/10', icon: Package },
  READY_FOR_PICKUP: { label: 'Ready',             color: 'text-cyan-400',   bg: 'bg-cyan-400/10',   icon: Package },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',  color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Truck },
  DELIVERED:        { label: 'Delivered',         color: 'text-emerald-400',bg: 'bg-emerald-400/10',icon: CheckCircle },
  CANCELLED:        { label: 'Cancelled',         color: 'text-red-400',    bg: 'bg-red-400/10',    icon: XCircle },
  REFUNDED:         { label: 'Refunded',          color: 'text-zinc-400',   bg: 'bg-zinc-400/10',   icon: XCircle },
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
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button type="button" aria-label="Go back" onClick={() => router.back()} className="w-9 h-9 bg-app-card border border-app-border rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-zinc-300" />
        </button>
        <div>
          <h1 className="text-white font-bold text-lg">My Orders</h1>
          <p className="text-zinc-500 text-xs">{orders.length} total orders</p>
        </div>
      </div>

      {isLoading ? (
        <div className="px-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-app-card border border-app-border rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <div className="w-20 h-20 bg-app-card border border-app-border rounded-3xl flex items-center justify-center mb-5">
            <Package className="w-9 h-9 text-zinc-600" />
          </div>
          <h3 className="text-white font-bold text-lg mb-1">No orders yet</h3>
          <p className="text-zinc-500 text-sm mb-6 text-center">Your orders will appear here once you start shopping</p>
          <Link href="/products" className="bg-gold text-black font-bold px-8 py-3 rounded-2xl text-sm">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
            const StatusIcon = cfg.icon;
            const preview = order.items.slice(0, 2).map(i => i.name).join(', ');
            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="bg-app-card border border-app-border rounded-2xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors">
                  <div className={`w-11 h-11 rounded-2xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white font-bold text-sm">{order.orderNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-xs line-clamp-1">{preview}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-white font-bold text-sm">{formatPrice(order.total)}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer brand */}
      <div className="flex items-center justify-center gap-1.5 py-8 mt-2">
        <Leaf className="w-3.5 h-3.5 text-gold" />
        <span className="text-zinc-600 text-xs font-medium">VEGU — Fresh Groceries</span>
      </div>
    </>
  );
}
