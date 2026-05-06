'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Plus, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function VendorProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-products'],
    queryFn: () => api.get('/api/vendor/products').then(r => r.data),
  });

  const { data: cats } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then(r => r.data.data),
  });

  const { mutate: toggleAvail } = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      api.patch(`/api/vendor/products/${id}`, { isAvailable }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['vendor-products'] }); },
  });

  const products = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">{data?.meta?.total || 0} products</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {showForm && (
        <AddProductForm cats={cats || []} onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['vendor-products'] }); }} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="card aspect-square skeleton" />)
          : products.map((p: { id: string; images: string[]; name: string; price: number; stock: number; unit: string; isAvailable: boolean }) => (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-4">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-3">
                  {p.images[0] ? (
                    <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="200px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                  )}
                  <div className={`absolute top-2 right-2 badge text-xs ${p.isAvailable ? 'badge-green' : 'badge-red'}`}>
                    {p.isAvailable ? 'Live' : 'Hidden'}
                  </div>
                </div>
                <p className="font-semibold text-gray-900 text-sm line-clamp-1">{p.name}</p>
                <p className="text-primary-600 font-bold mt-0.5">{formatPrice(p.price)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Stock: {p.stock} {p.unit}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => toggleAvail({ id: p.id, isAvailable: !p.isAvailable })}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${p.isAvailable ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                  >
                    {p.isAvailable ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                    {p.isAvailable ? 'Hide' : 'Show'}
                  </button>
                </div>
              </motion.div>
            ))}
      </div>
    </div>
  );
}

function AddProductForm({ cats, onSuccess }: { cats: { id: string; name: string }[]; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', slug: '', price: '', stock: '', unit: 'kg', categoryId: '', images: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/vendor/products', {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        images: form.images ? [form.images] : [],
      });
      toast.success('Product created!');
      onSuccess();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2 font-bold text-gray-900 text-lg border-b pb-3 mb-1">New Product</div>
      {[
        { k: 'name', label: 'Name', placeholder: 'Product name' },
        { k: 'slug', label: 'Slug', placeholder: 'product-slug' },
        { k: 'price', label: 'Price (₹)', placeholder: '99', type: 'number' },
        { k: 'stock', label: 'Stock', placeholder: '100', type: 'number' },
        { k: 'unit', label: 'Unit', placeholder: 'kg / pcs / g' },
        { k: 'images', label: 'Image URL', placeholder: 'https://...' },
      ].map(({ k, label, placeholder, type = 'text' }) => (
        <div key={k}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
          <input type={type} placeholder={placeholder} value={form[k as keyof typeof form]} onChange={set(k as keyof typeof form)} className="input" required={k !== 'images'} />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
        <select value={form.categoryId} onChange={set('categoryId')} className="input" required>
          <option value="">Select category</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea rows={2} placeholder="Product description" value={form.description} onChange={set('description')} className="input resize-none" />
      </div>
      <div className="sm:col-span-2 flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" loading={loading}>Create Product</Button>
      </div>
    </form>
  );
}
