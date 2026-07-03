'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Settings, Store, Truck, Percent, Save, Globe, Phone, Mail } from 'lucide-react';

type StoreSettings = {
  storeName?: string; storeEmail?: string; storePhone?: string;
  storeCurrency?: string; storeTimezone?: string;
  minOrderAmount?: number; deliveryFee?: number; freeDeliveryThreshold?: number;
  taxRate?: number; maintenanceMode?: boolean;
  supportPhone?: string; supportWhatsApp?: string; supportEmail?: string;
  officeAddress?: string; supportHours?: string; emergencySupport?: string;
  aboutTitle?: string; aboutDescription?: string;
  contactTitle?: string; contactDescription?: string;
  paymentMethods?: string; faqJson?: string;
  privacyPolicy?: string; termsAndConditions?: string;
  riderSafetyPolicy?: string;
  refundPolicy?: string; cancellationPolicy?: string; shippingPolicy?: string;
};

const inp = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors';

export default function SettingsPage() {
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState('general');

  const { data: settings, isLoading } = useQuery<StoreSettings>({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/api/admin/settings').then(r => r.data.data ?? {}),
  });

  const [form, setForm] = useState<StoreSettings>({});
  const merged = { ...settings, ...form };

  const save = useMutation({
    mutationFn: () => api.patch('/api/admin/settings', form),
    onSuccess: () => { toast.success('Settings saved'); setForm({}); qc.invalidateQueries({ queryKey: ['admin-settings'] }); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save'),
  });

  const update = (key: keyof StoreSettings, value: string | number | boolean) =>
    setForm(f => ({ ...f, [key]: value }));

  const hasChanges = Object.keys(form).length > 0;

  const SECTIONS = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'commerce', label: 'Commerce', icon: Percent },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'public', label: 'Public Pages', icon: Settings },
    { id: 'legal', label: 'Legal', icon: Mail },
  ];

  if (isLoading) return (
    <div className="p-6 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-6 max-w-[1000px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Configure your store preferences</p>
        </div>
        {hasChanges && (
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {save.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-44 shrink-0 space-y-0.5">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${activeSection === s.id ? 'bg-emerald-500/15 text-emerald-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
            >
              <s.icon className="w-4 h-4 shrink-0" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {activeSection === 'general' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">General Settings</h2>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Store Name</label>
                <input value={merged.storeName ?? ''} onChange={e => update('storeName', e.target.value)} className={inp} placeholder="VEGU" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Currency</label>
                  <select title="Currency" value={merged.storeCurrency ?? 'INR'} onChange={e => update('storeCurrency', e.target.value)} className={inp}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Timezone</label>
                  <select title="Timezone" value={merged.storeTimezone ?? 'Asia/Kolkata'} onChange={e => update('storeTimezone', e.target.value)} className={inp}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl cursor-pointer">
                <div className="flex-1">
                  <p className="text-xs font-medium text-zinc-300">Maintenance Mode</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Temporarily disable the storefront for customers</p>
                </div>
                <input
                  type="checkbox"
                  checked={merged.maintenanceMode ?? false}
                  onChange={e => update('maintenanceMode', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-emerald-500"
                />
              </label>
            </div>
          )}

          {activeSection === 'delivery' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Delivery Settings</h2>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Minimum Order Amount (₹)</label>
                <input type="number" value={merged.minOrderAmount ?? ''} onChange={e => update('minOrderAmount', Number(e.target.value))} className={inp} placeholder="100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Delivery Fee (₹)</label>
                <input type="number" value={merged.deliveryFee ?? ''} onChange={e => update('deliveryFee', Number(e.target.value))} className={inp} placeholder="30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Free Delivery Threshold (₹)</label>
                <input type="number" value={merged.freeDeliveryThreshold ?? ''} onChange={e => update('freeDeliveryThreshold', Number(e.target.value))} className={inp} placeholder="500" />
                <p className="text-[10px] text-zinc-600 mt-1">Orders above this amount get free delivery</p>
              </div>
            </div>
          )}

          {activeSection === 'commerce' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Commerce Settings</h2>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Tax Rate (%)</label>
                <input type="number" step="0.01" value={merged.taxRate ?? ''} onChange={e => update('taxRate', Number(e.target.value))} className={inp} placeholder="18" />
                <p className="text-[10px] text-zinc-600 mt-1">GST or applicable tax rate applied to orders</p>
              </div>
            </div>
          )}

          {activeSection === 'contact' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Contact Information</h2>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Support Email</label>
                <input type="email" value={merged.storeEmail ?? ''} onChange={e => update('storeEmail', e.target.value)} className={inp} placeholder="support@vegu.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Support Phone</label>
                <input type="tel" value={merged.storePhone ?? ''} onChange={e => update('storePhone', e.target.value)} className={inp} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Public Support Phone</label>
                <input type="tel" value={merged.supportPhone ?? ''} onChange={e => update('supportPhone', e.target.value)} className={inp} placeholder="+91-1800-8348-4357" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">WhatsApp Support</label>
                <input type="text" value={merged.supportWhatsApp ?? ''} onChange={e => update('supportWhatsApp', e.target.value)} className={inp} placeholder="+91-90000-00000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Public Support Email</label>
                <input type="email" value={merged.supportEmail ?? ''} onChange={e => update('supportEmail', e.target.value)} className={inp} placeholder="support@vegu.app" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Support Hours</label>
                <input type="text" value={merged.supportHours ?? ''} onChange={e => update('supportHours', e.target.value)} className={inp} placeholder="9:00 AM - 9:00 PM, Monday to Sunday" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Office Address</label>
                <textarea title="Office address" value={merged.officeAddress ?? ''} onChange={e => update('officeAddress', e.target.value)} className={inp} rows={2} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Emergency Support Message</label>
                <textarea title="Emergency support message" value={merged.emergencySupport ?? ''} onChange={e => update('emergencySupport', e.target.value)} className={inp} rows={2} />
              </div>
            </div>
          )}

          {activeSection === 'public' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Public Content</h2>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">About Title</label>
                <input title="About title" type="text" value={merged.aboutTitle ?? ''} onChange={e => update('aboutTitle', e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">About Description</label>
                <textarea title="About description" value={merged.aboutDescription ?? ''} onChange={e => update('aboutDescription', e.target.value)} className={inp} rows={4} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Contact Title</label>
                <input title="Contact title" type="text" value={merged.contactTitle ?? ''} onChange={e => update('contactTitle', e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Contact Description</label>
                <textarea title="Contact description" value={merged.contactDescription ?? ''} onChange={e => update('contactDescription', e.target.value)} className={inp} rows={3} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Payment Methods JSON</label>
                <textarea title="Payment methods JSON" value={merged.paymentMethods ?? ''} onChange={e => update('paymentMethods', e.target.value)} className={inp} rows={4} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">FAQ JSON</label>
                <textarea title="FAQ JSON" value={merged.faqJson ?? ''} onChange={e => update('faqJson', e.target.value)} className={inp} rows={6} />
              </div>
            </div>
          )}

          {activeSection === 'legal' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Legal Policies</h2>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Privacy Policy</label>
                <textarea title="Privacy policy" value={merged.privacyPolicy ?? ''} onChange={e => update('privacyPolicy', e.target.value)} className={inp} rows={5} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Terms & Conditions</label>
                <textarea title="Terms and conditions" value={merged.termsAndConditions ?? ''} onChange={e => update('termsAndConditions', e.target.value)} className={inp} rows={5} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Rider Safety & Compliance</label>
                <textarea title="Rider safety and compliance" value={merged.riderSafetyPolicy ?? ''} onChange={e => update('riderSafetyPolicy', e.target.value)} className={inp} rows={5} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Refund Policy</label>
                <textarea title="Refund policy" value={merged.refundPolicy ?? ''} onChange={e => update('refundPolicy', e.target.value)} className={inp} rows={4} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Cancellation Policy</label>
                <textarea title="Cancellation policy" value={merged.cancellationPolicy ?? ''} onChange={e => update('cancellationPolicy', e.target.value)} className={inp} rows={4} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Shipping Policy</label>
                <textarea title="Shipping policy" value={merged.shippingPolicy ?? ''} onChange={e => update('shippingPolicy', e.target.value)} className={inp} rows={4} />
              </div>
            </div>
          )}

          {hasChanges && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {save.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
