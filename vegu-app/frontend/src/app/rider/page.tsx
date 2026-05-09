'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, MapPin, Phone, ChevronRight, Power,
  IndianRupee, CheckCircle2, Bike, Clock, AlertCircle, LogOut,
  Camera, X, RotateCcw, Upload, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import riderApi from '@/lib/riderApi';
import { useRiderAuthStore } from '@/store/rider-auth.store';

interface RiderDashboard {
  partner: {
    id: string;
    status: 'AVAILABLE' | 'OFFLINE' | 'BUSY';
    totalDeliveries: number;
    totalEarnings: number;
    vehicleType: string;
    vehicleNo: string | null;
  };
  activeOrder: ActiveOrder | null;
  todayDeliveries: number;
  pendingOrders: AvailableOrder[];
}

interface ActiveOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  deliveryFee: number;
  user: { name: string; phone: string | null };
  address: { line1: string; city: string; label: string } | null;
  items: { quantity: number; product: { name: string } }[];
}

interface AvailableOrder {
  id: string;
  orderNumber: string;
  total: number;
  deliveryFee: number;
  user: { name: string };
  address: { line1: string; city: string; label: string } | null;
  items: { quantity: number }[];
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-500',
  OFFLINE: 'bg-gray-400',
  BUSY: 'bg-yellow-500',
};

// ── Proof of Delivery Modal ──────────────────────────────────────────────────
function ProofModal({ orderId, onClose, onSuccess }: {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Get location when modal opens
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
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
          if (width > height) {
            if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
          } else {
            if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
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
    const compressed = await compressImage(file);
    setPreview(compressed);
  };

  const handleSubmit = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      await riderApi.post(`/api/rider/orders/${orderId}/proof`, {
        imageBase64: preview,
        lat: location?.lat,
        lng: location?.lng,
        address: location?.address,
      });
      toast.success('Delivery confirmed! Great job! 🎉');
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit proof';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
      <div className="w-full bg-white rounded-t-3xl px-4 pt-5 pb-8 max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-gray-900 font-bold text-lg">Proof of Delivery</h2>
            <p className="text-gray-500 text-xs mt-0.5">Take a photo of the delivered order</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Image area */}
        {preview ? (
          <div className="relative rounded-2xl overflow-hidden mb-4 bg-gray-100 aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Delivery proof" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setPreview(null)}
              aria-label="Retake photo"
              className="absolute top-3 right-3 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4 text-white" />
            </button>
            {location && (
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-green-400" />
                <span className="text-white text-xs font-medium">Location captured</span>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center py-10 mb-4 bg-gray-50 active:bg-gray-100"
          >
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-3">
              <Camera className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-gray-700 font-semibold text-sm">Tap to take photo</p>
            <p className="text-gray-400 text-xs mt-1">Photo of package at delivery location</p>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          aria-label="Capture delivery photo"
          title="Capture delivery photo"
          className="hidden"
          onChange={handleCapture}
        />

        {/* Info */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5">
          <p className="text-green-800 text-xs font-medium">
            📸 The photo will be shared with the customer and admin as delivery confirmation.
            Ensure the package is clearly visible.
          </p>
        </div>

        {/* Action buttons */}
        {preview ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Upload className="w-4 h-4 animate-pulse" />
                Submitting proof…
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirm Delivery
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Open Camera
          </button>
        )}
      </div>
    </div>
  );
}

export default function RiderDashboard() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, logout } = useRiderAuthStore();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [proofOrderId, setProofOrderId] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      const store = useRiderAuthStore.getState();
      if (store.refreshToken) {
        await riderApi.post('/api/auth/logout', { refreshToken: store.refreshToken }).catch(() => {});
      }
    } finally {
      logout();
      router.push('/rider/login');
    }
  };

  const { data, isLoading, error } = useQuery<RiderDashboard>({
    queryKey: ['rider-dashboard'],
    queryFn: () => riderApi.get('/api/rider/dashboard').then(r => r.data.data),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });

  const toggleStatus = useMutation({
    mutationFn: () => riderApi.patch('/api/rider/toggle-status'),
    onSuccess: (res) => {
      toast.success(res.data.message);
      qc.invalidateQueries({ queryKey: ['rider-dashboard'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const acceptOrder = useMutation({
    mutationFn: (orderId: string) => {
      setUpdatingId(orderId);
      return riderApi.post(`/api/rider/orders/${orderId}/accept`);
    },
    onSuccess: () => {
      toast.success('Order accepted!');
      qc.invalidateQueries({ queryKey: ['rider-dashboard'] });
      setUpdatingId(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to accept';
      toast.error(msg);
      setUpdatingId(null);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      riderApi.patch(`/api/rider/orders/${orderId}/status`, { status }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      qc.invalidateQueries({ queryKey: ['rider-dashboard'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  // Register as rider if not yet
  const registerRider = useMutation({
    mutationFn: () => riderApi.post('/api/rider/register', { vehicleType: 'bike' }),
    onSuccess: () => {
      toast.success('Registered as rider!');
      qc.invalidateQueries({ queryKey: ['rider-dashboard'] });
      if (typeof window !== 'undefined') window.location.reload();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (!user) router.push('/rider/login');
    else if (user.role !== 'DELIVERY') router.push('/rider/login');
  }, [user, router]);

  if (!user || user.role !== 'DELIVERY') return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not a rider yet — show registration
  if (error || !data?.partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bike className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Become a VEGU Rider</h2>
          <p className="text-gray-500 text-sm mb-6">Earn money delivering groceries in your city</p>
          <button
            type="button"
            onClick={() => registerRider.mutate()}
            disabled={registerRider.isPending}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {registerRider.isPending ? 'Registering...' : 'Register as Rider'}
          </button>
        </div>
      </div>
    );
  }

  const { partner, activeOrder, todayDeliveries, pendingOrders } = data;
  const isOnline = partner.status === 'AVAILABLE';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-green-200 text-sm">Welcome back,</p>
            <h1 className="text-xl font-bold">{user.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleStatus.mutate()}
              disabled={toggleStatus.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                isOnline ? 'bg-white text-green-700' : 'bg-green-800 text-green-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusColors[partner.status]}`} />
              {isOnline ? 'Online' : 'Offline'}
              <Power className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              className="w-9 h-9 bg-green-800 hover:bg-green-900 text-green-200 rounded-full flex items-center justify-center transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-700 rounded-xl p-3 text-center">
            <p className="text-green-200 text-xs">Today</p>
            <p className="text-white font-bold text-lg">{todayDeliveries}</p>
            <p className="text-green-200 text-xs">deliveries</p>
          </div>
          <div className="bg-green-700 rounded-xl p-3 text-center">
            <p className="text-green-200 text-xs">Total</p>
            <p className="text-white font-bold text-lg">{partner.totalDeliveries}</p>
            <p className="text-green-200 text-xs">completed</p>
          </div>
          <div className="bg-green-700 rounded-xl p-3 text-center">
            <p className="text-green-200 text-xs">Earnings</p>
            <p className="text-white font-bold text-lg">₹{partner.totalEarnings}</p>
            <p className="text-green-200 text-xs">total</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">

        {/* Active Order */}
        {activeOrder && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-green-500">
            <div className="bg-green-50 px-4 py-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-semibold text-green-700 text-sm">Active Delivery</span>
              <span className="ml-auto text-xs text-gray-500">#{activeOrder.orderNumber}</span>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{activeOrder.user.name}</p>
                  <p className="text-gray-500 text-sm truncate">
                    {activeOrder.items.map(i => i.product.name).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{activeOrder.total}</p>
                  <p className="text-xs text-green-600 font-medium">+₹{activeOrder.deliveryFee} fee</p>
                </div>
              </div>

              {activeOrder.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${activeOrder.address.line1}, ${activeOrder.address.city}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-gray-50 rounded-xl p-3"
                >
                  <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 flex-1">
                    {activeOrder.address.line1}, {activeOrder.address.city}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </a>
              )}

              {activeOrder.user.phone && (
                <a
                  href={`tel:${activeOrder.user.phone}`}
                  className="flex items-center gap-2 bg-blue-50 rounded-xl p-3"
                >
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">Call {activeOrder.user.name}</span>
                </a>
              )}

              {/* Status buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {activeOrder.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    onClick={() => updateStatus.mutate({ orderId: activeOrder.id, status: 'OUT_FOR_DELIVERY' })}
                    disabled={updateStatus.isPending}
                    className="col-span-2 bg-yellow-500 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                  >
                    {updateStatus.isPending ? 'Updating...' : 'Mark as Picked Up'}
                  </button>
                )}
                {activeOrder.status === 'OUT_FOR_DELIVERY' && (
                  <button
                    type="button"
                    onClick={() => setProofOrderId(activeOrder.id)}
                    className="col-span-2 bg-green-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Available Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Available Orders</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {pendingOrders.length} nearby
            </span>
          </div>

          {!isOnline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 text-sm">You are offline</p>
                <p className="text-yellow-600 text-xs">Go online to accept delivery orders</p>
              </div>
            </div>
          )}

          {isOnline && pendingOrders.length === 0 && !activeOrder && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No orders available right now</p>
              <p className="text-gray-400 text-sm">New orders will appear here automatically</p>
            </div>
          )}

          {isOnline && !activeOrder && pendingOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                  <p className="text-gray-500 text-sm">{order.user.name}</p>
                  <p className="text-xs text-gray-400">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{order.total}</p>
                  <p className="text-xs text-green-600 font-semibold">+₹{order.deliveryFee} earn</p>
                </div>
              </div>

              {order.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="truncate">{order.address.line1}, {order.address.city}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => acceptOrder.mutate(order.id)}
                disabled={acceptOrder.isPending && updatingId === order.id}
                className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                {acceptOrder.isPending && updatingId === order.id ? 'Accepting...' : 'Accept Order'}
              </button>
            </div>
          ))}
        </div>

        {/* Earnings summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-green-600" />
            Earnings Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Total deliveries</span>
              <span className="font-semibold text-gray-900">{partner.totalDeliveries}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total earned</span>
              <span className="font-semibold text-green-600">₹{partner.totalEarnings}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Vehicle</span>
              <span className="font-semibold text-gray-900 capitalize">
                {partner.vehicleType} {partner.vehicleNo ? `(${partner.vehicleNo})` : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Proof of Delivery modal */}
      {proofOrderId && (
        <ProofModal
          orderId={proofOrderId}
          onClose={() => setProofOrderId(null)}
          onSuccess={() => {
            setProofOrderId(null);
            qc.invalidateQueries({ queryKey: ['rider-dashboard'] });
          }}
        />
      )}
    </div>
  );
}
