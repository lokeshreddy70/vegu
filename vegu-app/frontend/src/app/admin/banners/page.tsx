'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  isActive: boolean;
  sortOrder: number;
}

const schema = z.object({
  title: z.string().min(2, 'Title required'),
  subtitle: z.string().optional(),
  image: z.string().url('Must be a valid URL'),
  link: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
});
type FormData = z.infer<typeof schema>;

export default function AdminBannersPage() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['admin-banners'],
    queryFn: () => api.get('/api/admin/banners').then(r => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutate: deleteBanner } = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/banners/${id}`),
    onSuccess: () => { toast.success('Banner deleted'); qc.invalidateQueries({ queryKey: ['admin-banners'] }); },
    onError: () => toast.error('Failed to delete banner'),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/api/admin/banners', data);
      toast.success('Banner created');
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      setShowForm(false);
      reset();
    } catch {
      toast.error('Failed to create banner');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banners</h1>
          <p className="text-gray-500 mt-1">Manage homepage promotional banners</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Add Banner
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 text-lg mb-5">New Banner</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Title" {...register('title')} error={errors.title?.message} placeholder="Fresh Fruits & Veggies" />
            <Input label="Subtitle (optional)" {...register('subtitle')} placeholder="Delivered in 30 minutes" />
            <div className="sm:col-span-2">
              <Input label="Image URL" {...register('image')} error={errors.image?.message} placeholder="https://images.unsplash.com/..." />
            </div>
            <Input label="Link (optional)" {...register('link')} placeholder="/products?category=fruits" />
            <Input label="Sort Order" type="number" {...register('sortOrder')} placeholder="1" />
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>Create Banner</Button>
            </div>
          </form>
        </div>
      )}

      {/* Banner list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-40 rounded-3xl" />)}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No banners yet</h3>
          <p className="text-gray-500">Create your first promotional banner</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((banner, i) => (
            <motion.div key={banner.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="relative h-40 bg-gray-100">
                <Image src={banner.image} alt={banner.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <p className="text-white font-bold">{banner.title}</p>
                  {banner.subtitle && <p className="text-white/80 text-sm">{banner.subtitle}</p>}
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`badge text-xs ${banner.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Order: {banner.sortOrder}</p>
                  {banner.link && <p className="text-xs text-primary-600 font-medium mt-0.5">{banner.link}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => deleteBanner(banner.id)}
                  aria-label="Delete banner"
                  className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
