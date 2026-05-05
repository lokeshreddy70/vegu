import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import AuthScreen from './AuthScreen';
import VeguPlatform from './VeguPlatform';

// Keys stored in shared store (read by all users — admin writes, customers read)
const SHARED_KEYS = new Set(['products', 'categories', 'settings', 'banners', 'orders']);

function setupFirestoreStorage(uid) {
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

const Splash = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FF6B35 0%, #C1272D 100%)',
      fontFamily: '"SF Pro Display", -apple-system, system-ui, sans-serif',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>⚡</div>
      <div
        style={{
          color: '#fff',
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: -1,
          fontFamily: 'Georgia, serif',
        }}
      >
        Vegu
      </div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 6 }}>
        Loading…
      </div>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setupFirestoreStorage(firebaseUser.uid);
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setReady(true);
    });
    return unsub;
  }, []);

  if (!ready) return <Splash />;
  if (!user) return <AuthScreen />;
  return <VeguPlatform user={user} />;
}
