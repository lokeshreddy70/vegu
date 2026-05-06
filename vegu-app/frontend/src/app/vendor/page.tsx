'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShoppingBag, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';

export default function VendorDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: () => api.get('/api/vendor/dashboard').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['vendor-orders-recent'],
    queryFn: () => api.get('/api/vendor/orders', { params: { limit: 5 } }).then(r => r.data),
  });

  const stats = data || {};
  const recentOrders = ordersData?.data?.slice(0, 5) || [];

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders || 0, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending Orders', value: stats.pendingOrders || 0, icon: AlertTriangle, color: 'bg-orange-50 text-orange-600' },
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue || 0), icon: TrendingUp, color: 'bg-green-50 text-green-600' },
    { label: 'Products', value: `${stats.totalProducts || 0} (${stats.lowStockProducts || 0} low)`, icon: Package, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your store and track performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{isLoading ? '—' : stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-gray-900">Recent Orders</h2>
          <a href="/vendor/orders" className="text-primary-600 text-sm font-semibold hover:underline">View all</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Order #</th>
                <th className="text-left px-6 py-3 font-semibold">Customer</th>
                <th className="text-left px-6 py-3 font-semibold">Items</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-right px-6 py-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((o: { id: string; orderNumber: string; user: { name: string }; items: unknown[]; status: string; total: number; createdAt: string }) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900 text-sm">{o.orderNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{o.user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{o.items.length} item{o.items.length > 1 ? 's' : ''}</td>
                  <td className="px-6 py-4">
                    <span className={`badge text-xs ${getStatusColor(o.status)}`}>{o.status.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 text-sm">{formatPrice(o.total)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && !isLoading && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
