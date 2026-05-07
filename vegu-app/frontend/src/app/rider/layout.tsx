'use client';

import ErrorBoundary from '@/components/ErrorBoundary';

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary portal="rider">{children}</ErrorBoundary>
    </div>
  );
}
