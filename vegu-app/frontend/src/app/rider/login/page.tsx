'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, Bike } from 'lucide-react';
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

export default function RiderLoginPage() {
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const { setAuth, user, isAuthenticated } = useAuthStore();

  // If already logged in as a rider, go to dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === 'DELIVERY') {
      router.replace('/rider');
    }
  }, [isAuthenticated, user, router]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('/api/auth/login', data);
      const { user: loggedIn, accessToken, refreshToken } = res.data.data;
      if (loggedIn.role !== 'DELIVERY') {
        toast.error('This login is only for VEGU delivery riders');
        return;
      }
      setAuth(loggedIn, accessToken, refreshToken);
      toast.success(`Welcome, ${loggedIn.name.split(' ')[0]}!`);
      router.push('/rider');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-green-900/30">
            <Bike className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">VEGU Rider</h1>
          <p className="text-green-200 text-sm">Delivery Partner Portal</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="rider@example.com"
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

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full !bg-green-600 hover:!bg-green-700"
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            New rider?{' '}
            <a href="/rider/register" className="text-green-600 font-semibold hover:underline">
              Join as a rider
            </a>
          </p>
        </div>

        <p className="text-center mt-5">
          <a href="/" className="text-green-200 text-sm hover:text-white transition-colors">
            ← Back to VEGU Shopping App
          </a>
        </p>
      </motion.div>
    </div>
  );
}
