'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, CreditCard, Truck, Plus, CheckCircle2, Tag, X, ArrowLeft, Leaf } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useCartStore, useCartSubtotal } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { pushLocalCartToDB } from '@/lib/cartSync';
import { formatPrice } from '@/lib/utils';

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'RAZORPAY'>('COD');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (items.length === 0) { router.push('/cart'); return; }
    pushLocalCartToDB(items).then(() => setSynced(true));
  }, [hydrated, isAuthenticated, items, router]);

  const { data: addresses = [], isLoading: addrLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: () => api.get('/api/addresses').then(r => r.data.data),
    enabled: isAuthenticated && synced,
  });

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddress(def.id);
    }
  }, [addresses, selectedAddress]);

  const subtotal = useCartSubtotal();
  const deliveryFee = subtotal >= 500 ? 0 : 40;
  const discount = appliedCoupon?.discount ?? 0;
  const total = subtotal + deliveryFee - discount;

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.post('/api/coupons/validate', { code: couponInput.trim(), orderTotal: subtotal });
      const { code, discount: d, description } = res.data.data;
      setAppliedCoupon({ code, discount: d, description });
      toast.success(`Coupon applied! You save ${formatPrice(d)}`, { style: { background: '#fff', color: '#1A1A1A', border: '1px solid #E8E8E8' } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid coupon code';
      toast.error(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponInput(''); };

  const { mutate: placeOrder, isPending } = useMutation({
    mutationFn: () => api.post('/api/orders', { addressId: selectedAddress, paymentMethod, couponCode: appliedCoupon?.code }),
    onSuccess: (res) => {
      clearCart();
      toast.success('Order placed!', { style: { background: '#fff', color: '#1A1A1A', border: '1px solid #E8E8E8' } });
      router.push(`/orders/${res.data.data.id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to place order';
      toast.error(msg);
    },
  });

  if (!hydrated || !synced) {
    return (
      <div className="bg-[#F7F9FA] min-h-screen px-4 pt-12 space-y-4">
        <div className="h-8 w-40 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-36 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-[#F7F9FA] min-h-screen pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 flex items-center gap-3 px-4 pt-12 pb-4 sticky top-0 z-10">
        <button type="button" aria-label="Go back" onClick={() => router.back()}
          className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-gray-900 font-bold text-lg">Checkout</h1>
          <p className="text-gray-400 text-xs">{items.length} item{items.length !== 1 ? 's' : ''} in cart</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Delivery Address */}
        <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-veg" />
            <p className="text-gray-900 font-bold text-sm">Delivery Address</p>
          </div>
          {addrLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-6">
              <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm mb-3">No addresses saved</p>
              <button type="button" onClick={() => router.push('/account/addresses')}
                className="flex items-center gap-1.5 text-veg text-sm font-semibold mx-auto">
                <Plus className="w-4 h-4" /> Add Address
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <div key={addr.id} onClick={() => setSelectedAddress(addr.id)}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedAddress === addr.id
                      ? 'border-veg bg-veg/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{addr.label}</span>
                        <span className="text-gray-800 font-semibold text-sm">{addr.fullName}</span>
                      </div>
                      <p className="text-gray-500 text-xs truncate">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                      <p className="text-gray-500 text-xs">{addr.city}, {addr.state} — {addr.pincode}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{addr.phone}</p>
                    </div>
                    {selectedAddress === addr.id && <CheckCircle2 className="w-5 h-5 text-veg shrink-0 mt-0.5" />}
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => router.push('/account/addresses')}
                className="flex items-center gap-1.5 text-veg text-sm font-semibold mt-1">
                <Plus className="w-4 h-4" /> Add new address
              </button>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-veg" />
            <p className="text-gray-900 font-bold text-sm">Payment Method</p>
          </div>
          <div className="space-y-2">
            {[
              { id: 'COD', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when delivered' },
              { id: 'RAZORPAY', label: 'Online Payment', icon: '💳', desc: 'Cards, UPI, Net Banking' },
            ].map((opt) => (
              <div key={opt.id} onClick={() => setPaymentMethod(opt.id as 'COD' | 'RAZORPAY')}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === opt.id
                    ? 'border-veg bg-veg/5'
                    : 'border-gray-100 hover:border-gray-200'
                }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{opt.icon}</span>
                  <div>
                    <p className="text-gray-800 text-sm font-semibold">{opt.label}</p>
                    <p className="text-gray-400 text-xs">{opt.desc}</p>
                  </div>
                </div>
                {paymentMethod === opt.id && <CheckCircle2 className="w-5 h-5 text-veg" />}
              </div>
            ))}
          </div>
        </div>

        {/* Delivery banner */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center gap-3">
          <Truck className="w-4 h-4 text-veg shrink-0" />
          <p className="text-gray-600 text-xs font-medium">
            Estimated delivery: <span className="text-veg font-bold">30 minutes</span> after confirmation
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm space-y-3">
          <p className="text-gray-900 font-bold text-sm">Order Summary</p>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-gray-500 line-clamp-1 flex-1">{item.product.name} × {item.quantity}</span>
                <span className="text-gray-800 font-semibold ml-2">{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          {appliedCoupon ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <Tag className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-600">{appliedCoupon.code}</p>
                <p className="text-xs text-emerald-500 truncate">{appliedCoupon.description}</p>
              </div>
              <button type="button" onClick={removeCoupon} aria-label="Remove coupon">
                <X className="w-4 h-4 text-emerald-500 hover:text-emerald-700" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
              <input
                value={couponInput}
                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                placeholder="Promo code"
                className="bg-transparent text-sm flex-1 outline-none text-gray-700 placeholder:text-gray-400 uppercase"
              />
              <button type="button" onClick={applyCoupon}
                disabled={couponLoading || !couponInput.trim()}
                className="text-xs font-bold text-veg disabled:opacity-40">
                {couponLoading ? '…' : 'Apply'}
              </button>
            </div>
          )}

          <div className="border-t border-gray-100 pt-3 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-800 font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery</span>
              <span className={`font-semibold ${deliveryFee === 0 ? 'text-veg' : 'text-gray-800'}`}>
                {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Coupon</span>
                <span className="text-veg font-semibold">−{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-gray-900 font-bold">Total</span>
              <span className="text-gray-900 font-extrabold text-xl">{formatPrice(Math.max(0, total))}</span>
            </div>
          </div>
        </div>

        {/* Place Order CTA */}
        <button type="button" onClick={() => placeOrder()}
          disabled={isPending || !selectedAddress || items.length === 0}
          className="w-full bg-veg text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-veg/30 active:scale-[0.98] transition-all">
          {isPending ? 'Placing Order…' : `Place Order — ${formatPrice(Math.max(0, total))}`}
        </button>

        <div className="flex items-center justify-center gap-1.5 py-2">
          <Leaf className="w-3.5 h-3.5 text-veg" />
          <span className="text-gray-400 text-xs">Fresh in 10 minutes, guaranteed</span>
        </div>
      </div>
    </div>
  );
}
