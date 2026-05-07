'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, ChevronLeft, ChevronRight, User, ShoppingBag, Ban, CheckCircle2, X } from 'lucide-react';

type Customer = {
  id: string; name: string; email: string; phone?: string; isActive: boolean;
  createdAt: string; _count?: { orders: number };
  orders?: { id: string; orderNumber: string; total: number; status: string; createdAt: string }[];
  totalSpent?: number;
};

export default function CustomersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', page, search],
    queryFn: () => api.get('/api/admin/users', { params: { page, limit: 20, search: search || undefined, role: 'CUSTOMER' } }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const { data: detail } = useQuery({
    queryKey: ['admin-customer-detail', selected?.id],
    queryFn: () => api.get(`/api/admin/users/${selected!.id}`).then(r => r.data.data),
    enabled: !!selected?.id,
  });

  const toggle = useMutation({
    mutationFn: (id: string) => api.patch(`/api/admin/users/${id}/toggle`),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['admin-customers'] }); qc.invalidateQueries({ queryKey: ['admin-customer-detail', selected?.id] }); },
    onError: () => toast.error('Failed to update'),
  });

  const customers: Customer[] = data?.data ?? [];
  const meta = data?.meta;
  const customerDetail: Customer = detail ?? selected;

  const STATUS_COLORS: Record<string, string> = {
    DELIVERED: 'text-emerald-400', CANCELLED: 'text-red-400', PENDING: 'text-amber-400',
  };

  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-bold text-white">Customers</h1>
        <p className="text-xs text-zinc-500 mt-0.5">{meta?.total ?? 0} registered customers</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Orders</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading && Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-zinc-800 rounded animate-pulse" /></td></tr>
              ))}
              {!isLoading && customers.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-zinc-800/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                        {c.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-200 truncate">{c.name}</p>
                        <p className="text-[10px] text-zinc-600 truncate">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 hidden md:table-cell">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-xs text-zinc-300">{c._count?.orders ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-zinc-600 hidden lg:table-cell">{new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${c.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {c.isActive ? 'Active' : 'Banned'}
                    </span>
                  </td>
                </tr>
              ))}
              {!isLoading && !customers.length && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-600">No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">Page {meta.page} of {meta.totalPages}</p>
            <div className="flex gap-2">
              <button type="button" title="Previous page" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button type="button" title="Next page" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Customer detail slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600/30 flex items-center justify-center text-emerald-400 text-sm font-bold">
                  {customerDetail?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{customerDetail?.name}</p>
                  <p className="text-xs text-zinc-500">{customerDetail?.email}</p>
                </div>
              </div>
              <button type="button" title="Close" onClick={() => setSelected(null)} className="p-1 text-zinc-500 hover:text-zinc-300 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                  <ShoppingBag className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{customerDetail?._count?.orders ?? 0}</p>
                  <p className="text-[10px] text-zinc-500">Total Orders</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                  <User className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{formatPrice(customerDetail?.totalSpent ?? 0)}</p>
                  <p className="text-[10px] text-zinc-500">Total Spent</p>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 text-xs">
                {customerDetail?.phone && <div className="flex justify-between"><span className="text-zinc-500">Phone</span><span className="text-zinc-300">{customerDetail.phone}</span></div>}
                <div className="flex justify-between"><span className="text-zinc-500">Joined</span><span className="text-zinc-300">{customerDetail?.createdAt ? new Date(customerDetail.createdAt).toLocaleDateString('en-IN') : '—'}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Status</span><span className={customerDetail?.isActive ? 'text-emerald-400' : 'text-red-400'}>{customerDetail?.isActive ? 'Active' : 'Banned'}</span></div>
              </div>

              {/* Recent orders */}
              {customerDetail?.orders && customerDetail.orders.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Recent Orders</p>
                  <div className="space-y-2">
                    {customerDetail.orders.slice(0, 5).map((o: { id: string; orderNumber: string; total: number; status: string; createdAt: string }) => (
                      <div key={o.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-mono text-zinc-300">{o.orderNumber}</p>
                          <p className={`text-[10px] ${STATUS_COLORS[o.status] ?? 'text-zinc-500'}`}>{o.status.replace(/_/g, ' ')}</p>
                        </div>
                        <p className="text-xs font-medium text-zinc-300">{formatPrice(o.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => toggle.mutate(selected.id)}
                  disabled={toggle.isPending}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${customerDetail?.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'}`}
                >
                  {customerDetail?.isActive ? <><Ban className="w-4 h-4" /> Ban Customer</> : <><CheckCircle2 className="w-4 h-4" /> Activate Customer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
