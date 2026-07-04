"use client";

import BottomNav from '@/components/layout/BottomNav';
import { usePathname } from 'next/navigation';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreenChat = pathname === '/account/help';

  return (
    <div className="min-h-screen bg-app-bg">
      <main className={isFullscreenChat ? '' : 'pb-20'}>{children}</main>
      {!isFullscreenChat && <BottomNav />}
    </div>
  );
}
