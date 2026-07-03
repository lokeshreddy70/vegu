'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Wallet, CircleDollarSign } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getPublicConfig, parsePaymentMethods } from '@/lib/publicConfig';

const methodIcon = (id: string) => {
  if (id === 'WALLET') return Wallet;
  if (id === 'COD') return CircleDollarSign;
  return CreditCard;
};

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login');
  }, [hasHydrated, isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['public-config'],
    queryFn: getPublicConfig,
  });

  if (!hasHydrated || !isAuthenticated) return null;

  const methods = parsePaymentMethods(data?.paymentMethods ?? '[]');

  return (
    <div className="container-page py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Methods</h1>
      <p className="text-sm text-gray-500 mb-6">Available payment options on Vegu checkout.</p>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-2xl" />)}</div>
      ) : methods.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-sm text-gray-500">No payment methods are configured right now.</div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => {
            const Icon = methodIcon(m.id);
            return (
              <div key={m.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-veg/10 text-veg flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-semibold text-sm">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.id}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${m.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {m.enabled ? 'Available' : 'Disabled'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
