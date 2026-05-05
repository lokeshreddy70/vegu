import React, { useState, useEffect } from 'react';
import { auth, db, isConfigured } from './firebase';
import VeguPlatform from './VeguPlatform';
import AuthScreen from './AuthScreen';

// localStorage polyfill — used in demo mode (no Firebase configured)
function setupLocalStorage() {
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

// Firestore-backed storage — used when Firebase is configured
const SHARED_KEYS = new Set(['products', 'categories', 'settings', 'banners', 'orders']);

function setupFirestoreStorage(uid, firestoreFns) {
  const { doc, getDoc, setDoc, deleteDoc } = firestoreFns;
  window.storage = {
    get: async (key) => {
      const ref = SHARED_KEYS.has(key)
        ? doc(db, 'store', key)
        : doc(db, 'users', uid, 'data', key);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Not found');
      return { key, value: snap.data().v };
    },
    set: async (key, value) => {
      const ref = SHARED_KEYS.has(key)
        ? doc(db, 'store', key)
        : doc(db, 'users', uid, 'data', key);
      await setDoc(ref, { v: value });
      return { key, value };
    },
    delete: async (key) => {
      const ref = SHARED_KEYS.has(key)
        ? doc(db, 'store', key)
        : doc(db, 'users', uid, 'data', key);
      await deleteDoc(ref);
      return { key, deleted: true };
    },
    list: async () => ({ keys: [] }),
  };
}

const DEMO_USER = {
  uid: 'demo-local',
  isAnonymous: true,
  displayName: 'Guest',
  email: null,
  phoneNumber: null,
};

const Splash = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #FF6B35 0%, #C1272D 100%)',
    fontFamily: '"SF Pro Display", -apple-system, system-ui, sans-serif',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>⚡</div>
      <div style={{ color: '#fff', fontSize: 32, fontWeight: 900, fontFamily: 'Georgia, serif' }}>Vegu</div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 6 }}>Loading…</div>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isConfigured) {
      // Demo mode: localStorage + no login required
      setupLocalStorage();
      setUser(DEMO_USER);
      setReady(true);
      return;
    }

    // Firebase mode: load auth + firestore lazily
    let unsubscribe = () => {};
    (async () => {
      const [authMod, firestoreMod] = await Promise.all([
        import('firebase/auth'),
        import('firebase/firestore'),
      ]);
      const firestoreFns = {
        doc: firestoreMod.doc,
        getDoc: firestoreMod.getDoc,
        setDoc: firestoreMod.setDoc,
        deleteDoc: firestoreMod.deleteDoc,
      };
      unsubscribe = authMod.onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setupFirestoreStorage(firebaseUser.uid, firestoreFns);
          setUser(firebaseUser);
        } else {
          setUser(null);
        }
        setReady(true);
      });
    })();

    return () => unsubscribe();
  }, []);

  if (!ready) return <Splash />;
  if (!user) return <AuthScreen />;
  return <VeguPlatform user={user} />;
}
