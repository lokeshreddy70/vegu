'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { getPublicConfig } from '@/lib/publicConfig';

export default function AboutVeguPage() {
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

  return (
    <div className="container-page py-8 max-w-2xl">
      <div className="bg-white border border-gray-100 rounded-3xl p-6">
        <div className="w-12 h-12 rounded-2xl bg-veg/10 flex items-center justify-center mb-4">
          <Info className="w-6 h-6 text-veg" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{isLoading ? 'About Vegu' : data?.aboutTitle || 'About Vegu'}</h1>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {isLoading ? 'Loading...' : data?.aboutDescription || 'Vegu is your quick-commerce grocery destination.'}
        </p>

        <div className="mt-6 border-t border-gray-100 pt-5">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Privacy Policy</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-3">
            {isLoading ? 'Loading...' : data?.privacyPolicy || 'Your personal data is used only for order fulfillment, payments, support, and service improvements.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/legal/privacy" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
              Full Privacy Policy
            </Link>
            <Link href="/legal/terms" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
              Terms & Conditions
            </Link>
            <Link href="/legal/rider-safety" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
              Rider Safety Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
