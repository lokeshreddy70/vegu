'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Package, MapPin, Heart, LogOut, ChevronRight, Bell,
  Star, HelpCircle, Info, CreditCard, Edit2, Leaf,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Redirect after hydration — prevents flash redirect on load
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
    { icon: Package, label: 'My Orders', desc: 'View your recent orders', href: '/orders', accent: 'text-blue-400' },
    { icon: Heart, label: 'Wishlist', desc: 'Your saved products', href: '/account/wishlist', accent: 'text-red-400' },
    { icon: MapPin, label: 'Addresses', desc: 'Manage delivery addresses', href: '/account/addresses', accent: 'text-orange-400' },
    { icon: CreditCard, label: 'Payment Methods', desc: 'Cards & wallets', href: '/account/payments', accent: 'text-purple-400' },
    { icon: Bell, label: 'Notifications', desc: 'Alerts & updates', href: '/notifications', accent: 'text-cyan-400' },
    { icon: HelpCircle, label: 'Help & Support', desc: 'FAQs, contact us', href: '/account/help', accent: 'text-green-400' },
    { icon: Info, label: 'About Vegu', desc: 'Version 1.0.0', href: '/account/about', accent: 'text-zinc-400' },
  ];

  if (!mounted || !isAuthenticated) return null;

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
  const points = profile?.loyaltyPoints ?? 0;

  return (
    <>
      {/* Header */}
      <div className="px-4 pt-12 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gold rounded-lg flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide">vegu</span>
        </div>
        <Link href="/account/edit" className="w-8 h-8 bg-app-card border border-app-border rounded-xl flex items-center justify-center">
          <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
        </Link>
      </div>

      {/* Profile card */}
      <div className="mx-4 mt-4 mb-5 bg-app-card border border-app-border rounded-2xl p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gold/20 border-2 border-gold flex items-center justify-center shrink-0">
          <span className="text-gold text-xl font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base">Hello, {user?.name?.split(' ')[0]}! 👋</p>
          <p className="text-zinc-500 text-xs truncate">{user?.email}</p>
          {user?.phone && <p className="text-zinc-500 text-xs">{user.phone}</p>}
        </div>
      </div>

      {/* Rewards banner */}
      {points > 0 && (
        <div className="mx-4 mb-5 bg-gold/10 border border-gold/20 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-gold fill-gold" />
            <span className="text-white text-sm font-semibold">Rewards</span>
          </div>
          <span className="text-gold text-sm font-bold">{points} Points</span>
        </div>
      )}

      {/* Menu list */}
      <div className="mx-4 bg-app-card border border-app-border rounded-2xl overflow-hidden mb-4">
        {menuItems.map((item, i) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-4 px-4 py-4 transition-colors hover:bg-white/5 ${i > 0 ? 'border-t border-app-border' : ''}`}
          >
            <div className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
              <item.icon className={`w-4 h-4 ${item.accent}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">{item.label}</p>
              <p className="text-zinc-500 text-xs">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <div className="mx-4 mb-6">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl font-semibold text-sm hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );
}
