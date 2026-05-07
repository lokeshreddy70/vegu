import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
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

const app = express();

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://res.cloudinary.com'],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      config.frontendUrl,
      'https://vegu-app.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
    ];
    // Allow all Vercel preview deployments for this project
    const isVercelPreview = origin && /^https:\/\/vegu-app(-[a-z0-9-]+)?\.vercel\.app$/.test(origin);
    if (!origin || allowed.includes(origin) || isVercelPreview) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.set('trust proxy', 1);

// Request logging
app.use(requestLogger);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh', authLimiter);

// Health check
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() })
);

// Temporary ops: restore admin — remove after use
app.post('/ops/restore-admin', async (req, res) => {
  if (req.headers['x-ops-secret'] !== 'vegu-restore-admin-2026-a7b3c9d1') {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }
  const candidates = await prisma.user.findMany({
    where: { OR: [{ email: 'admin@vegu.app' }, { name: 'VEGU Admin' }] },
    select: { id: true, email: true, name: true, role: true },
  });
  const results = [];
  for (const u of candidates) {
    await prisma.user.update({ where: { id: u.id }, data: { role: 'ADMIN' } });
    await prisma.deliveryPartner.deleteMany({ where: { userId: u.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
    results.push({ email: u.email, was: u.role, action: 'restored to ADMIN' });
  }
  res.json({ success: true, results });
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/coupons', couponRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
