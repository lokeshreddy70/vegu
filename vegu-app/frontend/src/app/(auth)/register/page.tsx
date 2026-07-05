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
  referralCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('/api/auth/register', {
        ...data,
        referralCode: data.referralCode?.trim() || undefined,
      });
      if (!res.data?.data) throw new Error('Invalid server response');
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome to Vegu, ${user.name.split(' ')[0]}!`);
      if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'VENDOR') router.push('/vendor');
      else router.push('/');
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(axiosMsg || 'Could not create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] flex flex-col">
      {/* Green top banner */}
      <div className="keyboard-hide bg-veg px-6 pt-14 pb-10 flex flex-col items-center">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md mb-3">
          <Leaf className="w-7 h-7 text-veg" />
        </div>
        <span className="text-white font-black text-3xl italic tracking-wide">vegú</span>
        <p className="text-white/80 text-sm mt-1">Fresh groceries in 10 minutes</p>
      </div>

      {/* White card form */}
      <div className="flex-1 bg-[#F7F9FA] px-5 pt-8 pb-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-gray-900 font-bold text-xl mb-1">Create account 🌿</h1>
          <p className="text-gray-500 text-sm mb-6">Start your fresh journey today</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-gray-700 text-xs font-semibold mb-1.5 block">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  placeholder="Your full name"
                  autoComplete="name"
                  autoCapitalize="words"
                  autoCorrect="on"
                  spellCheck
                  enterKeyHint="next"
                  {...register('name')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-veg focus:ring-2 focus:ring-veg/10 transition-all"
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-gray-700 text-xs font-semibold mb-1.5 block">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="email"
                  enterKeyHint="next"
                  {...register('email')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-veg focus:ring-2 focus:ring-veg/10 transition-all"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-gray-700 text-xs font-semibold mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="done"
                  {...register('password')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-veg focus:ring-2 focus:ring-veg/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label="Toggle password visibility"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="text-gray-700 text-xs font-semibold mb-1.5 block">Referral Code (Optional)</label>
              <input
                placeholder="Enter referral code"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
                {...register('referralCode')}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-veg focus:ring-2 focus:ring-veg/10 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-veg text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-50 mt-2 shadow-lg shadow-veg/30"
            >
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-gray-500 text-sm text-center mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-veg font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
