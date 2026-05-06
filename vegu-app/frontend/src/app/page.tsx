import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import CategoryGrid from '@/components/home/CategoryGrid';
import ProductGrid from '@/components/home/ProductGrid';

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/categories`, {
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products/featured`, {
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products/trending`, {
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
    <>
      <Navbar />
      <main>
        <HeroSection />
        <CategoryGrid categories={categories} />
        <ProductGrid title="Featured Picks" subtitle="Editor's choice" products={featured} viewAllHref="/products?featured=true" />
        <ProductGrid title="Trending Now" subtitle="Hot this week" products={trending} viewAllHref="/products?trending=true" />

        {/* App Download CTA */}
        <section className="container-page py-16">
          <div className="bg-gradient-primary rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-primary-500/20">
            <div>
              <h2 className="text-3xl font-bold mb-2">Get the VEGU App</h2>
              <p className="text-white/80 text-lg">Faster checkout, exclusive deals, and real-time tracking.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="text-xs text-white/70">Download on</p>
                  <p className="font-bold">App Store</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="text-xs text-white/70">Get it on</p>
                  <p className="font-bold">Google Play</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
