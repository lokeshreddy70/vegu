'use client';

import { useQuery } from '@tanstack/react-query';
import { Phone, Mail, MessageCircle, MapPin, Clock } from 'lucide-react';
import { getPublicConfig } from '@/lib/publicConfig';

export default function ContactPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-config'],
    queryFn: getPublicConfig,
  });

  return (
    <div className="container-page py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{data?.contactTitle || 'Contact Us'}</h1>
      <p className="text-sm text-gray-500 mb-6">{data?.contactDescription || 'Get in touch with Vegu support.'}</p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4"><Phone className="w-4 h-4 text-veg mb-2" /><p className="text-xs text-gray-500">Phone</p><p className="font-semibold text-gray-900">{isLoading ? 'Loading...' : data?.supportPhone}</p></div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4"><MessageCircle className="w-4 h-4 text-veg mb-2" /><p className="text-xs text-gray-500">WhatsApp</p><p className="font-semibold text-gray-900">{isLoading ? 'Loading...' : data?.supportWhatsApp}</p></div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4"><Mail className="w-4 h-4 text-veg mb-2" /><p className="text-xs text-gray-500">Email</p><p className="font-semibold text-gray-900">{isLoading ? 'Loading...' : data?.supportEmail}</p></div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4"><Clock className="w-4 h-4 text-veg mb-2" /><p className="text-xs text-gray-500">Support Hours</p><p className="font-semibold text-gray-900">{isLoading ? 'Loading...' : data?.supportHours}</p></div>
      </div>

      <div className="mt-3 bg-white border border-gray-100 rounded-2xl p-4">
        <MapPin className="w-4 h-4 text-veg mb-2" />
        <p className="text-xs text-gray-500">Office Address</p>
        <p className="font-semibold text-gray-900">{isLoading ? 'Loading...' : data?.officeAddress}</p>
      </div>
    </div>
  );
}
