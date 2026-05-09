'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then(r => r.data.data),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', { search, category, sortBy, page, featured: searchParams.get('featured'), trending: searchParams.get('trending') }],
    queryFn: () =>
      api.get('/api/products', {
        params: {
          search: search || undefined,
          category: category || undefined,
          sortBy,
          page,
          limit: 20,
          featured: searchParams.get('featured') || undefined,
          trending: searchParams.get('trending') || undefined,
        },
      }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const products = data?.data || [];
  const meta = data?.meta;

  const title = searchParams.get('featured')
    ? 'Featured Products'
    : searchParams.get('trending')
    ? 'Trending Products'
    : category
    ? categoriesData?.find((c: { slug: string }) => c.slug === category)?.name || 'Products'
    : 'All Products';

  return (
    <div className="px-4 pt-12 pb-4">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-gray-900 font-bold text-xl">{title}</h1>
        <p className="text-gray-400 text-xs mt-0.5">{meta?.total || 0} products found</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-veg/50 shadow-sm"
        />
      </div>

      {/* Filters row */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm text-gray-700 outline-none appearance-none shadow-sm"
          >
            <option value="">All Categories</option>
            {categoriesData?.map((c: { id: string; slug: string; name: string }) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          title="Sort products"
          className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none appearance-none shadow-sm"
        >
          <option value="newest">Newest</option>
          <option value="price">Price ↑</option>
          <option value="rating">Top Rated</option>
          <option value="popular">Popular</option>
        </select>
      </div>

      {/* Grid */}
      {isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-gray-500 text-sm mb-4">Could not load products</p>
          <button type="button" onClick={() => refetch()}
            className="bg-veg text-white font-bold px-6 py-3 rounded-2xl text-sm">
            Try Again
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse shadow-sm">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-gray-900 font-bold text-lg mb-1">No products found</h3>
          <p className="text-gray-500 text-sm text-center">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product: Parameters<typeof ProductCard>[0]['product']) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl font-bold text-sm transition-all ${
                p === page ? 'bg-veg text-white shadow-md shadow-veg/30' : 'bg-white border border-gray-200 text-gray-500'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
