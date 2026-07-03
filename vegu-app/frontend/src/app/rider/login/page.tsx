'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRiderAuthStore } from '@/store/rider-auth.store';
import { resolveApiBase } from '@/lib/apiBase';

const rawApi = axios.create({ baseURL: resolveApiBase(), timeout: 20000, headers: { 'Content-Type': 'application/json' } });

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

const vehicles = [
  { id: 'bike',   label: 'Bike',   icon: '🏍️' },
  { id: 'scooter',label: 'Scooter',icon: '🛵' },
  { id: 'cycle',  label: 'Cycle',  icon: '🚲' },
  { id: 'car',    label: 'Car',    icon: '🚗' },
] as const;

export default function RiderLoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [mode, setMode] = useState<'login' | 'upgrade'>('login');
  const [upgradeToken, setUpgradeToken] = useState('');
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<typeof vehicles[number]['id']>('bike');
  const [upgrading, setUpgrading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const { setAuth, user, isAuthenticated } = useRiderAuthStore();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && isAuthenticated && user?.role === 'DELIVERY') router.replace('/rider');
  }, [mounted, isAuthenticated, user, router]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onLogin = async (data: FormData) => {
    try {
      const res = await rawApi.post('/api/auth/login', { email: data.email, password: data.password });
      const { user: u, accessToken, refreshToken } = res.data.data;
      if (u.role === 'DELIVERY') {
        setAuth(u, accessToken, refreshToken);
        toast.success(`Welcome, ${u.name.split(' ')[0]}`);
        router.push('/rider');
        return;
      }
      if (u.role === 'ADMIN' || u.role === 'VENDOR') {
        toast.error('Admin/vendor accounts cannot use the rider portal.');
        return;
      }
      setUpgradeToken(accessToken);
      setUpgradeEmail(data.email);
      setUpgradePassword(data.password);
      setMode('upgrade');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed');
    }
  };

  const onUpgrade = async () => {
    setUpgrading(true);
    try {
      await rawApi.post('/api/rider/register', { vehicleType: selectedVehicle }, { headers: { Authorization: `Bearer ${upgradeToken}` } });
      const res = await rawApi.post('/api/auth/login', { email: upgradeEmail, password: upgradePassword });
      const { user: u, accessToken, refreshToken } = res.data.data;
      setAuth(u, accessToken, refreshToken);
      toast.success('You are now a VEGU Rider');
      router.push('/rider');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] flex flex-col items-center justify-center px-5 relative overflow-hidden">

      {/* Ambient glow — pure atmosphere */}
      <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-[0.07] rider-ambient-glow" />

      {/* Brand */}
      <div className="text-center mb-10 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-[22px] mb-6 shadow-2xl">
          <span className="text-black text-2xl">⚡</span>
        </div>
        <div>
          <h1 className="text-emerald-900 text-[40px] font-black tracking-[-2px] leading-none">VEGU</h1>
          <p className="text-emerald-700/70 text-[10px] font-bold tracking-[0.5em] uppercase mt-1.5">RIDER PORTAL</p>
        </div>
      </div>

      {/* Login form */}
      {mode === 'login' && (
        <div className="w-full max-w-sm relative z-10">
          <div className="bg-white/90 backdrop-blur-xl border border-emerald-100 rounded-[28px] p-6 shadow-xl">
            <p className="text-gray-900 font-bold text-lg mb-0.5">Sign in</p>
            <p className="text-gray-500 text-sm mb-6">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit(onLogin)} className="space-y-3">
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

              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Password"
                    autoComplete="current-password"
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-2xl text-sm mt-2 hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-5">
              New rider?{' '}
              <a href="/rider/register" className="text-emerald-700 hover:text-emerald-600 transition-colors font-semibold">
                Register here
              </a>
            </p>
          </div>

          <p className="text-center mt-5">
            <a href="/" className="text-gray-500 text-xs hover:text-gray-700 transition-colors tracking-wide">
              ← Customer App
            </a>
          </p>
        </div>
      )}

      {/* Upgrade to rider */}
      {mode === 'upgrade' && (
        <div className="w-full max-w-sm relative z-10">
          <div className="bg-white/90 backdrop-blur-xl border border-emerald-100 rounded-[28px] p-6 shadow-xl">
            <div className="mb-5">
              <p className="text-gray-900 font-bold text-lg mb-1">One more step</p>
              <p className="text-gray-500 text-sm">Select your vehicle to join as a rider</p>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-5">
              {vehicles.map(v => (
                <button key={v.id} type="button" onClick={() => setSelectedVehicle(v.id)}
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

            <button type="button" onClick={onUpgrade} disabled={upgrading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-40 active:scale-[0.98] transition-all">
              {upgrading ? 'Registering…' : 'Join as Rider'}
              {!upgrading && <ChevronRight className="w-4 h-4" />}
            </button>

            <button type="button" onClick={() => setMode('login')}
              className="w-full mt-3 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
