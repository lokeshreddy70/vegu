'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Package, MapPin, Heart, LogOut, User, Star, Gift } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import Button from '@/components/ui/Button';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/api/auth/me').then(r => r.data.data),
    enabled: isAuthenticated,
  });

  const handleLogout = async () => {
    const rt = localStorage.getItem('refreshToken');
    try { await api.post('/api/auth/logout', { refreshToken: rt }); } catch { /* ignore */ }
    logout(); // logout() clears localStorage internally
    router.push('/');
  };

  const menuItems = [
    { icon: Package, label: 'My Orders', desc: 'Track and manage orders', href: '/orders', color: 'bg-blue-50 text-blue-600' },
    { icon: MapPin, label: 'Addresses', desc: 'Manage delivery addresses', href: '/account/addresses', color: 'bg-orange-50 text-orange-600' },
    { icon: Heart, label: 'Wishlist', desc: 'Your saved products', href: '/account/wishlist', color: 'bg-red-50 text-red-600' },
    { icon: Star, label: 'Reviews', desc: 'Reviews you have written', href: '/account/reviews', color: 'bg-yellow-50 text-yellow-600' },
    { icon: Gift, label: 'Refer & Earn', desc: `Code: ${profile?.referralCode || '...'}`, href: '/account/referral', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="container-page py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
            <span className="text-2xl font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            {user?.phone && <p className="text-gray-500 text-sm">{user.phone}</p>}
          </div>
          <Link
            href="/account/edit"
            aria-label="Edit profile"
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4 text-gray-600" />
          </Link>
        </div>

        {profile?.loyaltyPoints !== undefined && (
          <div className="mt-4 p-3 bg-primary-50 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-800">Loyalty Points</span>
            </div>
            <span className="text-lg font-bold text-primary-600">{profile.loyaltyPoints}</span>
          </div>
        )}
      </motion.div>

      {/* Menu */}
      <div className="space-y-3">
        {menuItems.map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={item.href} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <span className="text-gray-400 group-hover:text-primary-600 transition-colors">›</span>
            </Link>
          </motion.div>
        ))}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Button variant="secondary" className="w-full flex items-center gap-2 mt-4" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
