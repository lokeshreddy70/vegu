'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LogOut, Phone, Mail } from 'lucide-react';
import riderApi from '@/lib/riderApi';
import { useRiderAuthStore } from '@/store/rider-auth.store';
import toast from 'react-hot-toast';

export default function RiderProfilePage() {
  const router = useRouter();
  const { user, logout, refreshToken } = useRiderAuthStore();

  useEffect(() => {
    if (!user || user.role !== 'DELIVERY') router.push('/rider/login');
  }, [user, router]);

  const { data } = useQuery({
    queryKey: ['rider-dashboard'],
    queryFn: () => riderApi.get('/api/rider/dashboard').then(r => r.data.data),
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await riderApi.post('/api/auth/logout', { refreshToken }).catch(() => {});
      }
    } finally {
      logout();
      toast.success('Signed out');
      router.push('/rider/login');
    }
  };

  if (!user) return null;

  const partner = data?.partner;
  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'R';

  const vehicleEmoji: Record<string, string> = {
    bike: '🏍️', scooter: '🛵', cycle: '🚲', car: '🚗',
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-32 px-4 pt-12">

      {/* Identity card */}
      <div className="bg-white/[0.04] border border-white/[0.06] rounded-[28px] p-6 mb-4 text-center">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-[22px] bg-white/[0.08] border border-white/[0.1] flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-3xl font-black">{initials}</span>
        </div>

        <h1 className="text-white font-black text-xl tracking-[-0.5px]">{user.name}</h1>

        <div className="flex items-center justify-center gap-1.5 mt-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${partner?.status === 'AVAILABLE' ? 'bg-emerald-400' : 'bg-white/20'}`} />
          <span className="text-white/30 text-xs capitalize">
            {partner?.status?.toLowerCase() ?? 'rider'}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-white/[0.06]">
          <div>
            <p className="text-white text-xl font-black">{partner?.totalDeliveries ?? 0}</p>
            <p className="text-white/25 text-[10px] font-semibold tracking-wide uppercase mt-0.5">Deliveries</p>
          </div>
          <div>
            <p className="text-white text-xl font-black">₹{partner?.totalEarnings ?? 0}</p>
            <p className="text-white/25 text-[10px] font-semibold tracking-wide uppercase mt-0.5">Earned</p>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="bg-white/[0.04] border border-white/[0.06] rounded-3xl overflow-hidden mb-4">
        {user.email && (
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
            <div className="w-8 h-8 bg-white/[0.06] rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-3.5 h-3.5 text-white/30" />
            </div>
            <p className="text-white/50 text-sm">{user.email}</p>
          </div>
        )}
        {user.phone && (
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-8 h-8 bg-white/[0.06] rounded-xl flex items-center justify-center flex-shrink-0">
              <Phone className="w-3.5 h-3.5 text-white/30" />
            </div>
            <p className="text-white/50 text-sm">{user.phone}</p>
          </div>
        )}
      </div>

      {/* Vehicle */}
      {partner && (
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-3xl px-5 py-4 mb-4">
          <p className="text-white/25 text-[10px] font-bold tracking-[0.35em] uppercase mb-3">Vehicle</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{vehicleEmoji[partner.vehicleType?.toLowerCase()] ?? '🚗'}</span>
            <div>
              <p className="text-white font-semibold capitalize text-sm">{partner.vehicleType}</p>
              <p className="text-white/25 text-xs">{partner.vehicleNo || 'No plate added'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sign out */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-4 bg-white/[0.04] border border-white/[0.06] text-white/40 rounded-3xl font-semibold text-sm hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400/70 active:scale-[0.98] transition-all"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}
