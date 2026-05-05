import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Search, MapPin, Clock, Plus, Minus, Trash2, ChevronRight, Home, Package, User, Heart, Star, Zap, X, Check, CreditCard, Wallet, Banknote, ArrowLeft, Bell, Tag, Truck, Phone, Settings, Edit3, Save, AlertCircle, TrendingUp, IndianRupee, Box, Users, BarChart3, ToggleLeft, ToggleRight, Sparkles, Globe, LogOut } from 'lucide-react';
import { auth, db, isConfigured } from './firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { RiderDeliveryMap, CustomerTrackingMap } from './LiveMap';

const doSignOut = async () => {
  if (isConfigured && auth) {
    await signOut(auth);
  } else {
    window.location.reload();
  }
};

// ============ DEFAULT DATA (LOCALIZED FOR NELLORE) ============
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
  // Fruits & Veggies (Nellore famous items)
  { id: 1, name: 'Onion (Ulligadda)', te: 'ఉల్లిగడ్డ', unit: '1 kg', price: 32, mrp: 45, category: 'fruits', emoji: '🧅', rating: 4.3, sold: '2.1k', stock: 50, active: true },
  { id: 2, name: 'Tomato (Tomata)', te: 'టమాట', unit: '500 g', price: 28, mrp: 40, category: 'fruits', emoji: '🍅', rating: 4.1, sold: '3.5k', stock: 80, active: true },
  { id: 3, name: 'Banana Yelakki', te: 'ఏలక్కి అరటి', unit: '1 dozen', price: 60, mrp: 75, category: 'fruits', emoji: '🍌', rating: 4.5, sold: '5.2k', stock: 100, active: true },
  { id: 4, name: 'Mango Banganapalli', te: 'బంగినపల్లి మామిడి', unit: '1 kg', price: 89, mrp: 120, category: 'fruits', emoji: '🥭', rating: 4.8, sold: '4.2k', stock: 60, active: true },
  { id: 5, name: 'Drumstick (Munaga)', te: 'మునగకాయ', unit: '500 g', price: 35, mrp: 45, category: 'fruits', emoji: '🌿', rating: 4.4, sold: '1.8k', stock: 40, active: true },
  { id: 6, name: 'Curry Leaves', te: 'కరివేపాకు', unit: '100 g', price: 10, mrp: 15, category: 'fruits', emoji: '🍃', rating: 4.6, sold: '2.5k', stock: 70, active: true },
  { id: 7, name: 'Green Chilli', te: 'పచ్చిమిర్చి', unit: '250 g', price: 25, mrp: 35, category: 'fruits', emoji: '🌶️', rating: 4.3, sold: '3.1k', stock: 50, active: true },
  { id: 8, name: 'Coconut (Kobbari)', te: 'కొబ్బరికాయ', unit: '1 piece', price: 35, mrp: 45, category: 'fruits', emoji: '🥥', rating: 4.5, sold: '2.8k', stock: 80, active: true },

  // Dairy
  { id: 9, name: 'Heritage Toned Milk', te: 'హెరిటేజ్ పాలు', unit: '500 ml', price: 32, mrp: 32, category: 'dairy', emoji: '🥛', rating: 4.7, sold: '12k', stock: 200, active: true },
  { id: 10, name: 'Sangam Curd', te: 'సంగం పెరుగు', unit: '500 g', price: 45, mrp: 55, category: 'dairy', emoji: '🍮', rating: 4.5, sold: '6.3k', stock: 100, active: true },
  { id: 11, name: 'Farm Eggs', te: 'గుడ్లు', unit: '6 pcs', price: 60, mrp: 72, category: 'dairy', emoji: '🥚', rating: 4.5, sold: '6.3k', stock: 150, active: true },
  { id: 12, name: 'Amul Butter', te: 'అమూల్ వెన్న', unit: '100 g', price: 56, mrp: 60, category: 'dairy', emoji: '🧈', rating: 4.8, sold: '8.1k', stock: 60, active: true },
  { id: 13, name: 'Paneer Fresh', te: 'పనీర్', unit: '200 g', price: 89, mrp: 110, category: 'dairy', emoji: '🧀', rating: 4.6, sold: '3.4k', stock: 40, active: true },

  // Rice & Atta (Nellore is famous for rice!)
  { id: 14, name: 'Sona Masoori Rice (Nellore)', te: 'సోనా మసూరి బియ్యం', unit: '5 kg', price: 295, mrp: 350, category: 'rice', emoji: '🍚', rating: 4.8, sold: '7.2k', stock: 80, active: true },
  { id: 15, name: 'BPT Rice', te: 'బీపీటీ బియ్యం', unit: '5 kg', price: 320, mrp: 380, category: 'rice', emoji: '🌾', rating: 4.7, sold: '4.5k', stock: 60, active: true },
  { id: 16, name: 'Aashirvaad Atta', te: 'ఆశీర్వాద్ గోధుమ పిండి', unit: '5 kg', price: 245, mrp: 285, category: 'rice', emoji: '🌾', rating: 4.7, sold: '6.7k', stock: 70, active: true },
  { id: 17, name: 'Toor Dal (Kandi Pappu)', te: 'కంది పప్పు', unit: '1 kg', price: 165, mrp: 180, category: 'rice', emoji: '🫘', rating: 4.6, sold: '3.8k', stock: 50, active: true },
  { id: 18, name: 'Moong Dal (Pesara)', te: 'పెసర పప్పు', unit: '1 kg', price: 145, mrp: 160, category: 'rice', emoji: '🫛', rating: 4.5, sold: '2.9k', stock: 40, active: true },

  // Oil & Ghee
  { id: 19, name: 'Freedom Sunflower Oil', te: 'ఫ్రీడం నూనె', unit: '1 L', price: 165, mrp: 195, category: 'oil', emoji: '🛢️', rating: 4.6, sold: '7.2k', stock: 80, active: true },
  { id: 20, name: 'Priya Groundnut Oil', te: 'ప్రియ వేరుశెనగ నూనె', unit: '1 L', price: 195, mrp: 220, category: 'oil', emoji: '🥜', rating: 4.7, sold: '4.1k', stock: 50, active: true },
  { id: 21, name: 'Pure Cow Ghee', te: 'ఆవు నెయ్యి', unit: '500 ml', price: 425, mrp: 500, category: 'oil', emoji: '🍯', rating: 4.8, sold: '2.8k', stock: 30, active: true },

  // Spices (Andhra special)
  { id: 22, name: 'Guntur Red Chilli Powder', te: 'గుంటూరు కారం', unit: '500 g', price: 285, mrp: 340, category: 'spices', emoji: '🌶️', rating: 4.8, sold: '5.1k', stock: 60, active: true },
  { id: 23, name: 'Turmeric Powder', te: 'పసుపు పొడి', unit: '200 g', price: 65, mrp: 80, category: 'spices', emoji: '🟡', rating: 4.6, sold: '4.3k', stock: 70, active: true },
  { id: 24, name: 'Sambar Powder', te: 'సాంబార్ పొడి', unit: '200 g', price: 95, mrp: 120, category: 'spices', emoji: '🥄', rating: 4.7, sold: '3.6k', stock: 50, active: true },
  { id: 25, name: 'Tamarind (Chintapandu)', te: 'చింతపండు', unit: '500 g', price: 145, mrp: 175, category: 'spices', emoji: '🟫', rating: 4.5, sold: '2.4k', stock: 40, active: true },

  // Snacks
  { id: 26, name: 'Lays Magic Masala', te: 'లేస్ చిప్స్', unit: '52 g', price: 20, mrp: 20, category: 'snacks', emoji: '🥔', rating: 4.5, sold: '18k', stock: 200, active: true },
  { id: 27, name: 'Parle-G Biscuits', te: 'పార్లే-జి', unit: '250 g', price: 25, mrp: 30, category: 'snacks', emoji: '🍪', rating: 4.7, sold: '22k', stock: 250, active: true },
  { id: 28, name: 'Andhra Murukulu', te: 'మురుకులు', unit: '200 g', price: 65, mrp: 80, category: 'snacks', emoji: '🥨', rating: 4.7, sold: '4.8k', stock: 60, active: true },
  { id: 29, name: 'Maggi Noodles', te: 'మ్యాగీ', unit: '70 g x 4', price: 56, mrp: 60, category: 'snacks', emoji: '🍜', rating: 4.7, sold: '15k', stock: 180, active: true },

  // Beverages
  { id: 30, name: 'Coca Cola', te: 'కోకా కోలా', unit: '750 ml', price: 40, mrp: 45, category: 'beverages', emoji: '🥤', rating: 4.5, sold: '11k', stock: 120, active: true },
  { id: 31, name: 'Brooke Bond Tea', te: 'టీ పొడి', unit: '500 g', price: 245, mrp: 290, category: 'beverages', emoji: '🍵', rating: 4.7, sold: '4.5k', stock: 50, active: true },
  { id: 32, name: 'Bisleri Water', te: 'మంచినీళ్లు', unit: '1 L', price: 20, mrp: 20, category: 'beverages', emoji: '💧', rating: 4.4, sold: '20k', stock: 300, active: true },

  // Household
  { id: 33, name: 'Surf Excel', te: 'సర్ఫ్ ఎక్సెల్', unit: '1 kg', price: 215, mrp: 240, category: 'household', emoji: '🧺', rating: 4.6, sold: '5.4k', stock: 80, active: true },
  { id: 34, name: 'Vim Bar', te: 'విమ్ బార్', unit: '300 g x 3', price: 55, mrp: 75, category: 'household', emoji: '🧽', rating: 4.4, sold: '8.9k', stock: 120, active: true },
  { id: 35, name: 'Harpic', te: 'హార్పిక్', unit: '1 L', price: 145, mrp: 175, category: 'household', emoji: '🚽', rating: 4.5, sold: '4.2k', stock: 60, active: true },

  // Personal Care
  { id: 36, name: 'Colgate', te: 'కొల్గేట్', unit: '200 g', price: 110, mrp: 130, category: 'personal', emoji: '🪥', rating: 4.7, sold: '9.3k', stock: 100, active: true },
  { id: 37, name: 'Medimix Soap', te: 'మెడిమిక్స్ సోప్', unit: '125 g', price: 45, mrp: 55, category: 'personal', emoji: '🧼', rating: 4.6, sold: '6.1k', stock: 150, active: true },
  { id: 38, name: 'Clinic Plus Shampoo', te: 'క్లినిక్ ప్లస్', unit: '340 ml', price: 220, mrp: 260, category: 'personal', emoji: '🧴', rating: 4.4, sold: '3.7k', stock: 70, active: true },

  // Pooja
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
  language: 'en', // 'en' or 'te'
  isOpen: true,
};

// ============ STORAGE HOOK ============
const useStorage = (key, defaultValue) => {
  const [value, setValue] = useState(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
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

// ============ BRAND COLORS ============
const BRAND = {
  primary: '#FF6B35', // Andhra orange/saffron
  primaryDark: '#E55A2B',
  accent: '#4DA167', // Telugu green
  yellow: '#FFD23F',
  red: '#C1272D',
  cream: '#FFF8E7',
  ink: '#1A1A1A',
};

// ============ SUBSCRIPTION PLANS DEFAULT DATA ============
const DEFAULT_SUBSCRIPTION_PLANS = [
  { id: 'plus', name: 'Vegu Plus', price: 499, discountPercent: 5, freeDelivery: false, badge: '⭐ Popular', color: '#4DA167', benefits: ['5% off every order', 'Priority delivery', 'Exclusive member deals', 'Early sale access'], isActive: true },
  { id: 'premium', name: 'Vegu Premium', price: 999, discountPercent: 10, freeDelivery: true, badge: '🔥 Best Value', color: '#FF6B35', benefits: ['10% off every order', 'Free delivery always', 'Priority support', 'Early sale access'], isActive: true },
  { id: 'family', name: 'Vegu Family', price: 1499, discountPercent: 15, freeDelivery: true, badge: '👨‍👩‍👧 Family', color: '#C1272D', benefits: ['15% off every order', 'Free delivery always', 'Family size deals', 'Monthly hamper discount'], isActive: true },
];

// ============ MAIN APP ROUTER ============
function VeguPlatform({ user, userRole, userData, onSignOut }) {
  const GLOBAL_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;800;900&family=Hind:wght@400;500;600;700&display=swap');
    body { -webkit-font-smoothing: antialiased; background: #f5f5f5; }
    ::-webkit-scrollbar { display: none; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .font-display { font-family: 'Fraunces', Georgia, serif; }
    @keyframes pulse-scale { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
    @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
  `;
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative" style={{ fontFamily: '"SF Pro Display", -apple-system, system-ui, sans-serif' }}>
      <style>{GLOBAL_CSS}</style>
      {userRole === 'customer' && <CustomerApp user={user} userData={userData} onSignOut={onSignOut} />}
      {userRole === 'rider'    && <RiderApp    user={user} userData={userData} onSignOut={onSignOut} />}
      {userRole === 'admin'    && <AdminApp    user={user} userData={userData} onSignOut={onSignOut} />}
    </div>
  );
}

// ===========================================================
// ============ CUSTOMER APP ============
// ===========================================================
function CustomerApp({ user, userData, onSignOut }) {
  const [screen, setScreen] = useState('splash');
  const [products, setProducts] = useStorage('products', DEFAULT_PRODUCTS);
  const [categories] = useStorage('categories', DEFAULT_CATEGORIES);
  const [banners] = useStorage('banners', DEFAULT_BANNERS);
  const [settings] = useStorage('settings', DEFAULT_SETTINGS);
  const [subscriptionPlans] = useStorage('subscriptionPlans', DEFAULT_SUBSCRIPTION_PLANS);
  const [mySubscription, setMySubscription] = useStorage('mySubscription', null);
  const [cart, setCart] = useStorage('cart', {});
  const [allOrders, setAllOrders] = useStorage('orders', []);
  const [address, setAddress] = useStorage('address', { line: 'D.No 25-1-12, Trunk Road', area: 'Stonehousepet, Nellore', pin: '524002' });
  const [favorites, setFavorites] = useStorage('favorites', []);
  const [toast, setToast] = useState(null);
  // Extract real phone: stored as '+91NNNN' in userData, or decode from internal email
  const realPhone = userData?.phone || (user?.email?.startsWith('user_') ? '+91 ' + user.email.replace('user_', '').replace('@vegu.app', '').replace(/(\d{5})(\d{5})/, '$1 $2') : '');
  const defaultName = userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Customer';
  const [profile, setProfile] = useStorage('profile', { name: defaultName, phone: realPhone });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };
  const orders = allOrders.filter(o => o.userId === user?.uid);
  const activeSub = mySubscription || userData?.subscription;
  const activePlan = subscriptionPlans.find(p => p.id === activeSub?.planId && activeSub?.isActive);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [lang, setLang] = useState(settings.language);

  useEffect(() => {
    if (screen === 'splash') {
      const t = setTimeout(() => setScreen('home'), 2400);
      return () => clearTimeout(t);
    }
  }, [screen]);

  useEffect(() => {
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

  const filteredProducts = useMemo(() => {
    let list = activeProducts;
    if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory);
    if (searchQuery) list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.te && p.te.includes(searchQuery)));
    return list;
  }, [activeCategory, searchQuery, activeProducts]);

  const placeOrder = (paymentMethod, deliverySlot) => {
    const orderItems = Object.values(cart);
    const isScheduled = deliverySlot?.type === 'scheduled';
    // Apply subscription discount
    const discountPct = activePlan ? activePlan.discountPercent : 0;
    const discountedTotal = Math.round(cartTotal * (1 - discountPct / 100));
    const freeDeliveryThreshold = activePlan?.freeDelivery ? 0 : settings.freeDeliveryAbove;
    const deliveryFee = (discountedTotal >= freeDeliveryThreshold || isScheduled) ? 0 : settings.deliveryFee;
    const order = {
      id: 'VG' + Date.now().toString().slice(-8),
      userId: user?.uid,
      items: orderItems,
      total: discountedTotal + deliveryFee,
      itemTotal: cartTotal,
      discount: cartTotal - discountedTotal,
      delivery: deliveryFee,
      payment: paymentMethod,
      address,
      customerName: profile.name,
      customerPhone: profile.phone,
      status: 'placed',
      placedAt: new Date().toISOString(),
      etaMinutes: isScheduled ? null : settings.deliveryTime,
      deliveryType: deliverySlot?.type || 'quick',
      deliverySlot: deliverySlot?.slot || null,
      scheduledLabel: deliverySlot?.label || null,
      assignedRider: null,
    };
    setAllOrders([order, ...allOrders]);
    setActiveOrder(order);
    setCart({});
    setScreen('tracking');
  };

  const t = (en, te) => lang === 'te' ? (te || en) : en;

  // ==== SPLASH ====
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

  // ==== HOME ====
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

      {/* Banner */}
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

      {/* Categories grid */}
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

      {/* Filter pills */}
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
    const isOutOfStock = product.stock <= 0;
    const isLowStock = product.stock > 0 && product.stock <= 10;
    return (
      <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm ${isOutOfStock ? 'opacity-70' : ''}`}>
        <div onClick={isOutOfStock ? undefined : onClick} className={`relative aspect-square bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center ${isOutOfStock ? '' : 'cursor-pointer'}`}>
          <span className="text-6xl">{product.emoji}</span>
          {isOutOfStock && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><span className="bg-gray-700 text-white text-[10px] font-black px-2 py-1 rounded-full">OUT OF STOCK</span></div>}
          {!isOutOfStock && discount > 0 && <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">{discount}% OFF</div>}
          {!isOutOfStock && isLowStock && <div className="absolute bottom-1.5 left-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">Only {product.stock} left</div>}
          {!isOutOfStock && <div className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
            <Clock size={9} className="text-gray-700" />
            <span className="text-[9px] font-bold text-gray-800">{settings.deliveryTime} min</span>
          </div>}
        </div>
        <div className="p-2.5">
          <div onClick={isOutOfStock ? undefined : onClick} className={isOutOfStock ? '' : 'cursor-pointer'}>
            <h3 className="font-bold text-sm text-gray-900 leading-tight line-clamp-2 min-h-[2.5rem]">{lang === 'te' ? product.te : product.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{product.unit}</p>
          </div>
          <div className="flex items-end justify-between mt-2 gap-1">
            <div className="min-w-0">
              <div className="font-black text-gray-900">₹{product.price}</div>
              {product.mrp > product.price && <div className="text-[10px] text-gray-400 line-through">₹{product.mrp}</div>}
            </div>
            {isOutOfStock ? (
              <div className="text-[10px] text-gray-400 font-bold">Unavailable</div>
            ) : inCart ? (
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
    const [localQuery, setLocalQuery] = useState(searchQuery);
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
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [deliveryType, setDeliveryType] = useState('quick');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [slotError, setSlotError] = useState(false);

    const now = new Date();
    const todayLabel = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const tomorrowLabel = new Date(now.getTime() + 86400000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const h = now.getHours();
    const rawSlots = [
      { id: 'morning',   label: 'Morning',   time: '9 AM – 12 PM', icon: '🌅', avail: h < 11 },
      { id: 'afternoon', label: 'Afternoon', time: '12 – 4 PM',    icon: '☀️', avail: h < 15 },
      { id: 'evening',   label: 'Evening',   time: '4 – 8 PM',     icon: '🌆', avail: h < 19 },
      { id: 'night',     label: 'Night',     time: '8 – 10 PM',    icon: '🌙', avail: h < 21 },
    ];
    const slots = [
      ...rawSlots.filter(s => s.avail).map(s => ({ ...s, id: `today_${s.id}`, day: todayLabel })),
      ...rawSlots.map(s => ({ ...s, id: `tmrw_${s.id}`, day: tomorrowLabel })),
    ];

    const discountPct = activePlan ? activePlan.discountPercent : 0;
    const discountedTotal = Math.round(cartTotal * (1 - discountPct / 100));
    const freeAbove = activePlan?.freeDelivery ? 0 : settings.freeDeliveryAbove;
    const deliveryFee = (deliveryType === 'scheduled' || discountedTotal >= freeAbove) ? 0 : settings.deliveryFee;
    const grandTotal = discountedTotal + deliveryFee;

    const methods = [
      { id: 'upi', name: 'UPI', sub: 'PhonePe, GPay, Paytm', icon: <Wallet size={20} />, badge: 'INSTANT' },
      { id: 'card', name: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: <CreditCard size={20} /> },
      { id: 'cod', name: 'Cash on Delivery', sub: 'Pay when you receive', icon: <Banknote size={20} /> },
    ];

    const handlePlace = () => {
      if (deliveryType === 'scheduled' && !selectedSlot) { setSlotError(true); return; }
      const slotObj = deliveryType === 'quick' ? { type: 'quick' }
        : { type: 'scheduled', slot: selectedSlot.id, label: `${selectedSlot.day} ${selectedSlot.label} (${selectedSlot.time})` };
      placeOrder(paymentMethod, slotObj);
    };

    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('cart')}><ArrowLeft size={22} /></button>
          <div className="font-bold">Checkout</div>
        </div>

        <div className="p-4 space-y-4">
          {/* Active subscription banner */}
          {activePlan && (
            <div className="rounded-2xl p-3 flex items-center gap-3" style={{ background: activePlan.color + '18', border: `1.5px solid ${activePlan.color}30` }}>
              <div className="text-2xl">🌟</div>
              <div className="flex-1">
                <div className="font-black text-sm" style={{ color: activePlan.color }}>{activePlan.name} Active</div>
                <div className="text-xs text-gray-500">{activePlan.discountPercent}% off applied • {activePlan.freeDelivery ? 'Free delivery' : ''}</div>
              </div>
              <div className="font-black text-sm" style={{ color: activePlan.color }}>-₹{cartTotal - discountedTotal}</div>
            </div>
          )}

          {/* Delivery time selection */}
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-black mb-3 font-display">Delivery Time</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button onClick={() => { setDeliveryType('quick'); setSelectedSlot(null); }}
                className="p-3 rounded-xl border-2 text-left transition"
                style={{ borderColor: deliveryType === 'quick' ? BRAND.primary : '#e5e7eb', background: deliveryType === 'quick' ? '#fff3ee' : '#fff' }}>
                <div className="text-xl mb-1">⚡</div>
                <div className="font-black text-sm" style={{ color: deliveryType === 'quick' ? BRAND.primary : BRAND.ink }}>Quick</div>
                <div className="text-xs text-gray-500">{settings.deliveryTime} mins</div>
              </button>
              <button onClick={() => setDeliveryType('scheduled')}
                className="p-3 rounded-xl border-2 text-left transition"
                style={{ borderColor: deliveryType === 'scheduled' ? BRAND.accent : '#e5e7eb', background: deliveryType === 'scheduled' ? '#f0fdf4' : '#fff' }}>
                <div className="text-xl mb-1">📅</div>
                <div className="font-black text-sm" style={{ color: deliveryType === 'scheduled' ? BRAND.accent : BRAND.ink }}>Schedule</div>
                <div className="text-xs text-gray-500">Free delivery</div>
              </button>
            </div>
            {deliveryType === 'scheduled' && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-500 uppercase">Select a slot</div>
                {slotError && !selectedSlot && <div className="text-xs text-red-600 font-bold bg-red-50 px-3 py-2 rounded-lg">⚠️ Please select a delivery slot</div>}
                <div className="grid grid-cols-2 gap-2">
                  {slots.map(s => (
                    <button key={s.id} onClick={() => setSelectedSlot(s)}
                      className="p-2.5 rounded-xl border-2 text-left transition"
                      style={{ borderColor: selectedSlot?.id === s.id ? BRAND.accent : '#e5e7eb', background: selectedSlot?.id === s.id ? '#f0fdf4' : '#f9fafb' }}>
                      <div className="text-base mb-0.5">{s.icon}</div>
                      <div className="font-black text-xs" style={{ color: selectedSlot?.id === s.id ? BRAND.accent : BRAND.ink }}>{s.label}</div>
                      <div className="text-[10px] text-gray-400">{s.day}</div>
                      <div className="text-[10px] text-gray-500">{s.time}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-black mb-3 font-display">Payment Method</h3>
            <div className="space-y-2">
              {methods.map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition ${paymentMethod === m.id ? 'bg-orange-50' : 'bg-white'}`}
                  style={{ borderColor: paymentMethod === m.id ? BRAND.primary : '#e5e7eb' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: paymentMethod === m.id ? BRAND.primary : '#f3f4f6', color: paymentMethod === m.id ? 'white' : 'black' }}>
                    {m.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{m.name}</span>
                      {m.badge && <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{m.badge}</span>}
                    </div>
                    <div className="text-xs text-gray-500">{m.sub}</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: paymentMethod === m.id ? BRAND.primary : '#d1d5db', background: paymentMethod === m.id ? BRAND.primary : 'transparent' }}>
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
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-black mb-3">Order Summary</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>Items ({cartCount})</span><span>₹{cartTotal}</span></div>
              {discountPct > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>{activePlan?.name} ({discountPct}% off)</span><span>-₹{cartTotal - discountedTotal}</span></div>}
              <div className="flex justify-between text-gray-600">
                <span>Delivery {deliveryType === 'scheduled' ? '(Scheduled)' : ''}</span>
                {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : <span>₹{deliveryFee}</span>}
              </div>
              <div className="border-t border-dashed pt-2 mt-2 flex justify-between font-black"><span>To Pay</span><span>₹{grandTotal}</span></div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
          <button onClick={handlePlace} className="w-full text-white font-black py-4 rounded-xl active:scale-[0.98] transition flex items-center justify-center gap-2" style={{ background: BRAND.ink }}>
            <Zap size={18} fill="white" />
            {deliveryType === 'scheduled' && selectedSlot ? `Schedule for ${selectedSlot.label}` : `Place Order`} • ₹{grandTotal}
          </button>
        </div>
      </div>
    );
  };

  const TrackingScreen = () => {
    const [stepIdx, setStepIdx] = useState(0);
    const steps = [
      { title: 'Order Placed', sub: 'Confirmed by store', icon: '✅' },
      { title: 'Packing', sub: 'Items being prepared', icon: '📦' },
      { title: 'Out for Delivery', sub: 'Rider is on the way', icon: '🛵' },
      { title: 'Delivered', sub: 'Enjoy your order!', icon: '🎉' },
    ];
    useEffect(() => {
      if (stepIdx < steps.length - 1) {
        const t = setTimeout(() => {
          setStepIdx(stepIdx + 1);
          if (activeOrder) {
            const newStatus = ['placed', 'packing', 'out_for_delivery', 'delivered'][stepIdx + 1];
            const updated = { ...activeOrder, status: newStatus };
            setActiveOrder(updated);
            setAllOrders(allOrders.map(o => o.id === updated.id ? updated : o));
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
        {/* Live map — shows when order is packing or out for delivery */}
        {stepIdx >= 1 && (
          <div className="mx-4 -mt-4 mb-3 shadow-lg">
            <CustomerTrackingMap order={activeOrder} stepIdx={stepIdx} />
          </div>
        )}

        <div className={`mx-4 ${stepIdx >= 1 ? '' : '-mt-4'} bg-white rounded-2xl p-5 shadow-lg`}>
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
              <div className="font-bold text-sm">{activeOrder.riderName || 'Your Rider'}</div>
              <div className="text-xs text-gray-500">Delivery Partner • ⭐ {activeOrder.riderRating || '4.9'}</div>
            </div>
            <a href={`tel:${activeOrder.riderPhone || settings.supportPhone}`} className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center"><Phone size={16} color="white" /></a>
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
            <div key={o.id} className="bg-white rounded-2xl p-4">
              <div onClick={() => { setActiveOrder(o); setScreen('tracking'); }} className="cursor-pointer">
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
              {o.status === 'delivered' && (
                <button
                  onClick={() => {
                    const reCart = {};
                    o.items.forEach(it => { reCart[it.id] = { ...it }; });
                    setCart(reCart);
                    showToast('Items added to cart!');
                    setScreen('cart');
                  }}
                  className="mt-3 w-full py-2 rounded-xl border-2 text-xs font-black active:scale-[0.98] transition"
                  style={{ borderColor: BRAND.primary, color: BRAND.primary }}
                >
                  🔄 Reorder
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const AddressScreen = () => {
    const [form, setForm] = useState(address);
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
      {/* Subscription Card */}
      <button onClick={() => setScreen('subscription')} className="mx-4 mt-4 w-full rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition" style={{ background: activePlan ? activePlan.color : BRAND.ink }}>
        <div className="text-3xl">{activePlan ? '🌟' : '⭐'}</div>
        <div className="flex-1">
          <div className="font-black text-white text-sm">{activePlan ? `${activePlan.name} Active` : 'Get Vegu Plus'}</div>
          <div className="text-xs text-white/75">{activePlan ? `${activePlan.discountPercent}% off every order${activePlan.freeDelivery ? ' + free delivery' : ''}` : 'Save on every order with a subscription'}</div>
        </div>
        <ChevronRight size={18} color="white" />
      </button>

      <div className="mx-4 mt-4 bg-white rounded-2xl divide-y divide-gray-100">
        {[
          { icon: <Package size={18} />, label: 'My Orders', action: () => setScreen('orders') },
          { icon: <MapPin size={18} />, label: 'Saved Addresses', action: () => setScreen('address') },
          { icon: <Heart size={18} />, label: 'Favorites', action: () => setScreen('orders') },
          { icon: <Bell size={18} />, label: 'Notifications', action: () => {} },
          { icon: <Phone size={18} />, label: `Support: ${settings.supportPhone}`, action: () => { window.location.href = `tel:${settings.supportPhone.replace(/\s/g, '')}`; } },
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
      <div className="mx-4 mt-3 mb-8">
        <button
          onClick={() => doSignOut()}
          className="w-full py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-black text-sm flex items-center justify-center gap-2 active:bg-red-50"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );

  const SubscriptionScreen = () => {
    const [confirming, setConfirming] = useState(null);
    const activePlans = subscriptionPlans.filter(p => p.isActive);
    const handleSubscribe = (plan) => {
      setMySubscription({ planId: plan.id, isActive: true, startDate: new Date().toISOString(), planName: plan.name });
      setConfirming(null);
      setScreen('profile');
    };
    const handleCancel = () => {
      setMySubscription(null);
      setScreen('profile');
    };
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('profile')}><ArrowLeft size={22} /></button>
          <div className="font-bold flex-1">Vegu Subscription</div>
        </div>

        {activePlan && (
          <div className="mx-4 mt-4 rounded-2xl p-4" style={{ background: activePlan.color + '18', border: `1.5px solid ${activePlan.color}40` }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">🌟</div>
              <div>
                <div className="font-black" style={{ color: activePlan.color }}>{activePlan.name} — Active</div>
                <div className="text-xs text-gray-500">Since {new Date(activeSub?.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>
            <button onClick={handleCancel} className="text-xs text-red-500 font-bold border border-red-200 px-3 py-1.5 rounded-lg">Cancel Subscription</button>
          </div>
        )}

        <div className="mx-4 mt-4 space-y-3">
          {activePlans.map(plan => {
            const isCurrent = activePlan?.id === plan.id;
            return (
              <div key={plan.id} className="bg-white rounded-2xl overflow-hidden border-2" style={{ borderColor: isCurrent ? plan.color : '#f3f4f6' }}>
                <div className="p-4" style={{ background: plan.color }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-black text-lg font-display">{plan.name}</div>
                      <div className="text-white/80 text-xs">{plan.badge}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-black text-2xl">₹{plan.price}</div>
                      <div className="text-white/70 text-xs">/month</div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-2 mb-4">
                    {plan.benefits.map((b, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check size={14} style={{ color: plan.color }} className="flex-shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl text-center font-black text-sm" style={{ background: plan.color + '20', color: plan.color }}>Current Plan ✓</div>
                  ) : confirming === plan.id ? (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 text-center">Subscribe for ₹{plan.price}/month?</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setConfirming(null)} className="py-2.5 rounded-xl border border-gray-200 text-sm font-bold">Cancel</button>
                        <button onClick={() => handleSubscribe(plan)} className="py-2.5 rounded-xl text-white font-black text-sm" style={{ background: plan.color }}>Confirm</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConfirming(plan.id)} className="w-full py-2.5 rounded-xl text-white font-black text-sm active:scale-[0.98] transition" style={{ background: plan.color }}>
                      Subscribe Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const BottomNav = () => {
    const items = [
      { id: 'home', icon: Home, label: 'Home' },
      { id: 'orders', icon: Package, label: 'Orders' },
      { id: 'cart', icon: ShoppingCart, label: 'Cart', badge: cartCount },
      { id: 'profile', icon: User, label: 'Profile' },
    ];
    const hideOn = ['splash', 'product', 'checkout', 'tracking', 'address', 'search', 'subscription'];
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
      {screen === 'home' && <HomeScreen />}
      {screen === 'search' && <SearchScreen />}
      {screen === 'product' && <ProductScreen />}
      {screen === 'cart' && <CartScreen />}
      {screen === 'checkout' && <CheckoutScreen />}
      {screen === 'tracking' && <TrackingScreen />}
      {screen === 'orders' && <OrdersScreen />}
      {screen === 'address' && <AddressScreen />}
      {screen === 'profile' && <ProfileScreen />}
      {screen === 'subscription' && <SubscriptionScreen />}
      <FloatingCart />
      <BottomNav />
      {toast && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50" style={{ animation: 'slide-up 0.3s ease-out' }}>
          <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}>
            <span className="text-lg">{toast.type === 'error' ? '❌' : '✅'}</span>
            <span className="text-white font-bold text-sm flex-1">{toast.msg}</span>
          </div>
        </div>
      )}
    </>
  );
}

// ===========================================================
// ============ RIDER APP ============
// ===========================================================
function RiderApp({ user, userData, onSignOut }) {
  const [screen, setScreen] = useState('home');
  const [orders, setOrders] = useStorage('orders', []);
  const defaultRiderName = userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Rider';
  const [riderProfile, setRiderProfile] = useStorage('rider', {
    name: defaultRiderName,
    phone: userData?.phone || user?.phoneNumber || '+91 99887 76655',
    vehicle: userData?.vehicleNumber || userData?.vehicleType || 'TS09 EZ 4521',
    rating: 4.9,
    totalDeliveries: 247,
    todayEarnings: 0,
    isOnline: true,
  });
  const [activeDelivery, setActiveDelivery] = useState(null);

  const pendingOrders = orders.filter(o => !o.assignedRider && o.status !== 'delivered' && o.status !== 'cancelled');
  const myActiveOrders = orders.filter(o => o.assignedRider === riderProfile.phone && o.status !== 'delivered' && o.status !== 'cancelled');
  const myCompletedToday = orders.filter(o => o.assignedRider === riderProfile.phone && o.status === 'delivered' && new Date(o.placedAt).toDateString() === new Date().toDateString());
  const todayEarnings = myCompletedToday.length * 35; // ₹35 per delivery

  const acceptOrder = (orderId) => {
    const updated = orders.map(o => o.id === orderId ? {
      ...o,
      assignedRider: riderProfile.phone,
      riderName: riderProfile.name,
      riderPhone: riderProfile.phone,
      riderRating: riderProfile.rating,
      status: 'packing',
    } : o);
    setOrders(updated);
    setActiveDelivery(updated.find(o => o.id === orderId));
    setScreen('delivery');
  };

  const updateOrderStatus = (orderId, status) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
    setOrders(updated);
    setActiveDelivery(updated.find(o => o.id === orderId));
    if (status === 'delivered') {
      setRiderProfile(p => ({ ...p, totalDeliveries: (p.totalDeliveries || 0) + 1 }));
      setTimeout(() => { setActiveDelivery(null); setScreen('home'); }, 1500);
    }
  };

  // ==== HOME ====
  const RiderHome = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="px-4 pt-4 pb-6" style={{ background: `linear-gradient(135deg, ${BRAND.ink} 0%, #2a2a2a 100%)` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg text-white" style={{ background: BRAND.primary }}>{riderProfile.name[0]}</div>
            <div>
              <div className="text-white font-black">{riderProfile.name}</div>
              <div className="text-white/70 text-xs flex items-center gap-1">
                <Star size={11} fill={BRAND.yellow} color={BRAND.yellow} /> {riderProfile.rating} • {riderProfile.totalDeliveries} deliveries
              </div>
            </div>
          </div>
          <button onClick={() => setRiderProfile({ ...riderProfile, isOnline: !riderProfile.isOnline })} className="flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full">
            <div className={`w-2 h-2 rounded-full ${riderProfile.isOnline ? 'bg-emerald-400' : 'bg-gray-400'}`} />
            <span className="text-white text-xs font-bold">{riderProfile.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur rounded-2xl p-3">
          <div className="text-center">
            <div className="text-white font-black text-xl">₹{todayEarnings}</div>
            <div className="text-white/70 text-[10px]">Today's Earnings</div>
          </div>
          <div className="text-center border-x border-white/20">
            <div className="text-white font-black text-xl">{myCompletedToday.length}</div>
            <div className="text-white/70 text-[10px]">Deliveries Today</div>
          </div>
          <div className="text-center">
            <div className="text-white font-black text-xl">{riderProfile.vehicle.split(' ')[0]}</div>
            <div className="text-white/70 text-[10px]">Vehicle</div>
          </div>
        </div>
      </div>

      {!riderProfile.isOnline ? (
        <div className="mx-4 mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center">
          <div className="text-3xl mb-2">😴</div>
          <div className="font-black mb-1">You're Offline</div>
          <div className="text-sm text-gray-600 mb-3">Go online to start receiving orders</div>
          <button onClick={() => setRiderProfile({ ...riderProfile, isOnline: true })} className="text-white font-black px-6 py-2.5 rounded-xl" style={{ background: BRAND.primary }}>Go Online</button>
        </div>
      ) : (
        <>
          {myActiveOrders.length > 0 && (
            <div className="mx-4 mt-4">
              <h3 className="font-black mb-2 font-display">Active Delivery</h3>
              {myActiveOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl p-4 border-2" style={{ borderColor: BRAND.primary }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-black">#{order.id}</div>
                      <div className="text-xs text-gray-500">{order.items.length} items • ₹{order.total}</div>
                    </div>
                    <div className="text-xs font-black px-2 py-1 rounded text-white" style={{ background: BRAND.primary }}>{(order.status || 'placed').replace('_', ' ').toUpperCase()}</div>
                  </div>
                  <button onClick={() => { setActiveDelivery(order); setScreen('delivery'); }} className="w-full text-white font-bold py-2.5 rounded-xl" style={{ background: BRAND.ink }}>
                    Continue Delivery
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mx-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black font-display">New Orders</h3>
              <span className="text-xs text-gray-500">{pendingOrders.length} available</span>
            </div>
            {pendingOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="text-5xl mb-2">📭</div>
                <div className="font-black">No new orders</div>
                <div className="text-sm text-gray-500">Stay online — new orders will appear here</div>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-xs font-bold text-gray-500">#{order.id}</div>
                        <div className="font-black mt-0.5">₹{order.total} • {order.items.length} items</div>
                      </div>
                      <div className="text-emerald-600 font-black text-sm">+₹35</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-emerald-700 uppercase">Pickup</div>
                          <div className="text-xs font-medium">Vegu Dark Store, Trunk Road</div>
                        </div>
                        <div className="text-xs text-gray-500">0.5 km</div>
                      </div>
                      <div className="border-l-2 border-dashed border-gray-300 ml-3 h-2" />
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin size={12} className="text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-orange-700 uppercase">Drop</div>
                          <div className="text-xs font-medium truncate">{order.address.line}</div>
                          <div className="text-[10px] text-gray-500 truncate">{order.address.area}</div>
                        </div>
                        <div className="text-xs text-gray-500">2.1 km</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs">
                      <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">⏱ {order.etaMinutes} min</div>
                      <div className="bg-gray-100 px-2 py-1 rounded font-bold">{order.payment === 'cod' ? '💵 COD' : '✅ PAID'}</div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => acceptOrder(order.id)} className="flex-1 text-white font-black py-2.5 rounded-xl" style={{ background: BRAND.primary }}>
                        ACCEPT ORDER
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // ==== ACTIVE DELIVERY ====
  const DeliveryScreen = () => {
    if (!activeDelivery) return null;
    const o = activeDelivery;
    const stages = [
      { status: 'packing', label: 'At Store', action: 'Picked Up Order', next: 'out_for_delivery' },
      { status: 'out_for_delivery', label: 'On The Way', action: 'Reached Customer', next: 'arrived' },
      { status: 'arrived', label: 'At Customer', action: 'Mark Delivered', next: 'delivered' },
    ];
    const currentStage = stages.find(s => s.status === o.status) || stages[0];

    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="px-4 pt-4 pb-6" style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.red} 100%)` }}>
          <button onClick={() => setScreen('home')} className="mb-3"><ArrowLeft size={22} color="white" /></button>
          <div className="text-white/80 text-xs font-bold">DELIVERY IN PROGRESS</div>
          <div className="text-white text-2xl font-black font-display mt-1">#{o.id}</div>
          <div className="text-white/90 text-sm mt-1">{currentStage.label}</div>
        </div>

        {/* Live Map */}
        <div className="mx-4 -mt-4 shadow-lg">
          <RiderDeliveryMap order={o} />
        </div>

        {/* Customer Info */}
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-500 uppercase mb-2">Delivering To</div>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg text-white" style={{ background: BRAND.accent }}>{o.customerName[0]}</div>
            <div className="flex-1">
              <div className="font-black">{o.customerName}</div>
              <div className="text-xs text-gray-600">{o.address.line}</div>
              <div className="text-xs text-gray-500">{o.address.area} - {o.address.pin}</div>
            </div>
            <a href={`tel:${o.customerPhone}`} className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center"><Phone size={16} color="white" /></a>
          </div>
        </div>

        {/* Order Items */}
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-500 uppercase mb-2">Order Items ({o.items.length})</div>
          <div className="space-y-2">
            {o.items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center text-lg">{item.emoji}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.unit} × {item.qty}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-dashed flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500">Total Amount</div>
              <div className="font-black text-lg">₹{o.total}</div>
            </div>
            <div className={`text-xs font-black px-3 py-1.5 rounded-lg ${o.payment === 'cod' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {o.payment === 'cod' ? '💵 COLLECT CASH' : '✅ PAID ONLINE'}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
          {o.status !== 'delivered' && (
            <button
              onClick={() => updateOrderStatus(o.id, currentStage.next === 'arrived' ? 'arrived' : currentStage.next === 'delivered' ? 'delivered' : currentStage.next)}
              className="w-full text-white font-black py-4 rounded-xl active:scale-[0.98] transition flex items-center justify-center gap-2"
              style={{ background: o.status === 'arrived' ? '#10b981' : BRAND.primary }}
            >
              <Check size={20} /> {currentStage.action}
            </button>
          )}
          {o.status === 'delivered' && (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🎉</div>
              <div className="font-black text-emerald-600">Delivery Complete!</div>
              <div className="text-xs text-gray-500">+₹35 added to today's earnings</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==== EARNINGS ====
  const EarningsScreen = () => {
    const allMyDeliveries = orders.filter(o => o.assignedRider === riderProfile.phone && o.status === 'delivered');
    const totalEarned = allMyDeliveries.length * 35;
    const incentive = myCompletedToday.length >= 10 ? 100 : 0;
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="px-4 pt-4 pb-8" style={{ background: `linear-gradient(135deg, ${BRAND.accent} 0%, #2D5F3F 100%)` }}>
          <h1 className="text-white font-display font-black text-2xl">My Earnings</h1>
          <div className="text-white/80 text-xs">Track your daily income</div>
        </div>
        <div className="mx-4 -mt-4 bg-white rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-bold text-gray-500">TODAY'S EARNINGS</div>
          <div className="text-4xl font-black mt-1" style={{ color: BRAND.accent }}>₹{todayEarnings + incentive}</div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500">Deliveries</div>
              <div className="font-black text-lg">{myCompletedToday.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Per Order</div>
              <div className="font-black text-lg">₹35</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Incentive</div>
              <div className="font-black text-lg" style={{ color: BRAND.primary }}>₹{incentive}</div>
            </div>
          </div>
        </div>
        {myCompletedToday.length < 10 && (
          <div className="mx-4 mt-3 rounded-2xl p-4 text-white" style={{ background: BRAND.ink }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} color={BRAND.yellow} />
              <div className="font-black">Daily Bonus</div>
            </div>
            <div className="text-sm text-white/80">Complete {10 - myCompletedToday.length} more deliveries to earn ₹100 bonus!</div>
            <div className="mt-2 bg-white/10 rounded-full h-2 overflow-hidden">
              <div className="h-full transition-all" style={{ width: `${(myCompletedToday.length / 10) * 100}%`, background: BRAND.yellow }} />
            </div>
          </div>
        )}
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
          <div className="font-black mb-3">Recent Deliveries</div>
          {allMyDeliveries.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No completed deliveries yet</div>
          ) : (
            <div className="space-y-2">
              {allMyDeliveries.slice(0, 10).map(o => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-sm font-bold">#{o.id}</div>
                    <div className="text-xs text-gray-500">{new Date(o.placedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</div>
                  </div>
                  <div className="font-black text-emerald-600">+₹35</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
          <div className="font-black mb-2">All Time</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500">Total Earned</div>
              <div className="font-black text-xl">₹{totalEarned}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500">Total Orders</div>
              <div className="font-black text-xl">{riderProfile.totalDeliveries + allMyDeliveries.length}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==== RIDER PROFILE ====
  const RiderProfileScreen = () => {
    const [edit, setEdit] = useState(false);
    const [form, setForm] = useState(riderProfile);
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="px-4 pt-4 pb-12" style={{ background: `linear-gradient(135deg, ${BRAND.ink} 0%, #2a2a2a 100%)` }}>
          <h1 className="text-white font-display font-black text-2xl">My Profile</h1>
        </div>
        <div className="-mt-6 mx-4 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl text-white" style={{ background: BRAND.primary }}>{riderProfile.name[0]}</div>
            <div className="flex-1">
              <div className="font-black text-lg">{riderProfile.name}</div>
              <div className="text-xs text-gray-500">Vegu Delivery Partner</div>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={12} fill={BRAND.yellow} color={BRAND.yellow} />
                <span className="text-xs font-bold">{riderProfile.rating}</span>
                <span className="text-xs text-gray-500">• {riderProfile.totalDeliveries} deliveries</span>
              </div>
            </div>
            <button onClick={() => setEdit(!edit)} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
              {edit ? <X size={16} /> : <Edit3 size={16} />}
            </button>
          </div>
          {edit ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Phone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Vehicle Number</label>
                <input value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
              <button onClick={() => { setRiderProfile(form); setEdit(false); }} className="w-full text-white font-black py-2.5 rounded-xl" style={{ background: BRAND.primary }}>Save Changes</button>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Phone</span><span className="font-bold">{riderProfile.phone}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Vehicle</span><span className="font-bold">{riderProfile.vehicle}</span></div>
              <div className="flex justify-between py-2"><span className="text-gray-500">Joined</span><span className="font-bold">Member since 2024</span></div>
            </div>
          )}
        </div>
        <div className="mx-4 mt-3 bg-white rounded-2xl divide-y divide-gray-100">
          {[
            { icon: '📋', label: 'Documents & Verification' },
            { icon: '💰', label: 'Bank Details' },
            { icon: '🎓', label: 'Training & Tutorials' },
            { icon: '📞', label: 'Helpline & Support' },
            { icon: '⚙️', label: 'App Settings' },
          ].map((item, i) => (
            <button key={i} className="w-full p-4 flex items-center gap-3 active:bg-gray-50">
              <div className="text-xl">{item.icon}</div>
              <span className="flex-1 text-left font-medium text-sm">{item.label}</span>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          ))}
        </div>
        <div className="mx-4 mt-3 mb-8">
          <button
            onClick={() => doSignOut()}
            className="w-full py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-black text-sm flex items-center justify-center gap-2 active:bg-red-50"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    );
  };

  const RiderNav = () => {
    const items = [
      { id: 'home', icon: Home, label: 'Orders' },
      { id: 'earnings', icon: IndianRupee, label: 'Earnings' },
      { id: 'profile', icon: User, label: 'Profile' },
    ];
    if (screen === 'delivery') return null;
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto z-30">
        <div className="grid grid-cols-3 py-1">
          {items.map(item => {
            const Icon = item.icon;
            const active = screen === item.id;
            return (
              <button key={item.id} onClick={() => setScreen(item.id)} className="py-2 flex flex-col items-center gap-0.5">
                <Icon size={22} style={{ color: active ? BRAND.primary : '#9ca3af' }} />
                <span className="text-[10px] font-bold" style={{ color: active ? BRAND.primary : '#9ca3af' }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {screen === 'home' && <RiderHome />}
      {screen === 'delivery' && <DeliveryScreen />}
      {screen === 'earnings' && <EarningsScreen />}
      {screen === 'profile' && <RiderProfileScreen />}
      <RiderNav />
    </>
  );
}

// ===========================================================
// ============ ADMIN APP ============
// ===========================================================
function AdminApp({ user, userData, onSignOut }) {
  const [screen, setScreen] = useState('dashboard');
  const [products, setProducts] = useStorage('products', DEFAULT_PRODUCTS);
  const [categories, setCategories] = useStorage('categories', DEFAULT_CATEGORIES);
  const [banners, setBanners] = useStorage('banners', DEFAULT_BANNERS);
  const [settings, setSettings] = useStorage('settings', DEFAULT_SETTINGS);
  const [orders, setOrders] = useStorage('orders', []);
  const [subscriptionPlans, setSubscriptionPlans] = useStorage('subscriptionPlans', DEFAULT_SUBSCRIPTION_PLANS);
  const [riderApplications, setRiderApplications] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingBanner, setEditingBanner] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    if (!db) return;
    getDocs(collection(db, 'riderApplications'))
      .then(snap => setRiderApplications(snap.docs.map(d => d.data())))
      .catch(() => {});
  }, []);

  const todayOrders = orders.filter(o => new Date(o.placedAt).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const pendingCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const lowStockProducts = products.filter(p => p.stock < 20).length;

  // ==== DASHBOARD ====
  const Dashboard = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="px-4 pt-4 pb-8" style={{ background: `linear-gradient(135deg, ${BRAND.ink} 0%, #2a2a2a 100%)` }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/70 text-xs font-bold">ADMIN DASHBOARD</div>
            <h1 className="text-white font-display font-black text-2xl mt-1">{settings.storeName}</h1>
            <div className="text-white/70 text-xs">{user?.email || settings.city}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSettings({ ...settings, isOpen: !settings.isOpen })} className="flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-2 rounded-full">
              <div className={`w-2 h-2 rounded-full ${settings.isOpen ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className="text-white text-xs font-bold">{settings.isOpen ? 'OPEN' : 'CLOSED'}</span>
            </button>
            <button onClick={() => doSignOut()} className="bg-white/10 backdrop-blur p-2 rounded-full">
              <LogOut size={16} color="white" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="-mt-4 mx-4 grid grid-cols-2 gap-2">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-bold"><IndianRupee size={12} /> TODAY</div>
          <div className="font-black text-2xl mt-1">₹{todayRevenue}</div>
          <div className="text-xs text-emerald-600 font-bold">+12% vs yesterday</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-bold"><Package size={12} /> ORDERS</div>
          <div className="font-black text-2xl mt-1">{todayOrders.length}</div>
          <div className="text-xs text-gray-500">{pendingCount} pending</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-bold"><Box size={12} /> PRODUCTS</div>
          <div className="font-black text-2xl mt-1">{products.length}</div>
          <div className="text-xs text-orange-600 font-bold">{lowStockProducts} low stock</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-bold"><Users size={12} /> CUSTOMERS</div>
          <div className="font-black text-2xl mt-1">{new Set(orders.map(o => o.customerPhone)).size}</div>
          <div className="text-xs text-emerald-600 font-bold">Active users</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mx-4 mt-4">
        <h3 className="font-black mb-2 font-display">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'products', icon: Box, label: 'Products', color: BRAND.primary },
            { id: 'orders', icon: Package, label: 'Orders', color: BRAND.accent },
            { id: 'riders', icon: Users, label: 'Riders', color: '#8B5CF6' },
            { id: 'plans', icon: Sparkles, label: 'Plans', color: '#EC4899' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics', color: '#3B82F6' },
            { id: 'settings', icon: Settings, label: 'Settings', color: BRAND.ink },
          ].map(a => {
            const Icon = a.icon;
            return (
              <button key={a.id} onClick={() => setScreen(a.id)} className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1 active:scale-95 transition">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: a.color }}>
                  <Icon size={18} color="white" />
                </div>
                <span className="text-xs font-bold">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mx-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black font-display">Recent Orders</h3>
          <button onClick={() => setScreen('orders')} className="text-xs font-bold" style={{ color: BRAND.primary }}>View All →</button>
        </div>
        {orders.slice(0, 4).length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-500 text-sm">No orders yet. Place a test order from Customer App!</div>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 4).map(o => (
              <div key={o.id} className="bg-white rounded-2xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl">{o.items[0]?.emoji || '📦'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">#{o.id}</div>
                  <div className="text-xs text-gray-500">{o.customerName} • {o.items.length} items</div>
                </div>
                <div className="text-right">
                  <div className="font-black">₹{o.total}</div>
                  <div className={`text-[9px] font-black px-1.5 py-0.5 rounded ${o.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{(o.status || 'placed').replace('_', ' ').toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts > 0 && (
        <div className="mx-4 mt-4 bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="text-orange-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-black text-orange-900">{lowStockProducts} products running low</div>
              <div className="text-xs text-orange-700">Click Products → Filter Low Stock to restock</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ==== PRODUCTS MANAGEMENT ====
  const ProductsScreen = () => {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    let displayProducts = products;
    if (filter === 'active') displayProducts = displayProducts.filter(p => p.active);
    if (filter === 'inactive') displayProducts = displayProducts.filter(p => !p.active);
    if (filter === 'low') displayProducts = displayProducts.filter(p => p.stock < 20);
    if (search) displayProducts = displayProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    const addProduct = () => {
      const newP = {
        id: Date.now(),
        name: 'New Product',
        te: '',
        unit: '1 kg',
        price: 50,
        mrp: 60,
        category: categories[0]?.id || 'fruits',
        emoji: '📦',
        rating: 4.5,
        sold: '0',
        stock: 50,
        active: true,
      };
      setProducts([newP, ...products]);
      setEditingProduct(newP);
      setScreen('product-edit');
    };

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('dashboard')}><ArrowLeft size={22} /></button>
          <div className="font-bold flex-1">Products ({products.length})</div>
          <button onClick={addProduct} className="text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1" style={{ background: BRAND.primary }}>
            <Plus size={14} /> ADD
          </button>
        </div>
        <div className="p-3 bg-white border-b">
          <div className="bg-gray-100 rounded-xl px-3 py-2 flex items-center gap-2 mb-2">
            <Search size={16} className="text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="flex-1 bg-transparent outline-none text-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'active', 'inactive', 'low'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${filter === f ? 'text-white' : 'bg-gray-100 text-gray-700'}`} style={filter === f ? { background: BRAND.primary } : {}}>
                {f === 'all' ? 'All' : f === 'active' ? '✅ Active' : f === 'inactive' ? '⏸ Inactive' : '⚠️ Low Stock'}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3 space-y-2">
          {displayProducts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-3 flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">{p.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-sm truncate">{p.name}</div>
                  {!p.active && <span className="text-[9px] bg-gray-200 px-1 rounded font-bold">OFF</span>}
                </div>
                <div className="text-xs text-gray-500">{p.unit} • ₹{p.price}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.stock < 20 ? 'bg-red-100 text-red-700' : p.stock < 50 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>Stock: {p.stock}</div>
                </div>
              </div>
              <button onClick={() => { setEditingProduct(p); setScreen('product-edit'); }} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                <Edit3 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ==== PRODUCT EDIT ====
  const ProductEditScreen = () => {
    const [form, setForm] = useState(editingProduct);
    if (!form) return null;
    const save = () => {
      setProducts(products.map(p => p.id === form.id ? form : p));
      setScreen('products');
    };
    const remove = () => {
      if (confirm('Delete this product?')) {
        setProducts(products.filter(p => p.id !== form.id));
        setScreen('products');
      }
    };
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('products')}><ArrowLeft size={22} /></button>
          <div className="font-bold flex-1">Edit Product</div>
          <button onClick={remove} className="text-red-500"><Trash2 size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl flex items-center justify-center text-5xl">{form.emoji}</div>
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500">Emoji / Icon</label>
                <input value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500 text-2xl" />
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-bold text-gray-500">Product Name (English)</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Telugu Name (తెలుగు)</label>
                <input value={form.te || ''} onChange={e => setForm({...form, te: e.target.value})} placeholder="e.g. ఉల్లిగడ్డ" className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Unit / Pack Size</label>
                <input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} placeholder="1 kg / 500 g / 6 pcs" className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-black mb-2">Pricing & Stock</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Selling Price (₹)</label>
                <input type="number" value={form.price} onChange={e => setForm({...form, price: parseInt(e.target.value) || 0})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">MRP (₹)</label>
                <input type="number" value={form.mrp} onChange={e => setForm({...form, mrp: parseInt(e.target.value) || 0})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Stock Quantity</label>
                <input type="number" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value) || 0})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Rating</label>
                <input type="number" step="0.1" max="5" value={form.rating} onChange={e => setForm({...form, rating: parseFloat(e.target.value) || 0})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
            </div>
            {form.mrp > form.price && (
              <div className="mt-2 text-xs text-emerald-600 font-bold">{Math.round(((form.mrp - form.price) / form.mrp) * 100)}% OFF will show on customer app</div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-black">Active in Store</div>
                <div className="text-xs text-gray-500">Customers can see & order this product</div>
              </div>
              <button onClick={() => setForm({...form, active: !form.active})}>
                {form.active ? <ToggleRight size={36} style={{ color: BRAND.accent }} /> : <ToggleLeft size={36} className="text-gray-400" />}
              </button>
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
          <button onClick={save} className="w-full text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2" style={{ background: BRAND.primary }}>
            <Save size={18} /> Save Product
          </button>
        </div>
      </div>
    );
  };

  // ==== ORDERS ====
  const OrdersScreen = () => {
    const [filter, setFilter] = useState('all');
    let displayOrders = orders;
    if (filter !== 'all') displayOrders = orders.filter(o => o.status === filter);
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('dashboard')}><ArrowLeft size={22} /></button>
          <div className="font-bold flex-1">All Orders ({orders.length})</div>
        </div>
        <div className="bg-white p-3 border-b">
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'placed', 'packing', 'out_for_delivery', 'delivered'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${filter === f ? 'text-white' : 'bg-gray-100 text-gray-700'}`} style={filter === f ? { background: BRAND.primary } : {}}>
                {f.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3 space-y-2">
          {displayOrders.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">No orders found</div>}
          {displayOrders.map(o => (
            <div key={o.id} className="bg-white rounded-2xl p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-black text-sm">#{o.id}</div>
                  <div className="text-xs text-gray-500">{new Date(o.placedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</div>
                </div>
                <div className={`text-[10px] font-black px-2 py-1 rounded ${o.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{(o.status || 'placed').replace('_', ' ').toUpperCase()}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-2 mb-2">
                <div className="text-xs"><span className="font-bold">{o.customerName}</span> • {o.customerPhone}</div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{o.address.line}, {o.address.area}</div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="text-gray-500">{o.items.length} items • {o.payment.toUpperCase()}</div>
                <div className="font-black">₹{o.total}</div>
              </div>
              <div className="flex gap-1 mt-2">
                {o.items.slice(0, 6).map(it => <div key={it.id} className="w-7 h-7 bg-orange-50 rounded text-base flex items-center justify-center">{it.emoji}</div>)}
                {o.items.length > 6 && <div className="w-7 h-7 bg-gray-100 rounded text-[10px] flex items-center justify-center font-bold">+{o.items.length - 6}</div>}
              </div>
              {o.assignedRider && <div className="mt-2 text-[10px] text-blue-600 font-bold">🛵 Assigned: {o.assignedRider}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ==== BANNERS ====
  const BannersScreen = () => {
    const addBanner = () => {
      const newB = { id: Date.now(), title: 'New Offer', subtitle: 'Tap to edit', code: '', bg: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.red} 100%)`, emoji: '🎁', active: true };
      setBanners([newB, ...banners]);
      setEditingBanner(newB);
      setScreen('banner-edit');
    };
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('dashboard')}><ArrowLeft size={22} /></button>
          <div className="font-bold flex-1">Banners ({banners.length})</div>
          <button onClick={addBanner} className="text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1" style={{ background: BRAND.primary }}>
            <Plus size={14} /> ADD
          </button>
        </div>
        <div className="p-3 space-y-3">
          {banners.map(b => (
            <div key={b.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="h-28 relative" style={{ background: b.bg }}>
                <div className="absolute inset-0 p-4 flex items-center justify-between">
                  <div>
                    <div className="text-white font-display font-black text-lg">{b.title}</div>
                    <div className="text-white/90 text-xs">{b.subtitle}</div>
                  </div>
                  <div className="text-5xl">{b.emoji}</div>
                </div>
                {!b.active && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-black">INACTIVE</div>}
              </div>
              <div className="p-3 flex items-center gap-2">
                <button onClick={() => { setEditingBanner(b); setScreen('banner-edit'); }} className="flex-1 bg-gray-100 font-bold text-xs py-2 rounded-lg">Edit</button>
                <button onClick={() => setBanners(banners.map(x => x.id === b.id ? {...x, active: !x.active} : x))} className="flex-1 font-bold text-xs py-2 rounded-lg" style={{ background: b.active ? BRAND.cream : '#fee2e2', color: b.active ? BRAND.primary : '#dc2626' }}>
                  {b.active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => { if (confirm('Delete banner?')) setBanners(banners.filter(x => x.id !== b.id)); }} className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const BannerEditScreen = () => {
    const [form, setForm] = useState(editingBanner);
    if (!form) return null;
    const presetGradients = [
      `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.red} 100%)`,
      `linear-gradient(135deg, ${BRAND.accent} 0%, #2D5F3F 100%)`,
      'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
      'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
    ];
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('banners')}><ArrowLeft size={22} /></button>
          <div className="font-bold flex-1">Edit Banner</div>
        </div>
        <div className="p-4 space-y-3">
          <div className="rounded-2xl overflow-hidden h-32" style={{ background: form.bg }}>
            <div className="h-full p-4 flex items-center justify-between">
              <div>
                <div className="text-white font-display font-black text-xl">{form.title || 'Title'}</div>
                <div className="text-white/90 text-sm">{form.subtitle}</div>
                {form.code && <div className="inline-block mt-1 bg-white/25 px-2 py-0.5 rounded text-white text-xs font-bold">{form.code}</div>}
              </div>
              <div className="text-6xl">{form.emoji}</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 space-y-2">
            <div>
              <label className="text-xs font-bold text-gray-500">Title</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Subtitle</label>
              <input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Promo Code (optional)</label>
              <input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Emoji</label>
              <input value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500 text-2xl" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Background</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {presetGradients.map((g, i) => (
                  <button key={i} onClick={() => setForm({...form, bg: g})} className="h-12 rounded-lg border-2" style={{ background: g, borderColor: form.bg === g ? BRAND.ink : 'transparent' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
          <button onClick={() => { setBanners(banners.map(b => b.id === form.id ? form : b)); setScreen('banners'); }} className="w-full text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2" style={{ background: BRAND.primary }}>
            <Save size={18} /> Save Banner
          </button>
        </div>
      </div>
    );
  };

  // ==== CATEGORIES ====
  const CategoriesScreen = () => {
    const addCategory = () => {
      const newC = { id: 'cat' + Date.now(), name: 'New Category', te: '', icon: '🆕', color: '#FFD89E' };
      setCategories([...categories, newC]);
      setEditingCategory(newC);
      setScreen('category-edit');
    };
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('dashboard')}><ArrowLeft size={22} /></button>
          <div className="font-bold flex-1">Categories ({categories.length})</div>
          <button onClick={addCategory} className="text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1" style={{ background: BRAND.primary }}>
            <Plus size={14} /> ADD
          </button>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          {categories.map(c => (
            <button key={c.id} onClick={() => { setEditingCategory(c); setScreen('category-edit'); }} className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl" style={{ background: c.color }}>{c.icon}</div>
              <div className="font-bold text-sm text-center">{c.name}</div>
              {c.te && <div className="text-[10px] text-gray-500">{c.te}</div>}
              <div className="text-[10px] text-gray-400">{products.filter(p => p.category === c.id).length} products</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const CategoryEditScreen = () => {
    const [form, setForm] = useState(editingCategory);
    if (!form) return null;
    const colors = ['#A8E6A1', '#FFE5B4', '#F4D9A0', '#FFD89E', '#FFB4A2', '#FFCBA4', '#B5D8FA', '#D4B5E8', '#FFC5D9', '#FFE45E'];
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('categories')}><ArrowLeft size={22} /></button>
          <div className="font-bold flex-1">Edit Category</div>
          <button onClick={() => { if (confirm('Delete category?')) { setCategories(categories.filter(c => c.id !== form.id)); setScreen('categories'); } }} className="text-red-500"><Trash2 size={18} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-white rounded-2xl p-4">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl" style={{ background: form.color }}>{form.icon}</div>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-bold text-gray-500">Icon (emoji)</label>
                <input value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500 text-2xl" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Telugu Name</label>
                <input value={form.te || ''} onChange={e => setForm({...form, te: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Color</label>
                <div className="grid grid-cols-5 gap-2 mt-1">
                  {colors.map(c => (
                    <button key={c} onClick={() => setForm({...form, color: c})} className="h-12 rounded-lg border-2" style={{ background: c, borderColor: form.color === c ? BRAND.ink : 'transparent' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
          <button onClick={() => { setCategories(categories.map(c => c.id === form.id ? form : c)); setScreen('categories'); }} className="w-full text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2" style={{ background: BRAND.primary }}>
            <Save size={18} /> Save Category
          </button>
        </div>
      </div>
    );
  };

  // ==== ANALYTICS ====
  const AnalyticsScreen = () => {
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const productSales = {};
    orders.forEach(o => o.items.forEach(it => { productSales[it.id] = (productSales[it.id] || 0) + it.qty; }));
    const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, qty]) => ({ ...products.find(p => p.id == id), qty }));
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('dashboard')}><ArrowLeft size={22} /></button>
          <div className="font-bold">Analytics</div>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-white rounded-2xl p-4 grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 font-bold">TOTAL REVENUE</div>
              <div className="text-2xl font-black mt-1" style={{ color: BRAND.accent }}>₹{totalRevenue}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold">TOTAL ORDERS</div>
              <div className="text-2xl font-black mt-1">{orders.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold">AVG ORDER</div>
              <div className="text-2xl font-black mt-1">₹{orders.length ? Math.round(totalRevenue / orders.length) : 0}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold">CUSTOMERS</div>
              <div className="text-2xl font-black mt-1">{new Set(orders.map(o => o.customerPhone)).size}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-black mb-3">Top Selling Products</h3>
            {topProducts.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">No sales yet</div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs" style={{ background: i === 0 ? BRAND.yellow : i === 1 ? '#9CA3AF' : '#D97706', color: i === 0 ? BRAND.ink : 'white' }}>{i+1}</div>
                    <div className="text-2xl">{p.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.qty} units sold</div>
                    </div>
                    <div className="font-black text-sm">₹{p.qty * p.price}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-black mb-3">Order Status Breakdown</h3>
            <div className="space-y-2">
              {['placed', 'packing', 'out_for_delivery', 'delivered'].map(s => {
                const count = orders.filter(o => o.status === s).length;
                const pct = orders.length ? (count / orders.length) * 100 : 0;
                return (
                  <div key={s}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold">{s.replace('_', ' ').toUpperCase()}</span>
                      <span>{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${pct}%`, background: BRAND.primary }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==== SETTINGS ====
  const SettingsScreen = () => {
    const [form, setForm] = useState(settings);
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('dashboard')}><ArrowLeft size={22} /></button>
          <div className="font-bold">Store Settings</div>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-black mb-3 font-display">Store Identity</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-bold text-gray-500">Store Name (Brand)</label>
                <input value={form.storeName} onChange={e => setForm({...form, storeName: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500 font-bold text-lg" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Tagline</label>
                <input value={form.tagline} onChange={e => setForm({...form, tagline: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500">City</label>
                  <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">State</label>
                  <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-black mb-3 font-display">Delivery Settings</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500">Delivery Time (min)</label>
                  <input type="number" value={form.deliveryTime} onChange={e => setForm({...form, deliveryTime: parseInt(e.target.value) || 10})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Service Radius (km)</label>
                  <input type="number" value={form.serviceRadius} onChange={e => setForm({...form, serviceRadius: parseInt(e.target.value) || 5})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Delivery Fee (₹)</label>
                  <input type="number" value={form.deliveryFee} onChange={e => setForm({...form, deliveryFee: parseInt(e.target.value) || 25})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Free Delivery Above (₹)</label>
                  <input type="number" value={form.freeDeliveryAbove} onChange={e => setForm({...form, freeDeliveryAbove: parseInt(e.target.value) || 199})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <h3 className="font-black mb-3 font-display">Contact & Payment</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-bold text-gray-500">Support Phone</label>
                <input value={form.supportPhone} onChange={e => setForm({...form, supportPhone: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">UPI ID for Payments</label>
                <input value={form.upiId} onChange={e => setForm({...form, upiId: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-black">Store Status</div>
                <div className="text-xs text-gray-500">{form.isOpen ? 'Customers can place orders' : 'Store is closed'}</div>
              </div>
              <button onClick={() => setForm({...form, isOpen: !form.isOpen})}>
                {form.isOpen ? <ToggleRight size={36} style={{ color: BRAND.accent }} /> : <ToggleLeft size={36} className="text-gray-400" />}
              </button>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <Globe size={18} className="text-orange-600 mt-0.5" />
              <div className="text-xs text-orange-900">
                <div className="font-bold mb-1">Multi-language Support</div>
                Your customers can switch between English & Telugu in the customer app. Add Telugu names to all products for best experience.
              </div>
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto">
          <button onClick={() => { setSettings(form); setScreen('dashboard'); }} className="w-full text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2" style={{ background: BRAND.primary }}>
            <Save size={18} /> Save Settings
          </button>
        </div>
      </div>
    );
  };

  // ==== PLANS MANAGEMENT ====
  const PlansScreen = () => {
    const [editForm, setEditForm] = useState(null);

    const addPlan = () => {
      const newPlan = { id: 'plan_' + Date.now(), name: 'New Plan', price: 299, discountPercent: 5, freeDelivery: false, badge: '🆕 New', color: '#4DA167', benefits: ['5% off every order'], isActive: true };
      setSubscriptionPlans([...subscriptionPlans, newPlan]);
      setEditForm(newPlan);
    };

    const savePlan = (plan) => {
      setSubscriptionPlans(subscriptionPlans.map(p => p.id === plan.id ? plan : p));
      setEditForm(null);
    };

    const deletePlan = (planId) => {
      if (confirm('Delete this plan?')) setSubscriptionPlans(subscriptionPlans.filter(p => p.id !== planId));
    };

    if (editForm) {
      return (
        <div className="min-h-screen bg-gray-50 pb-32">
          <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setEditForm(null)}><ArrowLeft size={22} /></button>
            <div className="font-bold flex-1">Edit Plan</div>
            <button onClick={() => deletePlan(editForm.id)} className="text-red-500"><Trash2 size={18} /></button>
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-white rounded-2xl p-4 space-y-3">
              <div><label className="text-xs font-bold text-gray-500">Plan Name</label><input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" /></div>
              <div><label className="text-xs font-bold text-gray-500">Badge Text</label><input value={editForm.badge} onChange={e => setEditForm({...editForm, badge: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs font-bold text-gray-500">Price (₹/month)</label><input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: parseInt(e.target.value) || 0})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" /></div>
                <div><label className="text-xs font-bold text-gray-500">Discount %</label><input type="number" value={editForm.discountPercent} onChange={e => setEditForm({...editForm, discountPercent: parseInt(e.target.value) || 0})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" /></div>
              </div>
              <div><label className="text-xs font-bold text-gray-500">Color (hex)</label><input value={editForm.color} onChange={e => setEditForm({...editForm, color: e.target.value})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500" /></div>
              <div><label className="text-xs font-bold text-gray-500">Benefits (one per line)</label><textarea rows={4} value={editForm.benefits.join('\n')} onChange={e => setEditForm({...editForm, benefits: e.target.value.split('\n').filter(Boolean)})} className="w-full mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-orange-500 text-sm" /></div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">Free Delivery</span>
                <button onClick={() => setEditForm({...editForm, freeDelivery: !editForm.freeDelivery})}>
                  {editForm.freeDelivery ? <ToggleRight size={32} style={{ color: BRAND.accent }} /> : <ToggleLeft size={32} className="text-gray-400" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">Active (visible to customers)</span>
                <button onClick={() => setEditForm({...editForm, isActive: !editForm.isActive})}>
                  {editForm.isActive ? <ToggleRight size={32} style={{ color: BRAND.accent }} /> : <ToggleLeft size={32} className="text-gray-400" />}
                </button>
              </div>
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 max-w-md mx-auto">
            <button onClick={() => savePlan(editForm)} className="w-full text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2" style={{ background: BRAND.primary }}>
              <Save size={18} /> Save Plan
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('dashboard')}><ArrowLeft size={22} /></button>
          <div className="font-bold flex-1">Subscription Plans</div>
          <button onClick={addPlan} className="text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1" style={{ background: BRAND.primary }}><Plus size={14} /> ADD</button>
        </div>
        <div className="p-4 space-y-3">
          {subscriptionPlans.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-500">No plans yet. Create your first plan!</div>
          ) : subscriptionPlans.map(plan => (
            <div key={plan.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <div className="px-4 py-3 flex items-center gap-3" style={{ background: plan.color }}>
                <div className="flex-1">
                  <div className="text-white font-black">{plan.name}</div>
                  <div className="text-white/75 text-xs">{plan.badge}</div>
                </div>
                <div className="text-white font-black text-lg">₹{plan.price}/mo</div>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-bold" style={{ color: plan.color }}>{plan.discountPercent}% OFF</span>
                  {plan.freeDelivery && <span className="text-emerald-600 font-bold">Free Delivery</span>}
                  {!plan.isActive && <span className="text-gray-400 text-xs font-bold bg-gray-100 px-2 py-0.5 rounded">INACTIVE</span>}
                </div>
                <button onClick={() => setEditForm(plan)} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"><Edit3 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ==== RIDERS MANAGEMENT ====
  const RidersScreen = () => {
    const pendingRiders = riderApplications.filter(r => !r.isApproved && !r.isRejected);
    const approvedRiders = riderApplications.filter(r => r.isApproved);
    const rejectedRiders = riderApplications.filter(r => r.isRejected);

    const approveRider = async (rider) => {
      const updated = riderApplications.map(r => r.uid === rider.uid ? { ...r, isApproved: true, isRejected: false, status: 'approved' } : r);
      setRiderApplications(updated);
      try {
        if (db) {
          await setDoc(doc(db, 'users', rider.uid), { isApproved: true }, { merge: true });
          await setDoc(doc(db, 'riderApplications', rider.uid), { isApproved: true, isRejected: false, status: 'approved' }, { merge: true });
        }
      } catch (e) {}
    };

    const rejectRider = async (rider) => {
      const updated = riderApplications.map(r => r.uid === rider.uid ? { ...r, isRejected: true, isApproved: false, status: 'rejected' } : r);
      setRiderApplications(updated);
      try {
        if (db) {
          await setDoc(doc(db, 'users', rider.uid), { isApproved: false }, { merge: true });
          await setDoc(doc(db, 'riderApplications', rider.uid), { isRejected: true, isApproved: false, status: 'rejected' }, { merge: true });
        }
      } catch (e) {}
    };

    const RiderCard = ({ rider, showActions }) => (
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg text-white flex-shrink-0" style={{ background: BRAND.primary }}>{rider.name?.[0] || '?'}</div>
          <div className="flex-1 min-w-0">
            <div className="font-black">{rider.name || 'Unknown'}</div>
            <div className="text-xs text-gray-500">{rider.email}</div>
            <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-2">
              <span>📞 {rider.phone || '—'}</span>
              <span>🛵 {rider.vehicleType || '—'}</span>
              <span>🔢 {rider.vehicleNumber || '—'}</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">{rider.appliedAt ? new Date(rider.appliedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''}</div>
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2 mt-3">
            <button onClick={() => rejectRider(rider)} className="flex-1 py-2 rounded-xl border-2 border-red-200 text-red-600 font-black text-sm">Reject</button>
            <button onClick={() => approveRider(rider)} className="flex-1 py-2 rounded-xl text-white font-black text-sm" style={{ background: BRAND.accent }}>Approve ✓</button>
          </div>
        )}
      </div>
    );

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setScreen('dashboard')}><ArrowLeft size={22} /></button>
          <div className="font-bold flex-1">Delivery Riders</div>
          {pendingRiders.length > 0 && <div className="text-xs font-black text-white bg-orange-500 w-5 h-5 rounded-full flex items-center justify-center">{pendingRiders.length}</div>}
        </div>
        <div className="p-4 space-y-4">
          {pendingRiders.length > 0 && (
            <div>
              <div className="text-xs font-bold text-orange-600 uppercase mb-2">Pending Approval ({pendingRiders.length})</div>
              <div className="space-y-2">{pendingRiders.map(r => <RiderCard key={r.uid} rider={r} showActions />)}</div>
            </div>
          )}
          {approvedRiders.length > 0 && (
            <div>
              <div className="text-xs font-bold text-emerald-600 uppercase mb-2">Active Riders ({approvedRiders.length})</div>
              <div className="space-y-2">{approvedRiders.map(r => <RiderCard key={r.uid} rider={r} showActions={false} />)}</div>
            </div>
          )}
          {rejectedRiders.length > 0 && (
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase mb-2">Rejected ({rejectedRiders.length})</div>
              <div className="space-y-2">{rejectedRiders.map(r => <RiderCard key={r.uid} rider={r} showActions={false} />)}</div>
            </div>
          )}
          {riderApplications.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="text-5xl mb-2">🛵</div>
              <div className="font-black">No rider applications yet</div>
              <div className="text-sm text-gray-500 mt-1">New applications will appear here</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const AdminNav = () => {
    if (['product-edit', 'banner-edit', 'category-edit'].includes(screen)) return null;
    const items = [
      { id: 'dashboard', icon: Home, label: 'Home' },
      { id: 'orders', icon: Package, label: 'Orders' },
      { id: 'products', icon: Box, label: 'Products' },
      { id: 'riders', icon: Users, label: 'Riders' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ];
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto z-30">
        <div className="grid grid-cols-5 py-1">
          {items.map(item => {
            const Icon = item.icon;
            const active = screen === item.id;
            return (
              <button key={item.id} onClick={() => setScreen(item.id)} className="py-2 flex flex-col items-center gap-0.5">
                <Icon size={20} style={{ color: active ? BRAND.primary : '#9ca3af' }} />
                <span className="text-[10px] font-bold" style={{ color: active ? BRAND.primary : '#9ca3af' }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {screen === 'dashboard' && <Dashboard />}
      {screen === 'products' && <ProductsScreen />}
      {screen === 'product-edit' && <ProductEditScreen />}
      {screen === 'orders' && <OrdersScreen />}
      {screen === 'banners' && <BannersScreen />}
      {screen === 'banner-edit' && <BannerEditScreen />}
      {screen === 'categories' && <CategoriesScreen />}
      {screen === 'category-edit' && <CategoryEditScreen />}
      {screen === 'analytics' && <AnalyticsScreen />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'plans' && <PlansScreen />}
      {screen === 'riders' && <RidersScreen />}
      <AdminNav />
    </>
  );
}

export default VeguPlatform;
