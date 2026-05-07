'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Bell, Send, Users, Store, Truck } from 'lucide-react';

const inp = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors';

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'All Users', icon: Users, desc: 'Customers, vendors, and riders' },
  { value: 'CUSTOMERS', label: 'Customers Only', icon: Users, desc: 'Registered customer accounts' },
  { value: 'VENDORS', label: 'Vendors Only', icon: Store, desc: 'Approved vendor accounts' },
  { value: 'RIDERS', label: 'Riders Only', icon: Truck, desc: 'Delivery riders' },
];

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('ALL');

  const broadcast = useMutation({
    mutationFn: () => api.post('/api/admin/notifications/broadcast', { title, body, audience }),
    onSuccess: () => {
      toast.success('Notification sent!');
      setTitle('');
      setBody('');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send'),
  });

  const canSend = title.trim() && body.trim();

  return (
    <div className="p-6 space-y-6 max-w-[800px]">
      <div>
        <h1 className="text-xl font-bold text-white">Notifications</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Broadcast push notifications to users</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Bell className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Broadcast Notification</p>
            <p className="text-xs text-zinc-500">Send a push notification to selected audience</p>
          </div>
        </div>

        {/* Audience */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Audience</label>
          <div className="grid grid-cols-2 gap-2">
            {AUDIENCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAudience(opt.value)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${audience === opt.value ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 hover:border-zinc-700'}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${audience === opt.value ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  <opt.icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-medium ${audience === opt.value ? 'text-emerald-400' : 'text-zinc-300'}`}>{opt.label}</p>
                  <p className="text-[10px] text-zinc-600 truncate">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Notification Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={inp}
            placeholder="e.g. Weekend Sale is Live! 🎉"
            maxLength={80}
          />
          <p className="text-[10px] text-zinc-600 mt-1 text-right">{title.length}/80</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Message Body *</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            className={inp}
            rows={4}
            placeholder="e.g. Get up to 40% off on fresh vegetables this weekend. Limited time only!"
            maxLength={256}
          />
          <p className="text-[10px] text-zinc-600 mt-1 text-right">{body.length}/256</p>
        </div>

        {/* Preview */}
        {(title || body) && (
          <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Preview</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">V</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-200 truncate">{title || 'Notification Title'}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2">{body || 'Notification body text...'}</p>
                <p className="text-[10px] text-zinc-600 mt-1">VEGU · now</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => broadcast.mutate()}
          disabled={!canSend || broadcast.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {broadcast.isPending ? 'Sending…' : `Send to ${AUDIENCE_OPTIONS.find(o => o.value === audience)?.label}`}
        </button>
      </div>

      {/* Info */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <p className="text-xs text-amber-400 font-medium mb-1">Note</p>
        <p className="text-xs text-zinc-500">Notifications are delivered to users who have granted push notification permissions in the VEGU app. Users who have disabled notifications will not receive this broadcast.</p>
      </div>
    </div>
  );
}
