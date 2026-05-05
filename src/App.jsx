import React, { useState, useEffect } from 'react';
import { auth, db, isConfigured } from './firebase';
import VeguPlatform from './VeguPlatform';
import AuthScreen, { RiderPendingScreen, SetupRequired } from './AuthScreen';

const SHARED_KEYS = new Set(['products', 'categories', 'settings', 'banners', 'orders',
  'subscriptionPlans', 'riderApplications']);

function setupFirestoreStorage(uid, fns) {
  const { doc, getDoc, setDoc, deleteDoc } = fns;
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
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isConfigured) {
      setReady(true);
      return;
    }

    let unsub = () => {};
    (async () => {
      const [authMod, firestoreMod] = await Promise.all([
        import('firebase/auth'),
        import('firebase/firestore'),
      ]);
      const fns = {
        doc: firestoreMod.doc,
        getDoc: firestoreMod.getDoc,
        setDoc: firestoreMod.setDoc,
        deleteDoc: firestoreMod.deleteDoc,
      };

      unsub = authMod.onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Fetch role + profile from Firestore
          const snap = await firestoreMod.getDoc(firestoreMod.doc(db, 'users', firebaseUser.uid));
          const data = snap.exists() ? snap.data() : { role: 'customer' };
          setupFirestoreStorage(firebaseUser.uid, fns);
          setUser(firebaseUser);
          setUserRole(data.role || 'customer');
          setUserData(data);
        } else {
          setUser(null);
          setUserRole(null);
          setUserData(null);
        }
        setReady(true);
      });
    })();
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  };

  if (!isConfigured) return <SetupRequired />;
  if (!ready) return <Splash />;
  if (!user) return <AuthScreen />;

  // Rider waiting for admin approval
  if (userRole === 'rider' && userData?.isApproved === false) {
    return <RiderPendingScreen onSignOut={handleSignOut} />;
  }

  return <VeguPlatform user={user} userRole={userRole} userData={userData} onSignOut={handleSignOut} />;
}
