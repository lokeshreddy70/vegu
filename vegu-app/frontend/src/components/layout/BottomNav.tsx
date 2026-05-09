'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid2x2, Tag, ShoppingCart, User } from 'lucide-react';
import { useCartItemCount } from '@/store/cart.store';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/',         label: 'Home',       icon: Home,         exact: true },
  { href: '/products', label: 'Categories', icon: Grid2x2 },
  { href: '/products?featured=true', label: 'Deals', icon: Tag },
  { href: '/cart',     label: 'Cart',       icon: ShoppingCart },
  { href: '/account',  label: 'Account',    icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartItemCount();

  const isActive = (tab: typeof tabs[number]) =>
    tab.exact ? pathname === tab.href : pathname.startsWith(tab.href.split('?')[0]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-app-card border-t border-app-border safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-0.5 flex-1 py-2 transition-colors relative',
                active ? 'text-gold' : 'text-zinc-500'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                {tab.label === 'Cart' && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-gold text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] font-medium', active ? 'text-gold' : 'text-zinc-500')}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gold rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
