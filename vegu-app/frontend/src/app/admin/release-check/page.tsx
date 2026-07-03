'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { resolveApiBase } from '@/lib/apiBase';

const apiBase = resolveApiBase('');

type CheckResult = {
  key: string;
  label: string;
  ok: boolean;
  details: string;
};

const HTTP_CHECKS = [
  { key: 'health', label: 'Backend Health', path: `${apiBase}/api/public/config` },
  { key: 'products', label: 'Products API', path: `${apiBase}/api/products?limit=1` },
  { key: 'bazaar', label: 'Live Bazaar API', path: `${apiBase}/api/products/bazaar` },
  { key: 'price', label: 'Price Flow API', path: `${apiBase}/api/products/price-signals` },
  { key: 'kitchen', label: 'AI Kitchen API', path: `${apiBase}/api/kitchen/chat`, method: 'POST', body: { messages: [{ role: 'user', content: 'hello' }] } },
  { key: 'support', label: 'Support API', path: `${apiBase}/api/support/chat`, method: 'POST', body: { message: 'hello' } },
];

export default function ReleaseCheckPage() {
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [streamOk, setStreamOk] = useState<{ bazaar: boolean; price: boolean }>({ bazaar: false, price: false });

  useEffect(() => {
    let mounted = true;

    const runChecks = async () => {
      setLoading(true);
      const results: CheckResult[] = [];

      for (const check of HTTP_CHECKS) {
        try {
          const res = await fetch(check.path, {
            method: check.method || 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: check.body ? JSON.stringify(check.body) : undefined,
          });
          results.push({
            key: check.key,
            label: check.label,
            ok: res.ok || (check.key === 'kitchen' && res.status === 401),
            details: `HTTP ${res.status}`,
          });
        } catch {
          results.push({
            key: check.key,
            label: check.label,
            ok: false,
            details: 'Network error',
          });
        }
      }

      const testStream = (url: string, onDone: (ok: boolean) => void) => {
        try {
          const ev = new EventSource(url);
          const timeout = setTimeout(() => {
            ev.close();
            onDone(false);
          }, 6000);

          ev.onmessage = () => {
            clearTimeout(timeout);
            ev.close();
            onDone(true);
          };

          ev.onerror = () => {
            clearTimeout(timeout);
            ev.close();
            onDone(false);
          };
        } catch {
          onDone(false);
        }
      };

      await new Promise<void>((resolve) => {
        let done = 0;
        const finish = () => {
          done += 1;
          if (done === 2) resolve();
        };
        testStream(`${apiBase}/api/products/bazaar/stream`, (ok) => {
          if (mounted) setStreamOk((s) => ({ ...s, bazaar: ok }));
          finish();
        });
        testStream(`${apiBase}/api/products/price-signals/stream`, (ok) => {
          if (mounted) setStreamOk((s) => ({ ...s, price: ok }));
          finish();
        });
      });

      if (mounted) {
        setChecks(results);
        setLoading(false);
      }
    };

    void runChecks();
    return () => {
      mounted = false;
    };
  }, []);

  const score = useMemo(() => {
    const streamChecks = [streamOk.bazaar, streamOk.price];
    const all = [...checks.map((c) => c.ok), ...streamChecks];
    if (all.length === 0) return 0;
    return Math.round((all.filter(Boolean).length / all.length) * 100);
  }, [checks, streamOk.bazaar, streamOk.price]);

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Release Check</h1>
        <p className="text-zinc-400 text-sm">Live service verification screen</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-zinc-400 text-xs">Current Score</p>
        <p className="text-white text-3xl font-black mt-1">{loading ? '--' : `${score}%`}</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 text-sm text-white font-semibold">API Checks</div>
        <div className="divide-y divide-zinc-800/60">
          {checks.map((c) => (
            <div key={c.key} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-200">{c.label}</p>
                <p className="text-[11px] text-zinc-500">{c.details}</p>
              </div>
              {c.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
            </div>
          ))}
          {loading && (
            <div className="px-4 py-4 flex items-center gap-2 text-zinc-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Running checks...
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 text-sm text-white font-semibold">Realtime Checks</div>
        <div className="divide-y divide-zinc-800/60">
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-zinc-200">Live Bazaar Stream</p>
            {streamOk.bazaar ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-zinc-200">Price Flow Stream</p>
            {streamOk.price ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
          </div>
        </div>
      </div>
    </div>
  );
}
