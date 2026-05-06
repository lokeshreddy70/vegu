'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('/api/auth/login', data);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'VENDOR') router.push('/vendor');
      else router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-green-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary-600 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            VEGU
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-500">Sign in to continue shopping fresh</p>
        </div>

        <div className="card p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              placeholder="Your password"
              icon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary-600 font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-2xl text-sm text-gray-600">
            <p className="font-semibold text-gray-700 mb-2">Demo accounts:</p>
            <p>🛒 Customer: customer@vegu.app / Customer@2024</p>
            <p>🏪 Vendor: vendor@vegu.app / Vendor@2024</p>
            <p>⚙️ Admin: admin@vegu.app / VeguAdmin@2024</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
