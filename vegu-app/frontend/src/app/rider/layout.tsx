'use client';

import ErrorBoundary from '@/components/ErrorBoundary';
import RiderBottomNav from '@/components/rider/RiderBottomNav';
import { usePathname } from 'next/navigation';

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/rider/login' || pathname === '/rider/register';

  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary portal="rider">{children}</ErrorBoundary>
      {!isAuthPage && <RiderBottomNav />}
    </div>
  );
}
