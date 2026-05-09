'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Package, MapPin, Heart, LogOut, ChevronRight, Bell,
  Star, HelpCircle, Info, CreditCard, Edit2, Leaf, ChefHat, Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) router.push('/login');
  }, [mounted, isAuthenticated, router]);

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/api/auth/me').then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const handleLogout = async () => {
    const rt = localStorage.getItem('refreshToken');
    try { await api.post('/api/auth/logout', { refreshToken: rt }); } catch { /* ignore */ }
    logout();
    router.push('/');
  };

  const menuItems = [
    { icon: Package,     label: 'My Orders',        desc: 'Track your recent orders',     href: '/orders',                   color: 'bg-blue-100 text-blue-600' },
    { icon: ChefHat,     label: 'AI Kitchen',       desc: 'Recipes & meal plans',         href: '/kitchen',                  color: 'bg-veg/10 text-veg' },
    { icon: Shield,      label: 'Trusted Riders',   desc: 'Your favorite delivery riders',href: '/account/favorite-riders',  color: 'bg-indigo-100 text-indigo-600' },
    { icon: Heart,       label: 'Wishlist',          desc: 'Your saved products',          href: '/account/wishlist',         color: 'bg-red-100 text-red-500' },
    { icon: MapPin,      label: 'Addresses',         desc: 'Manage delivery addresses',    href: '/account/addresses', color: 'bg-orange-100 text-orange-500' },
    { icon: CreditCard,  label: 'Payment Methods',   desc: 'Cards & wallets',              href: '/account/payments',  color: 'bg-purple-100 text-purple-600' },
    { icon: Bell,        label: 'Notifications',     desc: 'Alerts & updates',             href: '/notifications',     color: 'bg-cyan-100 text-cyan-600' },
    { icon: HelpCircle,  label: 'Help & Support',    desc: 'FAQs, chat with us',           href: '/account/help',      color: 'bg-green-100 text-green-600' },
    { icon: Info,        label: 'About Vegu',        desc: 'Version 1.0.0',                href: '/account/about',     color: 'bg-gray-100 text-gray-500' },
  ];

  if (!mounted || !isAuthenticated) return null;

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
  const points = profile?.loyaltyPoints ?? 0;

  return (
    <div className="bg-[#F7F9FA] min-h-screen pb-24">
      {/* Green header */}
      <div className="bg-veg px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-white" />
            <span className="text-white font-black text-xl italic">vegú</span>
          </div>
          <Link href="/account/edit" className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Edit2 className="w-4 h-4 text-white" />
          </Link>
        </div>

        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center shrink-0">
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>
          <div>
            <p className="text-white font-bold text-base">{user?.name}</p>
            <p className="text-white/70 text-xs">{user?.email}</p>
            {user?.phone && <p className="text-white/70 text-xs">{user.phone}</p>}
          </div>
        </div>
      </div>

      {/* Rewards banner */}
      {points > 0 && (
        <div className="mx-4 -mt-3 mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-gray-800 text-sm font-bold">Reward Points</span>
          </div>
          <span className="text-veg text-base font-extrabold">{points} pts</span>
        </div>
      )}

      {/* Quick actions */}
      <div className="mx-4 mt-4 mb-4 grid grid-cols-3 gap-2">
        {[
          { icon: Package, label: 'Orders', href: '/orders' },
          { icon: Heart, label: 'Wishlist', href: '/account/wishlist' },
          { icon: MapPin, label: 'Addresses', href: '/account/addresses' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-1.5 py-4 hover:border-veg/30 transition-colors"
          >
            <item.icon className="w-5 h-5 text-veg" />
            <span className="text-gray-700 text-xs font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Menu list */}
      <div className="mx-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {menuItems.map((item, i) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-4 px-4 py-4 transition-colors hover:bg-gray-50 ${i > 0 ? 'border-t border-gray-50' : ''}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-sm font-semibold">{item.label}</p>
              <p className="text-gray-400 text-xs">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <div className="mx-4 mb-6">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 border border-red-100 text-red-500 rounded-2xl font-semibold text-sm hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
