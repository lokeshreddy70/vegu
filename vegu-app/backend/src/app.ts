import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'crypto';
import { config } from './config';
import { errorHandler, notFound } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { prisma } from './prisma/client';

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import addressRoutes from './routes/address.routes';
import vendorRoutes from './routes/vendor.routes';
import adminRoutes from './routes/admin.routes';
import bannerRoutes from './routes/banner.routes';
import wishlistRoutes from './routes/wishlist.routes';
import notificationRoutes from './routes/notification.routes';
import riderRoutes from './routes/rider.routes';
import couponRoutes from './routes/coupon.routes';
import supportRoutes from './routes/support.routes';
import kitchenRoutes from './routes/kitchen.routes';
import trustedRiderRoutes from './routes/trusted-rider.routes';
import publicRoutes from './routes/public.routes';

const app = express();

// ── Request ID — attach a unique ID to every request for tracing ──────────────
app.use((_req, res, next) => {
  res.setHeader('X-Request-Id', randomUUID());
  next();
});

// ── Compression — gzip/brotli before anything writes a response body ──────────
app.use(compression());

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://res.cloudinary.com'],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Prevent MIME-type sniffing
  noSniff: true,
  // Prevent clickjacking
  frameguard: { action: 'deny' },
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      config.frontendUrl,
      'https://vegu-app.vercel.app',
      'https://vegu-repo.vercel.app',
      'https://frontend-jet-sigma-69.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    const isVercelPreview = origin != null &&
      /^https:\/\/(vegu-app|vegu-repo|frontend)(-[a-z0-9-]+)?\.vercel\.app$/.test(origin);
    if (!origin || allowed.includes(origin) || isVercelPreview) return cb(null, true);
    // Return null (block without error) rather than throwing — avoids 500 responses
    cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
// Proof-of-delivery uploads base64 phone photos (~2-4 MB encoded).
// The proof endpoint uses a higher limit; all other endpoints stay tight.
app.use('/api/rider/orders', express.json({ limit: '8mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.set('trust proxy', 1);

// ── Request logging ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Rate limiting ─────────────────────────────────────────────────────────────

// General API: 200 req / 15 min
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: (req) => req.method === 'OPTIONS',
});

// Auth endpoints: 15 attempts / 15 min — brute-force protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
});

// Order creation: 10 orders / 5 min — prevents order flooding
const orderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many orders placed, please wait before placing another.' },
});

// Cart: 60 mutations / 1 min — generous but still bounded
const cartLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many cart operations, please slow down.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh', authLimiter);

// ── Health check — includes DB connectivity ───────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      db: 'connected',
    });
  } catch {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      db: 'disconnected',
    });
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartLimiter, cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/trusted-riders', trustedRiderRoutes);
app.use('/api/public', publicRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
