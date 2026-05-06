'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Input from '@/components/ui/Input';
import { Search, UserCheck, UserX } from 'lucide-react';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.get('/api/admin/users', { params: { search: search || undefined } }).then(r => r.data),
  });

  const { mutate: toggleUser } = useMutation({
    mutationFn: (id: string) => api.patch(`/api/admin/users/${id}/toggle`),
    onSuccess: () => { toast.success('User status updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
  });

  const users = data?.data || [];

  const roleColors: Record<string, string> = {
    CUSTOMER: 'badge-blue',
    VENDOR: 'badge-yellow',
    DELIVERY: 'badge-green',
    ADMIN: 'bg-purple-100 text-purple-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">{data?.meta?.total || 0} registered users</p>
        </div>
        <div className="w-72">
          <Input placeholder="Search users..." icon={<Search className="w-4 h-4" />} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-3 font-semibold">User</th>
              <th className="text-left px-6 py-3 font-semibold">Role</th>
              <th className="text-left px-6 py-3 font-semibold">Joined</th>
              <th className="text-center px-6 py-3 font-semibold">Status</th>
              <th className="text-center px-6 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="skeleton h-4 w-24 rounded" /></td>)}</tr>
                ))
              : users.map((u: { id: string; name: string; email: string; phone?: string; role: string; isActive: boolean; createdAt: string }) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-sm">{u.name[0].toUpperCase()}</div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge text-xs ${roleColors[u.role] || 'badge-gray'}`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`badge text-xs ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleUser(u.id)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto transition-colors ${u.isActive ? 'bg-red-50 hover:bg-red-100' : 'bg-green-50 hover:bg-green-100'}`}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {u.isActive ? <UserX className="w-4 h-4 text-red-600" /> : <UserCheck className="w-4 h-4 text-green-600" />}
                      </button>
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
