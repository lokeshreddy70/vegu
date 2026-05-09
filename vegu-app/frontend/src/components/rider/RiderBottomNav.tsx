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
      <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 flex-1 py-1.5"
            >
              <div className={cn(
                'w-11 h-8 flex items-center justify-center rounded-xl transition-all',
                active ? 'bg-green-50' : ''
              )}>
                <Icon
                  className={cn('w-5 h-5 transition-all', active ? 'text-green-600' : 'text-gray-400')}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span className={cn(
                'text-[10px] font-semibold tracking-wide transition-all',
                active ? 'text-green-600' : 'text-gray-400'
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
