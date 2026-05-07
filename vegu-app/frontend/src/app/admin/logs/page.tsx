'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ChevronLeft, ChevronRight, ScrollText, Search } from 'lucide-react';

type LogEntry = {
  id: string; action: string; entity: string; entityId?: string;
  details?: string; createdAt: string;
  user?: { name: string; email: string; role: string };
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'text-emerald-400 bg-emerald-500/10',
  UPDATE: 'text-blue-400 bg-blue-500/10',
  DELETE: 'text-red-400 bg-red-500/10',
  LOGIN: 'text-violet-400 bg-violet-500/10',
  LOGOUT: 'text-zinc-400 bg-zinc-500/10',
  APPROVE: 'text-cyan-400 bg-cyan-500/10',
  REJECT: 'text-orange-400 bg-orange-500/10',
};

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-logs', page, search],
    queryFn: () => api.get('/api/admin/logs', { params: { page, limit: 25, search: search || undefined } }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const logs: LogEntry[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-4 max-w-[1200px]">
      <div>
        <h1 className="text-xl font-bold text-white">Audit Logs</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Platform activity and admin action history</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search logs…"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-zinc-800/60">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="px-4 py-3"><div className="h-4 bg-zinc-800 rounded animate-pulse" /></div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <ScrollText className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-600">No audit logs yet</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-4 px-4 py-3 hover:bg-zinc-800/20 transition-colors">
                <div className="shrink-0 mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ACTION_COLORS[log.action] ?? 'text-zinc-400 bg-zinc-700'}`}>
                    {log.action}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-zinc-300 font-medium">{log.entity}</span>
                    {log.entityId && <span className="text-[10px] font-mono text-zinc-600">{log.entityId.slice(0, 8)}…</span>}
                  </div>
                  {log.details && <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{log.details}</p>}
                  {log.user && (
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {log.user.name} <span className="text-zinc-700">·</span> {log.user.role}
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-zinc-600 shrink-0 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">Page {meta.page} of {meta.totalPages} · {meta.total} entries</p>
            <div className="flex gap-2">
              <button type="button" title="Previous page" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button type="button" title="Next page" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
