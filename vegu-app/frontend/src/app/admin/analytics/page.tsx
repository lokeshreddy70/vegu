'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, ShoppingCart, Package } from 'lucide-react';

const PERIOD_OPTIONS = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
];

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: '#10b981', PENDING: '#f59e0b', CONFIRMED: '#3b82f6',
  PREPARING: '#8b5cf6', CANCELLED: '#ef4444', REFUNDED: '#71717a',
  READY_FOR_PICKUP: '#06b6d4', OUT_FOR_DELIVERY: '#f97316',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{typeof payload[0].value === 'number' && payload[0].name === 'revenue' ? formatPrice(payload[0].value) : payload[0].value}</p>
    </div>
  );
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics', period],
    queryFn: () => api.get('/api/admin/analytics', { params: { period } }).then(r => r.data.data),
  });

  const revenueByDay = data?.revenueByDay ?? [];
  const ordersByStatus = data?.ordersByStatus ?? [];
  const topProducts = data?.topProducts ?? [];
  const topVendors = data?.topVendors ?? [];
  const summary = data?.summary ?? {};

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Business performance metrics</p>
        </div>
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {PERIOD_OPTIONS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === p.value ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatPrice(data?.totalRevenue ?? 0), icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'New Customers', value: summary.newCustomers ?? 0, icon: Users, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Repeat Customers', value: summary.repeatCustomers ?? 0, icon: Users, color: 'text-violet-400 bg-violet-500/10' },
          { label: 'Avg Order Value', value: formatPrice(summary.avgOrderValue ?? 0), icon: ShoppingCart, color: 'text-amber-400 bg-amber-500/10' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-1">Revenue Over Time</h2>
        <p className="text-xs text-zinc-500 mb-4">Delivered orders only</p>
        {isLoading ? (
          <div className="h-48 bg-zinc-800 rounded-lg animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#rev-grad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Orders by status */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Orders by Status</h2>
          {isLoading ? <div className="h-40 bg-zinc-800 rounded animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ordersByStatus} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="status" tick={{ fontSize: 9, fill: '#71717a' }} tickLine={false} axisLine={false} tickFormatter={v => v.replace(/_/g, ' ').slice(0, 8)} />
                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {ordersByStatus.map((entry: { status: string }, i: number) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#3f3f46'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top products */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-emerald-400" /> Top Products</h2>
          {isLoading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 bg-zinc-800 rounded animate-pulse" />)}</div> : (
            <div className="space-y-3">
              {topProducts.slice(0, 6).map((p: { name: string; _sum: { total: number; quantity: number } }, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600 w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 truncate">{p.name}</p>
                    <div className="mt-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, ((p._sum?.total ?? 0) / (topProducts[0]?._sum?.total || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-zinc-400">{formatPrice(p._sum?.total ?? 0)}</p>
                    <p className="text-[10px] text-zinc-600">{p._sum?.quantity ?? 0} sold</p>
                  </div>
                </div>
              ))}
              {!topProducts.length && <p className="text-xs text-zinc-600 text-center py-6">No data for this period</p>}
            </div>
          )}
        </div>
      </div>

      {/* Top vendors */}
      {topVendors.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top Vendors by Revenue</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topVendors.slice(0, 6).map((v: { storeName?: string; vendorId: string; _sum: { total: number } }, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-zinc-800/50 rounded-xl p-3">
                <span className="text-xs text-zinc-600 w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 truncate">{v.storeName ?? v.vendorId}</p>
                  <p className="text-[10px] text-emerald-400 mt-0.5">{formatPrice(v._sum?.total ?? 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
