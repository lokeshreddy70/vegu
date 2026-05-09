'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Heart, Star, Bike, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface FavoriteRider {
  id: string;
  name: string;
  avatar?: string;
  vehicleType: string;
  rating: number;
  totalDeliveries: number;
  badge: { label: string; tier: number };
  favoritedAt: string;
}

const BADGE_STYLES: Record<string, string> = {
  Elite:    'bg-purple-100 text-purple-700',
  Trusted:  'bg-blue-100 text-blue-700',
  Reliable: 'bg-emerald-100 text-emerald-700',
  Rookie:   'bg-gray-100 text-gray-500',
};

const VEHICLE_EMOJI: Record<string, string> = {
  bike: '🏍️', scooter: '🛵', cycle: '🚲', car: '🚗',
};

export default function FavoriteRidersPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: riders, isLoading } = useQuery<FavoriteRider[]>({
    queryKey: ['favorite-riders'],
    queryFn: () => api.get('/api/trusted-riders/favorites').then(r => r.data.data),
  });

  const { mutate: removeFav } = useMutation({
    mutationFn: (partnerId: string) => api.post(`/api/trusted-riders/favorites/toggle/${partnerId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorite-riders'] });
      toast.success('Removed from favorites');
    },
  });

  return (
    <div className="min-h-screen bg-[#F7F9FA] pb-24">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white border-b border-gray-100">
        <button type="button" onClick={() => router.back()}
          className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </button>
        <div>
          <h1 className="text-gray-900 font-bold text-base">Trusted Riders</h1>
          <p className="text-gray-400 text-xs">Your saved delivery partners</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {isLoading && (
          <>{[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl h-24 animate-pulse border border-gray-100" />
          ))}</>
        )}

        {!isLoading && (!riders || riders.length === 0) && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold">No favorite riders yet</p>
            <p className="text-gray-400 text-sm mt-1">
              After a delivery, tap the heart icon to save your rider
            </p>
            <Link href="/orders" className="inline-flex items-center gap-1.5 mt-4 text-veg font-semibold text-sm">
              View past orders →
            </Link>
          </div>
        )}

        {riders?.map(rider => (
          <div key={rider.id} className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-xl shrink-0">
                {rider.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={rider.avatar} alt={rider.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  rider.name[0].toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 font-bold text-sm">{rider.name}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${BADGE_STYLES[rider.badge.label] ?? BADGE_STYLES.Rookie}`}>
                    {rider.badge.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-gray-400 text-xs flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {rider.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-400 text-xs flex items-center gap-0.5">
                    <Bike className="w-3 h-3" />
                    {rider.totalDeliveries} deliveries
                  </span>
                  <span className="text-gray-400 text-xs">
                    {VEHICLE_EMOJI[rider.vehicleType] ?? '🚗'} {rider.vehicleType}
                  </span>
                </div>
              </div>

              {/* Trust icon + remove */}
              <div className="flex flex-col items-end gap-2">
                <ShieldCheck className="w-4 h-4 text-veg" />
                <button type="button" onClick={() => removeFav(rider.id)}
                  className="text-[10px] text-gray-400 hover:text-red-400 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}

        {riders && riders.length > 0 && (
          <p className="text-center text-xs text-gray-400 pt-2">
            Favorite riders are prioritized when available
          </p>
        )}
      </div>
    </div>
  );
}
