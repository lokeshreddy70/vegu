'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Send, Bot, User, Leaf, RotateCcw, Phone, MapPin, Receipt, Package, Headphones } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getPublicConfig } from '@/lib/publicConfig';
import { formatPrice } from '@/lib/utils';

interface SupportAction {
  type: string;
  label: string;
  value?: string;
}

interface SupportTicket {
  id: string;
  title?: string;
  status?: string;
  priority?: string;
  order?: { orderNumber?: string } | null;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
  estimatedDelivery?: string | null;
  vendor?: { storeName?: string } | null;
  deliveryPartner?: { user?: { name?: string; phone?: string } | null } | null;
}

interface OrderCard {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
  riderName?: string | null;
  riderPhone?: string | null;
  storeName?: string | null;
  eta?: string | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  source?: 'ai' | 'faq';
  actions?: SupportAction[];
  orderCard?: OrderCard | null;
  ticket?: SupportTicket | null;
  status?: 'sent' | 'resolved';
}

const QUICK_QUESTIONS = [
  'Where is my order?',
  'How do I cancel my order?',
  'When will I get my refund?',
  'Is there free delivery?',
  'Talk to a human agent',
];

const QUICK_ACTIONS: SupportAction[] = [
  { type: 'track-latest', label: 'Track Order' },
  { type: 'refund-latest', label: 'Request Refund' },
  { type: 'human', label: 'Talk To Human' },
  { type: 'call', label: 'Call Support' },
];

function OrderStatusCard({ order }: { order: OrderCard }) {
  return (
    <div className="mt-3 rounded-2xl border border-[#3a3223] bg-[#171717] p-3 text-left">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Latest Order</p>
          <p className="mt-1 text-sm font-bold text-white">#{order.orderNumber}</p>
          <p className="mt-1 text-xs text-zinc-400">{order.status.replace(/_/g, ' ')} · {formatPrice(order.total)}</p>
          {order.storeName && <p className="mt-1 text-xs text-zinc-500">Store: {order.storeName}</p>}
          {order.eta && <p className="mt-1 text-xs text-emerald-400">ETA: {new Date(order.eta).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</p>}
        </div>
        <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
          <Package className="h-4 w-4" />
        </div>
      </div>
      {(order.riderName || order.riderPhone) && (
        <div className="mt-3 rounded-xl bg-white/[0.03] px-3 py-2 text-xs text-zinc-300">
          Rider: <span className="font-semibold text-white">{order.riderName || 'Assigned'}</span>{order.riderPhone ? ` · ${order.riderPhone}` : ''}
        </div>
      )}
    </div>
  );
}

function TicketBadge({ ticket }: { ticket: SupportTicket }) {
  if (!ticket?.id) return null;
  return (
    <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
      Ticket created: <span className="font-semibold">{ticket.title || ticket.id}</span>
      {ticket.priority ? ` · ${ticket.priority}` : ''}
      {ticket.status ? ` · ${ticket.status.replace(/_/g, ' ')}` : ''}
    </div>
  );
}

function renderMessageContent(text: string): JSX.Element[] {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const segments = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={`line-${lineIdx}`}>
        {segments.map((seg, segIdx) => {
          if (seg.startsWith('**') && seg.endsWith('**')) {
            return <strong key={`seg-${lineIdx}-${segIdx}`}>{seg.slice(2, -2)}</strong>;
          }
          return <span key={`seg-${lineIdx}-${segIdx}`}>{seg}</span>;
        })}
        {lineIdx < lines.length - 1 ? <br /> : null}
      </span>
    );
  });
}

export default function HelpPage() {
  const router = useRouter();
  const { data: publicConfig } = useQuery({
    queryKey: ['public-config'],
    queryFn: getPublicConfig,
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm Vegu Support. How can I help you today?\n\nYou can ask me about your orders, delivery, refunds, or anything about the app!",
      source: 'ai',
      actions: QUICK_ACTIONS,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: recentOrders = [] } = useQuery<RecentOrder[]>({
    queryKey: ['support-recent-orders'],
    queryFn: () => api.get('/api/orders').then(r => r.data.data ?? []),
  });
  const { data: myTickets = [] } = useQuery({
    queryKey: ['my-support-tickets'],
    queryFn: () => api.get('/api/support/tickets/me').then(r => r.data.data),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text, status: 'sent' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await api.post('/api/support/chat', { message: text, history });
      const { reply, source, actions, orderCard, ticket } = res.data.data;
      setMessages(prev => [...prev, { role: 'assistant', content: reply, source, actions, orderCard, ticket, status: 'resolved' }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I\'m having trouble responding right now. Please email **${publicConfig?.supportEmail || 'support@vegu.app'}** or call **${publicConfig?.supportPhone || '+91-1800-8348-4357'}** for help.`,
        source: 'faq',
        actions: actionPalette,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const latestOrderCard = [...messages].reverse().find(m => m.orderCard)?.orderCard || (recentOrders[0] ? {
    id: recentOrders[0].id,
    orderNumber: recentOrders[0].orderNumber,
    status: recentOrders[0].status,
    total: recentOrders[0].total,
    paymentStatus: recentOrders[0].paymentStatus,
    paymentMethod: recentOrders[0].paymentMethod,
    riderName: recentOrders[0].deliveryPartner?.user?.name,
    riderPhone: recentOrders[0].deliveryPartner?.user?.phone,
    storeName: recentOrders[0].vendor?.storeName,
    eta: recentOrders[0].estimatedDelivery,
  } : null);

  const actionPalette: SupportAction[] = [
    { type: 'track-latest', label: 'Track Order' },
    { type: 'refund-latest', label: 'Request Refund' },
    { type: 'human', label: 'Talk To Human' },
    { type: 'call', label: 'Call Support' },
    ...(latestOrderCard?.riderPhone ? [{ type: 'contact-rider', label: 'Contact Rider' }] : []),
    ...(latestOrderCard?.id ? [{ type: 'invoice', label: 'View Invoice', value: `/orders/${latestOrderCard.id}` }] : []),
    ...(latestOrderCard?.id ? [{ type: 'change-address', label: 'Change Address', value: '/account/addresses' }] : []),
  ];

  const addAssistantMessage = (content: string) => {
    setMessages(prev => [...prev, { role: 'assistant', content, source: 'ai', actions: actionPalette }]);
  };

  const createTicket = async (title: string, summary: string, category: string, priority: string, requestedAction?: string, orderId?: string) => {
    const res = await api.post('/api/support/tickets', { title, summary, category, priority, requestedAction, orderId });
    return res.data.data as SupportTicket;
  };

  const handleAction = async (action: SupportAction) => {
    try {
      if (action.type === 'track' || action.type === 'invoice') {
        router.push(action.value || '/orders');
        return;
      }
      if (action.type === 'track-latest') {
        if (latestOrderCard?.id) router.push(`/orders/${latestOrderCard.id}`);
        else addAssistantMessage('I could not find a recent order to track yet. Ask me about your latest order first.');
        return;
      }
      if (action.type === 'refund-latest') {
        const ticket = await createTicket(
          'Refund request',
          latestOrderCard ? `Customer requested refund for order #${latestOrderCard.orderNumber}` : 'Customer requested refund support',
          'REFUND',
          'HIGH',
          action.type,
          latestOrderCard?.id,
        );
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: latestOrderCard
            ? `I created a refund support ticket for order #${latestOrderCard.orderNumber}. Our team can review the request and update you.`
            : 'I created a refund support ticket. Our team can review the request and update you.',
          source: 'ai',
          ticket,
          actions: actionPalette,
          orderCard: latestOrderCard,
        }]);
        toast.success('Refund request created');
        return;
      }
      if (action.type === 'change-address') {
        router.push('/account/addresses');
        return;
      }
      if (action.type === 'call') {
        window.location.href = action.value || `tel:${publicConfig?.supportPhone || '+91180083484357'}`;
        return;
      }
      if (action.type === 'contact-rider') {
        if (latestOrderCard?.riderPhone) {
          window.location.href = `tel:${latestOrderCard.riderPhone}`;
        } else {
          addAssistantMessage('Your rider contact is not available yet. I have created a support follow-up for this issue.');
        }
        return;
      }
      if (action.type === 'cancel') {
        await api.patch(`/api/orders/${action.value}/cancel`);
        addAssistantMessage('Your order cancellation request was submitted successfully.');
        toast.success('Order cancelled');
        return;
      }

      const category = action.type.includes('refund') ? 'REFUND' : action.type === 'human' ? 'GENERAL' : 'ORDER';
      const ticket = await createTicket(
        action.label,
        latestOrderCard ? `${action.label} requested for order #${latestOrderCard.orderNumber}` : action.label,
        category,
        action.type === 'human' ? 'HIGH' : 'MEDIUM',
        action.type,
        latestOrderCard?.id,
      );

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: action.type === 'human'
          ? 'I have created a support ticket and marked it for human review. Our team can continue from the admin support desk.'
          : `${action.label} has been logged. I created a support ticket so the operations team can continue this request.`,
        source: 'ai',
        ticket,
        actions: actionPalette,
        orderCard: latestOrderCard,
      }]);
      toast.success('Support ticket created');
    } catch (error) {
      console.error(error);
      toast.error('Could not complete that action right now');
    }
  };

  const handleReset = () => {
    setMessages([{
      role: 'assistant',
      content: "Hi! 👋 I'm Vegu Support. How can I help you today?",
      source: 'ai',
      actions: actionPalette,
    }]);
  };

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] flex-col bg-[#111315]">
      {/* Header */}
      <div className="shrink-0 border-b border-[#2D2416] bg-[radial-gradient(circle_at_top,#2d2416_0%,#181818_45%,#121212_100%)] px-4 pb-4 pt-12">
        <div className="flex items-center gap-3">
        <button type="button" aria-label="Go back" onClick={() => router.back()} className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-zinc-300" />
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 bg-gold/15 border border-gold/30 rounded-xl flex items-center justify-center">
            <Bot className="w-4 h-4 text-gold" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Vegu Support</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-[10px] font-semibold">
                Online · {publicConfig?.supportHours || 'Typically replies instantly'}
              </span>
            </div>
          </div>
        </div>
        <button type="button" aria-label="Reset chat" onClick={handleReset} className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center">
          <RotateCcw className="w-4 h-4 text-zinc-400" />
        </button>
        </div>

        <div className="mt-4 rounded-[24px] border border-[#3a3223] bg-white/[0.03] px-4 py-3 text-[12px] text-zinc-300">
          Fast help for orders, refunds, cancellations, and delivery updates.
        </div>

        {myTickets.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {myTickets.slice(0, 4).map((ticket: SupportTicket) => (
              <div key={ticket.id} className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-300">
                <p className="font-semibold text-white">{ticket.title || 'Support Ticket'}</p>
                <p className="mt-0.5 text-zinc-500">{ticket.status?.replace(/_/g, ' ') || 'Open'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-gold/20' : 'bg-gold/15 border border-gold/30'
            }`}>
              {msg.role === 'user'
                ? <User className="w-4 h-4 text-gold" />
                : <Leaf className="w-4 h-4 text-gold" />
              }
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gold text-black font-medium rounded-tr-sm'
                    : 'bg-app-card border border-app-border text-zinc-200 rounded-tl-sm'
                }`}
              >
                {renderMessageContent(msg.content)}
                  {msg.orderCard && <OrderStatusCard order={msg.orderCard} />}
                  {msg.ticket && <TicketBadge ticket={msg.ticket} />}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.actions.map((action, idx) => (
                        <button
                          key={`${action.type}-${idx}`}
                          type="button"
                          onClick={() => handleAction(action)}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/[0.08]"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
              {msg.source === 'ai' && msg.role === 'assistant' && (
                  <span className="text-[9px] text-zinc-600 px-1">AI powered</span>
              )}
                {msg.role === 'user' && msg.status && <span className="px-1 text-[9px] text-zinc-600">{msg.status}</span>}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4 text-gold" />
            </div>
            <div className="bg-app-card border border-app-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      {messages.length <= 2 && !loading && !composerFocused && !input.trim() && (
        <div className="px-4 pb-3 shrink-0">
          <p className="text-zinc-600 text-[10px] font-semibold uppercase tracking-wide mb-2">Quick questions</p>
          <div className="flex gap-2 flex-wrap">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendMessage(q)}
                className="text-xs text-gold border border-gold/30 bg-gold/5 rounded-full px-3 py-1.5 font-medium hover:bg-gold/10 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {actionPalette.map((action) => (
              <button
                key={action.type}
                type="button"
                onClick={() => handleAction(action)}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300"
              >
                {action.type.includes('track') && <Package className="h-3 w-3" />}
                {action.type.includes('refund') && <Receipt className="h-3 w-3" />}
                {action.type === 'call' && <Phone className="h-3 w-3" />}
                {action.type === 'human' && <Headphones className="h-3 w-3" />}
                {action.type === 'contact-rider' && <MapPin className="h-3 w-3" />}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0 border-t border-[#2D2416] bg-[#171717]/95 px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center gap-2 rounded-[28px] border border-[#3a3223] bg-[#1D1D1D] p-2 shadow-[0_-10px_30px_rgba(0,0,0,0.28)]">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => setComposerFocused(true)}
            onBlur={() => setComposerFocused(false)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Type your message..."
            autoComplete="on"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck
            enterKeyHint="send"
            disabled={loading}
            className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold disabled:opacity-40"
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
