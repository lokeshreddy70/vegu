'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid2x2, Search, Package, User, ShoppingCart } from 'lucide-react';
import { useCartItemCount, useCartSubtotal } from '@/store/cart.store';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';

const tabs = [
  { href: '/',           label: 'Home',       icon: Home,    exact: true },
  { href: '/categories', label: 'Categories', icon: Grid2x2, exact: false },
  { href: '/search',     label: 'Search',     icon: Search,  exact: false },
  { href: '/orders',     label: 'Orders',     icon: Package, exact: false },
  { href: '/account',    label: 'Profile',    icon: User,    exact: false },
];

export default function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartItemCount();
  const subtotal = useCartSubtotal();

  const isActive = (tab: typeof tabs[number]) => {
    if (tab.exact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  };

  return (
    <>
      {/* Floating cart bar — visible when cart has items */}
      {itemCount > 0 && (
        <div className="fixed bottom-16 left-4 right-4 z-50">
          <Link
            href="/cart"
            className="flex items-center justify-between bg-veg text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-veg/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold">{itemCount} item{itemCount > 1 ? 's' : ''} in cart</p>
                <p className="text-[11px] opacity-80">{formatPrice(subtotal)}</p>
              </div>
            </div>
            <span className="text-sm font-bold">View Cart →</span>
          </Link>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
          {tabs.map((tab) => {
            const active = isActive(tab);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 flex-1 py-2 transition-all',
                  active ? 'text-veg' : 'text-gray-400'
                )}
              >
                <div className={cn(
                  'w-10 h-6 flex items-center justify-center rounded-full transition-all',
                  active ? 'bg-veg/10' : ''
                )}>
                  <Icon
                    className={cn('w-5 h-5 transition-all', active ? 'text-veg' : 'text-gray-400')}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </div>
                <span className={cn(
                  'text-[10px] font-semibold transition-all',
                  active ? 'text-veg' : 'text-gray-400'
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
