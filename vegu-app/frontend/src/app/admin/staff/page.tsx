'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';

type Store = {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  isActive: boolean;
  manager?: { id: string; name: string; email: string } | null;
  _count?: { staff: number; products: number; orders: number };
};

type Staff = {
  id: string;
  employeeCode: string;
  status: 'ACTIVE' | 'BLOCKED';
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    isActive: boolean;
  };
  store: { id: string; name: string; code: string; city: string };
};

const STAFF_ROLES = ['STORE_MANAGER', 'INVENTORY_MANAGER', 'PACKING_STAFF', 'SUPPORT_STAFF'] as const;

export default function StaffPage() {
  const qc = useQueryClient();

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'STORE_MANAGER',
    storeId: '',
  });

  const [storeForm, setStoreForm] = useState({
    name: '',
    slug: '',
    code: '',
    city: '',
    state: '',
    phone: '',
    address: '',
  });

  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: () => api.get('/api/admin/stores').then((r) => r.data.data as Store[]),
  });

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['admin-staff'],
    queryFn: () => api.get('/api/admin/staff').then((r) => r.data.data as Staff[]),
  });

  const createStore = useMutation({
    mutationFn: () => api.post('/api/admin/stores', { ...storeForm }),
    onSuccess: () => {
      toast.success('Store created');
      setStoreForm({ name: '', slug: '', code: '', city: '', state: '', phone: '', address: '' });
      qc.invalidateQueries({ queryKey: ['admin-stores'] });
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create store';
      toast.error(msg);
    },
  });

  const createStaff = useMutation({
    mutationFn: () => api.post('/api/admin/staff', {
      ...staffForm,
      phone: staffForm.phone || undefined,
    }),
    onSuccess: () => {
      toast.success('Staff account created');
      setStaffForm({ name: '', email: '', phone: '', password: '', role: 'STORE_MANAGER', storeId: '' });
      qc.invalidateQueries({ queryKey: ['admin-staff'] });
      qc.invalidateQueries({ queryKey: ['admin-stores'] });
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create staff';
      toast.error(msg);
    },
  });

  const updateStaff = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'ACTIVE' | 'BLOCKED' }) =>
      api.patch(`/api/admin/staff/${userId}`, { status, isActive: status === 'ACTIVE' }),
    onSuccess: () => {
      toast.success('Staff status updated');
      qc.invalidateQueries({ queryKey: ['admin-staff'] });
    },
    onError: () => toast.error('Unable to update staff status'),
  });

  const resetPassword = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      api.post(`/api/admin/staff/${userId}/reset-password`, { password }),
    onSuccess: () => toast.success('Password reset successful'),
    onError: () => toast.error('Failed to reset password'),
  });

  const removeStaff = useMutation({
    mutationFn: (userId: string) => api.delete(`/api/admin/staff/${userId}`),
    onSuccess: () => {
      toast.success('Staff removed');
      qc.invalidateQueries({ queryKey: ['admin-staff'] });
    },
    onError: () => toast.error('Failed to remove staff'),
  });

  const stores = storesData || [];
  const staff = staffData || [];

  return (
    <div className="p-6 max-w-[1300px] space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Store & Staff Control Center</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Create stores, onboard operations employees, and manage role-based access.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">Create Store</h2>
          <div className="grid grid-cols-2 gap-2">
            <input className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100" placeholder="Store name" value={storeForm.name} onChange={(e) => setStoreForm((s) => ({ ...s, name: e.target.value }))} />
            <input className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100" placeholder="Store code" value={storeForm.code} onChange={(e) => setStoreForm((s) => ({ ...s, code: e.target.value }))} />
            <input className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100" placeholder="Slug" value={storeForm.slug} onChange={(e) => setStoreForm((s) => ({ ...s, slug: e.target.value }))} />
            <input className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100" placeholder="City" value={storeForm.city} onChange={(e) => setStoreForm((s) => ({ ...s, city: e.target.value }))} />
            <input className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100" placeholder="State" value={storeForm.state} onChange={(e) => setStoreForm((s) => ({ ...s, state: e.target.value }))} />
            <input className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100" placeholder="Phone" value={storeForm.phone} onChange={(e) => setStoreForm((s) => ({ ...s, phone: e.target.value }))} />
          </div>
          <input className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100" placeholder="Address" value={storeForm.address} onChange={(e) => setStoreForm((s) => ({ ...s, address: e.target.value }))} />
          <button type="button" onClick={() => createStore.mutate()} disabled={createStore.isPending} className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2">
            {createStore.isPending ? 'Creating...' : 'Create Store'}
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">Create Employee</h2>
          <div className="grid grid-cols-2 gap-2">
            <input className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100" placeholder="Name" value={staffForm.name} onChange={(e) => setStaffForm((s) => ({ ...s, name: e.target.value }))} />
            <input className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100" placeholder="Email" value={staffForm.email} onChange={(e) => setStaffForm((s) => ({ ...s, email: e.target.value }))} />
            <input className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100" placeholder="Mobile" value={staffForm.phone} onChange={(e) => setStaffForm((s) => ({ ...s, phone: e.target.value }))} />
            <input type="password" className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100" placeholder="Password" value={staffForm.password} onChange={(e) => setStaffForm((s) => ({ ...s, password: e.target.value }))} />
            <select title="Staff role" className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100" value={staffForm.role} onChange={(e) => setStaffForm((s) => ({ ...s, role: e.target.value }))}>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select title="Assigned store" className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100" value={staffForm.storeId} onChange={(e) => setStaffForm((s) => ({ ...s, storeId: e.target.value }))}>
              <option value="">Assign store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name} ({store.code})</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={() => createStaff.mutate()} disabled={createStaff.isPending} className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2">
            {createStaff.isPending ? 'Creating...' : 'Create Employee'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">Stores</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {storesLoading && <p className="px-4 py-6 text-sm text-zinc-500">Loading stores...</p>}
            {!storesLoading && stores.map((store) => (
              <div key={store.id} className="px-4 py-3 text-sm">
                <p className="text-zinc-100 font-medium">{store.name} ({store.code})</p>
                <p className="text-zinc-500 text-xs">{store.city}, {store.state} • Staff {store._count?.staff ?? 0} • Orders {store._count?.orders ?? 0}</p>
                {store.manager && <p className="text-zinc-500 text-xs">Manager: {store.manager.name}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">Operations Employees</h3>
          </div>
          <div className="divide-y divide-zinc-800 max-h-[500px] overflow-y-auto">
            {staffLoading && <p className="px-4 py-6 text-sm text-zinc-500">Loading staff...</p>}
            {!staffLoading && staff.map((member) => (
              <div key={member.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-zinc-100 font-medium">{member.user.name}</p>
                    <p className="text-xs text-zinc-500">{member.user.email} • {member.user.role}</p>
                    <p className="text-xs text-zinc-500">{member.store.name} ({member.store.code}) • {member.employeeCode}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full ${member.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{member.status}</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-200" onClick={() => updateStaff.mutate({ userId: member.user.id, status: member.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' })}>
                    {member.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                  </button>
                  <button type="button" className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-200" onClick={() => {
                    const next = window.prompt(`Enter new password for ${member.user.name}`);
                    if (next && next.length >= 8) {
                      resetPassword.mutate({ userId: member.user.id, password: next });
                    } else if (next) {
                      toast.error('Password must be at least 8 characters');
                    }
                  }}>
                    Reset Password
                  </button>
                  <button type="button" className="text-xs px-2 py-1 rounded bg-red-900/50 text-red-300" onClick={() => removeStaff.mutate(member.user.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
