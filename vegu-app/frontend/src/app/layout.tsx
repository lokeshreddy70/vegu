import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'VEGU — Fresh Groceries in 30 Minutes', template: '%s | VEGU' },
  description: 'Order fresh fruits, vegetables, dairy, and more. Delivered to your door in 30 minutes.',
  keywords: ['grocery delivery', 'fresh vegetables', 'fruits', 'online grocery', 'quick delivery'],
  themeColor: '#16a34a',
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
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
