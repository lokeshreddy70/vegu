'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, Truck, Plus, CheckCircle, Tag, X } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useCartStore, useCartSubtotal } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { pushLocalCartToDB } from '@/lib/cartSync';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';

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

  // Step 1: wait for Zustand to hydrate from localStorage
  useEffect(() => { setHydrated(true); }, []);

  // Step 2: after hydration, auth-guard + push local cart → DB before backend reads it
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
      toast.success(`Coupon applied! You save ${formatPrice(d)}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid coupon code';
      toast.error(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  const { mutate: placeOrder, isPending } = useMutation({
    mutationFn: () => api.post('/api/orders', { addressId: selectedAddress, paymentMethod, couponCode: appliedCoupon?.code }),
    onSuccess: (res) => {
      clearCart();
      toast.success('Order placed successfully!');
      router.push(`/orders/${res.data.data.id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to place order';
      toast.error(msg);
    },
  });

  const paymentOptions = [
    { id: 'COD', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when delivered' },
    { id: 'RAZORPAY', label: 'Online Payment', icon: '💳', desc: 'Cards, UPI, Net Banking' },
  ];

  if (!hydrated || !synced) {
    return (
      <div className="container-page py-8">
        <div className="skeleton h-10 w-40 rounded-xl mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton h-48 rounded-3xl" />
            <div className="skeleton h-36 rounded-3xl" />
          </div>
          <div className="skeleton h-72 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-4 sm:py-8">
      <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Delivery Address */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-primary-600" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Delivery Address</h2>
            </div>

            {addrLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No addresses saved</p>
                <Button variant="secondary" size="sm" onClick={() => router.push('/account/addresses')}>
                  <Plus className="w-4 h-4 mr-1" /> Add Address
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <motion.div
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr.id)}
                    whileTap={{ scale: 0.99 }}
                    className={`p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedAddress === addr.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="badge badge-gray text-xs">{addr.label}</span>
                          <span className="font-semibold text-gray-900 text-sm">{addr.fullName}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                        <p className="text-sm text-gray-600">{addr.city}, {addr.state} — {addr.pincode}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{addr.phone}</p>
                      </div>
                      {selectedAddress === addr.id && <CheckCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />}
                    </div>
                  </motion.div>
                ))}
                <button type="button" onClick={() => router.push('/account/addresses')} className="flex items-center gap-2 text-primary-600 font-semibold text-sm hover:underline mt-2">
                  <Plus className="w-4 h-4" /> Add new address
                </button>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-primary-600" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Payment Method</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paymentOptions.map((opt) => (
                <motion.div
                  key={opt.id}
                  onClick={() => setPaymentMethod(opt.id as 'COD' | 'RAZORPAY')}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === opt.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl sm:text-2xl">{opt.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </div>
                    {paymentMethod === opt.id && <CheckCircle className="w-5 h-5 text-primary-600" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="card p-4 flex items-center gap-3 bg-primary-50 border border-primary-100">
            <Truck className="w-5 h-5 text-primary-600 shrink-0" />
            <p className="text-sm text-primary-800 font-medium">Estimated delivery: <strong>30 minutes</strong> after order confirmation</p>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="card p-4 sm:p-6 lg:sticky lg:top-24 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Order Summary</h2>
            <div className="space-y-3 max-h-40 sm:max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 line-clamp-1 flex-1">{item.product.name} × {item.quantity}</span>
                  <span className="font-semibold text-gray-900 ml-2">{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {appliedCoupon ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-2xl">
                <Tag className="w-4 h-4 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-700">{appliedCoupon.code}</p>
                  <p className="text-xs text-green-600 truncate">{appliedCoupon.description}</p>
                </div>
                <button type="button" onClick={removeCoupon} aria-label="Remove coupon">
                  <X className="w-4 h-4 text-green-600 hover:text-green-800" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2 p-3 bg-gray-50 rounded-2xl">
                <input
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                  placeholder="Promo code"
                  className="bg-transparent text-sm flex-1 outline-none text-gray-700 placeholder:text-gray-400 uppercase"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-40"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className={`font-semibold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon discount</span>
                  <span className="font-semibold">−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base sm:text-lg border-t border-gray-100 pt-3">
                <span>Total</span>
                <span className="text-primary-600">{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              loading={isPending}
              disabled={!selectedAddress || items.length === 0}
              onClick={() => placeOrder()}
            >
              Place Order — {formatPrice(Math.max(0, total))}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
