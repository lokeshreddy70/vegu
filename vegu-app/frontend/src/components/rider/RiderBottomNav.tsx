'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, IndianRupee, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/rider',          label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/rider/earnings', label: 'Earnings',  icon: IndianRupee,     exact: false },
  { href: '/rider/profile',  label: 'Profile',   icon: User,            exact: false },
];

export default function RiderBottomNav() {
  const pathname = usePathname();

  const isActive = (tab: typeof tabs[number]) =>
    tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-0.5 flex-1 py-2 transition-all',
                active ? 'text-veg' : 'text-gray-400'
              )}
            >
              <div className={cn('w-10 h-6 flex items-center justify-center rounded-full', active ? 'bg-veg/10' : '')}>
                <Icon className={cn('w-5 h-5', active ? 'text-veg' : 'text-gray-400')} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={cn('text-[10px] font-semibold', active ? 'text-veg' : 'text-gray-400')}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
