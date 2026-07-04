'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Car, CheckCircle2, Camera, FileImage, ShieldCheck, CreditCard, BadgeIndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRiderAuthStore } from '@/store/rider-auth.store';
import { resolveApiBase } from '@/lib/apiBase';

const rawApi = axios.create({ baseURL: resolveApiBase(), timeout: 20000, headers: { 'Content-Type': 'application/json' } });

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Phone is required'),
  password: z.string().min(8, 'At least 8 characters'),
  vehicleType: z.enum(['bike', 'scooter', 'cycle', 'car']),
  vehicleNo: z.string().min(4, 'Vehicle number is required'),
});
type FormData = z.infer<typeof schema>;

const vehicles = [
  { id: 'bike', label: 'Bike', icon: '🏍️' },
  { id: 'scooter', label: 'Scooter', icon: '🛵' },
  { id: 'cycle', label: 'Cycle', icon: '🚲' },
  { id: 'car', label: 'Car', icon: '🚗' },
] as const;

async function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function UploadCard({ label, value, onPick, accent, icon }: {
  label: string;
  value?: string;
  onPick: () => void;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onPick} className={`w-full rounded-2xl border border-dashed px-4 py-4 text-left transition-colors ${accent}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white p-2 shadow-sm">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-1 text-xs text-slate-500">{value ? 'Photo captured' : 'Tap to capture or upload'}</p>
        </div>
        {value && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
      </div>
    </button>
  );
}

export default function RiderRegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [drivingLicense, setDrivingLicense] = useState('');
  const [aadhaarPhoto, setAadhaarPhoto] = useState('');
  const [rcDocument, setRcDocument] = useState('');
  const [insuranceDocument, setInsuranceDocument] = useState('');
  const router = useRouter();
  const { setAuth, user, isAuthenticated } = useRiderAuthStore();

  const profileRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);
  const aadhaarRef = useRef<HTMLInputElement>(null);
  const rcRef = useRef<HTMLInputElement>(null);
  const insuranceRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && isAuthenticated && user?.role === 'DELIVERY') router.replace('/rider');
  }, [mounted, isAuthenticated, user, router]);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vehicleType: 'bike' },
  });
  const selectedVehicle = watch('vehicleType');

  const pickFile = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setter(await toBase64(file));
  };

  const onSubmit = async (data: FormData) => {
    if (!profilePhoto) {
      toast.error('Live profile photo is required');
      return;
    }
    if (!drivingLicense) {
      toast.error('Driving licence photo is required');
      return;
    }

    try {
      const regRes = await rawApi.post('/api/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      const tempToken: string = regRes.data.data.accessToken;

      await rawApi.post('/api/rider/register', {
        vehicleType: data.vehicleType,
        vehicleNo: data.vehicleNo,
        profilePhoto,
        drivingLicense,
        aadhaarPhoto: aadhaarPhoto || undefined,
        rcDocument: rcDocument || undefined,
        insuranceDocument: insuranceDocument || undefined,
      }, { headers: { Authorization: `Bearer ${tempToken}` } });

      const loginRes = await rawApi.post('/api/auth/login', { email: data.email, password: data.password });
      const { user: riderUser, accessToken, refreshToken } = loginRes.data.data;
      setAuth(riderUser, accessToken, refreshToken);
      setDone(true);
      setTimeout(() => router.push('/rider'), 1800);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06281d] px-5">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.06]">
            <CheckCircle2 className="h-9 w-9 text-white/80" />
          </div>
          <h2 className="mb-2 text-2xl font-black tracking-tight text-white">Profile submitted</h2>
          <p className="text-sm text-white/60">Taking you to your rider dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dcfce7_0%,#f8fafc_38%,#eef2ff_100%)] px-5 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-white shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-100">
            <Car className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-[38px] font-black tracking-[-2px] text-emerald-900">VEGU</h1>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.45em] text-emerald-700/70">Rider Portal</p>
        </div>

        <div className="rounded-[32px] border border-emerald-100 bg-white/90 p-6 shadow-2xl shadow-emerald-500/10 backdrop-blur">
          <p className="text-3xl font-black tracking-tight text-slate-900">Create account</p>
          <p className="mt-1 text-sm text-slate-500">Join the VEGU rider network with your real profile and documents</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input {...register('name')} placeholder="Full name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" />
                </div>
                {errors.name && <p className="ml-1 mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="email" autoComplete="email" {...register('email')} placeholder="rider@example.com" className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" />
                </div>
                {errors.email && <p className="ml-1 mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</label>
                <input type="tel" autoComplete="tel" {...register('phone')} placeholder="Phone number" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" />
                {errors.phone && <p className="ml-1 mt-1.5 text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle Number</label>
                <input type="text" autoCapitalize="characters" {...register('vehicleNo')} placeholder="AP39AB1234" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" />
                {errors.vehicleNo && <p className="ml-1 mt-1.5 text-xs text-red-500">{errors.vehicleNo.message}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type={showPass ? 'text' : 'password'} autoComplete="new-password" {...register('password')} placeholder="At least 8 characters" className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-12 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" />
                <button type="button" onClick={() => setShowPass(!showPass)} aria-label="Toggle password visibility" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="ml-1 mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle Type</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => setValue('vehicleType', vehicle.id)}
                    className={`rounded-2xl border px-3 py-4 text-left transition-all ${selectedVehicle === vehicle.id ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                  >
                    <div className="text-2xl">{vehicle.icon}</div>
                    <p className="mt-2 text-sm font-semibold">{vehicle.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Verification Documents
              </div>
              <div className="space-y-3">
                <UploadCard label="Live Profile Photo" value={profilePhoto} onPick={() => profileRef.current?.click()} accent="bg-emerald-50/70 hover:bg-emerald-100/70" icon={<Camera className="h-4 w-4 text-emerald-600" />} />
                <UploadCard label="Driving Licence Photo" value={drivingLicense} onPick={() => licenseRef.current?.click()} accent="bg-blue-50/70 hover:bg-blue-100/70" icon={<CreditCard className="h-4 w-4 text-blue-600" />} />
                <UploadCard label="Aadhaar Photo" value={aadhaarPhoto} onPick={() => aadhaarRef.current?.click()} accent="bg-amber-50/70 hover:bg-amber-100/70" icon={<BadgeIndianRupee className="h-4 w-4 text-amber-600" />} />
                <UploadCard label="RC Document" value={rcDocument} onPick={() => rcRef.current?.click()} accent="bg-violet-50/70 hover:bg-violet-100/70" icon={<FileImage className="h-4 w-4 text-violet-600" />} />
                <UploadCard label="Insurance Document" value={insuranceDocument} onPick={() => insuranceRef.current?.click()} accent="bg-slate-100 hover:bg-slate-200" icon={<FileImage className="h-4 w-4 text-slate-600" />} />
              </div>
            </div>

            <input ref={profileRef} hidden type="file" accept="image/*" onChange={(e) => void pickFile(e, setProfilePhoto)} />
            <input ref={licenseRef} hidden type="file" accept="image/*" onChange={(e) => void pickFile(e, setDrivingLicense)} />
            <input ref={aadhaarRef} hidden type="file" accept="image/*" onChange={(e) => void pickFile(e, setAadhaarPhoto)} />
            <input ref={rcRef} hidden type="file" accept="image/*" onChange={(e) => void pickFile(e, setRcDocument)} />
            <input ref={insuranceRef} hidden type="file" accept="image/*" onChange={(e) => void pickFile(e, setInsuranceDocument)} />

            <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:opacity-40">
              {isSubmitting ? 'Submitting profile…' : 'Start Delivering'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already a rider? <a href="/rider/login" className="font-semibold text-emerald-700">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
