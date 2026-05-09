'use client';

import { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('vegu-splash')) return;
    sessionStorage.setItem('vegu-splash', '1');
    setVisible(true);
    const t1 = setTimeout(() => setFading(true), 1900);
    const t2 = setTimeout(() => setVisible(false), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-veg flex flex-col items-center justify-center transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-5 animate-splash">
        <div className="relative">
          <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-2xl">
            <Leaf className="w-12 h-12 text-veg" />
          </div>
          <div className="absolute inset-0 rounded-[32px] bg-white/20 blur-xl scale-125" />
        </div>
        <div className="text-center">
          <h1 className="text-white text-5xl font-extrabold italic tracking-wide">vegú</h1>
          <p className="text-white/70 text-xs font-semibold tracking-[0.25em] uppercase mt-2">
            Fresh · Fast · Natural
          </p>
        </div>
      </div>

      <div className="absolute bottom-12 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce bounce-delay-0" />
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce bounce-delay-150" />
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce bounce-delay-300" />
      </div>
    </div>
  );
}
