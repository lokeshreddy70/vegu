'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import api from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/product/ProductCard';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () =>
      api.get('/api/products', { params: { search: debouncedQuery, limit: 24 } }).then(r => r.data),
    enabled: debouncedQuery.length >= 2,
  });

  const products = data?.data || [];
  const total = data?.meta?.total || 0;

  const { data: trending } = useQuery({
    queryKey: ['trending-search'],
    queryFn: () => api.get('/api/products/trending').then(r => r.data.data),
    enabled: debouncedQuery.length < 2,
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16">
        <div className="container-page py-8">
          {/* Search bar */}
          <div className="relative max-w-2xl mx-auto mb-10">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for fruits, vegetables, dairy…"
              className="w-full pl-14 pr-12 py-4 text-lg rounded-3xl border border-gray-200 bg-white shadow-lg shadow-gray-100/60 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setDebouncedQuery(''); }}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          {/* Results */}
          {debouncedQuery.length >= 2 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  {isLoading ? 'Searching…' : `${total} result${total !== 1 ? 's' : ''} for "${debouncedQuery}"`}
                </h2>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="card">
                      <div className="skeleton aspect-square" />
                      <div className="p-4 space-y-2">
                        <div className="skeleton h-4 w-3/4 rounded" />
                        <div className="skeleton h-3 w-1/2 rounded" />
                        <div className="skeleton h-8 rounded-xl mt-3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-24">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
                  <p className="text-gray-500">Try a different search term or browse categories</p>
                  <button
                    type="button"
                    onClick={() => router.push('/products')}
                    className="btn-primary mt-6 inline-flex"
                  >
                    Browse All Products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {products.map((product: Parameters<typeof ProductCard>[0]['product'], i: number) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Trending when no query */
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Trending Now</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {(trending || []).slice(0, 10).map((product: Parameters<typeof ProductCard>[0]['product'], i: number) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
