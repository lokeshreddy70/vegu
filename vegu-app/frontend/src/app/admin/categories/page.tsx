'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Tag, ToggleLeft, ToggleRight } from 'lucide-react';

type Category = {
  id: string; name: string; slug: string; image?: string; icon?: string; color?: string;
  isActive: boolean; sortOrder: number; parentId?: string;
  _count?: { products: number }; children?: { id: string; name: string }[];
};

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});
type F = z.infer<typeof schema>;

const inp = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors';

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/api/admin/categories').then(r => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });

  const openAdd = () => { setEditing(null); reset({}); setShowForm(true); };
  const openEdit = (c: Category) => {
    setEditing(c);
    reset({ name: c.name, image: c.image ?? '', icon: c.icon ?? '', color: c.color ?? '', parentId: c.parentId ?? '', sortOrder: c.sortOrder, isActive: c.isActive });
    setShowForm(true);
  };

  const save = useMutation({
    mutationFn: (d: F) => editing
      ? api.patch(`/api/admin/categories/${editing.id}`, d)
      : api.post('/api/admin/categories', d),
    onSuccess: () => { toast.success(editing ? 'Updated' : 'Created'); setShowForm(false); qc.invalidateQueries({ queryKey: ['admin-categories'] }); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/categories/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-categories'] }); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Cannot delete'),
  });

  const toggle = useMutation({
    mutationFn: (c: Category) => api.patch(`/api/admin/categories/${c.id}`, { isActive: !c.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  });

  const roots = categories.filter(c => !c.parentId);

  return (
    <div className="p-6 space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Categories</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{categories.length} categories</p>
        </div>
        <button type="button" onClick={openAdd} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl h-28 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roots.map(cat => (
            <div key={cat.id} className={`bg-zinc-900 border rounded-xl p-4 transition-colors ${cat.isActive ? 'border-zinc-800' : 'border-zinc-800/50 opacity-60'}`}>
              <div className="flex items-start gap-3">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-lg object-cover bg-zinc-800 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color ? `${cat.color}22` : undefined }}>
                    <Tag className="w-5 h-5 text-zinc-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-100 truncate">{cat.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{cat._count?.products ?? 0} products</p>
                  {cat.children && cat.children.length > 0 && (
                    <p className="text-[10px] text-zinc-600 mt-1">{cat.children.map(c => c.name).join(', ')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800">
                <button type="button" title={cat.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggle.mutate(cat)} className={`p-1.5 rounded-lg transition-colors ${cat.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-zinc-600 hover:text-emerald-400 hover:bg-zinc-800'}`}>
                  {cat.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <span className="text-[10px] text-zinc-600 flex-1">Sort: {cat.sortOrder}</span>
                <button type="button" title="Edit" onClick={() => openEdit(cat)} className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button type="button" title="Delete" onClick={() => { if (confirm('Delete this category?')) remove.mutate(cat.id); }} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {!roots.length && (
            <div className="col-span-3 py-16 text-center">
              <Tag className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-600">No categories yet</p>
            </div>
          )}
        </div>
      )}

      {/* Form panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
              <h3 className="text-sm font-semibold text-white">{editing ? 'Edit Category' : 'Add Category'}</h3>
              <button type="button" title="Close" onClick={() => setShowForm(false)} className="p-1 text-zinc-500 hover:text-zinc-300 rounded"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit(d => save.mutate(d))} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Name *</label>
                <input {...register('name')} className={inp} placeholder="e.g. Vegetables" />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
                <textarea {...register('description')} rows={2} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Image URL</label>
                <input {...register('image')} className={inp} placeholder="https://…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Icon (emoji)</label>
                  <input {...register('icon')} className={inp} placeholder="🥦" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Color (hex)</label>
                  <input {...register('color')} className={inp} placeholder="#10b981" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Sort Order</label>
                  <input {...register('sortOrder')} type="number" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Parent Category</label>
                  <select {...register('parentId')} className={inp}>
                    <option value="">None (top level)</option>
                    {categories.filter(c => c.id !== editing?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input type="checkbox" {...register('isActive')} className="rounded border-zinc-700 bg-zinc-800 text-emerald-500" />
                Active (visible on store)
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-zinc-700 text-zinc-400 text-sm rounded-lg hover:border-zinc-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                  {isSubmitting ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
