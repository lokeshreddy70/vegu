'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('/api/auth/register', data);
      if (!res.data?.data) throw new Error('Invalid server response');
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome to VEGU, ${user.name.split(' ')[0]}!`, { style: { background: '#1A1A1A', color: '#fff', border: '1px solid #272727' } });
      if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'VENDOR') router.push('/vendor');
      else router.push('/');
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(axiosMsg || 'Could not create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-gold rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20">
              <Leaf className="w-7 h-7 text-black" />
            </div>
            <span className="text-white font-bold text-2xl tracking-wide">vegu</span>
          </Link>
          <h1 className="text-white font-bold text-2xl mt-4 mb-1">Create account</h1>
          <p className="text-zinc-500 text-sm">Fresh groceries, delivered fast</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-zinc-400 text-xs font-semibold mb-1.5 block">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                placeholder="Your full name"
                autoComplete="name"
                {...register('name')}
                className="w-full bg-app-card border border-app-border rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-gold/50"
              />
            </div>
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-zinc-400 text-xs font-semibold mb-1.5 block">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
                className="w-full bg-app-card border border-app-border rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-gold/50"
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-zinc-400 text-xs font-semibold mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                {...register('password')}
                className="w-full bg-app-card border border-app-border rounded-xl pl-9 pr-10 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-gold/50"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label="Toggle password visibility"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gold text-black font-bold py-3.5 rounded-2xl text-sm disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-zinc-500 text-sm text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-gold font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
