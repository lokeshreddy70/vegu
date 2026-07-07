'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Plus, Search, Star, Eye, EyeOff, Pencil, Trash2, X, Package,
  ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';
import ProductImage from '@/components/product/ProductImage';

type Product = {
  id: string; name: string; slug: string; brand?: string; price: number; comparePrice?: number;
  images: string[]; stock: number; isAvailable: boolean; isFeatured: boolean;
  isTrending: boolean; discount: number; sku?: string; unit: string; weight?: number;
  purchasePrice?: number; batchNumber?: string; expiryDate?: string; minStockAlert: number;
  category: { id: string; name: string }; vendor: { id: string; storeName: string };
  createdAt: string;
};
type Category = { id: string; name: string };
type Vendor = { id: string; storeName: string };

const schema = z.object({
  name: z.string().min(2, 'Min 2 chars'),
  brand: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive('Must be positive'),
  comparePrice: z.coerce.number().optional(),
  categoryId: z.string().min(1, 'Required'),
  vendorId: z.string().min(1, 'Required'),
  sku: z.string().optional(),
  stock: z.coerce.number().int().min(0),
  minStockAlert: z.coerce.number().int().min(0).default(10),
  unit: z.string().default('piece'),
  weight: z.coerce.number().optional(),
  purchasePrice: z.coerce.number().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  discount: z.coerce.number().min(0).max(100).default(0),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  images: z.string().optional(),
  tags: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function SlideOver({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button type="button" title="Close" onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300 rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

const inp = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors';

export default function ProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search, categoryFilter],
    queryFn: () => api.get('/api/admin/products', {
      params: { page, search: search || undefined, categoryId: categoryFilter || undefined, limit: 20 },
    }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const { data: cats } = useQuery<Category[]>({
    queryKey: ['admin-categories-simple'],
    queryFn: () => api.get('/api/admin/categories?counts=false').then(r => r.data.data),
  });

  const { data: vendors } = useQuery<{ data: Vendor[] }>({
    queryKey: ['admin-vendors-simple'],
    queryFn: () => api.get('/api/admin/vendors?limit=100').then(r => r.data),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const openAdd = () => { setEditing(null); reset({}); setShowForm(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    reset({
      name: p.name, brand: p.brand ?? '', price: p.price, comparePrice: p.comparePrice,
      categoryId: p.category.id, vendorId: p.vendor.id,
      sku: p.sku ?? '', stock: p.stock, minStockAlert: p.minStockAlert, unit: p.unit, weight: p.weight, purchasePrice: p.purchasePrice, batchNumber: p.batchNumber ?? '', expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString().slice(0, 10) : '', discount: p.discount,
      isAvailable: p.isAvailable, isFeatured: p.isFeatured, isTrending: p.isTrending,
      images: p.images.join(', '),
    });
    setShowForm(true);
  };

  const save = useMutation({
    mutationFn: (d: FormData) => {
      const body = { ...d, images: d.images?.split(',').map(s => s.trim()).filter(Boolean) ?? [], tags: d.tags?.split(',').map(s => s.trim()).filter(Boolean) ?? [] };
      return editing
        ? api.patch(`/api/admin/products/${editing.id}`, body)
        : api.post('/api/admin/products', body);
    },
    onSuccess: () => { toast.success(editing ? 'Product updated' : 'Product created'); setShowForm(false); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save product';
      toast.error(msg);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/products/${id}`),
    onSuccess: () => { toast.success('Product removed'); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
  });

  const toggleFeatured = useMutation({
    mutationFn: (id: string) => api.patch(`/api/admin/products/${id}/featured`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const toggleAvailability = useMutation({
    mutationFn: (id: string) => api.patch(`/api/admin/products/${id}/availability`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const products: Product[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-4 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Products</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{meta?.total ?? 0} total products</p>
        </div>
        <button type="button" onClick={openAdd} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products…"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button type="button" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 text-sm px-3 py-2 rounded-lg transition-colors">
          <Filter className="w-3.5 h-3.5" /> Filter
        </button>
        {showFilters && (
          <select title="Filter products by category" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500">
            <option value="">All categories</option>
            {cats?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
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
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Stock</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-zinc-800 rounded animate-pulse" /></td></tr>
              ))}
              {!isLoading && products.map(p => (
                <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images[0] ? (
                        <ProductImage name={p.name} slug={p.slug} categoryName={p.category.name} images={p.images} width={36} height={36} className="h-9 w-9 rounded-lg object-cover bg-zinc-800 shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-zinc-600" /></div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-100 truncate max-w-[180px]">{p.name}</p>
                        <p className="text-[10px] text-zinc-600">{p.brand || 'Unbranded'}{p.sku ? ` · ${p.sku}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs hidden md:table-cell">{p.category.name}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs hidden lg:table-cell truncate max-w-[120px]">{p.vendor.storeName}</td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold text-zinc-100">{formatPrice(p.price)}</p>
                    <p className="text-[10px] text-zinc-600">Cost {p.purchasePrice ? formatPrice(p.purchasePrice) : '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className={`text-xs font-medium ${p.stock === 0 ? 'text-red-400' : p.stock <= 5 ? 'text-amber-400' : 'text-zinc-400'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.isAvailable ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                      {p.isFeatured && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button type="button" title={p.isFeatured ? 'Unfeature' : 'Feature'} onClick={() => toggleFeatured.mutate(p.id)} className={`p-1.5 rounded-lg transition-colors ${p.isFeatured ? 'text-amber-400 hover:bg-amber-500/10' : 'text-zinc-600 hover:text-amber-400 hover:bg-zinc-800'}`}>
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" title={p.isAvailable ? 'Hide product' : 'Show product'} onClick={() => toggleAvailability.mutate(p.id)} className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
                        {p.isAvailable ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button type="button" title="Edit" onClick={() => openEdit(p)} className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" title="Remove" onClick={() => { if (confirm('Remove this product?')) remove.mutate(p.id); }} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !products.length && (
                <tr><td colSpan={7} className="px-4 py-16 text-center">
                  <Package className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-600">No products found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">Page {meta.page} of {meta.totalPages} · {meta.total} products</p>
            <div className="flex gap-2">
              <button type="button" title="Previous page" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" title="Next page" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Slide-over */}
      <SlideOver open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4">
          <Field label="Product Name" error={errors.name?.message}>
            <input {...register('name')} className={inp} placeholder="e.g. Fresh Tomatoes" />
          </Field>
          <Field label="Brand">
            <input {...register('brand')} className={inp} placeholder="e.g. Aashirvaad, Amul" />
          </Field>
          <Field label="Description">
            <textarea {...register('description')} rows={3} className={inp} placeholder="Optional description…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)" error={errors.price?.message}>
              <input {...register('price')} type="number" step="0.01" className={inp} placeholder="0.00" />
            </Field>
            <Field label="Compare Price (₹)">
              <input {...register('comparePrice')} type="number" step="0.01" className={inp} placeholder="Optional" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock" error={errors.stock?.message}>
              <input {...register('stock')} type="number" className={inp} placeholder="0" />
            </Field>
            <Field label="Low Stock Alert">
              <input {...register('minStockAlert')} type="number" className={inp} placeholder="10" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit">
              <input {...register('unit')} className={inp} placeholder="piece, kg, litre…" />
            </Field>
            <Field label="Weight">
              <input {...register('weight')} type="number" step="0.01" className={inp} placeholder="Optional" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Discount %" error={errors.discount?.message}>
              <input {...register('discount')} type="number" className={inp} placeholder="0" />
            </Field>
            <Field label="SKU">
              <input {...register('sku')} className={inp} placeholder="Optional" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase Price">
              <input {...register('purchasePrice')} type="number" step="0.01" className={inp} placeholder="Optional" />
            </Field>
            <Field label="Batch Number">
              <input {...register('batchNumber')} className={inp} placeholder="Optional" />
            </Field>
          </div>
          <Field label="Expiry Date">
            <input {...register('expiryDate')} type="date" className={inp} />
          </Field>
          <Field label="Category" error={errors.categoryId?.message}>
            <select {...register('categoryId')} className={inp}>
              <option value="">Select category</option>
              {cats?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Store" error={errors.vendorId?.message}>
            <select {...register('vendorId')} className={inp}>
              <option value="">Select store</option>
              {vendors?.data?.map((v: Vendor) => <option key={v.id} value={v.id}>{v.storeName}</option>)}
            </select>
          </Field>
          <Field label="Images (comma-separated URLs)">
            <textarea {...register('images')} rows={2} className={inp} placeholder="https://…, https://…" />
          </Field>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Upload product images</label>
            <input
              title="Upload product images"
              type="file"
              multiple
              accept="image/*"
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                const values = await Promise.all(files.map(fileToDataUrl));
                setValue('images', values.join(', '), { shouldDirty: true });
              }}
              className="w-full text-xs text-zinc-400"
            />
          </div>
          <Field label="Tags (comma-separated)">
            <input {...register('tags')} className={inp} placeholder="fresh, organic, seasonal" />
          </Field>
          <div className="flex flex-wrap gap-4 pt-1">
            {(['isAvailable', 'isFeatured', 'isTrending'] as const).map(k => (
              <label key={k} className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input type="checkbox" {...register(k)} className="rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/30" />
                {k === 'isAvailable' ? 'Available' : k === 'isFeatured' ? 'Featured' : 'Trending'}
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-zinc-700 text-zinc-400 text-sm rounded-lg hover:border-zinc-600 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
              {isSubmitting ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
