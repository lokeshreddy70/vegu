'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Phone, ChevronRight, Power, CheckCircle2,
  Bike, Clock, AlertCircle, Camera, X, RotateCcw,
  Upload, CheckCircle, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import riderApi from '@/lib/riderApi';
import { useRiderAuthStore } from '@/store/rider-auth.store';

interface RiderDashboard {
  partner: { id: string; status: 'AVAILABLE' | 'OFFLINE' | 'BUSY'; totalDeliveries: number; totalEarnings: number; vehicleType: string; vehicleNo: string | null; };
  activeOrder: ActiveOrder | null;
  todayDeliveries: number;
  pendingOrders: AvailableOrder[];
}
interface ActiveOrder {
  id: string; orderNumber: string; status: string; total: number; deliveryFee: number;
  user: { name: string; phone: string | null };
  address: { line1: string; city: string; label: string } | null;
  items: { quantity: number; product: { name: string } }[];
}
interface AvailableOrder {
  id: string; orderNumber: string; total: number; deliveryFee: number;
  user: { name: string };
  address: { line1: string; city: string; label: string } | null;
  items: { quantity: number }[];
}

// ── Proof of Delivery Modal ─────────────────────────────────────────────────
function ProofModal({ orderId, onClose, onSuccess }: { orderId: string; onClose: () => void; onSuccess: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }), () => {});
    }
  }, []);

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const MAX = 600;
          let { width, height } = img;
          if (width > height) { if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; } }
          else { if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; } }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(await compressImage(file));
  };

  const handleSubmit = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      await riderApi.post(`/api/rider/orders/${orderId}/proof`, { imageBase64: preview, lat: location?.lat, lng: location?.lng });
      toast.success('Delivery confirmed');
      onSuccess();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-md">
      <div className="w-full bg-[#0F0F0F] border-t border-white/[0.07] rounded-t-[32px] px-5 pt-5 pb-10 max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6" />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-bold text-lg">Proof of Delivery</h2>
            <p className="text-white/35 text-xs mt-0.5">Photograph the delivered package</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="w-8 h-8 bg-white/[0.06] border border-white/[0.08] rounded-full flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>

        {preview ? (
          <div className="relative rounded-3xl overflow-hidden mb-5 aspect-[4/3] bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Delivery proof" className="w-full h-full object-cover" />
            <button type="button" onClick={() => setPreview(null)} aria-label="Retake"
              className="absolute top-3 right-3 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-white" />
            </button>
            {location && (
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-white/70" />
                <span className="text-white text-xs font-medium">Location captured</span>
              </div>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full border border-white/[0.07] bg-white/[0.02] rounded-3xl flex flex-col items-center justify-center py-12 mb-5 active:bg-white/[0.05] transition-colors">
            <div className="w-14 h-14 bg-white/[0.07] rounded-2xl flex items-center justify-center mb-3">
              <Camera className="w-7 h-7 text-white/50" />
            </div>
            <p className="text-white/60 font-semibold text-sm">Tap to capture</p>
            <p className="text-white/25 text-xs mt-1">Package must be clearly visible</p>
          </button>
        )}

        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          aria-label="Capture delivery photo" title="Capture delivery photo"
          className="hidden" onChange={handleCapture} />

        {preview ? (
          <button type="button" onClick={handleSubmit} disabled={uploading}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all">
            {uploading ? <><Upload className="w-4 h-4 animate-pulse" /> Submitting…</> : <><CheckCircle className="w-4 h-4" /> Confirm Delivery</>}
          </button>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            <Camera className="w-4 h-4" /> Open Camera
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function RiderDashboard() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, logout } = useRiderAuthStore();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [proofOrderId, setProofOrderId] = useState<string | null>(null);

  const handleLogout = async () => {
    const store = useRiderAuthStore.getState();
    if (store.refreshToken) await riderApi.post('/api/auth/logout', { refreshToken: store.refreshToken }).catch(() => {});
    logout();
    router.push('/rider/login');
  };

  const { data, isLoading, error } = useQuery<RiderDashboard>({
    queryKey: ['rider-dashboard'],
    queryFn: () => riderApi.get('/api/rider/dashboard').then(r => r.data.data),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });

  const toggleStatus = useMutation({
    mutationFn: () => riderApi.patch('/api/rider/toggle-status'),
    onSuccess: (res) => { toast.success(res.data.message); qc.invalidateQueries({ queryKey: ['rider-dashboard'] }); },
    onError: () => toast.error('Failed to update status'),
  });

  const acceptOrder = useMutation({
    mutationFn: (orderId: string) => { setUpdatingId(orderId); return riderApi.post(`/api/rider/orders/${orderId}/accept`); },
    onSuccess: () => { toast.success('Order accepted'); qc.invalidateQueries({ queryKey: ['rider-dashboard'] }); setUpdatingId(null); },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to accept');
      setUpdatingId(null);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) => riderApi.patch(`/api/rider/orders/${orderId}/status`, { status }),
    onSuccess: (res) => { toast.success(res.data.message); qc.invalidateQueries({ queryKey: ['rider-dashboard'] }); },
    onError: () => toast.error('Failed to update status'),
  });

  const registerRider = useMutation({
    mutationFn: () => riderApi.post('/api/rider/register', { vehicleType: 'bike' }),
    onSuccess: () => { toast.success('Registered!'); qc.invalidateQueries({ queryKey: ['rider-dashboard'] }); if (typeof window !== 'undefined') window.location.reload(); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'),
  });

  useEffect(() => {
    if (!user) router.push('/rider/login');
    else if (user.role !== 'DELIVERY') router.push('/rider/login');
  }, [user, router]);

  if (!user || user.role !== 'DELIVERY') return null;

  if (isLoading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
    </div>
  );

  if (error || !data?.partner) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-5">
      <div className="bg-white/[0.04] border border-white/[0.07] rounded-[28px] p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-white/[0.07] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Bike className="w-8 h-8 text-white/50" />
        </div>
        <h2 className="text-white font-bold text-xl mb-2">Become a Rider</h2>
        <p className="text-white/35 text-sm mb-6">Earn money delivering groceries</p>
        <button type="button" onClick={() => registerRider.mutate()} disabled={registerRider.isPending}
          className="w-full bg-white text-black font-bold py-3.5 rounded-2xl text-sm disabled:opacity-40">
          {registerRider.isPending ? 'Registering…' : 'Register Now'}
        </button>
      </div>
    </div>
  );

  const { partner, activeOrder, todayDeliveries, pendingOrders } = data;
  const isOnline = partner.status === 'AVAILABLE';

  return (
    <div className="min-h-screen bg-[#050505] pb-28">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/30 text-xs font-semibold tracking-[0.2em] uppercase">Rider</p>
            <h1 className="text-white text-2xl font-black tracking-tight mt-0.5">{user.name.split(' ')[0]}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Online toggle */}
            <button
              type="button"
              onClick={() => toggleStatus.mutate()}
              disabled={toggleStatus.isPending}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs tracking-wide border transition-all ${
                isOnline
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/[0.03] border-white/[0.07] text-white/35'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full transition-all ${isOnline ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-white/20'}`} />
              <Power className="w-3 h-3" />
              {isOnline ? 'Online' : 'Offline'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5 mt-5">
          {[
            { label: 'Today', value: todayDeliveries, unit: 'trips' },
            { label: 'All time', value: partner.totalDeliveries, unit: 'deliveries' },
            { label: 'Earned', value: `₹${partner.totalEarnings}`, unit: 'total' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-3">
              <p className="text-white/30 text-[9px] font-semibold tracking-widest uppercase">{s.label}</p>
              <p className="text-white font-black text-xl leading-tight mt-1">{s.value}</p>
              <p className="text-white/20 text-[9px] mt-0.5">{s.unit}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4">

        {/* ── Active Order ──────────────────────────────────── */}
        {activeOrder && (
          <div className="bg-white/[0.05] border border-white/10 rounded-3xl overflow-hidden">
            {/* Top bar */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
              <span className="text-emerald-400 text-xs font-bold tracking-wide uppercase">Active Delivery</span>
              <span className="ml-auto text-white/25 text-xs font-mono">#{activeOrder.orderNumber}</span>
            </div>

            <div className="p-4 space-y-3">
              {/* Customer */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">{activeOrder.user.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {activeOrder.items.slice(0, 2).map(i => i.product.name).join(', ')}
                    {activeOrder.items.length > 2 && ` +${activeOrder.items.length - 2}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-black text-lg">₹{activeOrder.total}</p>
                  <p className="text-white/40 text-xs">+₹{activeOrder.deliveryFee} fee</p>
                </div>
              </div>

              {/* Address */}
              {activeOrder.address && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${activeOrder.address.line1}, ${activeOrder.address.city}`)}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-3">
                  <MapPin className="w-4 h-4 text-white/40 shrink-0" />
                  <span className="text-white/60 text-sm flex-1 truncate">{activeOrder.address.line1}, {activeOrder.address.city}</span>
                  <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                </a>
              )}

              {/* Call customer */}
              {activeOrder.user.phone && (
                <a href={`tel:${activeOrder.user.phone}`}
                  className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-3">
                  <Phone className="w-4 h-4 text-white/40 shrink-0" />
                  <span className="text-white/60 text-sm">Call {activeOrder.user.name}</span>
                </a>
              )}

              {/* Action buttons */}
              {activeOrder.status === 'CONFIRMED' && (
                <button type="button"
                  onClick={() => updateStatus.mutate({ orderId: activeOrder.id, status: 'OUT_FOR_DELIVERY' })}
                  disabled={updateStatus.isPending}
                  className="w-full bg-white text-black font-bold py-3.5 rounded-2xl text-sm disabled:opacity-40 active:scale-[0.98] transition-all">
                  {updateStatus.isPending ? 'Updating…' : 'Mark as Picked Up'}
                </button>
              )}
              {activeOrder.status === 'OUT_FOR_DELIVERY' && (
                <button type="button" onClick={() => setProofOrderId(activeOrder.id)}
                  className="w-full bg-white text-black font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                  <CheckCircle2 className="w-4 h-4" /> Mark as Delivered
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Available Orders ──────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/50 text-xs font-semibold tracking-[0.15em] uppercase">Incoming</p>
            <span className="text-white/25 text-xs bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full">
              {pendingOrders.length} nearby
            </span>
          </div>

          {!isOnline && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-white/25 shrink-0 mt-0.5" />
              <div>
                <p className="text-white/50 text-sm font-semibold">You are offline</p>
                <p className="text-white/25 text-xs mt-0.5">Go online to receive orders</p>
              </div>
            </div>
          )}

          {isOnline && pendingOrders.length === 0 && !activeOrder && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 flex flex-col items-center text-center">
              <Clock className="w-8 h-8 text-white/15 mb-3" />
              <p className="text-white/30 text-sm">No orders right now</p>
              <p className="text-white/15 text-xs mt-1">New orders appear automatically</p>
            </div>
          )}

          {isOnline && !activeOrder && pendingOrders.map(order => (
            <div key={order.id} className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-bold font-mono text-sm">#{order.orderNumber}</p>
                  <p className="text-white/40 text-xs mt-0.5">{order.user.name} · {order.items.reduce((s, i) => s + i.quantity, 0)} items</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-black">₹{order.total}</p>
                  <p className="text-white/40 text-xs">+₹{order.deliveryFee}</p>
                </div>
              </div>

              {order.address && (
                <div className="flex items-center gap-2 text-xs text-white/30 mb-3">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{order.address.line1}, {order.address.city}</span>
                </div>
              )}

              <button type="button" onClick={() => acceptOrder.mutate(order.id)}
                disabled={acceptOrder.isPending && updatingId === order.id}
                className="w-full bg-white text-black font-bold py-3 rounded-2xl text-sm disabled:opacity-40 active:scale-[0.98] transition-all">
                {acceptOrder.isPending && updatingId === order.id ? 'Accepting…' : 'Accept Order'}
              </button>
            </div>
          ))}
        </div>

        {/* ── Logout ───────────────────────────────────────── */}
        <div className="pt-2">
          <button type="button" onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-white/20 text-xs font-semibold tracking-wide hover:text-white/40 transition-colors">
            <Package className="w-3.5 h-3.5" />
            Sign out of rider account
          </button>
        </div>
      </div>

      {/* POD modal */}
      {proofOrderId && (
        <ProofModal orderId={proofOrderId} onClose={() => setProofOrderId(null)}
          onSuccess={() => { setProofOrderId(null); qc.invalidateQueries({ queryKey: ['rider-dashboard'] }); }} />
      )}
    </div>
  );
}
