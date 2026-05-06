'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';

interface Props {
  title: string;
  subtitle?: string;
  products: Parameters<typeof ProductCard>[0]['product'][];
  viewAllHref?: string;
}

export default function ProductGrid({ title, subtitle, products, viewAllHref }: Props) {
  if (products.length === 0) return null;
  return (
    <section className="container-page py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          {subtitle && <p className="text-primary-600 font-semibold text-sm uppercase tracking-wide mb-1">{subtitle}</p>}
          <h2 className="section-title">{title}</h2>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-primary-600 font-semibold text-sm hover:underline">
            View all
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
