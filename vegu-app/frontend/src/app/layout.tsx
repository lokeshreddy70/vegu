import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const viewport: Viewport = {
  themeColor: '#2ECC71',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: { default: 'VEGU — Fresh Groceries in 30 Minutes', template: '%s | VEGU' },
  description: 'Order fresh fruits, vegetables, dairy, and more. Delivered to your door in 30 minutes.',
  keywords: ['grocery delivery', 'fresh vegetables', 'fruits', 'online grocery', 'quick delivery'],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VEGU',
  },
  icons: {
    icon: '/icons/icon-192x192.svg',
    apple: '/apple-touch-icon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'VEGU',
    title: 'VEGU — Fresh Groceries in 30 Minutes',
    description: 'Order fresh fruits, vegetables, dairy, and more. Delivered to your door in 30 minutes.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
