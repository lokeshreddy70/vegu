'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Package, Tag, Info, CheckCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import Navbar from '@/components/layout/Navbar';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

const typeIcon: Record<string, React.ElementType> = {
  order: Package,
  promo: Tag,
  info: Info,
};

const typeColor: Record<string, string> = {
  order: 'bg-blue-50 text-blue-600',
  promo: 'bg-green-50 text-green-600',
  info: 'bg-gray-50 text-gray-600',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const qc = useQueryClient();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login');
  }, [hasHydrated, isAuthenticated, router]);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/api/notifications').then(r => r.data.data),
    enabled: hasHydrated && isAuthenticated,
  });

  if (!hasHydrated) return null;

  const { mutate: markAllRead } = useMutation({
    mutationFn: () => api.patch('/api/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16">
        <div className="container-page py-8 max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-primary-600 font-semibold text-sm mt-1">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors"
              >
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card p-4 flex gap-4">
                  <div className="skeleton w-10 h-10 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-1/2 rounded" />
                    <div className="skeleton h-3 w-3/4 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-24">
              <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No notifications yet</h3>
              <p className="text-gray-500">We&apos;ll notify you about orders, deals, and more</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n, i) => {
                const Icon = typeIcon[n.type] || Info;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => !n.isRead && markRead(n.id)}
                    className={`card p-4 flex gap-4 cursor-pointer hover:shadow-md transition-shadow ${!n.isRead ? 'border-l-4 border-primary-500' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${typeColor[n.type] || 'bg-gray-50 text-gray-600'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                        <span className="text-xs text-gray-400 shrink-0">{formatDate(n.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
