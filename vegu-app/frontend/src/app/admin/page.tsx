'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, TrendingUp, Store, Clock, Package } from 'lucide-react';
import api from '@/lib/api';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/api/admin/dashboard').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const stats = data?.stats || {};
  const recentOrders = data?.recentOrders || [];

  const statCards = [
    { label: 'Total Customers', value: stats.totalUsers || 0, icon: Users, color: 'bg-blue-50 text-blue-600', change: '+12%' },
    { label: 'Total Vendors', value: stats.totalVendors || 0, icon: Store, color: 'bg-purple-50 text-purple-600', change: `${stats.pendingVendors || 0} pending` },
    { label: 'Total Orders', value: stats.totalOrders || 0, icon: ShoppingBag, color: 'bg-orange-50 text-orange-600', change: '+8%' },
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue || 0), icon: TrendingUp, color: 'bg-green-50 text-green-600', change: '+15%', isPrice: true },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">{stat.change}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{isLoading ? '—' : stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" /> Recent Orders
          </h2>
          <a href="/admin/orders" className="text-sm text-primary-600 font-semibold hover:underline">View all</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Order</th>
                <th className="text-left px-6 py-3 font-semibold">Customer</th>
                <th className="text-left px-6 py-3 font-semibold">Vendor</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-right px-6 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="skeleton h-4 w-24 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : recentOrders.map((order: { id: string; orderNumber: string; user: { name: string }; vendor?: { storeName: string }; status: string; createdAt: string }) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900 text-sm">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{order.user.name}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{order.vendor?.storeName || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`badge text-xs ${getStatusColor(order.status)}`}>{order.status.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs text-right">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
