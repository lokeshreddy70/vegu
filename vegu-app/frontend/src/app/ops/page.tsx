'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Store, Truck, ShoppingBag, Users, Package, BarChart3, PauseCircle, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export default function OpsConsolePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user?.role !== 'ADMIN') router.replace('/');
  }, [hasHydrated, isAuthenticated, user, router]);

  const { data: settings } = useQuery({
    queryKey: ['ops-settings'],
    queryFn: () => api.get('/api/admin/settings').then((r) => r.data.data),
    enabled: hasHydrated && isAuthenticated && user?.role === 'ADMIN',
  });

  const { data: dashboard } = useQuery({
    queryKey: ['ops-dashboard'],
    queryFn: () => api.get('/api/admin/dashboard').then((r) => r.data.data),
    enabled: hasHydrated && isAuthenticated && user?.role === 'ADMIN',
  });

  const pause = useMutation({
    mutationFn: (payload: { minutes: number; reason?: string }) => api.post('/api/admin/settings/pause-service', payload),
    onSuccess: () => {
      toast.success('Service paused for 15 minutes');
      qc.invalidateQueries({ queryKey: ['ops-settings'] });
    },
    onError: () => toast.error('Could not pause service'),
  });

  const resume = useMutation({
    mutationFn: () => api.post('/api/admin/settings/resume-service'),
    onSuccess: () => {
      toast.success('Service resumed');
      qc.invalidateQueries({ queryKey: ['ops-settings'] });
    },
    onError: () => toast.error('Could not resume service'),
  });

  if (!hasHydrated || !isAuthenticated || user?.role !== 'ADMIN') return null;

  const cards = [
    { label: 'Products', value: dashboard?.counts?.products ?? 0, icon: Package, href: '/admin/products' },
    { label: 'Orders', value: dashboard?.counts?.orders ?? 0, icon: ShoppingBag, href: '/admin/orders' },
    { label: 'Stores', value: dashboard?.counts?.vendors ?? 0, icon: Store, href: '/admin/vendors' },
    { label: 'Riders', value: dashboard?.counts?.riders ?? 0, icon: Truck, href: '/admin/users' },
    { label: 'Users', value: dashboard?.counts?.customers ?? 0, icon: Users, href: '/admin/users' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">VEGU Operations Console</h1>
            <p className="text-sm text-zinc-400">Dedicated store operations panel for laptop and tablet control.</p>
          </div>
          <Link href="/admin/settings" className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900">
            <Settings className="h-4 w-4" /> Advanced Settings
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Service Control</p>
              <p className="text-xs text-zinc-500">
                {settings?.servicePauseUntil
                  ? `Paused until ${new Date(settings.servicePauseUntil).toLocaleString('en-IN')}`
                  : 'Service running normally'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => pause.mutate({ minutes: 15, reason: 'Rider operations issue' })}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500/20 px-3 py-2 text-sm font-semibold text-amber-300"
              >
                <PauseCircle className="h-4 w-4" /> Pause 15 Minutes
              </button>
              <button
                type="button"
                onClick={() => resume.mutate()}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-300"
              >
                <PlayCircle className="h-4 w-4" /> Resume
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {cards.map((card) => (
            <Link key={card.label} href={card.href} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">{card.label}</p>
                <card.icon className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/admin/inventory" className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm hover:border-zinc-700">Inventory & Stock</Link>
          <Link href="/admin/support" className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm hover:border-zinc-700">Support Desk</Link>
          <Link href="/admin/notifications" className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm hover:border-zinc-700">Notifications</Link>
          <Link href="/admin/analytics" className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm hover:border-zinc-700 inline-flex items-center gap-2"><BarChart3 className="h-4 w-4 text-emerald-400" /> Analytics</Link>
        </div>
      </div>
    </div>
  );
}
