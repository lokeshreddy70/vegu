import React, { useState } from 'react';
import { auth, db, isConfigured } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc,
} from 'firebase/firestore';

const BRAND = { primary: '#FF6B35', red: '#C1272D', accent: '#4DA167', ink: '#1A1A1A' };

const cleanError = (msg = '') => {
  if (msg.includes('auth/operation-not-allowed'))  return 'Email sign-in is not enabled. Contact admin.';
  if (msg.includes('auth/email-already-in-use'))   return 'Account already exists — please login instead.';
  if (msg.includes('auth/invalid-credential'))     return 'Wrong email or password.';
  if (msg.includes('auth/invalid-email'))          return 'Invalid email address.';
  if (msg.includes('auth/weak-password'))          return 'Password must be at least 6 characters.';
  if (msg.includes('auth/user-not-found'))         return 'No account found with this email.';
  if (msg.includes('auth/wrong-password'))         return 'Wrong password. Try again.';
  if (msg.includes('auth/too-many-requests'))      return 'Too many attempts. Try again later.';
  if (msg.includes('auth/network-request-failed')) return 'Network error. Check your connection.';
  if (msg.includes('permission-denied'))           return 'Database permission denied. Contact admin.';
  return msg.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]+\)\.?/g, '').trim() || 'Something went wrong. Try again.';
};

// ─── Step 1: Role Picker ───────────────────────────────────────────────────
const RolePicker = ({ onSelect }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6"
    style={{ background: 'linear-gradient(160deg, #fff8f5 0%, #fff 70%)', fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@800;900&display=swap'); .fd{font-family:'Fraunces',Georgia,serif;} @keyframes su{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}} .su{animation:su .4s ease}`}</style>

    {/* Logo */}
    <div className="text-center mb-10 su">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl"
        style={{ background: `linear-gradient(135deg,${BRAND.primary},${BRAND.red})` }}>
        <span style={{ fontSize: 38 }}>⚡</span>
      </div>
      <div className="fd font-black text-4xl" style={{ color: BRAND.ink }}>Vegu</div>
      <div className="text-sm text-gray-500 mt-1">Nellore ki 10 nimishallo!</div>
    </div>

    <div className="w-full max-w-sm su">
      <p className="text-center font-black text-xl mb-2 fd" style={{ color: BRAND.ink }}>I am a…</p>
      <p className="text-center text-sm text-gray-400 mb-6">Choose your role to get started</p>

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Customer */}
        <button onClick={() => onSelect('customer')}
          className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-gray-200 bg-white active:scale-95 transition-all hover:border-orange-300 hover:shadow-lg">
          <div className="text-5xl mb-3">🛒</div>
          <div className="font-black text-base" style={{ color: BRAND.ink }}>Customer</div>
          <div className="text-xs text-gray-400 mt-1 text-center">Browse &amp; order groceries</div>
        </button>

        {/* Rider */}
        <button onClick={() => onSelect('rider')}
          className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-gray-200 bg-white active:scale-95 transition-all hover:border-orange-300 hover:shadow-lg">
          <div className="text-5xl mb-3">🛵</div>
          <div className="font-black text-base" style={{ color: BRAND.ink }}>Rider</div>
          <div className="text-xs text-gray-400 mt-1 text-center">Delivery partner</div>
        </button>
      </div>

      <button onClick={() => onSelect('admin')}
        className="w-full text-center text-xs text-gray-400 py-2 underline underline-offset-2">
        Admin login →
      </button>
    </div>
  </div>
);

// ─── Step 2: Auth Form ─────────────────────────────────────────────────────
const AuthForm = ({ role, onBack }) => {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [riderPending, setRiderPending] = useState(false);

  const roleLabel = role === 'customer' ? 'Customer' : role === 'rider' ? 'Rider' : 'Admin';
  const roleIcon = role === 'customer' ? '🛒' : role === 'rider' ? '🛵' : '⚙️';

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please enter email and password.'); return; }
    if (mode === 'signup' && !name) { setError('Please enter your full name.'); return; }
    if (mode === 'signup' && role === 'rider' && !vehicleNumber) { setError('Please enter your vehicle number.'); return; }

    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        // Verify role matches
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        if (snap.exists() && snap.data().role !== role) {
          await signOut(auth);
          setError(`This account is registered as a ${snap.data().role}. Please select the correct role.`);
          setLoading(false);
          return;
        }
      } else {
        // Sign up
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });

        const userDoc = {
          role,
          name,
          email,
          phone: phone || '',
          createdAt: new Date().toISOString(),
          isActive: true,
        };

        if (role === 'rider') {
          Object.assign(userDoc, {
            vehicleType,
            vehicleNumber: vehicleNumber.toUpperCase(),
            isApproved: false,
          });
          // Add to pending rider applications
          const appRef = doc(db, 'store', 'riderApplications');
          const appSnap = await getDoc(appRef);
          const existing = appSnap.exists() ? JSON.parse(appSnap.data().v || '[]') : [];
          await setDoc(appRef, {
            v: JSON.stringify([...existing, {
              uid: cred.user.uid,
              name,
              email,
              phone,
              vehicleType,
              vehicleNumber: vehicleNumber.toUpperCase(),
              appliedAt: new Date().toISOString(),
              status: 'pending',
            }]),
          });
        }

        await setDoc(doc(db, 'users', cred.user.uid), userDoc);

        if (role === 'rider') {
          // Sign out and show pending screen — rider waits for admin approval
          await signOut(auth);
          setRiderPending(true);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      setError(cleanError(e.message));
    }
    setLoading(false);
  };

  // Rider submitted — pending approval
  if (riderPending) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
        <div className="text-7xl mb-5">⏳</div>
        <h2 className="font-black text-2xl mb-2" style={{ fontFamily: 'Fraunces,Georgia,serif' }}>Application Submitted!</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs leading-relaxed">
          Your rider application is under review. Our team will verify your details and approve your account within <strong>24 hours</strong>.
        </p>
        <div className="w-full max-w-xs bg-orange-50 rounded-2xl p-4 text-left space-y-2 mb-6">
          {['Identity & vehicle verification', 'Background check', 'Onboarding call (optional)'].map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center text-xs font-black">{i + 1}</div>
              <span className="text-gray-600">{s}</span>
            </div>
          ))}
        </div>
        <button onClick={onBack} className="w-full max-w-xs py-3.5 rounded-2xl font-black text-white"
          style={{ background: `linear-gradient(135deg,${BRAND.primary},${BRAND.red})` }}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{ background: 'linear-gradient(160deg,#fff8f5 0%,#fff 70%)', fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@800;900&display=swap'); .fd{font-family:'Fraunces',Georgia,serif;} input:focus{outline:none;border-color:#FF6B35;}`}</style>

      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 active:bg-gray-200">
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{roleIcon}</span>
            <span className="font-black text-lg fd">{roleLabel}</span>
          </div>
        </div>

        {/* Mode toggle — admin has no signup */}
        {role !== 'admin' && (
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
                style={mode === m ? { background: BRAND.primary, color: '#fff', boxShadow: '0 2px 8px rgba(255,107,53,.3)' } : { color: '#9ca3af' }}>
                {m === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-bold text-gray-500 ml-1">Full Name</label>
              <input type="text" placeholder="Ravi Kumar" value={name} onChange={e => setName(e.target.value)}
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium transition-colors" />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500 ml-1">Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium transition-colors" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 ml-1">Password</label>
            <div className="relative mt-1">
              <input type={showPass ? 'text' : 'password'} placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium transition-colors pr-14" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 px-2">
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Rider extra fields */}
          {role === 'rider' && mode === 'signup' && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-500 ml-1">Phone Number</label>
                <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 ml-1">Vehicle Type</label>
                <div className="flex gap-2 mt-1">
                  {[{ id: 'bike', label: '🏍️ Bike' }, { id: 'scooter', label: '🛵 Scooter' }, { id: 'bicycle', label: '🚲 Bicycle' }].map(v => (
                    <button key={v.id} type="button" onClick={() => setVehicleType(v.id)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-black border-2 transition-all"
                      style={{ borderColor: vehicleType === v.id ? BRAND.primary : '#e5e7eb', background: vehicleType === v.id ? '#fff3ee' : '#fff', color: vehicleType === v.id ? BRAND.primary : '#6b7280' }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 ml-1">Vehicle Number</label>
                <input type="text" placeholder="AP 15 XX 1234" value={vehicleNumber}
                  onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium tracking-widest transition-colors" />
              </div>
            </>
          )}

          {error && (
            <div className="px-4 py-3 rounded-2xl text-sm font-medium" style={{ background: '#fff1f0', color: BRAND.red }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[.98]"
            style={{ background: loading ? '#ccc' : `linear-gradient(135deg,${BRAND.primary},${BRAND.red})`, boxShadow: loading ? 'none' : '0 4px 15px rgba(255,107,53,.4)' }}>
            {loading ? '…' : mode === 'login' ? `Login as ${roleLabel} →` : `Create ${roleLabel} Account →`}
          </button>
        </div>

        {role === 'rider' && mode === 'signup' && (
          <p className="text-xs text-gray-400 text-center mt-4 px-4 leading-relaxed">
            Your account will be reviewed by our team before you can start delivering. Usually approved within 24 hours.
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Pending Approval Screen (for approved=false riders who try to log in) ──
export const RiderPendingScreen = ({ onSignOut }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50"
    style={{ fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
    <div className="text-7xl mb-5">🛵</div>
    <h2 className="font-black text-2xl mb-2" style={{ fontFamily: 'Fraunces,Georgia,serif' }}>Application Under Review</h2>
    <p className="text-gray-500 text-sm mb-8 max-w-xs leading-relaxed">
      Your rider account is pending admin approval. You'll be able to start delivering once approved. Usually within 24 hours.
    </p>
    <button onClick={onSignOut} className="w-full max-w-xs py-3.5 rounded-2xl font-black border-2 border-red-200 text-red-500 active:bg-red-50">
      Sign Out
    </button>
  </div>
);

// ─── No Firebase Config Screen ─────────────────────────────────────────────
export const SetupRequired = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50"
    style={{ fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
    <div className="text-6xl mb-5">🔧</div>
    <h2 className="font-black text-2xl mb-2" style={{ fontFamily: 'Fraunces,Georgia,serif' }}>Firebase Setup Required</h2>
    <p className="text-gray-500 text-sm mb-6 max-w-sm leading-relaxed">
      Add your Firebase environment variables to Vercel to enable full auth and per-user database.
    </p>
    <div className="w-full max-w-sm bg-white rounded-2xl p-5 text-left space-y-2 shadow-sm">
      {['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_APP_ID'].map(k => (
        <div key={k} className="font-mono text-xs bg-gray-100 rounded-lg px-3 py-2 text-gray-700">{k}</div>
      ))}
    </div>
    <p className="text-xs text-gray-400 mt-5">
      Add these in Vercel → Settings → Environment Variables → Redeploy
    </p>
  </div>
);

// ─── Main Export ───────────────────────────────────────────────────────────
export default function AuthScreen() {
  const [role, setRole] = useState(null); // null → show role picker

  if (!isConfigured) return <SetupRequired />;
  if (!role) return <RolePicker onSelect={setRole} />;
  return <AuthForm role={role} onBack={() => setRole(null)} />;
}
