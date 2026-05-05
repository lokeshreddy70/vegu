# 🌾 Vegu (వేగు)

> **Nellore ki delivery, 10 nimishallo!**
> A complete quick-commerce platform built for Andhra Pradesh — Customer App, Rider App, and Admin Panel in one.

![Made for Nellore](https://img.shields.io/badge/Made%20for-Nellore%2C%20AP-FF6B35?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss)

---

## ✨ What is this?

**Vegu** (వేగు = "swift" in Telugu) is a Blinkit-style quick-commerce platform designed and localized for Nellore, Andhra Pradesh. It's a single web app that contains three full apps in one — switchable via the floating toggle on the top right:

| App | For | Features |
|---|---|---|
| 🛒 **Customer App** | End users buying groceries | Bilingual (English/Telugu), 41+ products, cart, checkout, live order tracking |
| 🛵 **Rider App** | Delivery partners | Online/offline toggle, accept orders, navigate, earnings tracker |
| ⚙️ **Admin Panel** | Store owner (you!) | Edit products, manage orders, customize banners, change settings, view analytics |

All three apps share the same browser localStorage, so an order placed in the customer app instantly shows up in the rider and admin apps.

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/lokeshreddy70/vegu.git
cd vegu

# 2. Install dependencies
npm install

# 3. Run the dev server
npm run dev

# 4. Open http://localhost:5173 in your browser
```

That's it. Tap the **SWITCH** button in the top-right corner of the app to switch between Customer / Rider / Admin views.

---

## 🏗️ Tech Stack

- **React 18** — UI framework
- **Vite 5** — Lightning-fast dev server and build tool
- **Tailwind CSS 3** — Utility-first styling
- **Lucide React** — Beautiful icon library
- **localStorage** — Client-side persistence (no backend needed for MVP)

---

## 📂 Project Structure

```
vegu/
├── src/
│   ├── main.jsx           # Entry point
│   ├── App.jsx            # Root component + storage polyfill
│   ├── VeguPlatform.jsx   # The full platform (3 apps in one file)
│   └── index.css          # Tailwind directives
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind + custom Vegu colors
├── postcss.config.js      # PostCSS config
└── README.md              # You are here
```

---

## 🛠️ Customization Guide

Everything is editable from the **Admin Panel** in the running app — no code changes needed:

- **Store name & tagline** — Settings → Store Identity
- **Add/edit products** — Products → ADD or tap any product
- **Change prices** — Products → tap product → Pricing & Stock
- **Promo banners** — Banners → ADD (custom gradients, codes, emojis)
- **Categories** — Categories → ADD (custom colors and icons)
- **Delivery fee, free delivery threshold** — Settings → Delivery Settings
- **Support phone, UPI ID** — Settings → Contact & Payment

---

## 🌐 Deployment

### Deploy to Vercel (recommended, free)

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm run build
# Drag-drop the `dist` folder to netlify.com/drop
```

### Deploy to GitHub Pages

```bash
npm run build
# Push the dist folder to a gh-pages branch
```

---

## 🗺️ Roadmap

### Phase 1 — Current (MVP / Demo)
- ✅ Customer + Rider + Admin apps
- ✅ localStorage-based persistence
- ✅ Bilingual UI (English + Telugu)
- ✅ Order placement and tracking simulation

### Phase 2 — Production Backend
- [ ] Firebase / Supabase backend
- [ ] User authentication (OTP-based)
- [ ] Real payment integration (Razorpay)
- [ ] Push notifications (FCM)
- [ ] WhatsApp Business API for order updates

### Phase 3 — Operations
- [ ] Inventory sync with distributor
- [ ] Multi-store / multi-area support
- [ ] Loyalty program
- [ ] Referral system
- [ ] Customer support chat

### Phase 4 — Scale
- [ ] React Native apps (iOS + Android)
- [ ] Real-time GPS tracking for riders
- [ ] AI-based demand forecasting
- [ ] Expand to other AP cities (Tirupati, Vijayawada, Guntur)

---

## 💡 Business Model

- **Per-order delivery fee:** ₹25 (waived above ₹199)
- **Margin on products:** 12-18% (FMCG), 25-40% (fresh produce)
- **Estimated breakeven:** ~80-100 orders/day per dark store
- **Target areas (Phase 1):** Stonehousepet, Magunta Layout, Dargamitta, AC Subbareddy Nagar

---

## 📞 Contact

- **Founder:** Lokesh Reddy
- **GitHub:** [@lokeshreddy70](https://github.com/lokeshreddy70)
- **Location:** Nellore, Andhra Pradesh 🇮🇳

---

## 📄 License

MIT — feel free to fork, modify, and build your own quick-commerce business.

---

<p align="center">Made with ❤️ in <strong>Nellore</strong>, Andhra Pradesh</p>
