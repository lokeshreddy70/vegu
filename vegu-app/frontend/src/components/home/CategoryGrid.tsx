'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  image?: string;
  _count?: { products: number };
}

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <section className="container-page py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-primary-600 font-semibold text-sm uppercase tracking-wide mb-1">Browse by</p>
          <h2 className="section-title">Categories</h2>
        </div>
        <Link href="/products" className="text-primary-600 font-semibold text-sm hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center gap-3 p-4 rounded-3xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-200"
                style={{ backgroundColor: cat.color ? `${cat.color}20` : '#f0fdf4' }}
              >
                {cat.icon || '🛒'}
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight line-clamp-2">{cat.name}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
