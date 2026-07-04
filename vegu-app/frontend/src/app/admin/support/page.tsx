'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Headphones, LifeBuoy, MessageSquare, Send, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface TicketSummary {
  id: string;
  title: string;
  summary: string;
  lastMessagePreview?: string | null;
  category: string;
  priority: string;
  status: string;
  updatedAt: string;
  user?: { name?: string; email?: string; role?: string } | null;
  order?: { orderNumber?: string; status?: string; total?: number } | null;
  _count?: { messages: number };
}

interface TicketDetail extends TicketSummary {
  messages: Array<{
    id: string;
    body: string;
    senderRole: string;
    createdAt: string;
    sender?: { name?: string; email?: string } | null;
  }>;
  assignedAdmin?: { name?: string; email?: string } | null;
}

const STAT_ICONS = {
  open: Headphones,
  urgent: AlertTriangle,
  waiting: MessageSquare,
  resolvedToday: ShieldCheck,
} as const;

export default function AdminSupportPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [reply, setReply] = useState('');

  const { data: overview } = useQuery({
    queryKey: ['admin-support-overview'],
    queryFn: () => api.get('/api/admin/support/overview').then(r => r.data.data),
    refetchInterval: 15000,
  });

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['admin-support-tickets', statusFilter, priorityFilter],
    queryFn: () => api.get('/api/admin/support/tickets', { params: { status: statusFilter || undefined, priority: priorityFilter || undefined } }).then(r => r.data),
    refetchInterval: 15000,
  });

  const tickets: TicketSummary[] = ticketsData?.data ?? [];
  const selectedTicketId = selectedId || tickets[0]?.id || null;

  const { data: detail } = useQuery<TicketDetail>({
    queryKey: ['admin-support-ticket-detail', selectedTicketId],
    queryFn: () => api.get(`/api/admin/support/tickets/${selectedTicketId}`).then(r => r.data.data),
    enabled: !!selectedTicketId,
  });

  const replyMutation = useMutation({
    mutationFn: () => api.post(`/api/admin/support/tickets/${selectedTicketId}/reply`, { body: reply, markWaiting: false }),
    onSuccess: () => {
      setReply('');
      toast.success('Reply sent');
      qc.invalidateQueries({ queryKey: ['admin-support-ticket-detail', selectedTicketId] });
      qc.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => api.patch(`/api/admin/support/tickets/${selectedTicketId}`, { status }),
    onSuccess: () => {
      toast.success('Ticket updated');
      qc.invalidateQueries({ queryKey: ['admin-support-ticket-detail', selectedTicketId] });
      qc.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      qc.invalidateQueries({ queryKey: ['admin-support-overview'] });
    },
  });

  const stats = useMemo(() => [
    { key: 'open', label: 'Open', value: overview?.open ?? 0 },
    { key: 'urgent', label: 'Urgent', value: overview?.urgent ?? 0 },
    { key: 'waiting', label: 'Waiting', value: overview?.waiting ?? 0 },
    { key: 'resolvedToday', label: 'Resolved Today', value: overview?.resolvedToday ?? 0 },
  ], [overview]);

  return (
    <div className="max-w-[1700px] space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-white">Support Desk</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Customer complaints, AI escalations, refund requests, and chat history.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = STAT_ICONS[stat.key as keyof typeof STAT_ICONS];
          return (
            <div key={stat.key} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="border-b border-zinc-800 px-4 py-4">
            <div className="flex gap-2">
              <select title="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none">
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_CUSTOMER">Waiting</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <select title="Filter by priority" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none">
                <option value="">All Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-zinc-800/60">
            {isLoading && <div className="px-4 py-8 text-sm text-zinc-500">Loading tickets…</div>}
            {!isLoading && !tickets.length && <div className="px-4 py-8 text-sm text-zinc-500">No support tickets found.</div>}
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedId(ticket.id)}
                className={`w-full px-4 py-4 text-left transition-colors ${selectedTicketId === ticket.id ? 'bg-emerald-500/10' : 'hover:bg-zinc-800/50'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{ticket.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{ticket.lastMessagePreview || ticket.summary}</p>
                    <p className="mt-2 text-[11px] text-zinc-600">{ticket.user?.name || ticket.user?.email || 'Guest'}{ticket.order?.orderNumber ? ` · #${ticket.order.orderNumber}` : ''}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{ticket.priority}</p>
                    <p className="mt-1 text-[11px] text-emerald-400">{ticket.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          {!detail ? (
            <div className="px-6 py-10 text-sm text-zinc-500">Select a support ticket to view details.</div>
          ) : (
            <div className="flex max-h-[78vh] flex-col">
              <div className="border-b border-zinc-800 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">{detail.title}</h2>
                    <p className="mt-1 text-xs text-zinc-500">{detail.user?.name || detail.user?.email || 'Guest'}{detail.order?.orderNumber ? ` · Order #${detail.order.orderNumber}` : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => statusMutation.mutate({ status: 'IN_PROGRESS' })} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200">In Progress</button>
                    <button type="button" onClick={() => statusMutation.mutate({ status: 'WAITING_FOR_CUSTOMER' })} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200">Waiting</button>
                    <button type="button" onClick={() => statusMutation.mutate({ status: 'RESOLVED' })} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-black">Resolve</button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 text-xs">
                  <div className="rounded-lg bg-zinc-950 px-3 py-2 text-zinc-400">Priority: <span className="font-semibold text-white">{detail.priority}</span></div>
                  <div className="rounded-lg bg-zinc-950 px-3 py-2 text-zinc-400">Category: <span className="font-semibold text-white">{detail.category.replace(/_/g, ' ')}</span></div>
                  <div className="rounded-lg bg-zinc-950 px-3 py-2 text-zinc-400">Status: <span className="font-semibold text-white">{detail.status.replace(/_/g, ' ')}</span></div>
                  <div className="rounded-lg bg-zinc-950 px-3 py-2 text-zinc-400">Messages: <span className="font-semibold text-white">{detail.messages.length}</span></div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {detail.messages.map((message) => (
                  <div key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.senderRole === 'ADMIN' ? 'ml-auto bg-emerald-500 text-black' : message.senderRole === 'AI' ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-950 text-zinc-200 border border-zinc-800'}`}>
                    <p>{message.body}</p>
                    <p className={`mt-2 text-[10px] ${message.senderRole === 'ADMIN' ? 'text-black/60' : 'text-zinc-500'}`}>
                      {message.sender?.name || message.senderRole} · {new Date(message.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-800 px-6 py-4">
                <div className="flex items-end gap-3">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    rows={3}
                    placeholder="Reply to the customer or rider…"
                    className="min-h-[92px] flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => replyMutation.mutate()}
                    disabled={!reply.trim() || replyMutation.isPending}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-bold text-black disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" /> Reply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
