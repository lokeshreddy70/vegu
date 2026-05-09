'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, X, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import BottomNav from '@/components/layout/BottomNav';

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
    <div className="min-h-screen bg-app-bg pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button type="button" aria-label="Go back" onClick={() => router.back()} className="w-9 h-9 bg-app-card border border-app-border rounded-xl flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4 text-zinc-300" />
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for fruits, vegetables…"
            className="w-full bg-app-card border border-app-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-gold/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setDebouncedQuery(''); }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center"
            >
              <X className="w-3 h-3 text-zinc-300" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4">
        {debouncedQuery.length >= 2 ? (
          <>
            <p className="text-zinc-500 text-xs mb-4">
              {isLoading ? 'Searching…' : `${total} result${total !== 1 ? 's' : ''} for "${debouncedQuery}"`}
            </p>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-app-card border border-app-border rounded-2xl overflow-hidden animate-pulse">
                    <div className="aspect-square bg-zinc-800" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 w-3/4 bg-zinc-800 rounded" />
                      <div className="h-3 w-1/2 bg-zinc-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-white font-bold text-lg mb-1">No results found</h3>
                <p className="text-zinc-500 text-sm text-center mb-5">Try a different search term</p>
                <button type="button" onClick={() => router.push('/products')} className="bg-gold text-black font-bold px-6 py-2.5 rounded-2xl text-sm">
                  Browse All Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product: Parameters<typeof ProductCard>[0]['product']) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div>
            <p className="text-white font-bold text-sm mb-4">Trending Now</p>
            <div className="grid grid-cols-2 gap-3">
              {(trending || []).slice(0, 10).map((product: Parameters<typeof ProductCard>[0]['product']) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
