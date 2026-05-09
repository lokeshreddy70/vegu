'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Bike, Phone, Mail, User, Shield } from 'lucide-react';
import riderApi from '@/lib/riderApi';
import { useRiderAuthStore } from '@/store/rider-auth.store';
import toast from 'react-hot-toast';

export default function RiderProfilePage() {
  const router = useRouter();
  const { user, logout, refreshToken } = useRiderAuthStore();

  useEffect(() => {
    if (!user || user.role !== 'DELIVERY') router.push('/rider/login');
  }, [user, router]);

  const { data, isError } = useQuery({
    queryKey: ['rider-dashboard'],
    queryFn: () => riderApi.get('/api/rider/dashboard').then(r => r.data.data),
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      if (refreshToken) await riderApi.post('/api/auth/logout', { refreshToken }).catch(() => {});
    } finally {
      logout();
      toast.success('Signed out');
      router.push('/rider/login');
    }
  };

  if (!user) return null;

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <p className="text-gray-400 text-sm mb-4">Could not load profile data</p>
        <button type="button" onClick={() => router.refresh()}
          className="text-gray-600 text-xs border border-gray-200 px-4 py-2 rounded-xl">
          Retry
        </button>
      </div>
    );
  }

  const partner = data?.partner;
  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'R';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Green header */}
      <div className="bg-green-600 px-4 pt-12 pb-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{initials}</span>
          </div>
          <div className="text-center">
            <h1 className="text-white font-bold text-xl">{user.name}</h1>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${partner?.status === 'AVAILABLE' ? 'bg-white' : 'bg-white/40'}`} />
              <span className="text-white/80 text-xs capitalize">{partner?.status?.toLowerCase() ?? 'rider'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3">

        {/* Info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-900 text-sm font-semibold">{user.name}</p>
              <p className="text-gray-400 text-xs">Rider</p>
            </div>
          </div>
          {user.email && (
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                <Mail className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-gray-600 text-sm">{user.email}</p>
            </div>
          )}
          {user.phone && (
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm">{user.phone}</p>
            </div>
          )}
        </div>

        {/* Vehicle card */}
        {partner && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                <Bike className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-gray-900 text-sm font-semibold capitalize">{partner.vehicleType}</p>
                <p className="text-gray-400 text-xs">{partner.vehicleNo || 'No plate added'}</p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-gray-900 text-sm font-semibold">{partner.totalDeliveries} deliveries</p>
                <p className="text-gray-400 text-xs">₹{partner.totalEarnings} earned total</p>
              </div>
            </div>
          </div>
        )}

        {/* Sign out */}
        <button type="button" onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 border border-red-100 text-red-500 rounded-2xl font-semibold text-sm hover:bg-red-100 active:scale-[0.98] transition-all">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
