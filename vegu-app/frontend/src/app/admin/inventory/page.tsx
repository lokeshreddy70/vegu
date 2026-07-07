'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, Package, AlertTriangle, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Pencil, Check } from 'lucide-react';
import ProductImage from '@/components/product/ProductImage';

type Product = {
  id: string; name: string; sku?: string; stock: number; unit: string;
  images: string[]; isAvailable: boolean; price: number; purchasePrice?: number; batchNumber?: string; expiryDate?: string; minStockAlert: number; brand?: string;
  category: { name: string }; vendor: { storeName: string };
};

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="flex items-center gap-1 text-xs text-red-400 font-medium"><XCircle className="w-3 h-3" /> Out of stock</span>;
  if (stock <= 5) return <span className="flex items-center gap-1 text-xs text-amber-400 font-medium"><AlertTriangle className="w-3 h-3" /> Low ({stock})</span>;
  return <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium"><CheckCircle2 className="w-3 h-3" /> {stock}</span>;
}

export default function InventoryPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [newStock, setNewStock] = useState<Record<string, number>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inventory', page, filter],
    queryFn: () => api.get('/api/admin/inventory', { params: { page, filter: filter || undefined } }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const updateStock = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) => api.patch(`/api/admin/inventory/${id}/stock`, { stock }),
    onSuccess: (_, v) => { toast.success(`Stock updated to ${v.stock}`); setEditing(null); qc.invalidateQueries({ queryKey: ['admin-inventory'] }); },
    onError: () => toast.error('Failed to update stock'),
  });

  const products: Product[] = data?.data ?? [];
  const meta = data?.meta;

  const filtered = search ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.includes(search)) : products;

  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-bold text-white">Inventory</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Monitor and update product stock levels</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Out of Stock', value: meta?.outOfStock ?? 0, color: 'text-red-400 bg-red-500/10', key: 'out' },
          { label: 'Low Stock Alert', value: meta?.lowStock ?? 0, color: 'text-amber-400 bg-amber-500/10', key: 'low' },
          { label: 'Healthy Stock', value: meta?.healthy ?? 0, color: 'text-emerald-400 bg-emerald-500/10', key: 'healthy' },
        ].map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => { setFilter(filter === s.key ? '' : s.key); setPage(1); }}
            className={`bg-zinc-900 border rounded-xl p-4 text-left transition-all ${filter === s.key ? 'border-emerald-500/50' : 'border-zinc-800 hover:border-zinc-700'}`}
          >
            <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or SKU…"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Store</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Price</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden xl:table-cell">Batch / Expiry</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Stock Status</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">Update Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading && Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-zinc-800 rounded animate-pulse" /></td></tr>
              ))}
              {!isLoading && filtered.map(p => (
                <tr key={p.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <ProductImage name={p.name} images={p.images} categoryName={p.category.name} width={32} height={32} className="h-8 w-8 rounded-lg object-cover bg-zinc-800 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0"><Package className="w-3.5 h-3.5 text-zinc-600" /></div>
                      )}
                      <div className="min-w-0">
                        <p className="text-zinc-200 truncate max-w-[160px] font-medium text-xs">{p.name}</p>
                        <p className="text-[10px] text-zinc-600">{p.brand || 'Unbranded'}{p.sku ? ` · ${p.sku}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 hidden md:table-cell">{p.category.name}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500 hidden lg:table-cell truncate max-w-[120px]">{p.vendor.storeName}</td>
                  <td className="px-4 py-3 text-right text-xs font-medium text-zinc-300">
                    <p>{formatPrice(p.price)}</p>
                    <p className="text-[10px] text-zinc-600">Cost {p.purchasePrice ? formatPrice(p.purchasePrice) : '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 hidden xl:table-cell">
                    <p>{p.batchNumber || '—'}</p>
                    <p className="text-[10px] text-zinc-600">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-IN') : 'No expiry'}</p>
                  </td>
                  <td className="px-4 py-3 text-center"><StockBadge stock={p.stock} /></td>
                  <td className="px-4 py-3 text-center">
                    {editing === p.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          title="Update stock quantity"
                          type="number"
                          min={0}
                          defaultValue={p.stock}
                          onChange={e => setNewStock(s => ({ ...s, [p.id]: parseInt(e.target.value) || 0 }))}
                          className="w-16 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-100 text-center focus:outline-none focus:border-emerald-500"
                        />
                        <button type="button" title="Save" onClick={() => updateStock.mutate({ id: p.id, stock: newStock[p.id] ?? p.stock })} className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors">
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" title="Edit stock" onClick={() => { setEditing(p.id); setNewStock(s => ({ ...s, [p.id]: p.stock })); }} className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors mx-auto block">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">Page {meta.page} of {meta.totalPages}</p>
            <div className="flex gap-2">
              <button type="button" title="Previous page" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button type="button" title="Next page" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
