'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, X, ArrowLeft, Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import BottomNav from '@/components/layout/BottomNav';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supported = !!((window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      || (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);
    setVoiceSupported(supported);
  }, []);

  const handleVoiceSearch = () => {
    if (typeof window === 'undefined') return;
    const Ctor = (window as Window & {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onstart: (() => void) | null;
        onend: (() => void) | null;
        onerror: ((event: { error: string }) => void) | null;
        onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onstart: (() => void) | null;
        onend: (() => void) | null;
        onerror: ((event: { error: string }) => void) | null;
        onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        start: () => void;
      };
    }).SpeechRecognition || (window as Window & { webkitSpeechRecognition?: new () => {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onstart: (() => void) | null;
      onend: (() => void) | null;
      onerror: ((event: { error: string }) => void) | null;
      onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      start: () => void;
    } }).webkitSpeechRecognition;

    if (!Ctor) {
      toast.error('Voice search is not supported on this device');
      return;
    }

    const recognition = new Ctor();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setVoiceListening(true);
    recognition.onend = () => setVoiceListening(false);
    recognition.onerror = () => {
      setVoiceListening(false);
      toast.error('Could not capture voice input');
    };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
      if (transcript) {
        setQuery(transcript);
        setDebouncedQuery(transcript);
      }
    };

    recognition.start();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () =>
      api.get('/api/products', { params: { search: debouncedQuery, limit: 24 } }).then(r => r.data),
    enabled: debouncedQuery.length >= 2,
  });

  const products = data?.data || [];
  const total = data?.meta?.total || 0;

  const { data: trending } = useQuery({
    queryKey: ['trending-search'],
    queryFn: () => api.get('/api/products/trending').then(r => r.data.data),
    enabled: debouncedQuery.length < 2,
  });

  return (
    <div className="bg-[#F7F9FA] min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button type="button" aria-label="Go back" onClick={() => router.back()} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search for fruits, vegetables…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="search"
              className="w-full bg-gray-100 rounded-xl pl-10 pr-9 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-veg/20 focus:bg-white transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setDebouncedQuery(''); }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-gray-600" />
              </button>
            )}
            <button
              type="button"
              onClick={handleVoiceSearch}
              title="Voice search"
              disabled={!voiceSupported}
              className="absolute right-11 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-veg/10 flex items-center justify-center disabled:opacity-40"
            >
              {voiceListening ? <MicOff className="w-3.5 h-3.5 text-veg" /> : <Mic className="w-3.5 h-3.5 text-veg" />}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {debouncedQuery.length >= 2 ? (
          <>
            <p className="text-gray-500 text-xs mb-4">
              {isLoading ? 'Searching…' : `${total} result${total !== 1 ? 's' : ''} for "${debouncedQuery}"`}
            </p>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-100" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 w-3/4 bg-gray-100 rounded" />
                      <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-gray-900 font-bold text-lg mb-1">No results found</h3>
                <p className="text-gray-500 text-sm text-center mb-5">Try a different search term</p>
                <button type="button" onClick={() => router.push('/products')} className="bg-veg text-white font-bold px-6 py-2.5 rounded-2xl text-sm shadow-lg shadow-veg/30">
                  Browse All Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product: Parameters<typeof ProductCard>[0]['product']) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div>
            <p className="text-gray-900 font-bold text-sm mb-4">Trending Now 🔥</p>
            <div className="grid grid-cols-2 gap-3">
              {(trending || []).slice(0, 10).map((product: Parameters<typeof ProductCard>[0]['product']) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
