'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, ShoppingCart, ChefHat, Sparkles, Check, Mic, MicOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { syncAddToCart } from '@/lib/cartSync';
import { resolveApiBase } from '@/lib/apiBase';
import toast from 'react-hot-toast';
import ProductImage from '@/components/product/ProductImage';

const apiBase = resolveApiBase('');

interface Ingredient { name: string; qty: string; searchQuery: string; }
interface KitchenProduct {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price?: number;
  unit?: string;
  stock?: number;
}
interface Message {
  role: 'user' | 'assistant';
  content: string;
  ingredients?: Ingredient[];
  addedToCart?: boolean;
  addedIngredientKeys?: string[];
}

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecCtor = new () => SpeechRec;

const SUGGESTIONS = [
  "I have tomatoes, onions and paneer. What can I make?",
  "Plan a healthy week of dinner for 2",
  "Quick breakfast ideas under 15 minutes",
  "High-protein meal plan for gym days",
  "Easy biryani recipe for 4 people",
];

const QUICK_RECIPES = [
  {
    title: 'Paneer Butter Masala',
    prompt: 'Give me a quick Paneer Butter Masala recipe for 3 people with exact ingredients list.',
    image: 'https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=900&q=80',
  },
  {
    title: 'Veg Fried Rice',
    prompt: 'Suggest a 20-minute veg fried rice recipe and include all ingredients with qty.',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900&q=80',
  },
  {
    title: 'Protein Breakfast',
    prompt: 'Create a high-protein breakfast using eggs, oats, and curd. Include ingredients list.',
    image: 'https://images.unsplash.com/photo-1494859802809-d069c3b71a8a?w=900&q=80',
  },
];

function extractIngredients(text: string): { clean: string; ingredients: Ingredient[] } {
  const match = text.match(/<ingredients>([\s\S]*?)<\/ingredients>/);
  if (!match) {
    // Fallback parser for plain-text recipe outputs without XML ingredient block.
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const inferred = lines
      .filter((line) => /^\s*([\-*]|\d+\.)\s+/.test(line))
      .slice(0, 20)
      .map((line) => line.replace(/^\s*([\-*]|\d+\.)\s+/, '').trim())
      .filter((line) => line.length >= 2)
      .map((line) => {
        const core = line.replace(/\s{2,}/g, ' ').trim();
        const qtyMatch = core.match(/^([\d/]+\s*(?:kg|g|ml|l|tsp|tbsp|pcs?|cup|cups?)?)\s+(.+)/i);
        if (qtyMatch) {
          return {
            name: qtyMatch[2].trim(),
            qty: qtyMatch[1].trim(),
            searchQuery: qtyMatch[2].trim(),
          };
        }
        return {
          name: core,
          qty: 'as needed',
          searchQuery: core,
        };
      });

    if (inferred.length > 0) {
      return { clean: text, ingredients: inferred };
    }

    // Deterministic fallback so Add to Cart remains available in graceful mode.
    return {
      clean: text,
      ingredients: [
        { name: 'Onion', qty: '1', searchQuery: 'onion' },
        { name: 'Tomato', qty: '2', searchQuery: 'tomato' },
        { name: 'Mixed vegetables', qty: '400 g', searchQuery: 'mixed vegetables' },
        { name: 'Ginger garlic paste', qty: '1 tbsp', searchQuery: 'ginger garlic paste' },
      ],
    };
  }
  try {
    const ingredients: Ingredient[] = JSON.parse(match[1].trim());
    const clean = text.replace(/<ingredients>[\s\S]*?<\/ingredients>/, '').trim();
    return { clean, ingredients };
  } catch {
    return { clean: text, ingredients: [] };
  }
}

function normalizeAssistantText(text: string): string {
  return text
    .replace(/<ingredients>[\s\S]*?<\/ingredients>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function KitchenPage() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { addItem } = useCartStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<KitchenProduct[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const speechRef = useRef<SpeechRec | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);
  const memoryCacheRef = useRef<Map<string, string>>(new Map());
  const pendingAssistantTextRef = useRef('');
  const renderFrameRef = useRef<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: streaming ? 'auto' : 'smooth' });
  }, [messages, streaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (renderFrameRef.current != null) {
        cancelAnimationFrame(renderFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('vegu-kitchen-cache');
      if (!raw) return;
      const entries = JSON.parse(raw) as Array<[string, string]>;
      memoryCacheRef.current = new Map(entries.slice(-40));
    } catch {}
  }, []);

  const persistCache = () => {
    if (typeof window === 'undefined') return;
    try {
      const entries = Array.from(memoryCacheRef.current.entries()).slice(-40);
      localStorage.setItem('vegu-kitchen-cache', JSON.stringify(entries));
    } catch {}
  };

  const buildFallbackIngredients = useCallback((): Ingredient[] => {
    const fromCatalog = featuredProducts
      .slice(0, 4)
      .map((p) => ({ name: p.name, qty: '1 pack', searchQuery: p.name }));

    if (fromCatalog.length > 0) return fromCatalog;

    return [
      { name: 'Onion', qty: '1', searchQuery: 'onion' },
      { name: 'Tomato', qty: '2', searchQuery: 'tomato' },
      { name: 'Ginger garlic paste', qty: '1 tbsp', searchQuery: 'ginger garlic paste' },
      { name: 'Mixed vegetables', qty: '400 g', searchQuery: 'mixed vegetables' },
    ];
  }, [featuredProducts]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(`${apiBase}/api/products?limit=12`);
        const json = await res.json();
        setFeaturedProducts((json?.data || []).slice(0, 12));
      } catch {
        setFeaturedProducts([]);
      }
    };
    void loadProducts();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ctor = (window as Window & { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor }).SpeechRecognition
      || (window as Window & { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor }).webkitSpeechRecognition;
    if (!ctor) return;

    const rec = new ctor();
    rec.lang = 'en-IN';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setInput((prev) => `${prev} ${transcript}`.trim());
      }
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    speechRef.current = rec;
    setVoiceSupported(true);

    return () => {
      rec.stop();
      speechRef.current = null;
    };
  }, []);

  const toggleVoice = () => {
    const rec = speechRef.current;
    if (!rec) {
      toast.error('Voice input is not supported on this device');
      return;
    }
    if (isListening) {
      rec.stop();
      setIsListening(false);
      return;
    }
    rec.start();
    setIsListening(true);
  };

  const buildOfflineAssistant = useCallback((prompt: string): Message => {
    const fallbackIngredients = buildFallbackIngredients();
    return {
      role: 'assistant',
      content: `I prepared a quick starter recipe plan for "${prompt.trim()}". You can review and add ingredients below.`,
      ingredients: fallbackIngredients,
    };
  }, [buildFallbackIngredients]);

  const resolveIngredientProduct = useCallback(async (ingredient: Ingredient) => {
    const apiUrl = resolveApiBase('');
    const response = await fetch(`${apiUrl}/api/products?search=${encodeURIComponent(ingredient.searchQuery)}&limit=1`);
    const json = await response.json();
    return json.data?.[0] as KitchenProduct | undefined;
  }, []);

  const applyProductToCart = useCallback((product: KitchenProduct) => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price ?? 0,
      images: product.images ?? [],
      unit: product.unit ?? 'unit',
      stock: product.stock ?? 99,
    });
    syncAddToCart(product.id, 1);
  }, [addItem]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const history = [...messages, userMsg].slice(-8);

    if (!isAuthenticated || !accessToken) {
      setMessages([...history, buildOfflineAssistant(text)]);
      setInput('');
      return;
    }

    const apiMessages = history.map(m => ({ role: m.role, content: m.content }));
    const cacheKey = apiMessages.map(m => `${m.role}:${m.content}`).join('|').slice(-4000);

    const cached = memoryCacheRef.current.get(cacheKey);
    if (cached) {
      const { ingredients } = extractIngredients(cached);
      const resolvedIngredients = ingredients.length > 0 ? ingredients : buildFallbackIngredients();
      const clean = normalizeAssistantText(cached);
      setMessages([...history, {
        role: 'assistant',
        content: clean || 'I found your saved result and extracted the ingredients below.',
        ingredients: resolvedIngredients,
      }]);
      setInput('');
      return;
    }

    if (inFlightKeyRef.current === cacheKey) return;
    inFlightKeyRef.current = cacheKey;

    setMessages(history);
    setInput('');
    setStreaming(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const assistantMsg: Message = { role: 'assistant', content: '' };
    pendingAssistantTextRef.current = '';
    setMessages([...history, assistantMsg]);

    try {
      const res = await fetch(`${apiBase}/api/kitchen/chat`, {
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
        const fallbackIngredients = buildFallbackIngredients();
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: errMsg, ingredients: fallbackIngredients };
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
              pendingAssistantTextRef.current = fullText;

              if (renderFrameRef.current == null) {
                renderFrameRef.current = requestAnimationFrame(() => {
                  renderFrameRef.current = null;
                  const snapshot = pendingAssistantTextRef.current;
                  const cleanSnapshot = normalizeAssistantText(snapshot);
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'assistant', content: cleanSnapshot };
                    return updated;
                  });
                });
              }
            }
          } catch {}
        }
      }

      // Extract ingredients from final text
      const { ingredients } = extractIngredients(fullText);
      const resolvedIngredients = ingredients.length > 0 ? ingredients : buildFallbackIngredients();
      const clean = normalizeAssistantText(fullText);
      if (fullText.trim()) {
        memoryCacheRef.current.set(cacheKey, fullText);
        if (memoryCacheRef.current.size > 50) {
          const oldest = memoryCacheRef.current.keys().next().value;
          if (oldest) memoryCacheRef.current.delete(oldest);
        }
        persistCache();
      }
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: clean || 'Recipe generated. Ingredients are listed below.',
          ingredients: resolvedIngredients,
        };
        return updated;
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const fallbackIngredients = buildFallbackIngredients();
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: "Sorry, I couldn't connect to the kitchen AI. You can still use the ingredient list below and add items to cart.",
          ingredients: fallbackIngredients,
        };
        return updated;
      });
    } finally {
      inFlightKeyRef.current = null;
      setStreaming(false);
    }
  }, [messages, streaming, accessToken, buildFallbackIngredients, buildOfflineAssistant, isAuthenticated]);

  const addSingleToCart = async (ingredient: Ingredient, msgIdx: number, ingredientIdx: number) => {
    const key = `${msgIdx}:${ingredientIdx}`;
    setAddingKey(key);
    try {
      const product = await resolveIngredientProduct(ingredient);
      if (!product) {
        toast.error(`No matching product found for ${ingredient.name}.`);
        return;
      }

      applyProductToCart(product);
      setMessages(prev => prev.map((message, index) => {
        if (index !== msgIdx) return message;
        const existingKeys = message.addedIngredientKeys ?? [];
        if (existingKeys.includes(key)) return message;
        return { ...message, addedIngredientKeys: [...existingKeys, key] };
      }));
      toast.success(`${product.name} added to cart.`, {
        style: { background: '#fff', color: '#1A1A1A', border: '1px solid #E8E8E8' },
      });
    } catch {
      toast.error(`Could not add ${ingredient.name} right now.`);
    } finally {
      setAddingKey((current) => (current === key ? null : current));
    }
  };

  const addAllToCart = async (ingredients: Ingredient[], msgIdx: number) => {
    let added = 0;
    await Promise.allSettled(
      ingredients.map(async (ing) => {
        try {
          const p = await resolveIngredientProduct(ing);
          if (p) {
            applyProductToCart(p);
            added++;
          }
        } catch {}
      })
    );
    if (added === 0) {
      toast.error('No matching products found for these ingredients yet.');
      return;
    }
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

            <div className="w-full mt-8">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Popular Recipes</p>
              <div className="flex gap-3 overflow-x-auto overscroll-x-contain pb-1 scrollbar-hide">
                {QUICK_RECIPES.map((r) => (
                  <button
                    key={r.title}
                    type="button"
                    onClick={() => send(r.prompt)}
                    className="min-w-[190px] rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.image} alt={r.title} loading="lazy" decoding="async" className="h-24 w-full object-cover" />
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                      <p className="text-[11px] text-veg mt-1">Tap to generate ingredients</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {featuredProducts.length > 0 && (
              <div className="w-full mt-6">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Ingredients In Vegu</p>
                <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
                  {featuredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => send(`Suggest 2 recipes using ${p.name} and list all required ingredients.`)}
                      className="bg-white border border-gray-100 rounded-xl p-2 text-center shadow-sm"
                    >
                      <div className="relative mb-1 h-12 w-full overflow-hidden rounded-md bg-gray-50">
                        <ProductImage name={p.name} slug={p.slug} images={p.images} fill className="object-cover" sizes="96px" />
                      </div>
                      <p className="text-[11px] text-gray-700 line-clamp-2">{p.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                      <div key={j} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-veg shrink-0" />
                          <span className="text-gray-700 text-sm">{ing.name}</span>
                        </div>
                        <span className="text-gray-400 text-xs shrink-0">{ing.qty}</span>
                        <button
                          type="button"
                          onClick={() => addSingleToCart(ing, i, j)}
                          disabled={addingKey === `${i}:${j}` || msg.addedIngredientKeys?.includes(`${i}:${j}`)}
                          className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${msg.addedIngredientKeys?.includes(`${i}:${j}`)
                            ? 'bg-green-500 text-white'
                            : 'bg-veg/10 text-veg hover:bg-veg hover:text-white'
                          } disabled:opacity-60`}
                        >
                          {msg.addedIngredientKeys?.includes(`${i}:${j}`)
                            ? 'Added'
                            : addingKey === `${i}:${j}`
                              ? 'Adding...'
                              : 'Add to cart'}
                        </button>
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
            autoComplete="on"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck
            enterKeyHint="send"
            placeholder="Ask for a recipe, meal plan, or ingredient ideas…"
            rows={1}
            className="flex-1 resize-none bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-veg/20 max-h-32 leading-relaxed"
          />
          <button type="button" onClick={() => send(input)} disabled={!input.trim() || streaming}
            title="Send message"
            className="w-11 h-11 bg-veg text-white rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-[0.95] transition-all">
            <Send className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleVoice}
            disabled={!voiceSupported || streaming}
            title="Voice input"
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-40 transition-all ${isListening ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
