import BottomNav from '@/components/layout/BottomNav';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app-bg">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
