'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';

const nextStatus: Record<string, string | null> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: null,
  OUT_FOR_DELIVERY: null,
  DELIVERED: null,
  CANCELLED: null,
};

const nextLabel: Record<string, string> = {
  PENDING: 'Confirm',
  CONFIRMED: 'Start Preparing',
  PREPARING: 'Ready for Pickup',
};

export default function VendorOrdersPage() {
  const [filter, setFilter] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-orders', filter],
    queryFn: () => api.get('/api/vendor/orders', { params: { status: filter || undefined } }).then(r => r.data),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/vendor/orders/${id}/status`, { status }),
    onSuccess: () => { toast.success('Order updated'); qc.invalidateQueries({ queryKey: ['vendor-orders'] }); },
    onError: () => toast.error('Failed to update order'),
  });

  const orders = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">{data?.meta?.total || 0} orders</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input w-52">
          <option value="">All Orders</option>
          {['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-3xl" />)
          : orders.map((o: { id: string; orderNumber: string; user: { name: string; phone?: string }; items: { name: string; quantity: number; price: number }[]; status: string; total: number; address?: { city: string; pincode: string }; createdAt: string }) => (
              <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-gray-900">{o.orderNumber}</span>
                      <span className={`badge text-xs ${getStatusColor(o.status)}`}>{o.status.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-sm text-gray-500">{o.user.name} {o.user.phone ? `· ${o.user.phone}` : ''}</p>
                    {o.address && <p className="text-xs text-gray-400">{o.address.city} — {o.address.pincode}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600 text-lg">{formatPrice(o.total)}</p>
                    <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {o.items.map((item, i) => (
                    <span key={i} className="badge badge-gray">{item.name} × {item.quantity}</span>
                  ))}
                </div>

                {nextStatus[o.status] && (
                  <button
                    onClick={() => updateStatus({ id: o.id, status: nextStatus[o.status]! })}
                    className="btn-primary py-2 px-5 text-sm inline-flex items-center gap-2"
                  >
                    <ChevronDown className="w-4 h-4" /> {nextLabel[o.status] || 'Update'}
                  </button>
                )}
              </motion.div>
            ))}
        {orders.length === 0 && !isLoading && (
          <div className="text-center py-16 text-gray-400">No orders found</div>
        )}
      </div>
    </div>
  );
}
