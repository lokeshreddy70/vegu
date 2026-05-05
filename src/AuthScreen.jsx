import React, { useState, useRef, useEffect } from 'react';
import { auth, db, isConfigured } from './firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const BRAND = { primary: '#FF6B35', red: '#C1272D', accent: '#4DA167', ink: '#1A1A1A' };

const cleanError = (e) => {
  const code = (e && e.code) || '';
  const msg  = (e && e.message) || String(e) || '';
  const full = code + ' ' + msg;

  if (full.includes('auth/invalid-phone-number'))       return 'Invalid phone number. Enter a 10-digit mobile number.';
  if (full.includes('auth/missing-phone-number'))       return 'Please enter your mobile number.';
  if (full.includes('auth/quota-exceeded'))             return 'SMS limit reached. Try again after some time.';
  if (full.includes('auth/code-expired'))               return 'OTP expired. Please request a new one.';
  if (full.includes('auth/invalid-verification-code') ||
      full.includes('auth/invalid-verification-id'))   return 'Wrong OTP. Please check and try again.';
  if (full.includes('auth/too-many-requests'))          return 'Too many attempts. Please try after a few minutes.';
  if (full.includes('auth/network-request-failed'))     return 'Network error. Check your connection and try again.';
  if (full.includes('auth/operation-not-allowed'))      return 'Phone sign-in is not enabled. Contact admin.';
  if (full.includes('auth/captcha-check-failed'))       return 'Security check failed. Please refresh and try again.';
  if (full.includes('auth/invalid-credential') ||
      full.includes('auth/wrong-password') ||
      full.includes('auth/user-not-found'))             return 'Wrong email or password.';
  if (full.includes('auth/email-already-in-use'))       return 'Account already exists — please login.';
  if (full.includes('permission-denied') ||
      full.includes('insufficient permissions'))        return 'Something went wrong. Please try again.';

  return msg.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]+\)\.?/g, '').trim() || 'Something went wrong. Try again.';
};

// ─── Role Picker ──────────────────────────────────────────────────────────
const RolePicker = ({ onSelect }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6"
    style={{ background: 'linear-gradient(160deg,#fff8f5 0%,#fff 70%)', fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@800;900&display=swap'); .fd{font-family:'Fraunces',Georgia,serif;} @keyframes su{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}} .su{animation:su .4s ease}`}</style>

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

// ─── Phone Auth (Customer & Rider) ────────────────────────────────────────
const PhoneAuthForm = ({ role, onBack }) => {
  const [step, setStep]               = useState('phone'); // phone → otp → profile → riderPending
  const [phoneNum, setPhoneNum]       = useState('');
  const [otp, setOtp]                 = useState('');
  const [name, setName]               = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [vehicleNo, setVehicleNo]     = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const recaptchaRef = useRef(null);
  const verifierRef  = useRef(null);

  const roleLabel = role === 'customer' ? 'Customer' : 'Rider';
  const roleIcon  = role === 'customer' ? '🛒' : '🛵';

  useEffect(() => () => {
    try { verifierRef.current?.clear(); } catch {}
  }, []);

  const formatPhone = (num) => {
    const d = num.replace(/\D/g, '');
    if (d.length === 10) return '+91' + d;
    if (d.length === 12 && d.startsWith('91')) return '+' + d;
    return '+91' + d;
  };

  const sendOtp = async () => {
    const digits = phoneNum.replace(/\D/g, '');
    if (digits.length < 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    setLoading(true); setError('');
    try {
      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, { size: 'invisible' });
      }
      const result = await signInWithPhoneNumber(auth, formatPhone(digits), verifierRef.current);
      setConfirmation(result);
      setStep('otp');
    } catch (e) {
      setError(cleanError(e));
      try { verifierRef.current?.clear(); } catch {}
      verifierRef.current = null;
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
    setLoading(true); setError('');
    try {
      const cred = await confirmation.confirm(otp);
      const uid = cred.user.uid;
      // Detect new vs existing user via Firestore
      let isNew = true;
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          isNew = false;
          const data = snap.data();
          if (data.role && data.role !== role) {
            await signOut(auth);
            setError(`This number is a ${data.role} account. Please select the correct role.`);
            setLoading(false);
            return;
          }
        }
      } catch {}
      if (isNew) {
        setStep('profile');
      }
      // If existing + role ok → auth state listener in App.jsx takes over
    } catch (e) {
      setError(cleanError(e));
    }
    setLoading(false);
  };

  const resendOtp = async () => {
    setOtp(''); setError('');
    try { verifierRef.current?.clear(); } catch {}
    verifierRef.current = null;
    setStep('phone');
  };

  const saveProfile = async () => {
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (role === 'rider' && !vehicleNo.trim()) { setError('Please enter your vehicle number.'); return; }
    setLoading(true); setError('');
    const user = auth.currentUser;
    try {
      await updateProfile(user, { displayName: name });
      const userDoc = {
        role, name: name.trim(), phone: user.phoneNumber,
        createdAt: new Date().toISOString(), isActive: true,
      };
      if (role === 'rider') {
        Object.assign(userDoc, { vehicleType, vehicleNumber: vehicleNo.toUpperCase(), isApproved: false });
        try {
          await setDoc(doc(db, 'riderApplications', user.uid), {
            uid: user.uid, name: name.trim(), phone: user.phoneNumber, vehicleType,
            vehicleNumber: vehicleNo.toUpperCase(), appliedAt: new Date().toISOString(),
            status: 'pending', isApproved: false, isRejected: false,
          });
        } catch {}
      }
      try { await setDoc(doc(db, 'users', user.uid), userDoc); } catch {}
      if (role === 'rider') {
        await signOut(auth);
        setStep('riderPending');
        setLoading(false);
        return;
      }
      // Customer: auth state → App.jsx takes over
    } catch (e) {
      setError(cleanError(e));
    }
    setLoading(false);
  };

  // ── Rider pending ──
  if (step === 'riderPending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
        <div className="text-7xl mb-5">⏳</div>
        <h2 className="font-black text-2xl mb-2" style={{ fontFamily: 'Fraunces,Georgia,serif' }}>Application Submitted!</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs leading-relaxed">
          Your rider application is under review. Admin will verify and approve within <strong>24 hours</strong>.
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

      {/* invisible recaptcha container */}
      <div ref={recaptchaRef} />

      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={step === 'phone' ? onBack : () => { setStep('phone'); setOtp(''); setError(''); }}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 active:bg-gray-200 text-lg">
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{roleIcon}</span>
            <span className="font-black text-lg fd">{roleLabel} Login</span>
          </div>
        </div>

        {/* ── STEP: phone ── */}
        {step === 'phone' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-4">
            <div className="text-center pb-2">
              <div className="text-4xl mb-2">📱</div>
              <p className="font-black text-lg fd" style={{ color: BRAND.ink }}>Enter your mobile number</p>
              <p className="text-xs text-gray-400 mt-1">We'll send an OTP to verify</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 ml-1">Mobile Number</label>
              <div className="flex mt-1">
                <div className="flex items-center px-3 border-2 border-r-0 border-gray-200 rounded-l-2xl bg-gray-50 text-sm font-bold text-gray-600">
                  🇮🇳 +91
                </div>
                <input
                  type="tel" inputMode="numeric" placeholder="9876543210"
                  value={phoneNum} onChange={e => setPhoneNum(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-r-2xl text-sm font-medium transition-colors text-lg tracking-widest"
                  style={{ letterSpacing: '0.1em' }}
                />
              </div>
            </div>
            {error && <div className="px-4 py-3 rounded-2xl text-sm font-medium" style={{ background: '#fff1f0', color: BRAND.red }}>{error}</div>}
            <button onClick={sendOtp} disabled={loading || phoneNum.replace(/\D/g, '').length < 10}
              className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[.98]"
              style={{ background: (loading || phoneNum.replace(/\D/g, '').length < 10) ? '#d1d5db' : `linear-gradient(135deg,${BRAND.primary},${BRAND.red})`, boxShadow: loading ? 'none' : '0 4px 15px rgba(255,107,53,.35)' }}>
              {loading ? 'Sending OTP…' : 'Send OTP →'}
            </button>
          </div>
        )}

        {/* ── STEP: otp ── */}
        {step === 'otp' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-4">
            <div className="text-center pb-2">
              <div className="text-4xl mb-2">🔐</div>
              <p className="font-black text-lg fd" style={{ color: BRAND.ink }}>Enter OTP</p>
              <p className="text-xs text-gray-400 mt-1">
                Sent to +91 {phoneNum.replace(/\D/g, '')}
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 ml-1">6-digit OTP</label>
              <input
                type="tel" inputMode="numeric" placeholder="• • • • • •" maxLength={6}
                value={otp} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setOtp(v); if (v.length === 6) setTimeout(() => document.getElementById('verify-btn')?.click(), 50); }}
                className="w-full mt-1 px-4 py-4 border-2 border-gray-200 rounded-2xl text-center text-2xl font-black tracking-[0.5em] transition-colors"
                autoFocus
              />
            </div>
            {error && <div className="px-4 py-3 rounded-2xl text-sm font-medium" style={{ background: '#fff1f0', color: BRAND.red }}>{error}</div>}
            <button id="verify-btn" onClick={verifyOtp} disabled={loading || otp.length !== 6}
              className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[.98]"
              style={{ background: (loading || otp.length !== 6) ? '#d1d5db' : `linear-gradient(135deg,${BRAND.primary},${BRAND.red})`, boxShadow: loading ? 'none' : '0 4px 15px rgba(255,107,53,.35)' }}>
              {loading ? 'Verifying…' : 'Verify OTP →'}
            </button>
            <button onClick={resendOtp} className="w-full text-center text-sm font-bold py-1" style={{ color: BRAND.primary }}>
              Didn't receive? Resend OTP
            </button>
          </div>
        )}

        {/* ── STEP: profile (new user) ── */}
        {step === 'profile' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-3">
            <div className="text-center pb-2">
              <div className="text-4xl mb-2">👤</div>
              <p className="font-black text-lg fd" style={{ color: BRAND.ink }}>Complete your profile</p>
              <p className="text-xs text-gray-400 mt-1">Just a few details to get started</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 ml-1">Full Name</label>
              <input type="text" placeholder="Ravi Kumar" value={name} onChange={e => setName(e.target.value)}
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium transition-colors" />
            </div>

            {role === 'rider' && (
              <>
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
                  <input type="text" placeholder="AP 15 XX 1234" value={vehicleNo}
                    onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                    className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium tracking-widest transition-colors" />
                </div>
              </>
            )}

            {error && <div className="px-4 py-3 rounded-2xl text-sm font-medium" style={{ background: '#fff1f0', color: BRAND.red }}>{error}</div>}
            <button onClick={saveProfile} disabled={loading}
              className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[.98]"
              style={{ background: loading ? '#d1d5db' : `linear-gradient(135deg,${BRAND.primary},${BRAND.red})`, boxShadow: loading ? 'none' : '0 4px 15px rgba(255,107,53,.35)' }}>
              {loading ? 'Saving…' : `Start as ${roleLabel} →`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Admin Email Login ────────────────────────────────────────────────────
const AdminAuthForm = ({ onBack }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setError(''); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError(cleanError(e));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{ background: 'linear-gradient(160deg,#fff8f5 0%,#fff 70%)', fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@800;900&display=swap'); .fd{font-family:'Fraunces',Georgia,serif;} input:focus{outline:none;border-color:#FF6B35;}`}</style>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 active:bg-gray-200 text-lg">←</button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <span className="font-black text-lg fd">Admin Login</span>
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500 ml-1">Email</label>
            <input type="email" placeholder="admin@vegu.in" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium transition-colors" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 ml-1">Password</label>
            <div className="relative mt-1">
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium transition-colors pr-14" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 px-2">
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {error && <div className="px-4 py-3 rounded-2xl text-sm font-medium" style={{ background: '#fff1f0', color: BRAND.red }}>{error}</div>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[.98]"
            style={{ background: loading ? '#d1d5db' : `linear-gradient(135deg,${BRAND.ink},#2a2a2a)` }}>
            {loading ? '…' : 'Login as Admin →'}
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
    <h2 className="font-black text-2xl mb-2" style={{ fontFamily: 'Fraunces,Georgia,serif' }}>Application Under Review</h2>
    <p className="text-gray-500 text-sm mb-8 max-w-xs leading-relaxed">
      Your rider account is pending admin approval. You'll be notified once approved. Usually within 24 hours.
    </p>
    <button onClick={onSignOut} className="w-full max-w-xs py-3.5 rounded-2xl font-black border-2 border-red-200 text-red-500 active:bg-red-50">
      Sign Out
    </button>
  </div>
);

// ─── No Firebase Config Screen ────────────────────────────────────────────
export const SetupRequired = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50"
    style={{ fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
    <div className="text-6xl mb-5">🔧</div>
    <h2 className="font-black text-2xl mb-2" style={{ fontFamily: 'Fraunces,Georgia,serif' }}>Firebase Setup Required</h2>
    <p className="text-gray-500 text-sm mb-6 max-w-sm leading-relaxed">
      Add your Firebase environment variables to Vercel to enable auth and database.
    </p>
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
