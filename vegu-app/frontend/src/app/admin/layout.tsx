'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import {
  LayoutDashboard, Package, Tag, Warehouse, ShoppingCart,
  Users, Store, Megaphone, BarChart3, Bell, Settings,
  Shield, ScrollText, LogOut, ChevronLeft, Menu, X,
  Leaf, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveApiBase } from '@/lib/apiBase';

const apiBase = resolveApiBase('');

const NAV = [
  { href: '/admin',               label: 'Dashboard',      icon: LayoutDashboard, exact: true },
  { href: '/admin/products',      label: 'Products',       icon: Package },
  { href: '/admin/categories',    label: 'Categories',     icon: Tag },
  { href: '/admin/inventory',     label: 'Inventory',      icon: Warehouse },
  { href: '/admin/orders',        label: 'Orders',         icon: ShoppingCart },
  { href: '/admin/customers',     label: 'Customers',      icon: Users },
  { href: '/admin/vendors',       label: 'Vendors',        icon: Store },
  { href: '/admin/promotions',    label: 'Promotions',     icon: Megaphone },
  { href: '/admin/analytics',     label: 'Analytics',      icon: BarChart3 },
  { href: '/admin/support',       label: 'Support Desk',   icon: Bell },
  { href: '/admin/notifications', label: 'Notifications',  icon: Bell },
  { href: '/admin/settings',      label: 'Settings',       icon: Settings },
  { href: '/admin/staff',         label: 'Staff & Roles',  icon: Shield },
  { href: '/admin/logs',          label: 'Audit Logs',     icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasHydrated, logout, accessToken, refreshToken } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || user?.role !== 'ADMIN')) router.replace('/login');
  }, [hasHydrated, isAuthenticated, user, router]);

  const handleLogout = async () => {
    try {
      await fetch(`${apiBase}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {}
    logout();
    router.push('/login');
  };

  if (!hasHydrated || !isAuthenticated || user?.role !== 'ADMIN') return null;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  const NavItem = ({ item }: { item: typeof NAV[0] }) => {
    const active = isActive(item.href, item.exact);
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? item.label : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative',
          active
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5',
          collapsed && 'justify-center px-2',
        )}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        {!collapsed && <span className="truncate flex-1">{item.label}</span>}
        {active && !collapsed && <ChevronRight className="w-3 h-3 shrink-0 text-emerald-400" />}
      </Link>
    );
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn('flex flex-col h-full bg-zinc-900 border-r border-zinc-800', mobile ? 'w-64' : collapsed ? 'w-[60px]' : 'w-56', 'transition-all duration-200')}>
      {/* Logo */}
      <div className={cn('flex items-center h-14 border-b border-zinc-800 shrink-0 px-3 gap-3', collapsed && !mobile && 'justify-center px-2')}>
        <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">VEGU</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Admin Panel</p>
          </div>
        )}
        {!mobile && (
          <button type="button" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)} className={cn('p-1 text-zinc-600 hover:text-zinc-300 rounded transition-colors', collapsed && 'ml-0')}>
            <ChevronLeft className={cn('w-3.5 h-3.5 transition-transform duration-200', collapsed && 'rotate-180')} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {NAV.map(item => <NavItem key={item.href} item={item} />)}
      </nav>

      {/* User footer */}
      <div className="p-2 border-t border-zinc-800 shrink-0">
        <div className={cn('flex items-center gap-2.5 px-2 py-1.5 rounded-lg', collapsed && !mobile && 'justify-center px-1')}>
          <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          {(!collapsed || mobile) && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className={cn('mt-1 w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all', collapsed && !mobile && 'justify-center px-2')}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {(!collapsed || mobile) && 'Sign out'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-full shadow-2xl">
            <SidebarContent mobile />
          </div>
          <button type="button" title="Close menu" onClick={() => setMobileOpen(false)} className="absolute top-3.5 left-[268px] z-10 p-1.5 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0 z-10">
          <button type="button" title="Open menu" onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors">
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-zinc-600 text-xs hidden sm:inline">VEGU</span>
            <span className="text-zinc-700 hidden sm:inline">/</span>
            <span className="text-zinc-200 font-medium truncate text-sm">
              {NAV.find(n => isActive(n.href, n.exact))?.label ?? 'Admin'}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-zinc-500 hidden sm:inline">Live</span>
            </div>
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors hidden sm:inline">
              ← Store
            </Link>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
