'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
  vendor?: { storeName: string };
}

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
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-5 w-1/3 rounded mb-3" />
              <div className="skeleton h-4 w-1/2 rounded mb-2" />
              <div className="skeleton h-4 w-1/4 rounded" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6">Your orders will appear here once you start shopping</p>
          <Link href="/products" className="btn-primary inline-flex items-center gap-2">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/orders/${order.id}`} className="card p-6 flex items-center justify-between hover:shadow-lg transition-shadow group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-gray-900">{order.orderNumber}</span>
                      <span className={`badge text-xs ${getStatusColor(order.status)}`}>{order.status.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''} · {order.vendor?.storeName || 'VEGU Store'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
