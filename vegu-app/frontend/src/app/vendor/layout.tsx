'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, Leaf, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/vendor', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/vendor/products', icon: Package, label: 'Products' },
  { href: '/vendor/orders', icon: ShoppingBag, label: 'Orders' },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== 'VENDOR')) router.push('/login');
  }, [hasHydrated, isAuthenticated, user, router]);

  if (!hasHydrated || !isAuthenticated || user?.role !== 'VENDOR') return null;

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    logout();
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col fixed h-full z-30">
        <div className="p-6 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            Vendor Portal
          </Link>
          {user?.vendor && <p className="text-gray-500 text-xs mt-2 truncate">{user.vendor.storeName}</p>}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all', pathname === href ? 'bg-primary-600 text-white shadow-lg' : 'hover:bg-gray-800 hover:text-white')}>
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{user?.name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-gray-500 text-xs">Vendor</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-gray-800 transition-all w-full">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
