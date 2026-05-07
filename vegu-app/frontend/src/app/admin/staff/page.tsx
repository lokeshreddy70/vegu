'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Shield, Users, Store, Truck, Crown } from 'lucide-react';

type StaffSummary = {
  admins: number; vendors: number; riders: number; customers: number; total: number;
};

const ROLE_CONFIG = [
  { key: 'admins', label: 'Admins', icon: Crown, color: 'text-amber-400 bg-amber-500/10', desc: 'Full platform access and control' },
  { key: 'vendors', label: 'Vendors', icon: Store, color: 'text-violet-400 bg-violet-500/10', desc: 'Manage their store, products and orders' },
  { key: 'riders', label: 'Delivery Riders', icon: Truck, color: 'text-blue-400 bg-blue-500/10', desc: 'Handle delivery and tracking' },
  { key: 'customers', label: 'Customers', icon: Users, color: 'text-emerald-400 bg-emerald-500/10', desc: 'Browse and purchase products' },
];

const PERMISSIONS = [
  { role: 'ADMIN', permissions: ['Full dashboard access', 'Manage all users', 'Approve vendors', 'View analytics', 'Manage inventory', 'Send notifications', 'Configure settings', 'View audit logs'] },
  { role: 'VENDOR', permissions: ['Manage own products', 'View own orders', 'Update order status', 'View own analytics', 'Manage inventory'] },
  { role: 'RIDER', permissions: ['View assigned deliveries', 'Update delivery status', 'View delivery history'] },
  { role: 'CUSTOMER', permissions: ['Browse products', 'Place orders', 'Track orders', 'Manage profile', 'View order history'] },
];

export default function StaffPage() {
  const { data, isLoading } = useQuery<StaffSummary>({
    queryKey: ['admin-staff-summary'],
    queryFn: () => api.get('/api/admin/users/summary').then(r => r.data.data),
  });

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-xl font-bold text-white">Staff & Roles</h1>
        <p className="text-xs text-zinc-500 mt-0.5">User role management and permissions overview</p>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLE_CONFIG.map(r => (
          <div key={r.key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${r.color}`}>
              <r.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-white">
              {isLoading ? '—' : (data?.[r.key as keyof StaffSummary] ?? 0).toLocaleString()}
            </p>
            <p className="text-xs font-medium text-zinc-300 mt-0.5">{r.label}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Permissions matrix */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Permissions by Role</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PERMISSIONS.map(p => (
            <div key={p.role} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                  p.role === 'ADMIN' ? 'bg-amber-500/15 text-amber-400' :
                  p.role === 'VENDOR' ? 'bg-violet-500/15 text-violet-400' :
                  p.role === 'RIDER' ? 'bg-blue-500/15 text-blue-400' :
                  'bg-emerald-500/15 text-emerald-400'
                }`}>{p.role}</span>
              </div>
              <ul className="space-y-1.5">
                {p.permissions.map(perm => (
                  <li key={perm} className="flex items-center gap-2 text-xs text-zinc-400">
                    <div className="w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Info card */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <p className="text-xs text-blue-400 font-medium mb-1">Role Assignment</p>
        <p className="text-xs text-zinc-500">
          User roles are assigned automatically: customers register via the app, vendors apply and get approved via the Vendors page,
          and riders register via the rider portal. Admin roles must be assigned directly in the database for security.
        </p>
      </div>
    </div>
  );
}
