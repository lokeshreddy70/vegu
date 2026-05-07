'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, ChevronLeft, ChevronRight, Store, CheckCircle2, XCircle, Clock, X } from 'lucide-react';

type Vendor = {
  id: string; storeName: string; status: string; createdAt: string;
  user: { name: string; email: string; phone?: string };
  _count?: { products: number; orders: number };
  totalRevenue?: number; description?: string; address?: string;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-400',
  APPROVED: 'bg-emerald-500/15 text-emerald-400',
  REJECTED: 'bg-red-500/15 text-red-400',
  SUSPENDED: 'bg-zinc-500/15 text-zinc-400',
};

export default function VendorsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Vendor | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendors', page, search, statusFilter],
    queryFn: () => api.get('/api/admin/vendors', { params: { page, limit: 20, search: search || undefined, status: statusFilter || undefined } }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/api/admin/vendors/${id}/status`, { status }),
    onSuccess: (_, v) => {
      toast.success(`Vendor ${v.status.toLowerCase()}`);
      qc.invalidateQueries({ queryKey: ['admin-vendors'] });
      if (selected) setSelected(s => s ? { ...s, status: v.status } : null);
    },
    onError: () => toast.error('Failed to update'),
  });

  const vendors: Vendor[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-bold text-white">Vendors</h1>
        <p className="text-xs text-zinc-500 mt-0.5">{meta?.total ?? 0} registered vendors</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search vendors…"
            className="bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 w-56"
          />
        </div>
        <div className="flex items-center gap-1">
          {['', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${statusFilter === s ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Store</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Owner</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Products</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Revenue</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-zinc-800 rounded animate-pulse" /></td></tr>
              ))}
              {!isLoading && vendors.map(v => (
                <tr key={v.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 cursor-pointer" onClick={() => setSelected(v)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                        <Store className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-200 truncate">{v.storeName}</p>
                        <p className="text-[10px] text-zinc-600">{new Date(v.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-zinc-300">{v.user.name}</p>
                    <p className="text-[10px] text-zinc-600">{v.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-zinc-300">{v._count?.products ?? 0}</td>
                  <td className="px-4 py-3 text-right text-xs font-medium text-zinc-300 hidden lg:table-cell">{formatPrice(v.totalRevenue ?? 0)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[v.status] ?? 'bg-zinc-700 text-zinc-400'}`}>{v.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {v.status === 'PENDING' && (
                        <>
                          <button type="button" title="Approve" onClick={() => updateStatus.mutate({ id: v.id, status: 'APPROVED' })} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                          <button type="button" title="Reject" onClick={() => updateStatus.mutate({ id: v.id, status: 'REJECTED' })} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                      {v.status === 'APPROVED' && (
                        <button type="button" title="Suspend" onClick={() => updateStatus.mutate({ id: v.id, status: 'SUSPENDED' })} className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"><Clock className="w-3.5 h-3.5" /></button>
                      )}
                      {(v.status === 'REJECTED' || v.status === 'SUSPENDED') && (
                        <button type="button" title="Approve" onClick={() => updateStatus.mutate({ id: v.id, status: 'APPROVED' })} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !vendors.length && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-600">No vendors found</td></tr>
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

      {/* Detail slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <Store className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{selected.storeName}</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[selected.status] ?? 'bg-zinc-700 text-zinc-400'}`}>{selected.status}</span>
                </div>
              </div>
              <button type="button" title="Close" onClick={() => setSelected(null)} className="p-1 text-zinc-500 hover:text-zinc-300 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-white">{selected._count?.products ?? 0}</p>
                  <p className="text-[10px] text-zinc-500">Products</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-white">{selected._count?.orders ?? 0}</p>
                  <p className="text-[10px] text-zinc-500">Orders</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">Owner</span><span className="text-zinc-300">{selected.user.name}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Email</span><span className="text-zinc-300">{selected.user.email}</span></div>
                {selected.user.phone && <div className="flex justify-between"><span className="text-zinc-500">Phone</span><span className="text-zinc-300">{selected.user.phone}</span></div>}
                <div className="flex justify-between"><span className="text-zinc-500">Revenue</span><span className="text-zinc-300">{formatPrice(selected.totalRevenue ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Joined</span><span className="text-zinc-300">{new Date(selected.createdAt).toLocaleDateString('en-IN')}</span></div>
              </div>
              {selected.description && <p className="text-xs text-zinc-500 bg-zinc-800/50 rounded-xl p-4">{selected.description}</p>}
              <div className="flex gap-2 pt-2">
                {selected.status !== 'APPROVED' && (
                  <button type="button" onClick={() => { updateStatus.mutate({ id: selected.id, status: 'APPROVED' }); setSelected(null); }} className="flex-1 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm rounded-xl hover:bg-emerald-500/20 transition-colors">
                    Approve
                  </button>
                )}
                {selected.status === 'APPROVED' && (
                  <button type="button" onClick={() => { updateStatus.mutate({ id: selected.id, status: 'SUSPENDED' }); setSelected(null); }} className="flex-1 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm rounded-xl hover:bg-amber-500/20 transition-colors">
                    Suspend
                  </button>
                )}
                {selected.status !== 'REJECTED' && selected.status !== 'APPROVED' && (
                  <button type="button" onClick={() => { updateStatus.mutate({ id: selected.id, status: 'REJECTED' }); setSelected(null); }} className="flex-1 py-2 bg-red-500/10 text-red-400 border border-red-500/20 text-sm rounded-xl hover:bg-red-500/20 transition-colors">
                    Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
