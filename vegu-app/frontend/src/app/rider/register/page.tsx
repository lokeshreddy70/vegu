'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Car, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRiderAuthStore } from '@/store/rider-auth.store';

const rawApi = axios.create({ baseURL: '', timeout: 20000, headers: { 'Content-Type': 'application/json' } });

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  vehicleType: z.enum(['bike', 'scooter', 'cycle', 'car']),
  vehicleNo: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const vehicles = [
  { id: 'bike',    label: 'Bike',    icon: '🏍️' },
  { id: 'scooter', label: 'Scooter', icon: '🛵' },
  { id: 'cycle',   label: 'Cycle',   icon: '🚲' },
  { id: 'car',     label: 'Car',     icon: '🚗' },
] as const;

export default function RiderRegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { setAuth, user, isAuthenticated } = useRiderAuthStore();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && isAuthenticated && user?.role === 'DELIVERY') router.replace('/rider');
  }, [mounted, isAuthenticated, user, router]);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vehicleType: 'bike' },
  });
  const selectedVehicle = watch('vehicleType');

  const onSubmit = async (data: FormData) => {
    try {
      const regRes = await rawApi.post('/api/auth/register', {
        name: data.name, email: data.email, password: data.password,
      });
      const tempToken: string = regRes.data.data.accessToken;
      await rawApi.post(
        '/api/rider/register',
        { vehicleType: data.vehicleType, vehicleNo: data.vehicleNo || undefined },
        { headers: { Authorization: `Bearer ${tempToken}` } },
      );
      const loginRes = await rawApi.post('/api/auth/login', { email: data.email, password: data.password });
      const { user: riderUser, accessToken, refreshToken } = loginRes.data.data;
      setAuth(riderUser, accessToken, refreshToken);
      setDone(true);
      setTimeout(() => router.push('/rider'), 1800);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed. Please try again.',
      );
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/[0.06] border border-white/[0.1] rounded-[22px] flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-9 h-9 text-white/70" />
          </div>
          <h2 className="text-white text-2xl font-black tracking-tight mb-2">You&apos;re in.</h2>
          <p className="text-white/30 text-sm">Taking you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-[0.05] rider-ambient-glow pointer-events-none" />

      {/* Brand */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-[18px] mb-5 shadow-2xl">
          <span className="text-black text-xl">⚡</span>
        </div>
        <h1 className="text-white text-[36px] font-black tracking-[-2px] leading-none">VEGU</h1>
        <p className="text-white/25 text-[10px] font-bold tracking-[0.5em] uppercase mt-1.5">RIDER PORTAL</p>
      </div>

      {/* Perks */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-sm mb-5 relative z-10">
        {[
          { icon: '💰', label: '₹500+/day' },
          { icon: '⏰', label: 'Flexible' },
          { icon: '🎯', label: 'Weekly pay' },
        ].map(p => (
          <div key={p.label} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-3 text-center">
            <div className="text-lg mb-1">{p.icon}</div>
            <p className="text-white/35 text-[10px] font-semibold tracking-wide">{p.label}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="w-full max-w-sm relative z-10">
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.07] rounded-[28px] p-6">
          <p className="text-white font-bold text-lg mb-0.5">Create account</p>
          <p className="text-white/35 text-sm mb-6">Join the VEGU rider network</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Name */}
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Full name"
                  autoComplete="name"
                  {...register('name')}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25 transition-all"
                />
              </div>
              {errors.name && <p className="text-red-400/80 text-xs mt-1.5 ml-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25 transition-all"
                />
              </div>
              {errors.email && <p className="text-red-400/80 text-xs mt-1.5 ml-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password (min. 8 chars)"
                  autoComplete="new-password"
                  {...register('password')}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} aria-label="Toggle password"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400/80 text-xs mt-1.5 ml-1">{errors.password.message}</p>}
            </div>

            {/* Vehicle type */}
            <div>
              <p className="text-white/30 text-xs font-semibold tracking-wide mb-2 ml-1">Vehicle type</p>
              <div className="grid grid-cols-4 gap-2">
                {vehicles.map(v => (
                  <button key={v.id} type="button" onClick={() => setValue('vehicleType', v.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all text-xs font-semibold ${
                      selectedVehicle === v.id
                        ? 'border-white/40 bg-white/10 text-white'
                        : 'border-white/[0.07] bg-white/[0.03] text-white/30'
                    }`}>
                    <span className="text-xl">{v.icon}</span>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle number */}
            <div>
              <div className="relative">
                <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Vehicle number (optional)"
                  autoComplete="off"
                  {...register('vehicleNo')}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/25 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-black font-bold py-3.5 rounded-2xl text-sm mt-2 hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {isSubmitting ? 'Setting up account…' : 'Start Delivering'}
            </button>
          </form>

          <p className="text-center text-xs text-white/25 mt-5">
            Already a rider?{' '}
            <a href="/rider/login" className="text-white/50 hover:text-white transition-colors font-semibold">
              Sign in
            </a>
          </p>
        </div>

        <p className="text-center mt-5">
          <a href="/" className="text-white/20 text-xs hover:text-white/40 transition-colors tracking-wide">
            ← Customer App
          </a>
        </p>
      </div>
    </div>
  );
}
