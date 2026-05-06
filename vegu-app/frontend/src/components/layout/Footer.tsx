import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="container-page py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              VEGU
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Fresh groceries delivered to your doorstep in 30 minutes. Farm-fresh produce, dairy, snacks and more.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {['Products', 'Categories', 'Deals', 'About Us'].map(l => (
                <li key={l}><Link href="#" className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              {['Help Center', 'Track Order', 'Returns', 'Contact Us'].map(l => (
                <li key={l}><Link href="#" className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-6 text-sm text-gray-500 text-center">
          © 2024 VEGU. All rights reserved. Built with care for fresh living.
        </div>
      </div>
    </footer>
  );
}
