'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Send, Bot, User, Leaf, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import { getPublicConfig } from '@/lib/publicConfig';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  source?: 'ai' | 'faq';
}

const QUICK_QUESTIONS = [
  'Where is my order?',
  'How do I cancel my order?',
  'When will I get my refund?',
  'Is there free delivery?',
];

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
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await api.post('/api/support/chat', { message: text, history });
      const { reply, source } = res.data.data;
      setMessages(prev => [...prev, { role: 'assistant', content: reply, source }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I\'m having trouble responding right now. Please email **${publicConfig?.supportEmail || 'support@vegu.app'}** or call **${publicConfig?.supportPhone || '+91-1800-8348-4357'}** for help.`,
        source: 'faq',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([{
      role: 'assistant',
      content: "Hi! 👋 I'm Vegu Support. How can I help you today?",
      source: 'ai',
    }]);
  };

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] flex-col bg-app-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-app-card border-b border-app-border shrink-0">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
              </div>
              {msg.source === 'ai' && msg.role === 'assistant' && (
                <span className="text-[9px] text-zinc-600 px-1">AI powered</span>
              )}
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
      {messages.length <= 2 && !loading && (
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
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 pb-8 pt-3 bg-app-card border-t border-app-border shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Type your message..."
            autoComplete="on"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck
            enterKeyHint="send"
            disabled={loading}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-gold/50 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="w-11 h-11 bg-gold rounded-2xl flex items-center justify-center disabled:opacity-40 shrink-0"
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
