'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const TITLES: Record<string, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
  'rider-safety': 'Rider Safety & Compliance',
  refund: 'Refund Policy',
  cancellation: 'Cancellation Policy',
  shipping: 'Shipping Policy',
};

export default function LegalPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['public-page', slug],
    queryFn: () => api.get(`/api/public/pages/${slug}`).then((r) => r.data.data),
    enabled: !!slug,
  });

  const title = data?.title || TITLES[slug] || 'Legal';
  const content = data?.content || 'This policy is currently unavailable.';

  return (
    <div className="container-page py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
        {isLoading ? 'Loading...' : content}
      </div>
    </div>
  );
}
