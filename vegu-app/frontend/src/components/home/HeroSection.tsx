'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Clock, Shield, Truck, Leaf } from 'lucide-react';

const features = [
  { icon: Clock, label: '30 min delivery', color: 'text-orange-500 bg-orange-50' },
  { icon: Shield, label: '100% fresh', color: 'text-green-500 bg-green-50' },
  { icon: Truck, label: 'Free above ₹500', color: 'text-blue-500 bg-blue-50' },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-green-50" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary-200/30 to-green-200/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-primary-100/40 to-transparent blur-3xl" />

      <div className="container-page relative z-10 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-6"
            >
              <Leaf className="w-4 h-4" />
              Now delivering in 30 minutes
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
              Fresh groceries
              <span className="block text-gradient">to your door</span>
            </h1>

            <p className="text-xl text-gray-500 leading-relaxed mb-8 max-w-md">
              Order farm-fresh fruits, vegetables, dairy, and essentials. Delivered fresh in 30 minutes, every time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/products" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
                Shop Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/products?featured=true" className="btn-secondary inline-flex items-center gap-2 text-lg px-8 py-4">
                View Deals
              </Link>
            </div>

            <div className="flex flex-wrap gap-4">
              {features.map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-sm border border-gray-100">
                  <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full aspect-square max-w-[500px] mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-green-400/20 rounded-[3rem] rotate-6" />
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&q=80"
                  alt="Fresh groceries"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              </div>

              {/* Floating cards */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -left-6 top-1/4 glass rounded-2xl p-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-lg">🥦</div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Organic Veggies</p>
                    <p className="text-xs text-green-600 font-semibold">₹45 onwards</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -right-6 bottom-1/4 glass rounded-2xl p-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Super Fast</p>
                    <p className="text-xs text-orange-600 font-semibold">30 min delivery</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
