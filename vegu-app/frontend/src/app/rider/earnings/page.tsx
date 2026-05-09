'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, CheckCircle2, Zap } from 'lucide-react';
import riderApi from '@/lib/riderApi';
import { useRiderAuthStore } from '@/store/rider-auth.store';

export default function RiderEarningsPage() {
  const router = useRouter();
  const { user } = useRiderAuthStore();

  useEffect(() => {
    if (!user || user.role !== 'DELIVERY') router.push('/rider/login');
  }, [user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['rider-dashboard'],
    queryFn: () => riderApi.get('/api/rider/dashboard').then(r => r.data.data),
    enabled: !!user,
  });

  if (!user) return null;

  const partner = data?.partner;
  const avgPerDelivery = partner?.totalDeliveries
    ? Math.round((partner.totalEarnings || 0) / partner.totalDeliveries)
    : 0;

  const vehicleEmoji: Record<string, string> = {
    bike: '🏍️', scooter: '🛵', cycle: '🚲', car: '🚗',
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-32 px-4 pt-12">

      {/* Header */}
      <div className="mb-8">
        <p className="text-white/25 text-[10px] font-bold tracking-[0.4em] uppercase mb-2">Total Earnings</p>
        {isLoading ? (
          <div className="h-14 w-40 bg-white/[0.04] rounded-2xl animate-pulse" />
        ) : (
          <div className="flex items-end gap-2">
            <h1 className="text-white text-[52px] font-black tracking-[-3px] leading-none">
              ₹{partner?.totalEarnings ?? 0}
            </h1>
          </div>
        )}
        <p className="text-white/20 text-xs mt-2">All-time revenue</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-3xl h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">

          {/* Top stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-3xl p-5">
              <div className="w-8 h-8 bg-white/[0.07] rounded-xl flex items-center justify-center mb-3">
                <CheckCircle2 className="w-4 h-4 text-white/50" />
              </div>
              <p className="text-white text-2xl font-black">{data?.todayDeliveries ?? 0}</p>
              <p className="text-white/25 text-[10px] font-semibold tracking-wide uppercase mt-1">Today</p>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-3xl p-5">
              <div className="w-8 h-8 bg-white/[0.07] rounded-xl flex items-center justify-center mb-3">
                <TrendingUp className="w-4 h-4 text-white/50" />
              </div>
              <p className="text-white text-2xl font-black">{partner?.totalDeliveries ?? 0}</p>
              <p className="text-white/25 text-[10px] font-semibold tracking-wide uppercase mt-1">All Time</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-3xl p-5">
            <p className="text-white/40 text-[10px] font-bold tracking-[0.35em] uppercase mb-4">Breakdown</p>
            <div className="space-y-0 divide-y divide-white/[0.05]">
              <div className="flex justify-between items-center py-3">
                <span className="text-white/40 text-sm">Total earned</span>
                <span className="text-white font-bold text-sm">₹{partner?.totalEarnings ?? 0}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-white/40 text-sm">Total deliveries</span>
                <span className="text-white font-bold text-sm">{partner?.totalDeliveries ?? 0}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-white/40 text-sm">Avg. per delivery</span>
                <span className="text-white font-bold text-sm">₹{avgPerDelivery}</span>
              </div>
            </div>
          </div>

          {/* Vehicle */}
          {partner && (
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-3xl p-5">
              <p className="text-white/40 text-[10px] font-bold tracking-[0.35em] uppercase mb-4">Vehicle</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/[0.07] rounded-2xl flex items-center justify-center text-2xl">
                  {vehicleEmoji[partner.vehicleType?.toLowerCase()] ?? '🚗'}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold capitalize">{partner.vehicleType}</p>
                  <p className="text-white/30 text-xs mt-0.5">{partner.vehicleNo || 'No plate added'}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                  partner.status === 'AVAILABLE'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-white/[0.05] text-white/25'
                }`}>
                  {partner.status?.toLowerCase()}
                </div>
              </div>
            </div>
          )}

          {/* Motivational footer */}
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-3xl p-5 flex items-center gap-3">
            <Zap className="w-4 h-4 text-white/20 flex-shrink-0" />
            <p className="text-white/20 text-xs leading-relaxed">
              Every delivery brings you closer to your goals. Keep delivering excellence.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
