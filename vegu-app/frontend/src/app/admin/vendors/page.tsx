'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-gray-100 text-gray-600',
};

export default function AdminVendorsPage() {
  const [filter, setFilter] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendors', filter],
    queryFn: () => api.get('/api/admin/vendors', { params: { status: filter || undefined } }).then(r => r.data),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/api/admin/vendors/${id}/status`, { status }),
    onSuccess: () => { toast.success('Vendor status updated'); qc.invalidateQueries({ queryKey: ['admin-vendors'] }); },
    onError: () => toast.error('Failed to update status'),
  });

  const vendors = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500 mt-1">{data?.meta?.total || 0} vendors</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input w-48">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-3 font-semibold">Vendor</th>
              <th className="text-left px-6 py-3 font-semibold">Owner</th>
              <th className="text-center px-6 py-3 font-semibold">Products</th>
              <th className="text-left px-6 py-3 font-semibold">Status</th>
              <th className="text-left px-6 py-3 font-semibold">Joined</th>
              <th className="text-center px-6 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="skeleton h-4 w-20 rounded" /></td>)}</tr>
              ))
            ) : vendors.map((v: { id: string; storeName: string; user: { name: string; email: string }; _count: { products: number }; status: string; createdAt: string }) => (
              <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-900 text-sm">{v.storeName}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-700">{v.user.name}</p>
                  <p className="text-xs text-gray-400">{v.user.email}</p>
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-700 font-semibold">{v._count.products}</td>
                <td className="px-6 py-4">
                  <span className={`badge text-xs ${statusColors[v.status] || 'bg-gray-100 text-gray-600'}`}>{v.status}</span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{formatDate(v.createdAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {v.status === 'PENDING' && (
                      <>
                        <button onClick={() => updateStatus({ id: v.id, status: 'APPROVED' })} className="w-8 h-8 rounded-xl bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors" title="Approve">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </button>
                        <button onClick={() => updateStatus({ id: v.id, status: 'REJECTED' })} className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors" title="Reject">
                          <XCircle className="w-4 h-4 text-red-600" />
                        </button>
                      </>
                    )}
                    {v.status === 'APPROVED' && (
                      <button onClick={() => updateStatus({ id: v.id, status: 'SUSPENDED' })} className="w-8 h-8 rounded-xl bg-yellow-50 hover:bg-yellow-100 flex items-center justify-center transition-colors" title="Suspend">
                        <Clock className="w-4 h-4 text-yellow-600" />
                      </button>
                    )}
                    {v.status === 'SUSPENDED' && (
                      <button onClick={() => updateStatus({ id: v.id, status: 'APPROVED' })} className="w-8 h-8 rounded-xl bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors" title="Reactivate">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
