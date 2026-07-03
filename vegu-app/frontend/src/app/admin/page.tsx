'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import {
  TrendingUp, ShoppingCart, Users, Store, AlertTriangle,
  ArrowUpRight, Clock, CheckCircle2, XCircle, Package,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-400',
  CONFIRMED: 'bg-blue-500/15 text-blue-400',
  PREPARING: 'bg-violet-500/15 text-violet-400',
  READY_FOR_PICKUP: 'bg-cyan-500/15 text-cyan-400',
  OUT_FOR_DELIVERY: 'bg-orange-500/15 text-orange-400',
  DELIVERED: 'bg-emerald-500/15 text-emerald-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
  REFUNDED: 'bg-zinc-500/15 text-zinc-400',
};

function StatCard({ label, value, sub, icon: Icon, color = 'emerald' }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-400',
    amber: 'bg-amber-500/10 text-amber-400',
    violet: 'bg-violet-500/10 text-violet-400',
    red: 'bg-red-500/10 text-red-400',
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{formatPrice(payload[0].value)}</p>
    </div>
  );
};

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/api/admin/dashboard').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  if (isLoading) return (
    <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-28 animate-pulse" />
      ))}
    </div>
  );

  const { stats, recentOrders = [], lowStockProducts = [], weeklyRevenue = [], topProducts = [] } = data ?? {};

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Live overview of your store</p>
        <a href="/admin/release-check" className="inline-block mt-2 text-xs text-emerald-400 hover:text-emerald-300">Open release checks →</a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatPrice(stats?.totalRevenue ?? 0)} icon={TrendingUp} color="emerald" sub="All-time delivered" />
        <StatCard label="Today Revenue" value={formatPrice(stats?.todayRevenue ?? 0)} icon={ArrowUpRight} color="blue" sub={`${stats?.todayOrders ?? 0} orders today`} />
        <StatCard label="Total Orders" value={(stats?.totalOrders ?? 0).toLocaleString()} icon={ShoppingCart} color="violet" />
        <StatCard label="Pending Orders" value={stats?.pendingOrders ?? 0} icon={Clock} color="amber" />
        <StatCard label="Customers" value={(stats?.totalUsers ?? 0).toLocaleString()} icon={Users} color="blue" />
        <StatCard label="Active Vendors" value={stats?.totalVendors ?? 0} icon={Store} color="violet" sub={stats?.pendingVendors ? `${stats.pendingVendors} awaiting approval` : undefined} />
        <StatCard label="Delivered Today" value={stats?.deliveredToday ?? 0} icon={CheckCircle2} color="emerald" />
        <StatCard label="Cancellation Rate" value={`${stats?.cancellationRate ?? 0}%`} icon={XCircle} color="red" sub="Last 30 days" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Revenue — Last 7 Days</h2>
          <p className="text-xs text-zinc-500 mb-4">Based on delivered orders</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyRevenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top Products</h2>
          <div className="space-y-3">
            {topProducts.slice(0, 5).map((p: { name: string; _sum: { total: number; quantity: number } }, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-zinc-600 w-4 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 truncate">{p.name}</p>
                  <div className="mt-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full" />
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 shrink-0">{p._sum?.quantity ?? 0} sold</span>
              </div>
            ))}
            {!topProducts.length && <p className="text-xs text-zinc-600 text-center py-6">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Recent + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
            <a href="/admin/orders" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">View all →</a>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {recentOrders.slice(0, 7).map((o: { id: string; orderNumber: string; status: string; total: number; createdAt: string; user: { name: string }; vendor?: { storeName: string } }) => (
              <div key={o.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-300">{o.orderNumber}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLOR[o.status] ?? 'bg-zinc-700 text-zinc-400'}`}>{o.status}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{o.user.name}{o.vendor ? ` · ${o.vendor.storeName}` : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-white">{formatPrice(o.total)}</p>
                  <p className="text-[10px] text-zinc-600">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Low Stock
            </h2>
            <a href="/admin/inventory" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Manage →</a>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {lowStockProducts.map((p: { id: string; name: string; stock: number; images: string[] }) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded-lg object-cover bg-zinc-800 shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-zinc-600" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 truncate">{p.name}</p>
                  <p className={`text-[10px] font-semibold ${p.stock === 0 ? 'text-red-400' : 'text-amber-400'}`}>{p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</p>
                </div>
              </div>
            ))}
            {!lowStockProducts.length && (
              <div className="px-5 py-8 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">All stocked up</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
