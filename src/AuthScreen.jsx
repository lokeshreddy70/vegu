import React, { useState } from 'react';
import { auth, db, isConfigured } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const BRAND = { primary: '#FF6B35', red: '#C1272D', accent: '#4DA167', ink: '#1A1A1A' };

// Phone number → internal email (user never sees this)
const phoneToEmail = (phone) => `user_${phone.replace(/\D/g, '')}@vegu.app`;

const cleanError = (e) => {
  const code = (e && e.code) || '';
  const msg  = (e && e.message) || String(e) || '';
  const full = code + ' ' + msg;

  if (full.includes('auth/user-not-found'))                         return 'NO_ACCOUNT';
  if (full.includes('auth/invalid-credential') ||
      full.includes('auth/wrong-password'))                         return 'Wrong PIN. Try again.';
  if (full.includes('auth/email-already-in-use'))                   return 'This number is already registered. Please login.';
  if (full.includes('auth/weak-password'))                          return 'PIN must be at least 4 digits.';
  if (full.includes('auth/too-many-requests'))                      return 'Too many attempts. Try after a few minutes.';
  if (full.includes('auth/network-request-failed'))                 return 'Network error. Check your connection.';
  if (full.includes('auth/operation-not-allowed'))                  return 'Sign-in not enabled. Contact admin.';
  if (full.includes('permission-denied') ||
      full.includes('insufficient permissions'))                    return 'Something went wrong. Please try again.';

  return msg.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]+\)\.?/g, '').trim() || 'Something went wrong. Try again.';
};

// ─── Role Picker ──────────────────────────────────────────────────────────
const RolePicker = ({ onSelect }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6"
    style={{ background: 'linear-gradient(160deg,#fff8f5 0%,#fff 70%)', fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@800;900&display=swap');
      .fd{font-family:'Fraunces',Georgia,serif;}
      @keyframes su{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}} .su{animation:su .4s ease}`}</style>

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
      <p className="text-center text-sm text-gray-400 mb-6">Choose your role to continue</p>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <button onClick={() => onSelect('customer')}
          className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-gray-200 bg-white active:scale-95 transition-all hover:border-orange-300 hover:shadow-lg">
          <div className="text-5xl mb-3">🛒</div>
          <div className="font-black text-base" style={{ color: BRAND.ink }}>Customer</div>
          <div className="text-xs text-gray-400 mt-1 text-center">Browse &amp; order groceries</div>
        </button>
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

// ─── PIN dots display ─────────────────────────────────────────────────────
const PinDots = ({ value, max = 4 }) => (
  <div className="flex gap-3 justify-center mt-3 mb-1">
    {Array.from({ length: max }).map((_, i) => (
      <div key={i} className="w-4 h-4 rounded-full border-2 transition-all"
        style={{ borderColor: BRAND.primary, background: i < value.length ? BRAND.primary : 'transparent' }} />
    ))}
  </div>
);

// ─── Number pad ───────────────────────────────────────────────────────────
const NumPad = ({ onPress }) => {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div className="grid grid-cols-3 gap-2 mt-4">
      {keys.map((k, i) => (
        <button key={i} onClick={() => k && onPress(k)}
          disabled={!k}
          className="py-4 rounded-2xl text-xl font-black transition-all active:scale-95"
          style={{ background: k === '⌫' ? '#fee2e2' : k ? '#f9fafb' : 'transparent',
                   color: k === '⌫' ? BRAND.red : BRAND.ink,
                   opacity: k ? 1 : 0 }}>
          {k}
        </button>
      ))}
    </div>
  );
};

// ─── Phone + PIN Auth (Customer & Rider) ─────────────────────────────────
const PhoneAuthForm = ({ role, onBack }) => {
  const [step, setStep]           = useState('phone');   // phone | pin_login | pin_signup | profile | riderPending
  const [phone, setPhone]         = useState('');
  const [pin, setPin]             = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [name, setName]           = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [vehicleNo, setVehicleNo] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const roleLabel = role === 'customer' ? 'Customer' : 'Rider';
  const roleIcon  = role === 'customer' ? '🛒' : '🛵';

  // ── Phone step ──
  const handlePhoneNext = () => {
    const d = phone.replace(/\D/g, '');
    if (d.length !== 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    setError(''); setPin(''); setPinConfirm('');
    setStep('pin_login');
  };

  // ── Login step: try sign-in; if no account → switch to signup ──
  const handlePinLogin = async () => {
    if (pin.length < 4) { setError('Enter your 4-digit PIN.'); return; }
    setLoading(true); setError('');
    try {
      const email = phoneToEmail(phone);
      const cred = await signInWithEmailAndPassword(auth, email, pin);
      // Check role matches
      try {
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        if (snap.exists() && snap.data().role && snap.data().role !== role) {
          await signOut(auth);
          setError(`This number is a ${snap.data().role} account. Select the correct role.`);
        }
      } catch {}
    } catch (e) {
      const msg = cleanError(e);
      if (msg === 'NO_ACCOUNT') {
        // First time user — switch to signup
        setPin(''); setError('');
        setStep('pin_signup');
      } else {
        setError(msg);
      }
    }
    setLoading(false);
  };

  // ── Signup PIN step → profile ──
  const handlePinSignup = () => {
    if (pin.length < 4) { setError('Create a 4-digit PIN.'); return; }
    if (pin !== pinConfirm) { setError('PINs do not match. Try again.'); setPinConfirm(''); return; }
    setError(''); setStep('profile');
  };

  // ── Profile + create account ──
  const handleCreateAccount = async () => {
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (role === 'rider' && !vehicleNo.trim()) { setError('Please enter your vehicle number.'); return; }
    setLoading(true); setError('');
    try {
      const email = phoneToEmail(phone);
      const cred = await createUserWithEmailAndPassword(auth, email, pin);
      await updateProfile(cred.user, { displayName: name.trim() });

      const userDoc = {
        role, name: name.trim(),
        phone: '+91' + phone.replace(/\D/g, ''),
        createdAt: new Date().toISOString(), isActive: true,
      };

      if (role === 'rider') {
        Object.assign(userDoc, { vehicleType, vehicleNumber: vehicleNo.toUpperCase(), isApproved: false });
        try {
          await setDoc(doc(db, 'riderApplications', cred.user.uid), {
            uid: cred.user.uid, name: name.trim(),
            phone: '+91' + phone.replace(/\D/g, ''),
            vehicleType, vehicleNumber: vehicleNo.toUpperCase(),
            appliedAt: new Date().toISOString(),
            status: 'pending', isApproved: false, isRejected: false,
          });
        } catch {}
      }

      try { await setDoc(doc(db, 'users', cred.user.uid), userDoc); } catch {}

      if (role === 'rider') {
        await signOut(auth);
        setStep('riderPending');
        setLoading(false);
        return;
      }
      // Customer: auth state listener in App.jsx takes over
    } catch (e) {
      setError(cleanError(e));
    }
    setLoading(false);
  };

  const pinPress = (setPinFn, current) => (key) => {
    if (key === '⌫') { setPinFn(current.slice(0, -1)); setError(''); }
    else if (current.length < 4) { setPinFn(current + key); setError(''); }
  };

  // ── Rider pending ──
  if (step === 'riderPending') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
      <div className="text-7xl mb-5">⏳</div>
      <h2 className="font-black text-2xl mb-2" style={{ fontFamily: 'Fraunces,Georgia,serif' }}>Application Submitted!</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-xs leading-relaxed">
        Under review. Admin will approve within <strong>24 hours</strong>.
      </p>
      <button onClick={onBack} className="w-full max-w-xs py-3.5 rounded-2xl font-black text-white"
        style={{ background: `linear-gradient(135deg,${BRAND.primary},${BRAND.red})` }}>
        Back to Home
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col p-5 pt-10"
      style={{ background: 'linear-gradient(160deg,#fff8f5 0%,#fff 60%)', fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@800;900&display=swap'); .fd{font-family:'Fraunces',Georgia,serif;} input:focus{outline:none;border-color:#FF6B35;}`}</style>

      <div className="w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => {
              if (step === 'phone') { onBack(); return; }
              if (step === 'pin_login' || step === 'pin_signup') { setStep('phone'); setPin(''); setError(''); return; }
              if (step === 'profile') { setStep('pin_signup'); setError(''); return; }
              onBack();
            }}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg active:bg-gray-200">
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{roleIcon}</span>
            <span className="font-black text-lg fd">{roleLabel}</span>
          </div>
        </div>

        {/* ── STEP: phone ── */}
        {step === 'phone' && (
          <>
            <div className="text-center mb-8">
              <p className="font-black text-2xl fd mb-1" style={{ color: BRAND.ink }}>Enter Mobile Number</p>
              <p className="text-sm text-gray-400">We'll identify you by your number</p>
            </div>
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-2 border-2 border-gray-200 rounded-2xl px-4 py-3 focus-within:border-orange-400 transition-colors">
                <span className="text-sm font-bold text-gray-500">🇮🇳 +91</span>
                <div className="w-px h-5 bg-gray-200" />
                <input
                  type="tel" inputMode="numeric" placeholder="9876543210"
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handlePhoneNext()}
                  className="flex-1 text-xl font-black tracking-widest bg-transparent"
                  style={{ outline: 'none', border: 'none' }}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm mt-3 font-medium" style={{ color: BRAND.red }}>{error}</p>}
              <button onClick={handlePhoneNext} disabled={phone.replace(/\D/g,'').length !== 10}
                className="w-full mt-4 py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[.98]"
                style={{ background: phone.replace(/\D/g,'').length === 10 ? `linear-gradient(135deg,${BRAND.primary},${BRAND.red})` : '#e5e7eb', boxShadow: phone.replace(/\D/g,'').length === 10 ? '0 4px 15px rgba(255,107,53,.35)' : 'none' }}>
                Continue →
              </button>
            </div>
          </>
        )}

        {/* ── STEP: pin_login ── */}
        {step === 'pin_login' && (
          <>
            <div className="text-center mb-6">
              <p className="font-black text-2xl fd mb-1" style={{ color: BRAND.ink }}>Enter your PIN</p>
              <p className="text-sm text-gray-400">+91 {phone}</p>
            </div>
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <PinDots value={pin} />
              {error && <p className="text-sm mt-3 font-medium text-center" style={{ color: BRAND.red }}>{error}</p>}
              <NumPad onPress={pinPress(setPin, pin)} />
              <button onClick={handlePinLogin} disabled={loading || pin.length < 4}
                className="w-full mt-4 py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[.98]"
                style={{ background: (!loading && pin.length === 4) ? `linear-gradient(135deg,${BRAND.primary},${BRAND.red})` : '#e5e7eb', boxShadow: (!loading && pin.length === 4) ? '0 4px 15px rgba(255,107,53,.35)' : 'none' }}>
                {loading ? 'Logging in…' : 'Login →'}
              </button>
              <button onClick={() => { setPin(''); setError(''); setStep('pin_signup'); }}
                className="w-full mt-3 text-center text-sm py-1 font-bold" style={{ color: BRAND.primary }}>
                New here? Create account
              </button>
            </div>
          </>
        )}

        {/* ── STEP: pin_signup ── */}
        {step === 'pin_signup' && (
          <>
            <div className="text-center mb-6">
              <p className="font-black text-2xl fd mb-1" style={{ color: BRAND.ink }}>
                {pinConfirm.length === 0 && pin.length < 4 ? 'Create a PIN' : pin.length === 4 && pinConfirm.length < 4 ? 'Confirm PIN' : 'Create a PIN'}
              </p>
              <p className="text-sm text-gray-400">You'll use this to login next time</p>
            </div>
            <div className="bg-white rounded-3xl shadow-lg p-6">
              {pin.length < 4 ? (
                <>
                  <p className="text-center text-xs font-bold text-gray-400 mb-1">Enter 4-digit PIN</p>
                  <PinDots value={pin} />
                  <NumPad onPress={pinPress(setPin, pin)} />
                </>
              ) : (
                <>
                  <p className="text-center text-xs font-bold text-gray-400 mb-1">Confirm PIN</p>
                  <PinDots value={pinConfirm} />
                  <NumPad onPress={pinPress(setPinConfirm, pinConfirm)} />
                </>
              )}
              {error && <p className="text-sm mt-3 font-medium text-center" style={{ color: BRAND.red }}>{error}</p>}
              {pin.length === 4 && pinConfirm.length === 4 && (
                <button onClick={handlePinSignup}
                  className="w-full mt-4 py-4 rounded-2xl text-white font-black text-base active:scale-[.98]"
                  style={{ background: `linear-gradient(135deg,${BRAND.primary},${BRAND.red})`, boxShadow: '0 4px 15px rgba(255,107,53,.35)' }}>
                  Next →
                </button>
              )}
              <button onClick={() => { setStep('pin_login'); setPin(''); setPinConfirm(''); setError(''); }}
                className="w-full mt-3 text-center text-sm py-1 font-bold" style={{ color: BRAND.primary }}>
                Already have account? Login
              </button>
            </div>
          </>
        )}

        {/* ── STEP: profile (new user details) ── */}
        {step === 'profile' && (
          <div className="bg-white rounded-3xl shadow-lg p-6 space-y-3">
            <div className="text-center pb-2">
              <div className="text-4xl mb-2">👤</div>
              <p className="font-black text-lg fd" style={{ color: BRAND.ink }}>Almost done!</p>
              <p className="text-xs text-gray-400 mt-1">Tell us a bit about yourself</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 ml-1">Full Name</label>
              <input type="text" placeholder="Ravi Kumar" value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium transition-colors"
                autoFocus />
            </div>

            {role === 'rider' && (
              <>
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">Vehicle Type</label>
                  <div className="flex gap-2 mt-1">
                    {[{ id: 'bike', label: '🏍️ Bike' }, { id: 'scooter', label: '🛵 Scooter' }, { id: 'bicycle', label: '🚲 Cycle' }].map(v => (
                      <button key={v.id} onClick={() => setVehicleType(v.id)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-black border-2 transition-all"
                        style={{ borderColor: vehicleType === v.id ? BRAND.primary : '#e5e7eb', background: vehicleType === v.id ? '#fff3ee' : '#fff', color: vehicleType === v.id ? BRAND.primary : '#6b7280' }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">Vehicle Number</label>
                  <input type="text" placeholder="AP 15 XX 1234" value={vehicleNo}
                    onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                    className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium tracking-widest transition-colors" />
                </div>
              </>
            )}

            {error && <div className="px-4 py-3 rounded-2xl text-sm font-medium" style={{ background: '#fff1f0', color: BRAND.red }}>{error}</div>}

            <button onClick={handleCreateAccount} disabled={loading}
              className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[.98]"
              style={{ background: loading ? '#d1d5db' : `linear-gradient(135deg,${BRAND.primary},${BRAND.red})`, boxShadow: loading ? 'none' : '0 4px 15px rgba(255,107,53,.35)' }}>
              {loading ? 'Creating account…' : `Start as ${roleLabel} →`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Admin Email Login ────────────────────────────────────────────────────
const AdminAuthForm = ({ onBack }) => {
  const [email, setEmail]       = useState('admin@vegu.in');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async () => {
    if (!email || !password) { setError('Enter email and password.'); return; }
    setError(''); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      const msg = cleanError(e);
      setError(msg === 'NO_ACCOUNT' ? 'Admin account not found.' : msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{ background: 'linear-gradient(160deg,#f5f5f5 0%,#fff 70%)', fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
      <style>{`input:focus{outline:none;border-color:#1A1A1A;}`}</style>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg active:bg-gray-200">←</button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <span className="font-black text-lg" style={{ fontFamily: 'Fraunces,Georgia,serif' }}>Admin Login</span>
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500 ml-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium transition-colors" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 ml-1">Password</label>
            <div className="relative mt-1">
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium transition-colors pr-14"
                autoFocus />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 px-2">
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {error && <div className="px-4 py-3 rounded-2xl text-sm font-medium" style={{ background: '#fff1f0', color: BRAND.red }}>{error}</div>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[.98]"
            style={{ background: loading ? '#d1d5db' : `linear-gradient(135deg,${BRAND.ink},#333)` }}>
            {loading ? '…' : 'Login →'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Pending Rider Screen ─────────────────────────────────────────────────
export const RiderPendingScreen = ({ onSignOut }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50"
    style={{ fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
    <div className="text-7xl mb-5">🛵</div>
    <h2 className="font-black text-2xl mb-2" style={{ fontFamily: 'Fraunces,Georgia,serif' }}>Under Review</h2>
    <p className="text-gray-500 text-sm mb-8 max-w-xs leading-relaxed">
      Your rider account is pending admin approval. Usually approved within 24 hours.
    </p>
    <button onClick={onSignOut} className="w-full max-w-xs py-3.5 rounded-2xl font-black border-2 border-red-200 text-red-500">
      Sign Out
    </button>
  </div>
);

// ─── No Firebase Config Screen ────────────────────────────────────────────
export const SetupRequired = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50"
    style={{ fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
    <div className="text-6xl mb-4">🔧</div>
    <h2 className="font-black text-2xl mb-2">Firebase Setup Required</h2>
    <p className="text-gray-500 text-sm max-w-xs">Add Firebase environment variables to Vercel and redeploy.</p>
  </div>
);

// ─── Main Export ──────────────────────────────────────────────────────────
export default function AuthScreen() {
  const [role, setRole] = useState(null);
  if (!isConfigured) return <SetupRequired />;
  if (!role) return <RolePicker onSelect={setRole} />;
  if (role === 'admin') return <AdminAuthForm onBack={() => setRole(null)} />;
  return <PhoneAuthForm role={role} onBack={() => setRole(null)} />;
}
