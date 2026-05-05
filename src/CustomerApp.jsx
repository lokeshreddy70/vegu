import React from 'react';
import { ShoppingCart, Search, MapPin, Clock, Plus, Minus, Trash2, ChevronRight, Home, Package, User, Heart, Star, Zap, X, Check, CreditCard, Wallet, Banknote, ArrowLeft, Bell, Tag, Truck, Phone, Settings, Edit3, Save, AlertCircle, TrendingUp, IndianRupee, Box, Users, BarChart3, ToggleLeft, ToggleRight, Sparkles, Globe } from 'lucide-react';

// Polyfill for window.storage using localStorage
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: async (key) => {
      const value = localStorage.getItem(key);
      if (value === null) throw new Error('Not found');
      return { key, value };
    },
    set: async (key, value) => {
      localStorage.setItem(key, value);
      return { key, value };
    },
    delete: async (key) => {
      localStorage.removeItem(key);
      return { key, deleted: true };
    },
    list: async (prefix = '') => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
      return { keys, prefix };
    },
  };
}

// ============ DEFAULT DATA ============
const DEFAULT_CATEGORIES = [
  { id: 'fruits', name: 'Fruits & Veggies', te: 'పండ్లు & కూరగాయలు', icon: '🥬', color: '#A8E6A1' },
  { id: 'dairy', name: 'Dairy & Eggs', te: 'పాల ఉత్పత్తులు', icon: '🥛', color: '#FFE5B4' },
  { id: 'rice', name: 'Rice & Atta', te: 'బియ్యం & పిండి', icon: '🌾', color: '#F4D9A0' },
  { id: 'oil', name: 'Oil & Ghee', te: 'నూనె & నెయ్యి', icon: '🛢️', color: '#FFD89E' },
  { id: 'spices', name: 'Masala & Spices', te: 'మసాలాలు', icon: '🌶️', color: '#FFB4A2' },
  { id: 'snacks', name: 'Snacks', te: 'స్నాక్స్', icon: '🍿', color: '#FFCBA4' },
  { id: 'beverages', name: 'Beverages', te: 'పానీయాలు', icon: '🥤', color: '#B5D8FA' },
  { id: 'household', name: 'Household', te: 'గృహోపకరణాలు', icon: '🧴', color: '#D4B5E8' },
  { id: 'personal', name: 'Personal Care', te: 'వ్యక్తిగత సంరక్షణ', icon: '🧼', color: '#FFC5D9' },
  { id: 'pooja', name: 'Pooja Items', te: 'పూజా సామగ్రి', icon: '🪔', color: '#FFE45E' },
];

const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Onion (Ulligadda)', te: 'ఉల్లిగడ్డ', unit: '1 kg', price: 32, mrp: 45, category: 'fruits', emoji: '🧅', rating: 4.3, sold: '2.1k', stock: 50, active: true },
  { id: 2, name: 'Tomato (Tomata)', te: 'టమాట', unit: '500 g', price: 28, mrp: 40, category: 'fruits', emoji: '🍅', rating: 4.1, sold: '3.5k', stock: 80, active: true },
  { id: 3, name: 'Banana Yelakki', te: 'ఏలక్కి అరటి', unit: '1 dozen', price: 60, mrp: 75, category: 'fruits', emoji: '🍌', rating: 4.5, sold: '5.2k', stock: 100, active: true },
  { id: 4, name: 'Mango Banganapalli', te: 'బంగినపల్లి మామిడి', unit: '1 kg', price: 89, mrp: 120, category: 'fruits', emoji: '🥭', rating: 4.8, sold: '4.2k', stock: 60, active: true },
  { id: 5, name: 'Drumstick (Munaga)', te: 'మునగకాయ', unit: '500 g', price: 35, mrp: 45, category: 'fruits', emoji: '🌿', rating: 4.4, sold: '1.8k', stock: 40, active: true },
  { id: 6, name: 'Curry Leaves', te: 'కరివేపాకు', unit: '100 g', price: 10, mrp: 15, category: 'fruits', emoji: '🍃', rating: 4.6, sold: '2.5k', stock: 70, active: true },
  { id: 7, name: 'Green Chilli', te: 'పచ్చిమిర్చి', unit: '250 g', price: 25, mrp: 35, category: 'fruits', emoji: '🌶️', rating: 4.3, sold: '3.1k', stock: 50, active: true },
  { id: 8, name: 'Coconut (Kobbari)', te: 'కొబ్బరికాయ', unit: '1 piece', price: 35, mrp: 45, category: 'fruits', emoji: '🥥', rating: 4.5, sold: '2.8k', stock: 80, active: true },
  { id: 9, name: 'Heritage Toned Milk', te: 'హెరిటేజ్ పాలు', unit: '500 ml', price: 32, mrp: 32, category: 'dairy', emoji: '🥛', rating: 4.7, sold: '12k', stock: 200, active: true },
  { id: 10, name: 'Sangam Curd', te: 'సంగం పెరుగు', unit: '500 g', price: 45, mrp: 55, category: 'dairy', emoji: '🍮', rating: 4.5, sold: '6.3k', stock: 100, active: true },
  { id: 11, name: 'Farm Eggs', te: 'గుడ్లు', unit: '6 pcs', price: 60, mrp: 72, category: 'dairy', emoji: '🥚', rating: 4.5, sold: '6.3k', stock: 150, active: true },
  { id: 12, name: 'Amul Butter', te: 'అమూల్ వెన్న', unit: '100 g', price: 56, mrp: 60, category: 'dairy', emoji: '🧈', rating: 4.8, sold: '8.1k', stock: 60, active: true },
  { id: 13, name: 'Paneer Fresh', te: 'పనీర్', unit: '200 g', price: 89, mrp: 110, category: 'dairy', emoji: '🧀', rating: 4.6, sold: '3.4k', stock: 40, active: true },
  { id: 14, name: 'Sona Masoori Rice (Nellore)', te: 'సోనా మసూరి బియ్యం', unit: '5 kg', price: 295, mrp: 350, category: 'rice', emoji: '🍚', rating: 4.8, sold: '7.2k', stock: 80, active: true },
  { id: 15, name: 'BPT Rice', te: 'బీపీటీ బియ్యం', unit: '5 kg', price: 320, mrp: 380, category: 'rice', emoji: '🌾', rating: 4.7, sold: '4.5k', stock: 60, active: true },
  { id: 16, name: 'Aashirvaad Atta', te: 'ఆశీర్వాద్ గోధుమ పిండి', unit: '5 kg', price: 245, mrp: 285, category: 'rice', emoji: '🌾', rating: 4.7, sold: '6.7k', stock: 70, active: true },
  { id: 17, name: 'Toor Dal (Kandi Pappu)', te: 'కంది పప్పు', unit: '1 kg', price: 165, mrp: 180, category: 'rice', emoji: '🫘', rating: 4.6, sold: '3.8k', stock: 50, active: true },
  { id: 18, name: 'Moong Dal (Pesara)', te: 'పెసర పప్పు', unit: '1 kg', price: 145, mrp: 160, category: 'rice', emoji: '🫛', rating: 4.5, sold: '2.9k', stock: 40, active: true },
  { id: 19, name: 'Freedom Sunflower Oil', te: 'ఫ్రీడం నూనె', unit: '1 L', price: 165, mrp: 195, category: 'oil', emoji: '🛢️', rating: 4.6, sold: '7.2k', stock: 80, active: true },
  { id: 20, name: 'Priya Groundnut Oil', te: 'ప్రియ వేరుశెనగ నూనె', unit: '1 L', price: 195, mrp: 220, category: 'oil', emoji: '🥜', rating: 4.7, sold: '4.1k', stock: 50, active: true },
  { id: 21, name: 'Pure Cow Ghee', te: 'ఆవు నెయ్యి', unit: '500 ml', price: 425, mrp: 500, category: 'oil', emoji: '🍯', rating: 4.8, sold: '2.8k', stock: 30, active: true },
  { id: 22, name: 'Guntur Red Chilli Powder', te: 'గుంటూరు కారం', unit: '500 g', price: 285, mrp: 340, category: 'spices', emoji: '🌶️', rating: 4.8, sold: '5.1k', stock: 60, active: true },
  { id: 23, name: 'Turmeric Powder', te: 'పసుపు పొడి', unit: '200 g', price: 65, mrp: 80, category: 'spices', emoji: '🟡', rating: 4.6, sold: '4.3k', stock: 70, active: true },
  { id: 24, name: 'Sambar Powder', te: 'సాంబార్ పొడి', unit: '200 g', price: 95, mrp: 120, category: 'spices', emoji: '🥄', rating: 4.7, sold: '3.6k', stock: 50, active: true },
  { id: 25, name: 'Tamarind (Chintapandu)', te: 'చింతపండు', unit: '500 g', price: 145, mrp: 175, category: 'spices', emoji: '🟫', rating: 4.5, sold: '2.4k', stock: 40, active: true },
  { id: 26, name: 'Lays Magic Masala', te: 'లేస్ చిప్స్', unit: '52 g', price: 20, mrp: 20, category: 'snacks', emoji: '🥔', rating: 4.5, sold: '18k', stock: 200, active: true },
  { id: 27, name: 'Parle-G Biscuits', te: 'పార్లే-జి', unit: '250 g', price: 25, mrp: 30, category: 'snacks', emoji: '🍪', rating: 4.7, sold: '22k', stock: 250, active: true },
  { id: 28, name: 'Andhra Murukulu', te: 'మురుకులు', unit: '200 g', price: 65, mrp: 80, category: 'snacks', emoji: '🥨', rating: 4.7, sold: '4.8k', stock: 60, active: true },
  { id: 29, name: 'Maggi Noodles', te: 'మ్యాగీ', unit: '70 g x 4', price: 56, mrp: 60, category: 'snacks', emoji: '🍜', rating: 4.7, sold: '15k', stock: 180, active: true },
  { id: 30, name: 'Coca Cola', te: 'కోకా కోలా', unit: '750 ml', price: 40, mrp: 45, category: 'beverages', emoji: '🥤', rating: 4.5, sold: '11k', stock: 120, active: true },
  { id: 31, name: 'Brooke Bond Tea', te: 'టీ పొడి', unit: '500 g', price: 245, mrp: 290, category: 'beverages', emoji: '🍵', rating: 4.7, sold: '4.5k', stock: 50, active: true },
  { id: 32, name: 'Bisleri Water', te: 'మంచినీళ్లు', unit: '1 L', price: 20, mrp: 20, category: 'beverages', emoji: '💧', rating: 4.4, sold: '20k', stock: 300, active: true },
  { id: 33, name: 'Surf Excel', te: 'సర్ఫ్ ఎక్సెల్', unit: '1 kg', price: 215, mrp: 240, category: 'household', emoji: '🧺', rating: 4.6, sold: '5.4k', stock: 80, active: true },
  { id: 34, name: 'Vim Bar', te: 'విమ్ బార్', unit: '300 g x 3', price: 55, mrp: 75, category: 'household', emoji: '🧽', rating: 4.4, sold: '8.9k', stock: 120, active: true },
  { id: 35, name: 'Harpic', te: 'హార్పిక్', unit: '1 L', price: 145, mrp: 175, category: 'household', emoji: '🚽', rating: 4.5, sold: '4.2k', stock: 60, active: true },
  { id: 36, name: 'Colgate', te: 'కొల్గేట్', unit: '200 g', price: 110, mrp: 130, category: 'personal', emoji: '🪥', rating: 4.7, sold: '9.3k', stock: 100, active: true },
  { id: 37, name: 'Medimix Soap', te: 'మెడిమిక్స్ సోప్', unit: '125 g', price: 45, mrp: 55, category: 'personal', emoji: '🧼', rating: 4.6, sold: '6.1k', stock: 150, active: true },
  { id: 38, name: 'Clinic Plus Shampoo', te: 'క్లినిక్ ప్లస్', unit: '340 ml', price: 220, mrp: 260, category: 'personal', emoji: '🧴', rating: 4.4, sold: '3.7k', stock: 70, active: true },
  { id: 39, name: 'Agarbatti (Dhoop)', te: 'అగరబత్తీలు', unit: '20 sticks', price: 35, mrp: 45, category: 'pooja', emoji: '🪔', rating: 4.7, sold: '5.8k', stock: 100, active: true },
  { id: 40, name: 'Camphor (Karpooram)', te: 'కర్పూరం', unit: '50 g', price: 55, mrp: 70, category: 'pooja', emoji: '⚪', rating: 4.6, sold: '3.2k', stock: 80, active: true },
  { id: 41, name: 'Kumkum & Haldi Set', te: 'కుంకుమ పసుపు', unit: '100 g each', price: 65, mrp: 80, category: 'pooja', emoji: '🔴', rating: 4.5, sold: '2.4k', stock: 60, active: true },
];

const DEFAULT_BANNERS = [
  { id: 1, title: 'Welcome to Nellore', subtitle: 'Min ₹50 OFF on first order', code: 'NELLORE50', bg: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', emoji: '🌾', active: true },
  { id: 2, title: 'Sona Masoori Special', subtitle: 'Fresh Nellore rice — straight from farms', code: 'RICE10', bg: 'linear-gradient(135deg, #4DA167 0%, #2D5F3F 100%)', emoji: '🍚', active: true },
  { id: 3, title: 'Andhra Spices', subtitle: 'Guntur karam, sambar powder & more', code: '', bg: 'linear-gradient(135deg, #C1272D 0%, #8B0000 100%)', emoji: '🌶️', active: true },
];

const DEFAULT_SETTINGS = {
  storeName: 'Vegu',
  tagline: 'Nellore ki 10 nimishallo!',
  city: 'Nellore',
  state: 'Andhra Pradesh',
  deliveryTime: 12,
  freeDeliveryAbove: 199,
  deliveryFee: 25,
  serviceRadius: 5,
  supportPhone: '+91 98765 43210',
  upiId: 'vegu@paytm',
  language: 'en',
  isOpen: true,
};

const useStorage = (key, defaultValue) => {
  const [value, setValue] = React.useState(defaultValue);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(key);
        if (result && result.value) setValue(JSON.parse(result.value));
      } catch (e) {}
      setLoaded(true);
    })();
  }, [key]);

  const persist = async (newVal) => {
    const v = typeof newVal === 'function' ? newVal(value) : newVal;
    setValue(v);
    try { await window.storage.set(key, JSON.stringify(v)); } catch (e) {}
  };

  return [value, persist, loaded];
};

const BRAND = {
  primary: '#FF6B35',
  primaryDark: '#E55A2B',
  accent: '#4DA167',
  yellow: '#FFD23F',
  red: '#C1272D',
  cream: '#FFF8E7',
  ink: '#1A1A1A',
};

export function CustomerApp() {
  const [screen, setScreen] = React.useState('splash');
  const [products] = useStorage('products', DEFAULT_PRODUCTS);
  const [categories] = useStorage('categories', DEFAULT_CATEGORIES);
  const [banners] = useStorage('banners', DEFAULT_BANNERS);
  const [settings] = useStorage('settings', DEFAULT_SETTINGS);
  const [cart, setCart] = useStorage('cart', {});
  const [orders, setOrders] = useStorage('orders', []);
  const [address, setAddress] = useStorage('address', { line: 'D.No 25-1-12, Trunk Road', area: 'Stonehousepet, Nellore', pin: '524002' });
  const [profile] = useStorage('profile', { name: 'Ravi Kumar', phone: '+91 98765 43210' });
  const [activeCategory, setActiveCategory] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedProduct, setSelectedProduct] = React.useState(null);
  const [activeOrder, setActiveOrder] = React.useState(null);
  const [bannerIdx, setBannerIdx] = React.useState(0);
  const [lang, setLang] = React.useState(settings.language);

  React.useEffect(() => {
    if (screen === 'splash') {
      const t = setTimeout(() => setScreen('home'), 2400);
      return () => clearTimeout(t);
    }
  }, [screen]);

  React.useEffect(() => {
    const activeBanners = banners.filter(b => b.active);
    if (activeBanners.length > 1) {
      const t = setInterval(() => setBannerIdx(i => (i + 1) % activeBanners.length), 3500);
      return () => clearInterval(t);
    }
  }, [banners]);

  const activeBanners = banners.filter(b => b.active);
  const activeProducts = products.filter(p => p.active);

  const addToCart = (product) => {
    setCart({ ...cart, [product.id]: { ...product, qty: (cart[product.id]?.qty || 0) + 1 } });
  };
  const removeFromCart = (productId) => {
    const newCart = { ...cart };
    if (newCart[productId].qty > 1) newCart[productId] = { ...newCart[productId], qty: newCart[productId].qty - 1 };
    else delete newCart[productId];
    setCart(newCart);
  };
  const deleteFromCart = (productId) => {
    const newCart = { ...cart };
    delete newCart[productId];
    setCart(newCart);
  };

  const cartCount = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  const cartTotal = Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0);
  const cartMrp = Object.values(cart).reduce((s, i) => s + i.mrp * i.qty, 0);
  const cartSavings = cartMrp - cartTotal;

  const filteredProducts = React.useMemo(() => {
    let list = activeProducts;
    if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory);
    if (searchQuery) list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.te && p.te.includes(searchQuery)));
    return list;
  }, [activeCategory, searchQuery, activeProducts]);

  const placeOrder = (paymentMethod) => {
    const orderItems = Object.values(cart);
    const deliveryFee = cartTotal >= settings.freeDeliveryAbove ? 0 : settings.deliveryFee;
    const order = {
      id: 'VG' + Date.now().toString().slice(-8),
      items: orderItems,
      total: cartTotal + deliveryFee,
      itemTotal: cartTotal,
      delivery: deliveryFee,
      payment: paymentMethod,
      address,
      customerName: profile.name,
      customerPhone: profile.phone,
      status: 'placed',
      placedAt: new Date().toISOString(),
      etaMinutes: settings.deliveryTime,
      assignedRider: null,
    };
    setOrders([order, ...orders]);
    setActiveOrder(order);
    setCart({});
    setScreen('tracking');
  };

  const t = (en, te) => lang === 'te' ? (te || en) : en;

  if (screen === 'splash') {
    return (
      <div className="fixed inset-0 max-w-md mx-auto flex flex-col items-center justify-center" style={{ background: `linear-gradient(160deg, ${BRAND.primary} 0%, ${BRAND.red} 100%)` }}>
        <div style={{ animation: 'pulse-scale 1.5s ease-in-out infinite' }}>
          <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
            <div className="text-6xl font-black font-display" style={{ color: BRAND.primary }}>వ</div>
          </div>
        </div>
        <div style={{ animation: 'slide-up 0.8s ease-out 0.3s both' }} className="mt-8 text-center px-6">
          <h1 className="text-6xl font-black text-white tracking-tight font-display">{settings.storeName}</h1>
          <p className="text-white/90 mt-2 font-bold text-sm">{settings.tagline}</p>
          <div className="mt-1 text-white/70 text-xs">📍 {settings.city}, {settings.state}</div>
        </div>
        <div className="absolute bottom-12 text-white/70 text-[10px] font-medium tracking-wider">ANDHRA'S OWN QUICK COMMERCE</div>
      </div>
    );
  }

  const HomeScreen = () => (
    <div className="pb-32 bg-gray-50 min-h-screen">
      <div className="sticky top-0 z-30">
        <div style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.red} 100%)` }} className="px-4 pt-3 pb-4">
          <div className="flex items-start justify-between gap-3">
            <button onClick={() => setScreen('address')} className="flex-1 text-left active:scale-95 transition">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <Zap size={14} fill={BRAND.primary} color={BRAND.primary} />
                </div>
                <span className="text-white font-black text-sm">{t('Delivery in', 'డెలివరీ')} <span className="text-base">{settings.deliveryTime} {t('mins', 'నిమిషాలు')}</span></span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-white/95 text-sm font-medium truncate max-w-[210px]">{address.line}</span>
                <ChevronRight size={16} className="text-white/80 flex-shrink-0" />
              </div>
            </button>
            <button onClick={() => setLang(lang === 'en' ? 'te' : 'en')} className="bg-white/20 backdrop-blur px-2.5 py-1.5 rounded-full text-white text-[10px] font-black border border-white/30">
              {lang === 'en' ? 'తెలుగు' : 'EN'}
            </button>
            <button onClick={() => setScreen('profile')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center active:scale-90 transition">
              <User size={18} color={BRAND.primary} />
            </button>
          </div>
          <button onClick={() => setScreen('search')} className="mt-3 w-full bg-white rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm active:scale-[0.98] transition">
            <Search size={18} className="text-gray-500" />
            <span className="text-gray-500 text-sm">{t('Search "Sona masoori", "Pal", "Karam"...', 'శోధించండి "బియ్యం", "పాలు"...')}</span>
          </button>
        </div>
      </div>

      {activeBanners.length > 0 && (
        <div className="px-4 mt-4">
          <div className="rounded-2xl overflow-hidden relative h-32 shadow-lg" style={{ background: activeBanners[bannerIdx].bg, transition: 'background 0.6s ease' }}>
            <div className="absolute inset-0 p-5 flex items-center justify-between">
              <div className="flex-1">
                <div className="text-white/90 text-xs font-bold uppercase tracking-wider">{t('Limited Time', 'పరిమిత సమయం')}</div>
                <div className="text-white text-2xl font-black mt-1 leading-tight font-display">{activeBanners[bannerIdx].title}</div>
                <div className="text-white/95 text-sm mt-1 font-medium">{activeBanners[bannerIdx].subtitle}</div>
                {activeBanners[bannerIdx].code && (
                  <div className="inline-block mt-2 bg-white/25 backdrop-blur-sm px-2 py-1 rounded text-white text-xs font-bold border border-white/40">CODE: {activeBanners[bannerIdx].code}</div>
                )}
              </div>
              <div className="text-7xl">{activeBanners[bannerIdx].emoji}</div>
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {activeBanners.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${i === bannerIdx ? 'w-6 bg-white' : 'w-1 bg-white/50'}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        <div className="bg-green-50 rounded-xl p-2.5 text-center border border-green-100">
          <Truck size={18} className="mx-auto text-green-700 mb-0.5" />
          <div className="text-[10px] font-bold text-green-900">{t(`Free above ₹${settings.freeDeliveryAbove}`, `₹${settings.freeDeliveryAbove}+ ఉచిత`)}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-2.5 text-center border border-blue-100">
          <Clock size={18} className="mx-auto text-blue-700 mb-0.5" />
          <div className="text-[10px] font-bold text-blue-900">{settings.deliveryTime}-min Promise</div>
        </div>
        <div className="bg-orange-50 rounded-xl p-2.5 text-center border border-orange-100">
          <Tag size={18} className="mx-auto text-orange-700 mb-0.5" />
          <div className="text-[10px] font-bold text-orange-900">{t('Local Prices', 'స్థానిక ధరలు')}</div>
        </div>
      </div>

      <div className="mt-5 px-4">
        <h2 className="text-lg font-black text-gray-900 mb-3 font-display">{t('Shop by Category', 'వర్గం ప్రకారం')}</h2>
        <div className="grid grid-cols-4 gap-2">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className="flex flex-col items-center gap-1.5 active:scale-95 transition">
              <div className="w-full aspect-square rounded-2xl flex items-center justify-center text-3xl shadow-sm border" style={{ background: cat.color, borderColor: 'rgba(0,0,0,0.05)' }}>
                {cat.icon}
              </div>
              <span className="text-[10px] font-bold text-gray-800 text-center leading-tight">{lang === 'te' ? cat.te : cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 sticky top-[124px] z-20 bg-gray-50 py-2 px-4 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <button onClick={() => setActiveCategory('all')} className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition ${activeCategory === 'all' ? 'bg-black text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
            🛒 {t('All', 'అన్నీ')}
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${activeCategory === cat.id ? 'bg-black text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
              {cat.icon} {lang === 'te' ? cat.te : cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} cart={cart} onAdd={addToCart} onRemove={removeFromCart} onClick={() => { setSelectedProduct(product); setScreen('product'); }} lang={lang} />
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <div className="text-gray-600 font-medium">{t('No products found', 'ఉత్పత్తులు లేవు')}</div>
          </div>
        )}
      </div>

      <div className="mt-8 mx-4 p-5 rounded-2xl text-white" style={{ background: `linear-gradient(135deg, ${BRAND.ink} 0%, #2a2a2a 100%)` }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={20} color={BRAND.yellow} />
          <span className="font-black text-lg font-display">{settings.storeName} {t('Promise', 'వాగ్దానం')}</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{t(`Local dark stores in ${settings.city}. Fresh stock daily, fair prices, kirana-shop ka bharosa with the speed of an app.`, 'నెల్లూరులో స్థానిక డార్క్ స్టోర్లు. రోజూ తాజా సరుకు, న్యాయమైన ధరలు.')}</p>
        <div className="mt-3 flex items-center gap-1 text-xs text-white/70">
          <Phone size={12} /> {t('Support', 'సహాయం')}: {settings.supportPhone}
        </div>
      </div>
    </div>
  );

  const ProductCard = ({ product, cart, onAdd, onRemove, onClick, lang }) => {
    const inCart = cart[product.id];
    const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div onClick={onClick} className="relative aspect-square bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center cursor-pointer">
          <span className="text-6xl">{product.emoji}</span>
          {discount > 0 && <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">{discount}% OFF</div>}
          <div className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
            <Clock size={9} className="text-gray-700" />
            <span className="text-[9px] font-bold text-gray-800">12 min</span>
          </div>
        </div>
        <div className="p-2.5">
          <div onClick={onClick} className="cursor-pointer">
            <h3 className="font-bold text-sm text-gray-900 leading-tight line-clamp-2 min-h-[2.5rem]">{lang === 'te' ? product.te : product.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{product.unit}</p>
          </div>
          <div className="flex items-end justify-between mt-2 gap-1">
            <div className="min-w-0">
              <div className="font-black text-gray-900">₹{product.price}</div>
              {product.mrp > product.price && <div className="text-[10px] text-gray-400 line-through">₹{product.mrp}</div>}
            </div>
            {inCart ? (
              <div className="flex items-center rounded-lg overflow-hidden" style={{ background: BRAND.primary }}>
                <button onClick={() => onRemove(product.id)} className="p-1.5"><Minus size={14} color="white" /></button>
                <span className="text-white font-black text-sm px-1 min-w-[20px] text-center">{inCart.qty}</span>
                <button onClick={() => onAdd(product)} className="p-1.5"><Plus size={14} color="white" /></button>
              </div>
            ) : (
              <button onClick={() => onAdd(product)} className="font-black text-xs px-3.5 py-1.5 rounded-lg border-2 transition active:scale-95" style={{ background: 'white', color: BRAND.primary, borderColor: BRAND.primary }}>
                ADD
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SearchScreen = () => {
    const [localQuery, setLocalQuery] = React.useState(searchQuery);
    const trending = ['Sona Masoori', 'Milk', 'Eggs', 'Atta', 'Karam', 'Onion'];
    const results = localQuery ? activeProducts.filter(p => p.name.toLowerCase().includes(localQuery.toLowerCase()) || (p.te && p.te.includes(localQuery))) : [];
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('home')}><ArrowLeft size={22} /></button>
          <div className="flex-1 bg-gray-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <Search size={18} className="text-gray-500" />
            <input autoFocus value={localQuery} onChange={e => { setLocalQuery(e.target.value); setSearchQuery(e.target.value); }} placeholder="Search groceries..." className="flex-1 bg-transparent outline-none text-sm" />
            {localQuery && <button onClick={() => { setLocalQuery(''); setSearchQuery(''); }}><X size={16} className="text-gray-500" /></button>}
          </div>
        </div>
        {!localQuery ? (
          <div className="p-4">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Trending in Nellore</div>
            <div className="flex flex-wrap gap-2">
              {trending.map(t => (
                <button key={t} onClick={() => setLocalQuery(t)} className="px-3 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700">🔥 {t}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="text-xs text-gray-500 mb-3">{results.length} results for "{localQuery}"</div>
            <div className="grid grid-cols-2 gap-3">
              {results.map(p => <ProductCard key={p.id} product={p} cart={cart} onAdd={addToCart} onRemove={removeFromCart} onClick={() => { setSelectedProduct(p); setScreen('product'); }} lang={lang} />)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ProductScreen = () => {
    if (!selectedProduct) return null;
    const p = selectedProduct;
    const inCart = cart[p.id];
    const discount = Math.round(((p.mrp - p.price) / p.mrp) * 100);
    return (
      <div className="min-h-screen bg-white pb-32">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('home')}><ArrowLeft size={22} /></button>
          <div className="font-bold text-gray-900 truncate">{lang === 'te' ? p.te : p.name}</div>
        </div>
        <div className="aspect-square bg-gradient-to-br from-orange-50 to-yellow-100 flex items-center justify-center">
          <span className="text-9xl">{p.emoji}</span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Star size={12} fill="#10b981" color="#10b981" />
              <span className="text-xs font-bold text-emerald-800">{p.rating}</span>
            </div>
            <span className="text-xs text-gray-500">{p.sold} sold</span>
            <span className="ml-auto bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">⚡ {settings.deliveryTime} min</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 font-display">{p.name}</h1>
          {p.te && <p className="text-base text-gray-700 font-medium">{p.te}</p>}
          <p className="text-gray-500 mt-1">{p.unit}</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black">₹{p.price}</span>
            {p.mrp > p.price && (
              <>
                <span className="text-gray-400 line-through">₹{p.mrp}</span>
                <span className="bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded">{discount}% OFF</span>
              </>
            )}
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-bold">Inclusive of all taxes</div>
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
            <h3 className="font-black text-gray-900 mb-2">Why {settings.storeName}?</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex gap-2"><Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" /> 100% authentic, sourced from Nellore suppliers</div>
              <div className="flex gap-2"><Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" /> Stored in temperature-controlled dark stores</div>
              <div className="flex gap-2"><Check size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" /> Easy 24-hour returns, no questions asked</div>
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
          {inCart ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl overflow-hidden" style={{ background: BRAND.primary }}>
                <button onClick={() => removeFromCart(p.id)} className="p-3"><Minus size={18} color="white" /></button>
                <span className="text-white font-black px-3 min-w-[40px] text-center">{inCart.qty}</span>
                <button onClick={() => addToCart(p)} className="p-3"><Plus size={18} color="white" /></button>
              </div>
              <button onClick={() => setScreen('cart')} className="flex-1 text-white font-black py-3 rounded-xl active:scale-95 transition" style={{ background: BRAND.ink }}>Go to Cart</button>
            </div>
          ) : (
            <button onClick={() => addToCart(p)} className="w-full text-white font-black py-3.5 rounded-xl active:scale-95 transition" style={{ background: BRAND.primary }}>
              Add to Cart • ₹{p.price}
            </button>
          )}
        </div>
      </div>
    );
  };

  const CartScreen = () => {
    const items = Object.values(cart);
    if (items.length === 0) {
      return (
        <div className="min-h-screen bg-white">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setScreen('home')}><ArrowLeft size={22} /></button>
            <div className="font-bold">Your Cart</div>
          </div>
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="text-7xl mb-4">🛒</div>
            <h2 className="text-xl font-black text-gray-900 mb-2 font-display">Your cart is empty</h2>
            <p className="text-gray-500 mb-6 text-sm">Add some fresh items from Nellore</p>
            <button onClick={() => setScreen('home')} className="text-white font-black px-8 py-3 rounded-xl" style={{ background: BRAND.primary }}>Start Shopping</button>
          </div>
        </div>
      );
    }
    const deliveryFee = cartTotal >= settings.freeDeliveryAbove ? 0 : settings.deliveryFee;
    const grandTotal = cartTotal + deliveryFee;
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('home')}><ArrowLeft size={22} /></button>
          <div className="font-bold flex-1">Your Cart ({cartCount})</div>
        </div>
        {cartSavings > 0 && (
          <div className="m-4 p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white">
            <div className="flex items-center gap-2">
              <Tag size={18} />
              <div>
                <div className="font-black text-sm">You saved ₹{cartSavings} today!</div>
                <div className="text-xs text-white/80">Smart shopping with Vegu 🎉</div>
              </div>
            </div>
          </div>
        )}
        <div className="mx-4 bg-white rounded-2xl p-3 border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: BRAND.cream }}>
            <Zap size={20} color={BRAND.primary} fill={BRAND.primary} />
          </div>
          <div>
            <div className="font-black text-sm">Delivery in {settings.deliveryTime} minutes</div>
            <div className="text-xs text-gray-500">Shipment of {items.length} items</div>
          </div>
        </div>
        <div className="mx-4 mt-3 bg-white rounded-2xl divide-y divide-gray-100">
          {items.map(item => (
            <div key={item.id} className="p-3 flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">{item.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-gray-900 truncate">{item.name}</div>
                <div className="text-xs text-gray-500">{item.unit}</div>
                <div className="font-black text-sm mt-0.5">₹{item.price * item.qty}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center rounded-lg overflow-hidden" style={{ background: BRAND.primary }}>
                  <button onClick={() => removeFromCart(item.id)} className="p-1.5"><Minus size={14} color="white" /></button>
                  <span className="text-white font-black text-sm px-2">{item.qty}</span>
                  <button onClick={() => addToCart(item)} className="p-1.5"><Plus size={14} color="white" /></button>
                </div>
                <button onClick={() => deleteFromCart(item.id)} className="text-xs text-red-500 font-medium flex items-center gap-1"><Trash2 size={11} /> Remove</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
          <h3 className="font-black text-gray-900 mb-3">Bill Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Item Total</span><span className="font-medium">₹{cartTotal}</span></div>
            {cartSavings > 0 && <div className="flex justify-between text-emerald-600"><span>Savings on MRP</span><span className="font-medium">-₹{cartSavings}</span></div>}
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Fee</span>
              {deliveryFee === 0 ? <span className="font-bold text-emerald-600">FREE</span> : <span className="font-medium">₹{deliveryFee}</span>}
            </div>
            {deliveryFee > 0 && <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">💡 Add ₹{settings.freeDeliveryAbove - cartTotal} more for FREE delivery</div>}
            <div className="border-t border-dashed border-gray-200 pt-2 mt-2 flex justify-between font-black text-base">
              <span>Grand Total</span><span>₹{grandTotal}</span>
            </div>
          </div>
        </div>
        <div onClick={() => setScreen('address')} className="mx-4 mt-3 bg-white rounded-2xl p-4 flex items-center gap-3 cursor-pointer">
          <MapPin size={20} className="text-gray-700 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 font-bold">DELIVER TO</div>
            <div className="font-bold text-sm truncate">{address.line}</div>
            <div className="text-xs text-gray-500 truncate">{address.area} - {address.pin}</div>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
          <button onClick={() => setScreen('checkout')} className="w-full text-white font-black py-4 rounded-xl active:scale-[0.98] transition flex items-center justify-between px-5" style={{ background: BRAND.primary }}>
            <div className="text-left">
              <div className="text-xs">₹{grandTotal}</div>
              <div className="text-[10px] font-bold opacity-90">TOTAL</div>
            </div>
            <div className="flex items-center gap-1.5">Proceed to Pay <ChevronRight size={18} /></div>
          </button>
        </div>
      </div>
    );
  };

  const CheckoutScreen = () => {
    const [paymentMethod, setPaymentMethod] = React.useState('upi');
    const deliveryFee = cartTotal >= settings.freeDeliveryAbove ? 0 : settings.deliveryFee;
    const grandTotal = cartTotal + deliveryFee;
    const methods = [
      { id: 'upi', name: 'UPI', sub: 'PhonePe, GPay, Paytm', icon: <Wallet size={20} />, badge: 'INSTANT' },
      { id: 'card', name: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: <CreditCard size={20} /> },
      { id: 'cod', name: 'Cash on Delivery', sub: 'Pay when you receive', icon: <Banknote size={20} /> },
    ];
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('cart')}><ArrowLeft size={22} /></button>
          <div className="font-bold">Checkout</div>
        </div>
        <div className="p-4">
          <h3 className="font-black mb-3 font-display">Choose Payment Method</h3>
          <div className="space-y-2">
            {methods.map(m => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition ${paymentMethod === m.id ? 'bg-orange-50' : 'bg-white'}`} style={{ borderColor: paymentMethod === m.id ? BRAND.primary : '#e5e7eb' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: paymentMethod === m.id ? BRAND.primary : '#f3f4f6', color: paymentMethod === m.id ? 'white' : 'black' }}>{m.icon}</div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{m.name}</span>
                    {m.badge && <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{m.badge}</span>}
                  </div>
                  <div className="text-xs text-gray-500">{m.sub}</div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: paymentMethod === m.id ? BRAND.primary : '#d1d5db', background: paymentMethod === m.id ? BRAND.primary : 'transparent' }}>
                  {paymentMethod === m.id && <Check size={12} color="white" />}
                </div>
              </button>
            ))}
          </div>
          {paymentMethod === 'upi' && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
              💳 Pay to: <span className="font-bold">{settings.upiId}</span>
            </div>
          )}
          <div className="mt-5 bg-white rounded-2xl p-4">
            <h3 className="font-black mb-3">Order Summary</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>Items ({cartCount})</span><span>₹{cartTotal}</span></div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : <span>₹{deliveryFee}</span>}
              </div>
              <div className="border-t border-dashed pt-2 mt-2 flex justify-between font-black"><span>To Pay</span><span>₹{grandTotal}</span></div>
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
          <button onClick={() => placeOrder(paymentMethod)} className="w-full text-white font-black py-4 rounded-xl active:scale-[0.98] transition flex items-center justify-center gap-2" style={{ background: BRAND.ink }}>
            <Zap size={18} fill="white" />
            Place Order • ₹{grandTotal}
          </button>
        </div>
      </div>
    );
  };

  const TrackingScreen = () => {
    const [stepIdx, setStepIdx] = React.useState(0);
    const steps = [
      { title: 'Order Placed', sub: 'Confirmed by store', icon: '✅' },
      { title: 'Packing', sub: 'Items being prepared', icon: '📦' },
      { title: 'Out for Delivery', sub: 'Rider is on the way', icon: '🛵' },
      { title: 'Delivered', sub: 'Enjoy your order!', icon: '🎉' },
    ];
    React.useEffect(() => {
      if (stepIdx < steps.length - 1) {
        const t = setTimeout(() => {
          setStepIdx(stepIdx + 1);
          if (activeOrder) {
            const newStatus = ['placed', 'packing', 'out_for_delivery', 'delivered'][stepIdx + 1];
            const updated = { ...activeOrder, status: newStatus };
            setActiveOrder(updated);
            setOrders(orders.map(o => o.id === updated.id ? updated : o));
          }
        }, 4000);
        return () => clearTimeout(t);
      }
    }, [stepIdx]);
    if (!activeOrder) return null;
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="px-4 pt-4 pb-8" style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.red} 100%)` }}>
          <button onClick={() => setScreen('home')} className="mb-4"><ArrowLeft size={22} color="white" /></button>
          <div className="text-xs font-bold text-white/80 uppercase tracking-wider">Order #{activeOrder.id}</div>
          <h1 className="text-3xl font-black text-white mt-1 font-display">
            {stepIdx === steps.length - 1 ? 'Delivered!' : `Arriving in ${Math.max(2, settings.deliveryTime - stepIdx * 3)} mins`}
          </h1>
          <p className="text-sm text-white/90 mt-1">{steps[stepIdx].sub}</p>
        </div>
        <div className="mx-4 -mt-4 bg-white rounded-2xl p-5 shadow-lg">
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition" style={{ background: i <= stepIdx ? BRAND.primary : '#f3f4f6' }}>
                    {i <= stepIdx ? s.icon : ''}
                  </div>
                  {i < steps.length - 1 && <div className="w-0.5 h-8" style={{ background: i < stepIdx ? BRAND.primary : '#e5e7eb' }} />}
                </div>
                <div className="pb-4 flex-1">
                  <div className={`font-black ${i <= stepIdx ? 'text-gray-900' : 'text-gray-400'}`}>{s.title}</div>
                  <div className="text-xs text-gray-500">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {stepIdx >= 2 && stepIdx < 3 && (
          <div className="mx-4 mt-3 bg-white rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-2xl">🧑‍🚀</div>
            <div className="flex-1">
              <div className="font-bold text-sm">Suresh Reddy</div>
              <div className="text-xs text-gray-500">Delivery Partner • ⭐ 4.9</div>
            </div>
            <a href={`tel:${settings.supportPhone}`} className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center"><Phone size={16} color="white" /></a>
          </div>
        )}
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
          <h3 className="font-black mb-3">Order Items</h3>
          <div className="space-y-2">
            {activeOrder.items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-xl">{item.emoji}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.unit} × {item.qty}</div>
                </div>
                <div className="font-bold text-sm">₹{item.price * item.qty}</div>
              </div>
            ))}
            <div className="border-t border-dashed pt-2 mt-2 flex justify-between font-black"><span>Total Paid</span><span>₹{activeOrder.total}</span></div>
          </div>
        </div>
      </div>
    );
  };

  const OrdersScreen = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-2xl font-black font-display">My Orders</h1>
        <p className="text-xs text-gray-500">Track past and current orders</p>
      </div>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="text-6xl mb-3">📦</div>
          <h3 className="font-black mb-1">No orders yet</h3>
          <p className="text-sm text-gray-500 mb-4">Your order history will appear here</p>
          <button onClick={() => setScreen('home')} className="text-white font-black px-6 py-2.5 rounded-xl" style={{ background: BRAND.primary }}>Start Shopping</button>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {orders.map(o => (
            <div key={o.id} onClick={() => { setActiveOrder(o); setScreen('tracking'); }} className="bg-white rounded-2xl p-4 cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-bold text-gray-500">#{o.id}</div>
                  <div className="font-black mt-0.5">{o.items.length} items • ₹{o.total}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{new Date(o.placedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</div>
                </div>
                <div className={`text-xs font-black px-2 py-1 rounded ${o.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{(o.status || 'placed').replace('_', ' ').toUpperCase()}</div>
              </div>
              <div className="mt-3 flex gap-1">
                {o.items.slice(0, 5).map(it => (
                  <div key={it.id} className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center text-lg">{it.emoji}</div>
                ))}
                {o.items.length > 5 && <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold">+{o.items.length - 5}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const AddressScreen = () => {
    const [form, setForm] = React.useState(address);
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('home')}><ArrowLeft size={22} /></button>
          <div className="font-bold">Delivery Address</div>
        </div>
        <div className="p-4 space-y-4">
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: BRAND.cream, border: `1px solid ${BRAND.yellow}` }}>
            <MapPin size={18} style={{ color: BRAND.primary }} />
            <div className="text-sm font-bold">📍 We deliver across {settings.city}</div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">House / Door No.</label>
            <input value={form.line} onChange={e => setForm({...form, line: e.target.value})} className="w-full mt-1 px-3 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Area / Locality</label>
            <input value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="w-full mt-1 px-3 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">PIN Code</label>
            <input value={form.pin} onChange={e => setForm({...form, pin: e.target.value})} className="w-full mt-1 px-3 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-orange-500" />
          </div>
          <button onClick={() => { setAddress(form); setScreen('home'); }} className="w-full text-white font-black py-3.5 rounded-xl active:scale-[0.98] transition" style={{ background: BRAND.primary }}>Save Address</button>
        </div>
      </div>
    );
  };

  const ProfileScreen = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="px-4 pt-4 pb-12" style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.red} 100%)` }}>
        <button onClick={() => setScreen('home')} className="mb-3"><ArrowLeft size={22} color="white" /></button>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-black text-2xl" style={{ color: BRAND.primary }}>{profile.name[0]}</div>
          <div>
            <div className="font-black text-xl text-white">{profile.name}</div>
            <div className="text-sm text-white/80">{profile.phone}</div>
          </div>
        </div>
      </div>
      <div className="-mt-6 mx-4 bg-white rounded-2xl shadow-sm p-3">
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="p-3"><div className="font-black text-xl">{orders.length}</div><div className="text-xs text-gray-500">Orders</div></div>
          <div className="p-3 border-x border-gray-100"><div className="font-black text-xl">₹{orders.reduce((s, o) => s + ((o.itemTotal || 0) * 0.15), 0).toFixed(0)}</div><div className="text-xs text-gray-500">Saved</div></div>
          <div className="p-3"><div className="font-black text-xl">⭐ 4.8</div><div className="text-xs text-gray-500">Rating</div></div>
        </div>
      </div>
      <div className="mx-4 mt-4 bg-white rounded-2xl divide-y divide-gray-100">
        {[
          { icon: <Package size={18} />, label: 'My Orders', action: () => setScreen('orders') },
          { icon: <MapPin size={18} />, label: 'Saved Addresses', action: () => setScreen('address') },
          { icon: <Heart size={18} />, label: 'Favorites', action: () => {} },
          { icon: <Bell size={18} />, label: 'Notifications', action: () => {} },
          { icon: <Phone size={18} />, label: `Support: ${settings.supportPhone}`, action: () => {} },
        ].map((item, i) => (
          <button key={i} onClick={item.action} className="w-full p-4 flex items-center gap-3 active:bg-gray-50">
            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">{item.icon}</div>
            <span className="flex-1 text-left font-medium">{item.label}</span>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        ))}
      </div>
      <div className="mx-4 mt-4 p-4 rounded-2xl text-center" style={{ background: BRAND.ink }}>
        <Sparkles size={24} color={BRAND.yellow} className="mx-auto mb-1" />
        <div className="text-white font-black font-display">{settings.storeName} v1.0</div>
        <div className="text-white/60 text-xs mt-1">Made in {settings.city}, AP 🇮🇳</div>
      </div>
    </div>
  );

  const BottomNav = () => {
    const items = [
      { id: 'home', icon: Home, label: 'Home' },
      { id: 'orders', icon: Package, label: 'Orders' },
      { id: 'cart', icon: ShoppingCart, label: 'Cart', badge: cartCount },
      { id: 'profile', icon: User, label: 'Profile' },
    ];
    const hideOn = ['splash', 'product', 'checkout', 'tracking', 'address', 'search'];
    if (hideOn.includes(screen)) return null;
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto z-30">
        <div className="grid grid-cols-4 py-1">
          {items.map(item => {
            const Icon = item.icon;
            const active = screen === item.id;
            return (
              <button key={item.id} onClick={() => setScreen(item.id)} className="py-2 flex flex-col items-center gap-0.5 relative">
                <div className="relative">
                  <Icon size={22} style={{ color: active ? BRAND.primary : '#9ca3af' }} fill={active && item.id !== 'home' ? BRAND.primary : 'none'} />
                  {item.badge > 0 && (
                    <div className="absolute -top-1.5 -right-2 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center" style={{ background: BRAND.primary }}>{item.badge}</div>
                  )}
                </div>
                <span className="text-[10px] font-bold" style={{ color: active ? BRAND.primary : '#9ca3af' }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const FloatingCart = () => {
    const showOn = ['home', 'product'];
    if (!showOn.includes(screen) || cartCount === 0 || screen === 'cart') return null;
    return (
      <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-20">
        <button onClick={() => setScreen('cart')} className="w-full text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between active:scale-[0.98] transition" style={{ background: BRAND.ink }}>
          <div className="flex items-center gap-2">
            <div className="rounded-full w-7 h-7 flex items-center justify-center font-black text-xs" style={{ background: BRAND.primary }}>{cartCount}</div>
            <span className="font-bold text-sm">{cartCount} items • ₹{cartTotal}</span>
          </div>
          <div className="flex items-center gap-1 font-black text-sm">View Cart <ChevronRight size={16} /></div>
        </button>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;800;900&family=Hind:wght@400;500;600;700&display=swap');
        body { -webkit-font-smoothing: antialiased; background: #f5f5f5; }
        ::-webkit-scrollbar { display: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .font-display { font-family: 'Fraunces', Georgia, serif; }
        @keyframes pulse-scale { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
      `}</style>
      <div className="max-w-md mx-auto bg-white min-h-screen relative" style={{ fontFamily: '"SF Pro Display", -apple-system, system-ui, sans-serif' }}>
        {screen === 'home' && <HomeScreen />}
        {screen === 'search' && <SearchScreen />}
        {screen === 'product' && <ProductScreen />}
        {screen === 'cart' && <CartScreen />}
        {screen === 'checkout' && <CheckoutScreen />}
        {screen === 'tracking' && <TrackingScreen />}
        {screen === 'orders' && <OrdersScreen />}
        {screen === 'address' && <AddressScreen />}
        {screen === 'profile' && <ProfileScreen />}
        <FloatingCart />
        <BottomNav />
      </div>
    </>
  );
}

export default CustomerApp;
