'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { User, Phone, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Enter a valid phone number').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.patch('/api/auth/me', data);
      updateUser(res.data.data);
      toast.success('Profile updated');
      router.push('/account');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="container-page py-8 max-w-lg">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h1>

        <div className="card p-8">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-green-400 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <span className="text-2xl font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-bold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Full Name"
              icon={<User className="w-4 h-4" />}
              placeholder="Your full name"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Phone Number"
              icon={<Phone className="w-4 h-4" />}
              placeholder="+91 9876543210"
              error={errors.phone?.message}
              {...register('phone')}
            />

            <div className="pt-2">
              <Button type="submit" className="w-full" loading={isSubmitting} disabled={!isDirty}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
