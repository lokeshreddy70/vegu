'use client';

import { useQuery } from '@tanstack/react-query';
import { getPublicConfig, parseFaq } from '@/lib/publicConfig';

export default function FaqPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-config'],
    queryFn: getPublicConfig,
  });

  const items = parseFaq(data?.faqJson ?? '[]');

  return (
    <div className="container-page py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">FAQ</h1>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-sm text-gray-500">No FAQs configured yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={`${item.question}-${idx}`} className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="font-semibold text-gray-900 mb-1">{item.question}</p>
              <p className="text-sm text-gray-600">{item.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
