'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, Bike, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRiderAuthStore } from '@/store/rider-auth.store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// Raw axios — bypasses the stored-token interceptor
const rawApi = axios.create({
  baseURL: '',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  vehicleType: z.enum(['bike', 'scooter', 'cycle', 'car']).optional(),
});

type FormData = z.infer<typeof schema>;

const vehicles = [
  { id: 'bike', label: 'Bike', icon: '🏍️' },
  { id: 'scooter', label: 'Scooter', icon: '🛵' },
  { id: 'cycle', label: 'Cycle', icon: '🚲' },
  { id: 'car', label: 'Car', icon: '🚗' },
];

export default function RiderLoginPage() {
  const [showPass, setShowPass] = useState(false);
  // 'login' → normal login form
  // 'upgrade' → user logged in but not a rider yet; show vehicle picker to upgrade
  const [mode, setMode] = useState<'login' | 'upgrade'>('login');
  const [upgradeToken, setUpgradeToken] = useState('');
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<'bike' | 'scooter' | 'cycle' | 'car'>('bike');
  const [upgrading, setUpgrading] = useState(false);

  const router = useRouter();
  const { setAuth, user, isAuthenticated } = useRiderAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'DELIVERY') {
      router.replace('/rider');
    }
  }, [isAuthenticated, user, router]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onLogin = async (data: FormData) => {
    try {
      const res = await rawApi.post('/api/auth/login', {
        email: data.email,
        password: data.password,
      });
      const { user: loggedIn, accessToken, refreshToken } = res.data.data;

      if (loggedIn.role === 'DELIVERY') {
        // Already a rider — store and go
        setAuth(loggedIn, accessToken, refreshToken);
        toast.success(`Welcome back, ${loggedIn.name.split(' ')[0]}!`);
        router.push('/rider');
        return;
      }

      // Admin and vendor accounts cannot use the rider portal
      if (loggedIn.role === 'ADMIN' || loggedIn.role === 'VENDOR') {
        toast.error('Admin and vendor accounts cannot access the rider portal.');
        return;
      }

      // Regular customer — offer to upgrade to rider
      setUpgradeToken(accessToken);
      setUpgradeEmail(data.email);
      setUpgradePassword(data.password);
      setMode('upgrade');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Check your email and password.';
      toast.error(msg);
    }
  };

  const onUpgrade = async () => {
    setUpgrading(true);
    try {
      // Register as delivery partner using the token from the login above
      await rawApi.post(
        '/api/rider/register',
        { vehicleType: selectedVehicle },
        { headers: { Authorization: `Bearer ${upgradeToken}` } },
      );

      // Re-login to get a token with the new DELIVERY role
      const loginRes = await rawApi.post('/api/auth/login', {
        email: upgradeEmail,
        password: upgradePassword,
      });
      const { user: riderUser, accessToken, refreshToken } = loginRes.data.data;

      setAuth(riderUser, accessToken, refreshToken);
      toast.success('You are now a VEGU Rider!');
      router.push('/rider');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not complete registration.';
      toast.error(msg);
    } finally {
      setUpgrading(false);
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
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-green-900/30">
            <Bike className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">VEGU Rider</h1>
          <p className="text-green-200 text-sm">Delivery Partner Portal</p>
        </div>

        {mode === 'login' && (
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Sign in</h2>

            <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="rider@example.com"
                autoComplete="email"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="Your password"
                autoComplete="current-password"
                icon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPass(!showPass)} aria-label="Toggle password">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />

              <Button type="submit" loading={isSubmitting} className="w-full !bg-green-600 hover:!bg-green-700">
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
        )}

        {mode === 'upgrade' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 shadow-2xl"
          >
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Bike className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">One more step!</h2>
              <p className="text-sm text-gray-500 mt-1">
                You have an account but are not a rider yet. Pick your vehicle to join.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-5">
              {vehicles.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVehicle(v.id as typeof selectedVehicle)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-medium transition-all ${
                    selectedVehicle === v.id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-xl">{v.icon}</span>
                  {v.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onUpgrade}
              disabled={upgrading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-2xl font-semibold disabled:opacity-60"
            >
              {upgrading ? 'Registering...' : 'Complete Registration'}
              {!upgrading && <ChevronRight className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back to sign in
            </button>
          </motion.div>
        )}

        <p className="text-center mt-6">
          <a href="/" className="text-green-200 text-sm hover:text-white transition-colors">
            ← Back to VEGU Shopping App
          </a>
        </p>
      </motion.div>
    </div>
  );
}
