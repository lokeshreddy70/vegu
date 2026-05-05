import React from 'react';
import VeguPlatform from './VeguPlatform';

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

export default function App() {
  return <VeguPlatform />;
}
