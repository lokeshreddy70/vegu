'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Wallet, CircleDollarSign } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getPublicConfig, parsePaymentMethods } from '@/lib/publicConfig';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';

const methodIcon = (id: string) => {
  if (id === 'WALLET') return Wallet;
  if (id === 'COD') return CircleDollarSign;
  return CreditCard;
};

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, user } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login');
  }, [hasHydrated, isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['public-config'],
    queryFn: getPublicConfig,
  });

  const { data: wallet } = useQuery<{ balance: number; earned: number; used: number; transactions: Array<{ id: string; type: 'CREDIT' | 'DEBIT'; amount: number; description: string; createdAt: string }> }>({
    queryKey: ['wallet-me'],
    queryFn: () => api.get('/api/wallet/me').then((r) => r.data.data),
    enabled: isAuthenticated,
  });

  if (!hasHydrated || !isAuthenticated) return null;

  const methods = parsePaymentMethods(data?.paymentMethods ?? '[]');

  return (
    <div className="container-page py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Methods</h1>
      <p className="text-sm text-gray-500 mb-6">Available payment options on Vegu checkout.</p>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
        <p className="text-xs text-gray-500">Wallet Balance</p>
        <p className="text-2xl font-bold text-gray-900">{formatPrice(wallet?.balance ?? 0)}</p>
        <p className="text-xs text-gray-500 mt-1">Earned {formatPrice(wallet?.earned ?? 0)} · Used {formatPrice(wallet?.used ?? 0)}</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6">
        <p className="text-xs text-gray-500">Your Referral Code</p>
        <p className="text-lg font-bold text-veg">{user?.referralCode || 'N/A'}</p>
        <p className="text-xs text-gray-500 mt-1">
          Referral {data?.referralEnabled ? 'enabled' : 'disabled'} · Reward ₹{data?.referralRewardAmount || '0'} · Min order ₹{data?.referralMinOrderValue || '0'}
        </p>
      </div>

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

      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-900 mb-2">Recent Wallet Transactions</p>
        <div className="space-y-2">
          {(wallet?.transactions || []).slice(0, 10).map((txn) => (
            <div key={txn.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 font-medium">{txn.description}</p>
                <p className="text-xs text-gray-500">{new Date(txn.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <p className={`text-sm font-semibold ${txn.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                {txn.type === 'CREDIT' ? '+' : '-'}{formatPrice(txn.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
