'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Image, ToggleLeft, ToggleRight, Percent } from 'lucide-react';

type Coupon = {
  id: string; code: string; type: 'PERCENTAGE' | 'FIXED'; value: number;
  minOrderAmount?: number; maxDiscount?: number; usageLimit?: number;
  usedCount: number; isActive: boolean; expiresAt?: string;
};

type Banner = {
  id: string; title: string; subtitle?: string; image: string;
  link?: string; isActive: boolean; sortOrder: number;
};

const couponSchema = z.object({
  code: z.string().min(2).toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional(),
});
type CouponForm = z.infer<typeof couponSchema>;

const bannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  image: z.string().url(),
  link: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});
type BannerForm = z.infer<typeof bannerSchema>;

const inp = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors';

export default function PromotionsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'coupons' | 'banners'>('coupons');
  const [couponPanel, setCouponPanel] = useState(false);
  const [bannerPanel, setBannerPanel] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);

  const { data: couponsData, isLoading: cLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => api.get('/api/admin/coupons').then(r => r.data.data ?? r.data),
  });
  const { data: bannersData, isLoading: bLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => api.get('/api/admin/banners').then(r => r.data.data ?? r.data),
  });

  const coupons: Coupon[] = Array.isArray(couponsData) ? couponsData : [];
  const banners: Banner[] = Array.isArray(bannersData) ? bannersData : [];

  const couponForm = useForm<CouponForm>({ resolver: zodResolver(couponSchema) });
  const bannerForm = useForm<BannerForm>({ resolver: zodResolver(bannerSchema) });

  const saveCoupon = useMutation({
    mutationFn: (d: CouponForm) => editCoupon
      ? api.patch(`/api/admin/coupons/${editCoupon.id}`, d)
      : api.post('/api/admin/coupons', d),
    onSuccess: () => { toast.success(editCoupon ? 'Updated' : 'Created'); setCouponPanel(false); qc.invalidateQueries({ queryKey: ['admin-coupons'] }); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  });

  const deleteCoupon = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/coupons/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-coupons'] }); },
  });

  const toggleCoupon = useMutation({
    mutationFn: (c: Coupon) => api.patch(`/api/admin/coupons/${c.id}`, { isActive: !c.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  const saveBanner = useMutation({
    mutationFn: (d: BannerForm) => editBanner
      ? api.patch(`/api/admin/banners/${editBanner.id}`, d)
      : api.post('/api/admin/banners', d),
    onSuccess: () => { toast.success(editBanner ? 'Updated' : 'Created'); setBannerPanel(false); qc.invalidateQueries({ queryKey: ['admin-banners'] }); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  });

  const deleteBanner = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/banners/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-banners'] }); },
  });

  const toggleBanner = useMutation({
    mutationFn: (b: Banner) => api.patch(`/api/admin/banners/${b.id}`, { isActive: !b.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banners'] }),
  });

  const openCouponAdd = () => { setEditCoupon(null); couponForm.reset({ type: 'PERCENTAGE', isActive: true }); setCouponPanel(true); };
  const openCouponEdit = (c: Coupon) => {
    setEditCoupon(c);
    couponForm.reset({ code: c.code, type: c.type, value: c.value, minOrderAmount: c.minOrderAmount, maxDiscount: c.maxDiscount, usageLimit: c.usageLimit, isActive: c.isActive, expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '' });
    setCouponPanel(true);
  };
  const openBannerAdd = () => { setEditBanner(null); bannerForm.reset({ isActive: true, sortOrder: 0 }); setBannerPanel(true); };
  const openBannerEdit = (b: Banner) => {
    setEditBanner(b);
    bannerForm.reset({ title: b.title, subtitle: b.subtitle ?? '', image: b.image, link: b.link ?? '', sortOrder: b.sortOrder, isActive: b.isActive });
    setBannerPanel(true);
  };

  return (
    <div className="p-6 space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Promotions</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Manage coupons and banners</p>
        </div>
        <button
          type="button"
          onClick={tab === 'coupons' ? openCouponAdd : openBannerAdd}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> {tab === 'coupons' ? 'Add Coupon' : 'Add Banner'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-fit">
        {(['coupons', 'banners'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${tab === t ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Coupons */}
      {tab === 'coupons' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Discount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Usage</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Expires</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Active</th>
                <th className="px-4 py-3 sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {cLoading && Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-zinc-800 rounded animate-pulse" /></td></tr>)}
              {!cLoading && coupons.map(c => (
                <tr key={c.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Percent className="w-3 h-3 text-zinc-500" />
                      <span className="text-xs font-mono font-semibold text-zinc-200">{c.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400 hidden sm:table-cell">
                    {c.type === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`}
                    {c.minOrderAmount ? ` (min ₹${c.minOrderAmount})` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 hidden md:table-cell">{c.usedCount} / {c.usageLimit ?? '∞'}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500 hidden lg:table-cell">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button type="button" title={c.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggleCoupon.mutate(c)} className={`p-1 rounded-lg transition-colors ${c.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'}`}>
                      {c.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" title="Edit" onClick={() => openCouponEdit(c)} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button type="button" title="Delete" onClick={() => { if (confirm('Delete coupon?')) deleteCoupon.mutate(c.id); }} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!cLoading && !coupons.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-600">No coupons yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Banners */}
      {tab === 'banners' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl h-40 animate-pulse" />)}
          {!bLoading && banners.map(b => (
            <div key={b.id} className={`bg-zinc-900 border rounded-xl overflow-hidden transition-all ${b.isActive ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60'}`}>
              <div className="relative h-32 bg-zinc-800">
                {b.image ? <img src={b.image} alt={b.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image className="w-8 h-8 text-zinc-600" /></div>}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-zinc-200 truncate">{b.title}</p>
                {b.subtitle && <p className="text-xs text-zinc-500 mt-0.5 truncate">{b.subtitle}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                  <button type="button" title={b.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggleBanner.mutate(b)} className={`p-1 rounded-lg transition-colors ${b.isActive ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {b.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <span className="text-[10px] text-zinc-600 flex-1 ml-2">Order: {b.sortOrder}</span>
                  <button type="button" title="Edit" onClick={() => openBannerEdit(b)} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button type="button" title="Delete" onClick={() => { if (confirm('Delete banner?')) deleteBanner.mutate(b.id); }} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {!bLoading && !banners.length && (
            <div className="col-span-3 py-16 text-center">
              <Image className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-600">No banners yet</p>
            </div>
          )}
        </div>
      )}

      {/* Coupon panel */}
      {couponPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCouponPanel(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
              <h3 className="text-sm font-semibold text-white">{editCoupon ? 'Edit Coupon' : 'Add Coupon'}</h3>
              <button type="button" title="Close" onClick={() => setCouponPanel(false)} className="p-1 text-zinc-500 hover:text-zinc-300 rounded"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={couponForm.handleSubmit(d => saveCoupon.mutate(d))} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Code *</label>
                <input {...couponForm.register('code')} className={inp} placeholder="SUMMER20" />
                {couponForm.formState.errors.code && <p className="text-xs text-red-400 mt-1">{couponForm.formState.errors.code.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Type</label>
                  <select {...couponForm.register('type')} className={inp}>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Value *</label>
                  <input {...couponForm.register('value')} type="number" className={inp} placeholder="20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Min Order (₹)</label>
                  <input {...couponForm.register('minOrderAmount')} type="number" className={inp} placeholder="200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Max Discount (₹)</label>
                  <input {...couponForm.register('maxDiscount')} type="number" className={inp} placeholder="100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Usage Limit</label>
                  <input {...couponForm.register('usageLimit')} type="number" className={inp} placeholder="∞" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Expires</label>
                  <input {...couponForm.register('expiresAt')} type="date" className={inp} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input type="checkbox" {...couponForm.register('isActive')} className="rounded border-zinc-700 bg-zinc-800 text-emerald-500" />
                Active
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCouponPanel(false)} className="flex-1 py-2 border border-zinc-700 text-zinc-400 text-sm rounded-lg hover:border-zinc-600 transition-colors">Cancel</button>
                <button type="submit" disabled={couponForm.formState.isSubmitting} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                  {couponForm.formState.isSubmitting ? 'Saving…' : editCoupon ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner panel */}
      {bannerPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setBannerPanel(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
              <h3 className="text-sm font-semibold text-white">{editBanner ? 'Edit Banner' : 'Add Banner'}</h3>
              <button type="button" title="Close" onClick={() => setBannerPanel(false)} className="p-1 text-zinc-500 hover:text-zinc-300 rounded"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={bannerForm.handleSubmit(d => saveBanner.mutate(d))} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Title *</label>
                <input {...bannerForm.register('title')} className={inp} placeholder="Summer Sale" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Subtitle</label>
                <input {...bannerForm.register('subtitle')} className={inp} placeholder="Up to 50% off" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Image URL *</label>
                <input {...bannerForm.register('image')} className={inp} placeholder="https://…" />
                {bannerForm.formState.errors.image && <p className="text-xs text-red-400 mt-1">{bannerForm.formState.errors.image.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Link URL</label>
                  <input {...bannerForm.register('link')} className={inp} placeholder="/category/sale" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Sort Order</label>
                  <input {...bannerForm.register('sortOrder')} type="number" className={inp} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input type="checkbox" {...bannerForm.register('isActive')} className="rounded border-zinc-700 bg-zinc-800 text-emerald-500" />
                Active (visible on store)
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setBannerPanel(false)} className="flex-1 py-2 border border-zinc-700 text-zinc-400 text-sm rounded-lg hover:border-zinc-600 transition-colors">Cancel</button>
                <button type="submit" disabled={bannerForm.formState.isSubmitting} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                  {bannerForm.formState.isSubmitting ? 'Saving…' : editBanner ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
