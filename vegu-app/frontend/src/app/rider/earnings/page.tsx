'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { IndianRupee, TrendingUp, CheckCircle2, Bike } from 'lucide-react';
import riderApi from '@/lib/riderApi';
import { useRiderAuthStore } from '@/store/rider-auth.store';

export default function RiderEarningsPage() {
  const router = useRouter();
  const { user } = useRiderAuthStore();

  useEffect(() => {
    if (!user || user.role !== 'DELIVERY') router.push('/rider/login');
  }, [user, router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['rider-dashboard'],
    queryFn: () => riderApi.get('/api/rider/dashboard').then(r => r.data.data),
    enabled: !!user,
  });

  if (!user) return null;

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <p className="text-gray-400 text-sm mb-4">Could not load earnings data</p>
        <button type="button" onClick={() => router.refresh()}
          className="text-gray-600 text-xs border border-gray-200 px-4 py-2 rounded-xl">
          Retry
        </button>
      </div>
    );
  }

  const partner = data?.partner;
  const avgPerDelivery = partner?.totalDeliveries
    ? Math.round((partner.totalEarnings || 0) / partner.totalDeliveries)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-green-600 text-white px-4 pt-12 pb-6">
        <p className="text-green-200 text-sm mb-1">Your earnings</p>
        {isLoading ? (
          <div className="h-10 w-32 bg-green-700 rounded-xl animate-pulse" />
        ) : (
          <h1 className="text-3xl font-extrabold">₹{partner?.totalEarnings ?? 0}</h1>
        )}
        <p className="text-green-200 text-xs mt-1">All time total</p>
      </div>

      {isLoading ? (
        <div className="px-4 mt-4 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-3">

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{data?.todayDeliveries ?? 0}</p>
              <p className="text-gray-500 text-xs mt-0.5">Today&apos;s deliveries</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{partner?.totalDeliveries ?? 0}</p>
              <p className="text-gray-500 text-xs mt-0.5">Total deliveries</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-green-600" />
              Earnings Breakdown
            </h2>
            <div className="space-y-0 divide-y divide-gray-50">
              <div className="flex justify-between items-center py-2.5">
                <span className="text-gray-600 text-sm">Total earned</span>
                <span className="font-bold text-green-600">₹{partner?.totalEarnings ?? 0}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-gray-600 text-sm">Total deliveries</span>
                <span className="font-bold text-gray-900">{partner?.totalDeliveries ?? 0}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-gray-600 text-sm">Avg. per delivery</span>
                <span className="font-bold text-gray-900">₹{avgPerDelivery}</span>
              </div>
            </div>
          </div>

          {partner && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Bike className="w-4 h-4 text-green-600" />
                Vehicle Details
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-semibold text-gray-900 capitalize">{partner.vehicleType}</span>
                </div>
                {partner.vehicleNo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Number</span>
                    <span className="font-semibold text-gray-900">{partner.vehicleNo}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-semibold capitalize ${partner.status === 'AVAILABLE' ? 'text-green-600' : 'text-gray-400'}`}>
                    {partner.status.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
