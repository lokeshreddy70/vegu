'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid2x2, Tag, ShoppingCart, User } from 'lucide-react';
import { useCartItemCount } from '@/store/cart.store';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/',            label: 'Home',       icon: Home,         exact: true },
  { href: '/categories',  label: 'Categories', icon: Grid2x2,      exact: false },
  { href: '/products?featured=true', label: 'Deals', icon: Tag,   exact: false, match: '/products' },
  { href: '/cart',        label: 'Cart',       icon: ShoppingCart, exact: false },
  { href: '/account',     label: 'Account',    icon: User,         exact: false },
];

export default function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartItemCount();

  const isActive = (tab: typeof tabs[number]) => {
    if (tab.exact) return pathname === tab.href;
    const base = tab.match ?? tab.href.split('?')[0];
    return pathname.startsWith(base);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-app-card/95 backdrop-blur-md border-t border-app-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-0.5 flex-1 py-2 relative transition-all',
                active ? 'text-gold' : 'text-zinc-500'
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gold rounded-full" />
              )}
              <div className="relative mt-1">
                <Icon className={cn('w-5 h-5 transition-all', active ? 'text-gold' : 'text-zinc-500')} strokeWidth={active ? 2.5 : 1.8} />
                {tab.label === 'Cart' && itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[16px] h-4 bg-gold text-black text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] font-semibold transition-all', active ? 'text-gold' : 'text-zinc-500')}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
