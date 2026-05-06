'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Bike, Car, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  vehicleType: z.enum(['bike', 'scooter', 'cycle', 'car']),
  vehicleNo: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const vehicles = [
  { id: 'bike', label: 'Bike', icon: '🏍️' },
  { id: 'scooter', label: 'Scooter', icon: '🛵' },
  { id: 'cycle', label: 'Cycle', icon: '🚲' },
  { id: 'car', label: 'Car', icon: '🚗' },
];

export default function RiderRegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const router = useRouter();
  const { setAuth, user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'DELIVERY') {
      router.replace('/rider');
    }
  }, [isAuthenticated, user, router]);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vehicleType: 'bike' },
  });

  const selectedVehicle = watch('vehicleType');

  const onSubmit = async (data: FormData) => {
    try {
      // Step 1: Create account
      const regRes = await api.post('/api/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      if (!regRes.data?.data) throw new Error('Registration failed');
      const { accessToken: tempToken } = regRes.data.data;

      // Step 2: Register as delivery partner using the fresh token
      await api.post('/api/rider/register', {
        vehicleType: data.vehicleType,
        vehicleNo: data.vehicleNo || undefined,
      }, {
        headers: { Authorization: `Bearer ${tempToken}` },
      });

      // Step 3: Re-login to get a token with DELIVERY role
      const loginRes = await api.post('/api/auth/login', {
        email: data.email,
        password: data.password,
      });
      if (!loginRes.data?.data) throw new Error('Login failed');
      const { user: riderUser, accessToken, refreshToken } = loginRes.data.data;

      setAuth(riderUser, accessToken, refreshToken);
      setStep('success');

      setTimeout(() => router.push('/rider'), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Registration failed. Please try again.';
      toast.error(msg);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome aboard!</h2>
          <p className="text-green-200">Taking you to your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-600 to-green-800 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Bike className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Join as a Rider</h1>
          <p className="text-green-200 text-sm">Earn money delivering groceries</p>
        </div>

        {/* Perks */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { icon: '💰', label: 'Earn ₹500+/day' },
            { icon: '⏰', label: 'Flexible hours' },
            { icon: '🎯', label: 'Weekly payout' },
          ].map(p => (
            <div key={p.label} className="bg-white/10 rounded-2xl p-3 text-center">
              <div className="text-xl mb-1">{p.icon}</div>
              <p className="text-white text-xs font-medium">{p.label}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-gray-900 mb-5 text-center">Create your rider account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full name"
              placeholder="Your full name"
              autoComplete="name"
              icon={<User className="w-4 h-4" />}
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              icon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPass(!showPass)} aria-label="Toggle password">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Vehicle type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle type</label>
              <div className="grid grid-cols-4 gap-2">
                {vehicles.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setValue('vehicleType', v.id as FormData['vehicleType'])}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-medium transition-all ${
                      selectedVehicle === v.id
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{v.icon}</span>
                    {v.label}
                  </button>
                ))}
              </div>
              {errors.vehicleType && <p className="text-red-500 text-xs mt-1">{errors.vehicleType.message}</p>}
            </div>

            <Input
              label="Vehicle number (optional)"
              placeholder="e.g. AP 09 AB 1234"
              autoComplete="off"
              icon={<Car className="w-4 h-4" />}
              {...register('vehicleNo')}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full !bg-green-600 hover:!bg-green-700 mt-2"
            >
              {isSubmitting ? 'Creating account...' : 'Start Delivering'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already a rider?{' '}
            <a href="/rider/login" className="text-green-600 font-semibold hover:underline">
              Sign in
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
