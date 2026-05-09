'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, ShoppingCart, ChefHat, Sparkles, Check } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { syncAddToCart } from '@/lib/cartSync';
import toast from 'react-hot-toast';

interface Ingredient { name: string; qty: string; searchQuery: string; }
interface Message {
  role: 'user' | 'assistant';
  content: string;
  ingredients?: Ingredient[];
  addedToCart?: boolean;
}

const SUGGESTIONS = [
  "I have tomatoes, onions and paneer. What can I make?",
  "Plan a healthy week of dinner for 2",
  "Quick breakfast ideas under 15 minutes",
  "High-protein meal plan for gym days",
  "Easy biryani recipe for 4 people",
];

function extractIngredients(text: string): { clean: string; ingredients: Ingredient[] } {
  const match = text.match(/<ingredients>([\s\S]*?)<\/ingredients>/);
  if (!match) return { clean: text, ingredients: [] };
  try {
    const ingredients: Ingredient[] = JSON.parse(match[1].trim());
    const clean = text.replace(/<ingredients>[\s\S]*?<\/ingredients>/, '').trim();
    return { clean, ingredients };
  } catch {
    return { clean: text, ingredients: [] };
  }
}

export default function KitchenPage() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { addItem } = useCartStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setStreaming(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const apiMessages = history.map(m => ({ role: m.role, content: m.content }));
    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages([...history, assistantMsg]);

    try {
      const res = await fetch('/api/kitchen/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken || ''}` },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errMsg =
          res.status === 401 ? "Please sign in to use AI Kitchen." :
          res.status === 503 ? "AI Kitchen is temporarily unavailable. Please try again later." :
          res.status === 429 ? "Too many requests. Please wait a moment and try again." :
          "Something went wrong. Please try again.";
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: errMsg };
          return updated;
        });
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;
          try {
            const { text: t, error } = JSON.parse(payload);
            if (error) throw new Error(error);
            if (t) {
              fullText += t;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: fullText };
                return updated;
              });
            }
          } catch {}
        }
      }

      // Extract ingredients from final text
      const { clean, ingredients } = extractIngredients(fullText);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: clean, ingredients };
        return updated;
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: "Sorry, I couldn't connect to the kitchen AI. Please try again." };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, accessToken]);

  const addAllToCart = async (ingredients: Ingredient[], msgIdx: number) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    let added = 0;
    await Promise.allSettled(
      ingredients.map(async (ing) => {
        try {
          const r = await fetch(`${apiUrl}/api/products?search=${encodeURIComponent(ing.searchQuery)}&limit=1`);
          const j = await r.json();
          const p = j.data?.[0];
          if (p) {
            addItem({ id: p.id, name: p.name, slug: p.slug, price: p.price, images: p.images, unit: p.unit, stock: p.stock });
            syncAddToCart(p.id, 1);
            added++;
          }
        } catch {}
      })
    );
    setMessages(prev => prev.map((m, i) => i === msgIdx ? { ...m, addedToCart: true } : m));
    toast.success(`${added} ingredient${added !== 1 ? 's' : ''} added to cart!`, {
      style: { background: '#fff', color: '#1A1A1A', border: '1px solid #E8E8E8' },
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-3 flex items-center gap-3 sticky top-0 z-20">
        <Link href="/" className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-veg" />
            <h1 className="text-gray-900 font-bold text-base">AI Kitchen</h1>
            <span className="text-[9px] font-bold text-veg bg-veg/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Beta</span>
          </div>
          <p className="text-gray-400 text-[10px]">Ask for recipes, meal plans, ingredient ideas</p>
        </div>
        <Sparkles className="w-5 h-5 text-amber-400" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-8 text-center">
            <div className="w-20 h-20 bg-veg/10 rounded-[24px] flex items-center justify-center mb-4">
              <ChefHat className="w-10 h-10 text-veg" />
            </div>
            <h2 className="text-gray-900 font-bold text-lg mb-1">VEGU Kitchen AI</h2>
            <p className="text-gray-400 text-sm max-w-xs">
              Tell me what ingredients you have, or ask for a recipe. I&apos;ll build your grocery cart automatically.
            </p>
            {!isAuthenticated && (
              <p className="text-amber-500 text-xs mt-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                Sign in to save your conversation history
              </p>
            )}
            <div className="mt-6 space-y-2 w-full max-w-xs">
              {SUGGESTIONS.map(s => (
                <button key={s} type="button" onClick={() => send(s)}
                  className="w-full text-left text-sm text-gray-600 bg-white border border-gray-100 rounded-2xl px-4 py-3 hover:border-veg/30 hover:bg-veg/5 transition-all active:scale-[0.99] shadow-sm">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'w-full'}`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-5 h-5 bg-veg rounded-full flex items-center justify-center">
                    <ChefHat className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">VEGU Kitchen AI</span>
                </div>
              )}

              <div className={`rounded-3xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-veg text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
              }`}>
                {msg.content ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="flex gap-1 py-1">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce bounce-delay-0" />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce bounce-delay-150" />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce bounce-delay-300" />
                  </div>
                )}
              </div>

              {/* Ingredient card */}
              {msg.ingredients && msg.ingredients.length > 0 && (
                <div className="mt-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                    <p className="text-gray-800 font-semibold text-sm">Ingredients needed</p>
                    <span className="text-[10px] text-gray-400 font-medium">{msg.ingredients.length} items</span>
                  </div>
                  <div className="px-4 py-2">
                    {msg.ingredients.map((ing, j) => (
                      <div key={j} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-veg shrink-0" />
                          <span className="text-gray-700 text-sm">{ing.name}</span>
                        </div>
                        <span className="text-gray-400 text-xs">{ing.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3">
                    <button type="button" onClick={() => addAllToCart(msg.ingredients!, i)}
                      disabled={msg.addedToCart}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        msg.addedToCart
                          ? 'bg-green-500 text-white'
                          : 'bg-veg text-white hover:bg-veg/90 active:scale-[0.98]'
                      }`}>
                      {msg.addedToCart
                        ? <><Check className="w-4 h-4" /> Added to Cart</>
                        : <><ShoppingCart className="w-4 h-4" /> Add All to Cart</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 pb-safe">
        <div className="flex items-end gap-2 max-w-lg mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
            }}
            placeholder="Ask for a recipe, meal plan, or ingredient ideas…"
            rows={1}
            className="flex-1 resize-none bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-veg/20 max-h-32 leading-relaxed"
          />
          <button type="button" onClick={() => send(input)} disabled={!input.trim() || streaming}
            title="Send message"
            className="w-11 h-11 bg-veg text-white rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-[0.95] transition-all">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
