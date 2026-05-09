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
    <nav className="fixed bottom-5 left-4 right-4 z-50">
      <div className="bg-[#111111]/90 backdrop-blur-2xl border border-white/[0.07] rounded-[30px] px-3 py-2.5 flex items-center justify-around shadow-2xl">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 flex-1 py-1 group"
            >
              <div className={cn(
                'w-11 h-8 flex items-center justify-center rounded-2xl transition-all duration-300',
                active ? 'bg-white/10' : 'group-active:bg-white/5'
              )}>
                <Icon
                  className={cn('w-[18px] h-[18px] transition-all duration-300', active ? 'text-white' : 'text-white/25')}
                  strokeWidth={active ? 2.2 : 1.5}
                />
              </div>
              <span className={cn(
                'text-[9px] font-semibold tracking-[0.12em] uppercase transition-all duration-300',
                active ? 'text-white/80' : 'text-white/20'
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
