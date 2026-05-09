'use client';

import { useState } from 'react';
import { X, ChefHat, ShoppingCart, Check } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { syncAddToCart } from '@/lib/cartSync';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface KitIngredient {
  name: string;
  qty: string;
  searchQuery: string;
}
interface Kit {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  serves: string;
  time: string;
  ingredients: KitIngredient[];
  accent: string;
  textAccent: string;
}

const KITS: Kit[] = [
  {
    id: 'biryani',
    name: 'Biryani Kit',
    emoji: '🍛',
    tagline: 'Aromatic one-pot perfection',
    serves: '4–6',
    time: '60 min',
    accent: 'from-orange-50 to-amber-50',
    textAccent: 'text-orange-600',
    ingredients: [
      { name: 'Basmati Rice', qty: '500g', searchQuery: 'basmati rice' },
      { name: 'Onions', qty: '3 pcs', searchQuery: 'onion' },
      { name: 'Tomatoes', qty: '2 pcs', searchQuery: 'tomato' },
      { name: 'Curd / Yogurt', qty: '200g', searchQuery: 'curd' },
      { name: 'Fresh Coriander', qty: '1 bunch', searchQuery: 'coriander' },
      { name: 'Mint Leaves', qty: '1 bunch', searchQuery: 'mint' },
    ],
  },
  {
    id: 'pasta',
    name: 'Pasta Kit',
    emoji: '🍝',
    tagline: 'Italian comfort in 20 minutes',
    serves: '2',
    time: '20 min',
    accent: 'from-red-50 to-rose-50',
    textAccent: 'text-red-500',
    ingredients: [
      { name: 'Pasta', qty: '250g', searchQuery: 'pasta' },
      { name: 'Tomatoes', qty: '4 pcs', searchQuery: 'tomato' },
      { name: 'Garlic', qty: '1 head', searchQuery: 'garlic' },
      { name: 'Onion', qty: '1 pc', searchQuery: 'onion' },
      { name: 'Cheese', qty: '100g', searchQuery: 'cheese' },
      { name: 'Olive Oil', qty: '100ml', searchQuery: 'olive oil' },
    ],
  },
  {
    id: 'breakfast',
    name: 'Breakfast Kit',
    emoji: '🍳',
    tagline: 'Start your day right',
    serves: '2',
    time: '15 min',
    accent: 'from-yellow-50 to-amber-50',
    textAccent: 'text-yellow-600',
    ingredients: [
      { name: 'Eggs', qty: '6 pcs', searchQuery: 'eggs' },
      { name: 'Bread', qty: '1 loaf', searchQuery: 'bread' },
      { name: 'Butter', qty: '100g', searchQuery: 'butter' },
      { name: 'Milk', qty: '500ml', searchQuery: 'milk' },
      { name: 'Banana', qty: '4 pcs', searchQuery: 'banana' },
      { name: 'Oats', qty: '200g', searchQuery: 'oats' },
    ],
  },
  {
    id: 'family-dinner',
    name: 'Family Dinner',
    emoji: '🫕',
    tagline: 'A full meal for the whole family',
    serves: '4',
    time: '45 min',
    accent: 'from-green-50 to-emerald-50',
    textAccent: 'text-green-600',
    ingredients: [
      { name: 'Rice', qty: '500g', searchQuery: 'rice' },
      { name: 'Dal / Lentils', qty: '250g', searchQuery: 'dal' },
      { name: 'Potatoes', qty: '4 pcs', searchQuery: 'potato' },
      { name: 'Spinach', qty: '250g', searchQuery: 'spinach' },
      { name: 'Paneer', qty: '200g', searchQuery: 'paneer' },
      { name: 'Tomatoes', qty: '3 pcs', searchQuery: 'tomato' },
    ],
  },
  {
    id: 'high-protein',
    name: 'Protein Kit',
    emoji: '💪',
    tagline: 'Fuel your fitness goals',
    serves: '1',
    time: '20 min',
    accent: 'from-purple-50 to-violet-50',
    textAccent: 'text-purple-600',
    ingredients: [
      { name: 'Eggs', qty: '6 pcs', searchQuery: 'eggs' },
      { name: 'Chicken Breast', qty: '500g', searchQuery: 'chicken' },
      { name: 'Broccoli', qty: '300g', searchQuery: 'broccoli' },
      { name: 'Spinach', qty: '200g', searchQuery: 'spinach' },
      { name: 'Cottage Cheese', qty: '200g', searchQuery: 'paneer' },
      { name: 'Greek Yogurt', qty: '150g', searchQuery: 'curd' },
    ],
  },
];

interface AddedProduct {
  id: string; name: string; slug: string; price: number;
  images: string[]; unit: string; stock: number;
}

async function fetchIngredients(ingredients: KitIngredient[]): Promise<AddedProduct[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const results: AddedProduct[] = [];
  await Promise.allSettled(
    ingredients.map(async (ing) => {
      try {
        const r = await fetch(`${apiUrl}/api/products?search=${encodeURIComponent(ing.searchQuery)}&limit=1`);
        const j = await r.json();
        const p = j.data?.[0];
        if (p) results.push(p);
      } catch {}
    })
  );
  return results;
}

export default function ChefKitsSection() {
  const [activeKit, setActiveKit] = useState<Kit | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();

  const handleOrderKit = async () => {
    if (!activeKit || adding) return;
    setAdding(true);
    const products = await fetchIngredients(activeKit.ingredients);
    if (products.length === 0) {
      toast.error('No matching products found. Check back soon!');
      setAdding(false);
      return;
    }
    products.forEach(p => {
      addItem({ id: p.id, name: p.name, slug: p.slug, price: p.price, images: p.images, unit: p.unit, stock: p.stock });
      syncAddToCart(p.id, 1);
    });
    setAdded(true);
    setAdding(false);
    toast.success(`${products.length} items added from ${activeKit.name}!`, {
      style: { background: '#fff', color: '#1A1A1A', border: '1px solid #E8E8E8' },
    });
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <>
      <div className="py-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 mb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <ChefHat className="w-4 h-4 text-gray-700" />
              <h2 className="text-gray-900 font-bold text-base">Express Chef Kits</h2>
            </div>
            <p className="text-gray-400 text-xs">Recipe-ready in one tap</p>
          </div>
        </div>

        {/* Horizontal kit cards */}
        <div className="flex gap-3 px-4 overflow-x-auto pb-1 scrollbar-hide">
          {KITS.map(kit => (
            <button
              key={kit.id}
              type="button"
              onClick={() => { setActiveKit(kit); setAdded(false); }}
              className={`shrink-0 w-[160px] bg-gradient-to-br ${kit.accent} border border-gray-100 rounded-3xl p-4 text-left active:scale-[0.97] transition-transform shadow-sm`}
            >
              <span className="text-4xl block mb-2">{kit.emoji}</span>
              <p className="text-gray-900 font-bold text-sm leading-tight">{kit.name}</p>
              <p className="text-gray-400 text-[10px] mt-0.5 leading-snug">{kit.tagline}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[9px] font-bold text-gray-400 bg-white/60 px-1.5 py-0.5 rounded-full">👥 {kit.serves}</span>
                <span className="text-[9px] font-bold text-gray-400 bg-white/60 px-1.5 py-0.5 rounded-full">⏱ {kit.time}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom sheet modal */}
      {activeKit && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={e => { if (e.target === e.currentTarget) setActiveKit(null); }}
        >
          {/* Scrim */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setActiveKit(null)} />

          {/* Sheet */}
          <div className="relative w-full bg-white rounded-t-[28px] max-h-[80vh] overflow-y-auto pb-safe">
            <div className={`bg-gradient-to-br ${activeKit.accent} px-5 pt-6 pb-5`}>
              <button
                type="button"
                onClick={() => setActiveKit(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/70 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
              <span className="text-5xl block mb-3">{activeKit.emoji}</span>
              <h3 className="text-gray-900 font-black text-xl">{activeKit.name}</h3>
              <p className="text-gray-500 text-sm mt-1">{activeKit.tagline}</p>
              <div className="flex gap-3 mt-3">
                <span className="text-xs font-semibold text-gray-500 bg-white/60 px-2.5 py-1 rounded-full">👥 Serves {activeKit.serves}</span>
                <span className="text-xs font-semibold text-gray-500 bg-white/60 px-2.5 py-1 rounded-full">⏱ {activeKit.time}</span>
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-gray-500 text-xs font-semibold tracking-wide uppercase mb-3">What you&apos;ll need</p>
              <div className="space-y-2.5">
                {activeKit.ingredients.map(ing => (
                  <div key={ing.name} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-veg" />
                      <span className="text-gray-800 text-sm font-medium">{ing.name}</span>
                    </div>
                    <span className="text-gray-400 text-sm">{ing.qty}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleOrderKit}
                disabled={adding}
                className={`w-full mt-6 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${
                  added
                    ? 'bg-green-500 text-white'
                    : 'bg-veg text-white hover:bg-veg/90 disabled:opacity-60'
                }`}
              >
                {added ? (
                  <><Check className="w-4 h-4" /> Added to Cart</>
                ) : adding ? (
                  'Adding ingredients…'
                ) : (
                  <><ShoppingCart className="w-4 h-4" /> Add All to Cart</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
