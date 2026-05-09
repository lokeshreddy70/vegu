import BottomNav from '@/components/layout/BottomNav';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F9FA]">
      {/* pb-36 clears both BottomNav (64px) and the floating cart bar (56px) */}
      <main className="pb-36">{children}</main>
      <BottomNav />
    </div>
  );
}
