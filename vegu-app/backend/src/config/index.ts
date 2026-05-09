import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] || fallback;

const isProd = process.env.NODE_ENV === 'production';

// In production, JWT secrets must be set explicitly — no insecure fallbacks
const jwtAccessSecret = isProd
  ? required('JWT_ACCESS_SECRET')
  : optional('JWT_ACCESS_SECRET', 'vegu-access-secret-dev-only-NOT-for-prod');

const jwtRefreshSecret = isProd
  ? required('JWT_REFRESH_SECRET')
  : optional('JWT_REFRESH_SECRET', 'vegu-refresh-secret-dev-only-NOT-for-prod');

// Access tokens are short-lived (15m default) — refresh tokens handle long sessions
const jwtAccessExpires = optional('JWT_ACCESS_EXPIRES', isProd ? '15m' : '1d');
const jwtRefreshExpires = optional('JWT_REFRESH_EXPIRES', '30d');

export const config = {
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: !isProd,

  frontendUrl: optional('FRONTEND_URL', 'http://localhost:3000'),

  jwt: {
    accessSecret: jwtAccessSecret,
    refreshSecret: jwtRefreshSecret,
    accessExpires: jwtAccessExpires,
    refreshExpires: jwtRefreshExpires,
  },

  cloudinary: {
    cloudName: optional('CLOUDINARY_CLOUD_NAME', ''),
    apiKey: optional('CLOUDINARY_API_KEY', ''),
    apiSecret: optional('CLOUDINARY_API_SECRET', ''),
  },

  stripe: {
    secretKey: optional('STRIPE_SECRET_KEY', ''),
    webhookSecret: optional('STRIPE_WEBHOOK_SECRET', ''),
  },

  razorpay: {
    keyId: optional('RAZORPAY_KEY_ID', ''),
    keySecret: optional('RAZORPAY_KEY_SECRET', ''),
  },

  anthropic: {
    apiKey: optional('ANTHROPIC_API_KEY', ''),
  },

  smtp: {
    host: optional('SMTP_HOST', 'smtp.gmail.com'),
    port: parseInt(optional('SMTP_PORT', '587')),
    user: optional('SMTP_USER', ''),
    pass: optional('SMTP_PASS', ''),
    from: optional('FROM_EMAIL', 'noreply@vegu.app'),
  },
} as const;
