import BottomNav from '@/components/layout/BottomNav';
import HomeClient from '@/components/home/HomeClient';
import { resolveApiBase } from '@/lib/apiBase';

const apiBase = resolveApiBase();

async function getCategories() {
  try {
    const res = await fetch(`${apiBase}/api/categories`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getFeatured() {
  try {
    const res = await fetch(`${apiBase}/api/products/featured`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getTrending() {
  try {
    const res = await fetch(`${apiBase}/api/products/trending`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [categories, featured, trending] = await Promise.all([getCategories(), getFeatured(), getTrending()]);

  return (
    <div className="min-h-screen bg-[#F7F9FA] pb-20">
      <HomeClient categories={categories} featured={featured} trending={trending} />
      <BottomNav />
    </div>
  );
}
