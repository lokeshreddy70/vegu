'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
}

const schema = z.object({
  label: z.string().default('Home'),
  fullName: z.string().min(2, 'Name required'),
  phone: z.string().min(10, 'Valid phone required'),
  line1: z.string().min(5, 'Address required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  pincode: z.string().min(6, 'Valid pincode required'),
  isDefault: z.boolean().default(false),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login');
  }, [hasHydrated, isAuthenticated, router]);

  const { data: addresses = [], isLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: () => api.get('/api/addresses').then(r => r.data.data),
    enabled: hasHydrated && isAuthenticated,
  });

  if (!hasHydrated) return null;

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const useCurrentLocation = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation is not supported on this device');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setValue('lat', latitude);
        setValue('lng', longitude);

        try {
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
          const res = await fetch(url, {
            headers: { Accept: 'application/json' },
          });
          const data = await res.json();
          const addr = data?.address || {};

          const line1 = [addr.house_number, addr.road].filter(Boolean).join(' ').trim();
          const city = addr.city || addr.town || addr.village || '';
          const state = addr.state || '';
          const pincode = addr.postcode || '';

          if (line1) setValue('line1', line1, { shouldDirty: true });
          if (city) setValue('city', city, { shouldDirty: true });
          if (state) setValue('state', state, { shouldDirty: true });
          if (pincode) setValue('pincode', pincode, { shouldDirty: true });
          toast.success('Current location captured');
        } catch {
          toast.success('Location captured. Please fill remaining address fields.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        toast.error('Location permission denied or unavailable');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const { mutate: deleteAddr } = useMutation({
    mutationFn: (id: string) => api.delete(`/api/addresses/${id}`),
    onSuccess: () => { toast.success('Address removed'); qc.invalidateQueries({ queryKey: ['addresses'] }); },
    onError: () => toast.error('Could not delete address'),
  });

  const openAdd = () => { setEditing(null); reset({}); setShowForm(true); };
  const openEdit = (a: Address) => { setEditing(a); reset(a); setShowForm(true); };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await api.patch(`/api/addresses/${editing.id}`, data);
        toast.success('Address updated');
      } else {
        await api.post('/api/addresses', data);
        toast.success('Address added');
      }
      qc.invalidateQueries({ queryKey: ['addresses'] });
      setShowForm(false);
      reset({});
    } catch {
      toast.error('Failed to save address');
    }
  };

  const labels = ['Home', 'Work', 'Other'];

  return (
    <div className="container-page py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Addresses</h1>
        <Button onClick={openAdd} size="sm">
          <Plus className="w-4 h-4" /> Add New
        </Button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-5">{editing ? 'Edit Address' : 'New Address'}</h2>
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className="mb-4 inline-flex items-center gap-2 rounded-xl border border-veg/30 bg-veg/5 px-3 py-2 text-sm font-semibold text-veg disabled:opacity-50"
              >
                <MapPin className="w-4 h-4" />
                {locating ? 'Getting current location...' : 'Use current location'}
              </button>
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
                  <select {...register('label')} className="input">
                    {labels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <Input label="Full Name" autoComplete="name" enterKeyHint="next" {...register('fullName')} error={errors.fullName?.message} placeholder="Rahul Sharma" />
                <Input label="Phone" type="tel" autoComplete="tel" enterKeyHint="next" {...register('phone')} error={errors.phone?.message} placeholder="+91 9876543210" />
                <div className="sm:col-span-2">
                  <Input label="Address Line 1" autoComplete="address-line1" enterKeyHint="next" {...register('line1')} error={errors.line1?.message} placeholder="House no., Street name" />
                </div>
                <div className="sm:col-span-2">
                  <Input label="Address Line 2 (optional)" autoComplete="address-line2" enterKeyHint="next" {...register('line2')} placeholder="Landmark, Area" />
                </div>
                <Input label="City" autoComplete="address-level2" enterKeyHint="next" {...register('city')} error={errors.city?.message} placeholder="Hyderabad" />
                <Input label="State" autoComplete="address-level1" enterKeyHint="next" {...register('state')} error={errors.state?.message} placeholder="Telangana" />
                <Input label="Pincode" autoComplete="postal-code" inputMode="numeric" enterKeyHint="done" {...register('pincode')} error={errors.pincode?.message} placeholder="500001" />
                <div className="flex items-center gap-2 sm:col-span-2">
                  <input type="checkbox" id="isDefault" {...register('isDefault')} className="rounded" />
                  <label htmlFor="isDefault" className="text-sm text-gray-700 font-medium">Set as default address</label>
                </div>
                <div className="sm:col-span-2 flex gap-3 justify-end pt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" loading={isSubmitting}>{editing ? 'Update' : 'Save Address'}</Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="skeleton h-32 rounded-3xl" />)}
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="text-center py-20">
          <MapPin className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No addresses saved</h3>
          <p className="text-gray-500 mb-6">Add your first delivery address</p>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Address
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr, i) => (
            <motion.div key={addr.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`card p-5 ${addr.isDefault ? 'border-2 border-primary-500' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-gray">{addr.label}</span>
                    {addr.isDefault && <span className="badge badge-green flex items-center gap-1"><Check className="w-3 h-3" /> Default</span>}
                    <span className="font-semibold text-gray-900 text-sm">{addr.fullName}</span>
                  </div>
                  <p className="text-sm text-gray-600">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                  <p className="text-sm text-gray-600">{addr.city}, {addr.state} — {addr.pincode}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{addr.phone}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => openEdit(addr)} aria-label="Edit address"
                    className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <button type="button" onClick={() => deleteAddr(addr.id)} aria-label="Delete address"
                    className="w-8 h-8 rounded-xl border border-red-100 flex items-center justify-center hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
