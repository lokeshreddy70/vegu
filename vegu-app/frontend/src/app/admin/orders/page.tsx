'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', filter, page],
    queryFn: () => api.get('/api/admin/orders', { params: { status: filter || undefined, page } }).then(r => r.data),
  });

  const orders = data?.data || [];
  const meta = data?.meta;

  const statuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">{meta?.total || 0} total orders</p>
        </div>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} className="input w-52">
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Order #</th>
                <th className="text-left px-6 py-3 font-semibold">Customer</th>
                <th className="text-left px-6 py-3 font-semibold">Vendor</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-right px-6 py-3 font-semibold">Total</th>
                <th className="text-right px-6 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="skeleton h-4 w-24 rounded" /></td>)}</tr>
                  ))
                : orders.map((o: { id: string; orderNumber: string; user: { name: string; email: string }; vendor?: { storeName: string }; status: string; total: number; createdAt: string }) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900 text-sm">{o.orderNumber}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{o.user.name}</p>
                        <p className="text-xs text-gray-400">{o.user.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{o.vendor?.storeName || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`badge text-xs ${getStatusColor(o.status)}`}>{o.status.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 text-sm">{formatPrice(o.total)}</td>
                      <td className="px-6 py-4 text-right text-xs text-gray-500">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 p-6 border-t border-gray-100">
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${p === page ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
