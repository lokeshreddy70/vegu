'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AboutPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-page', 'about'],
    queryFn: () => api.get('/api/public/pages/about').then((r) => r.data.data),
  });

  return (
    <div className="container-page py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{data?.title || 'About Vegu'}</h1>
      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
        {isLoading ? 'Loading...' : data?.content || 'Vegu is a trusted grocery delivery platform.'}
      </div>
    </div>
  );
}
