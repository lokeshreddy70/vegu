'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Filter, SlidersHorizontal, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import Input from '@/components/ui/Input';

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

  const { data, isLoading } = useQuery({
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

  return (
    <div className="container-page py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {searchParams.get('featured') ? 'Featured Products' : searchParams.get('trending') ? 'Trending Products' : category ? categoriesData?.find((c: { slug: string }) => c.slug === category)?.name || 'Products' : 'All Products'}
          </h1>
          <p className="text-gray-500">{meta?.total || 0} products found</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              icon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="input w-full sm:w-48"
          >
            <option value="">All Categories</option>
            {categoriesData?.map((c: { id: string; slug: string; name: string }) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="newest">Newest First</option>
            <option value="price">Price: Low to High</option>
            <option value="rating">Top Rated</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton aspect-square" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-8 w-full rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product: Parameters<typeof ProductCard>[0]['product'], i: number) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-2xl font-semibold text-sm transition-all ${
                  p === page ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25' : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
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
