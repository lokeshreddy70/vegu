'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, User, Menu, X, Leaf, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore, useCartItemCount } from '@/store/cart.store';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const itemCount = useCartItemCount();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/products', label: 'Shop' },
    { href: '/products?featured=true', label: 'Deals' },
    { href: '/products?trending=true', label: 'Trending' },
  ];

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' : 'bg-transparent'
      )}
    >
      <div className="container-page">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-600">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-gradient">VEGU</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                  pathname === link.href
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href="/search" className="btn-ghost p-2 rounded-xl hidden sm:flex">
              <Search className="w-5 h-5 text-gray-600" />
            </Link>

            {isAuthenticated && (
              <Link href="/notifications" className="btn-ghost p-2 rounded-xl relative hidden sm:flex">
                <Bell className="w-5 h-5 text-gray-600" />
              </Link>
            )}

            <Link href="/cart" className="relative btn-ghost p-2 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </motion.span>
              )}
            </Link>

            {isAuthenticated ? (
              <Link
                href={user?.role === 'ADMIN' ? '/admin' : user?.role === 'VENDOR' ? '/vendor' : '/account'}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-gray-50 transition-all duration-150"
              >
                <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-sm">{user?.name?.[0]?.toUpperCase()}</span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link href="/login" className="btn-primary py-2 px-4 text-sm">
                Sign In
              </Link>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-ghost p-2 rounded-xl md:hidden">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 shadow-xl"
          >
            <div className="container-page py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/search" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2">
                <Search className="w-4 h-4" /> Search
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
