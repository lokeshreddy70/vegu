'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, X, ChevronLeft, ChevronRight, MapPin, User, Clock, Package } from 'lucide-react';

type OrderItem = { id: string; quantity: number; price: number; total: number; product: { name: string; images: string[] } };
type Order = {
  id: string; orderNumber: string; status: string; total: number; subtotal: number;
  deliveryFee: number; discount: number; createdAt: string; note?: string;
  user: { name: string; email: string; phone?: string };
  vendor?: { storeName: string };
  deliveryAddress?: { street: string; city: string; state: string };
  items?: OrderItem[];
  trackingHistory?: { status: string; note?: string; timestamp: string }[];
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  CONFIRMED: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  PREPARING: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  READY_FOR_PICKUP: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  OUT_FOR_DELIVERY: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  DELIVERED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/20',
  REFUNDED: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
};

const NEXT_STATUSES: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

const ALL_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

const TAB_COLORS: Record<string, string> = {
  PENDING: 'data-[active=true]:text-amber-400 data-[active=true]:border-amber-400',
  CONFIRMED: 'data-[active=true]:text-blue-400 data-[active=true]:border-blue-400',
  PREPARING: 'data-[active=true]:text-violet-400 data-[active=true]:border-violet-400',
  READY_FOR_PICKUP: 'data-[active=true]:text-cyan-400 data-[active=true]:border-cyan-400',
  OUT_FOR_DELIVERY: 'data-[active=true]:text-orange-400 data-[active=true]:border-orange-400',
  DELIVERED: 'data-[active=true]:text-emerald-400 data-[active=true]:border-emerald-400',
  CANCELLED: 'data-[active=true]:text-red-400 data-[active=true]:border-red-400',
  REFUNDED: 'data-[active=true]:text-zinc-400 data-[active=true]:border-zinc-400',
};

export default function OrdersPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusNote, setStatusNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, page],
    queryFn: () => api.get('/api/admin/orders', { params: { status: statusFilter || undefined, page, limit: 20 } }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-order-detail', selected?.id],
    queryFn: () => api.get(`/api/admin/orders/${selected!.id}`).then(r => r.data.data),
    enabled: !!selected?.id,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      api.patch(`/api/admin/orders/${id}/status`, { status, note }),
    onSuccess: (_, v) => {
      toast.success(`Order moved to ${v.status.replace(/_/g, ' ')}`);
      setStatusNote('');
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-order-detail', v.id] });
      if (selected) setSelected(s => s ? { ...s, status: v.status } : null);
    },
    onError: () => toast.error('Failed to update status'),
  });

  const orders: Order[] = data?.data ?? [];
  const meta = data?.meta;
  const orderDetail: Order = detail ?? selected;

  const filtered = search
    ? orders.filter(o => o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.user.name.toLowerCase().includes(search.toLowerCase()))
    : orders;

  const nextStatuses = orderDetail ? (NEXT_STATUSES[orderDetail.status] ?? []) : [];

  return (
    <div className="p-6 space-y-4 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Orders</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{meta?.total ?? 0} total orders</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <button
          type="button"
          data-active={statusFilter === ''}
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-transparent whitespace-nowrap transition-all data-[active=true]:bg-zinc-800 data-[active=true]:text-zinc-100 data-[active=true]:border-zinc-700 text-zinc-500 hover:text-zinc-300"
        >
          All
        </button>
        {ALL_STATUSES.map(s => (
          <button
            type="button"
            key={s}
            data-active={statusFilter === s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border border-transparent whitespace-nowrap transition-all text-zinc-500 hover:text-zinc-300 data-[active=true]:border ${TAB_COLORS[s]}`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by order # or customer…"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Order</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Total</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading && Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-zinc-800 rounded animate-pulse" /></td></tr>
              ))}
              {!isLoading && filtered.map(o => (
                <tr key={o.id} onClick={() => setSelected(o)} className="hover:bg-zinc-800/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="text-xs font-mono text-zinc-200">{o.orderNumber}</p>
                    <p className="text-[10px] text-zinc-600 sm:hidden">{o.user.name}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-xs text-zinc-300">{o.user.name}</p>
                    <p className="text-[10px] text-zinc-600">{o.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 hidden lg:table-cell">{o.vendor?.storeName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${STATUS_STYLES[o.status] ?? 'bg-zinc-700 text-zinc-400 border-zinc-600'}`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-zinc-200">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3 text-right text-[10px] text-zinc-600 hidden md:table-cell">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              ))}
              {!isLoading && !filtered.length && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-600">No orders found</td></tr>
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
          <div className="relative w-full max-w-lg bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-white font-mono">{orderDetail?.orderNumber}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border mt-1 inline-block ${STATUS_STYLES[orderDetail?.status] ?? 'bg-zinc-700 text-zinc-400 border-zinc-600'}`}>
                  {orderDetail?.status?.replace(/_/g, ' ')}
                </span>
              </div>
              <button type="button" title="Close" onClick={() => setSelected(null)} className="p-1 text-zinc-500 hover:text-zinc-300 rounded"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {detailLoading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-zinc-800 rounded-lg animate-pulse" />)}</div>}

              {!detailLoading && orderDetail && (
                <>
                  {/* Customer */}
                  <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><User className="w-3 h-3" /> Customer</p>
                    <p className="text-sm text-zinc-200">{orderDetail.user?.name}</p>
                    <p className="text-xs text-zinc-500">{orderDetail.user?.email}</p>
                    {orderDetail.user?.phone && <p className="text-xs text-zinc-500">{orderDetail.user.phone}</p>}
                  </div>

                  {/* Delivery address */}
                  {orderDetail.deliveryAddress && (
                    <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Delivery Address</p>
                      <p className="text-sm text-zinc-300">{orderDetail.deliveryAddress.street}</p>
                      <p className="text-xs text-zinc-500">{orderDetail.deliveryAddress.city}, {orderDetail.deliveryAddress.state}</p>
                    </div>
                  )}

                  {/* Items */}
                  {orderDetail.items && orderDetail.items.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-3"><Package className="w-3 h-3" /> Items ({orderDetail.items.length})</p>
                      <div className="space-y-2">
                        {orderDetail.items.map(item => (
                          <div key={item.id} className="flex items-center gap-3">
                            {item.product.images?.[0] ? (
                              <img src={item.product.images[0]} alt={item.product.name} className="w-9 h-9 rounded-lg object-cover bg-zinc-800 shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-zinc-800 shrink-0 flex items-center justify-center"><Package className="w-3.5 h-3.5 text-zinc-600" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-zinc-300 truncate">{item.product.name}</p>
                              <p className="text-[10px] text-zinc-600">{item.quantity} × {formatPrice(item.price)}</p>
                            </div>
                            <p className="text-xs font-medium text-zinc-300 shrink-0">{formatPrice(item.total)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span>{formatPrice(orderDetail.subtotal)}</span></div>
                    <div className="flex justify-between text-zinc-500"><span>Delivery Fee</span><span>{formatPrice(orderDetail.deliveryFee ?? 0)}</span></div>
                    {(orderDetail.discount ?? 0) > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>−{formatPrice(orderDetail.discount)}</span></div>}
                    <div className="flex justify-between text-white font-semibold pt-2 border-t border-zinc-700"><span>Total</span><span>{formatPrice(orderDetail.total)}</span></div>
                  </div>

                  {/* Tracking */}
                  {orderDetail.trackingHistory && orderDetail.trackingHistory.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-3"><Clock className="w-3 h-3" /> Timeline</p>
                      <div className="relative pl-4 space-y-4">
                        <div className="absolute left-1.5 top-2 bottom-2 w-px bg-zinc-800" />
                        {[...orderDetail.trackingHistory].reverse().map((t, i) => (
                          <div key={i} className="relative">
                            <div className="absolute -left-3 top-1 w-2 h-2 rounded-full bg-zinc-700 border border-zinc-600" />
                            <p className="text-xs font-medium text-zinc-300">{t.status.replace(/_/g, ' ')}</p>
                            {t.note && <p className="text-[10px] text-zinc-600 mt-0.5">{t.note}</p>}
                            <p className="text-[10px] text-zinc-700 mt-0.5">{new Date(t.timestamp).toLocaleString('en-IN')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Update status */}
                  {nextStatuses.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Update Status</p>
                      <textarea
                        value={statusNote}
                        onChange={e => setStatusNote(e.target.value)}
                        placeholder="Optional note…"
                        rows={2}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                      <div className="flex flex-wrap gap-2">
                        {nextStatuses.map(ns => (
                          <button
                            key={ns}
                            type="button"
                            onClick={() => updateStatus.mutate({ id: orderDetail.id, status: ns, note: statusNote || undefined })}
                            disabled={updateStatus.isPending}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${STATUS_STYLES[ns] ?? 'bg-zinc-700 text-zinc-300 border-zinc-600'} hover:opacity-80`}
                          >
                            → {ns.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
