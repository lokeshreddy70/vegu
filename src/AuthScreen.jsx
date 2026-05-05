import React, { useState, useRef, useEffect } from 'react';
import { auth, db, isConfigured } from './firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const BRAND = { primary: '#FF6B35', red: '#C1272D', accent: '#4DA167', ink: '#1A1A1A' };

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@800;900&display=swap');
  .fd { font-family: 'Fraunces', Georgia, serif; }
  @keyframes su { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
  .su { animation: su 0.45s ease both; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
  .shake { animation: shake 0.4s ease; }
  .otp-box:focus { outline: none; border-color: #FF6B35 !important; background: #fff3ee !important; transform: scale(1.05); }
`;

const cleanError = (e) => {
  const code = (e && e.code) || '';
  const msg  = (e && e.message) || String(e) || '';
  const full = code + ' ' + msg;
  if (full.includes('auth/invalid-phone-number'))        return 'Enter a valid 10-digit mobile number.';
  if (full.includes('auth/too-many-requests'))           return 'Too many attempts. Please wait a few minutes.';
  if (full.includes('auth/quota-exceeded'))              return 'Daily SMS limit reached. Try again tomorrow.';
  if (full.includes('auth/invalid-verification-code') ||
      full.includes('auth/invalid-code'))                return 'Wrong OTP. Please try again.';
  if (full.includes('auth/code-expired') ||
      full.includes('auth/session-expired'))             return 'OTP expired. Please request a new one.';
  if (full.includes('auth/missing-phone-number'))        return 'Enter your phone number first.';
  if (full.includes('auth/captcha-check-failed') ||
      full.includes('auth/recaptcha') ||
      full.includes('auth/unauthorized-domain'))         return 'Verification failed. Please try again.';
  if (full.includes('auth/network-request-failed'))      return 'Network error. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
};

// ─── 6-Box OTP Input ─────────────────────────────────────────────────────────
const OTPInput = ({ value, onChange, disabled }) => {
  const inputs = useRef([]);
  const digits = (value || '').split('');

  useEffect(() => {
    if (!disabled) inputs.current[value.length < 6 ? value.length : 5]?.focus();
  }, []);

  const handleChange = (i, char) => {
    if (!/^\d?$/.test(char)) return;
    const next = [...Array(6)].map((_, idx) => (idx < digits.length ? digits[idx] : ''));
    next[i] = char;
    onChange(next.join(''));
    if (char && i < 5) setTimeout(() => inputs.current[i + 1]?.focus(), 10);
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits]; next[i] = ''; onChange(next.join(''));
      } else if (i > 0) {
        inputs.current[i - 1]?.focus();
        const next = [...digits]; next[i - 1] = ''; onChange(next.join(''));
      }
    }
    if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(text.padEnd(6, '').slice(0, 6).trimEnd());
    const idx = Math.min(text.length, 5);
    setTimeout(() => inputs.current[idx]?.focus(), 10);
    e.preventDefault();
  };

  return (
    <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
      {[0,1,2,3,4,5].map(i => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="tel" inputMode="numeric" maxLength={1}
          value={digits[i] || ''}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value.slice(-1))}
          onKeyDown={e => handleKey(i, e)}
          onFocus={e => e.target.select()}
          className="otp-box w-11 h-14 text-center text-2xl font-black border-2 rounded-xl transition-all"
          style={{
            borderColor: digits[i] ? BRAND.primary : '#e5e7eb',
            background: digits[i] ? '#fff3ee' : '#f9fafb',
            color: BRAND.ink,
          }}
        />
      ))}
    </div>
  );
};

// ─── Role Picker ──────────────────────────────────────────────────────────────
const RolePicker = ({ onSelect }) => (
  <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg,#fff8f5 0%,#fff 60%)', fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
    <style>{CSS}</style>

    {/* Header */}
    <div className="px-6 pt-12 pb-8 text-center su">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl"
        style={{ background: `linear-gradient(135deg,${BRAND.primary},${BRAND.red})` }}>
        <span style={{ fontSize: 40 }}>⚡</span>
      </div>
      <h1 className="fd font-black text-5xl" style={{ color: BRAND.ink }}>Vegu</h1>
      <p className="text-sm text-gray-500 mt-2 font-medium">Nellore ki 10 nimishallo! 🌶️</p>
    </div>

    {/* Role cards */}
    <div className="flex-1 px-6">
      <p className="fd font-black text-xl text-center mb-1" style={{ color: BRAND.ink }}>Who are you?</p>
      <p className="text-center text-sm text-gray-400 mb-6">Select your role to continue</p>

      <div className="grid grid-cols-2 gap-3 su">
        {[
          { id: 'customer', emoji: '🛒', label: 'Customer', sub: 'Order groceries' },
          { id: 'rider',    emoji: '🛵', label: 'Rider',    sub: 'Deliver orders' },
        ].map(r => (
          <button key={r.id} onClick={() => onSelect(r.id)}
            className="flex flex-col items-center justify-center py-8 rounded-3xl border-2 border-gray-100 bg-white active:scale-95 transition-all shadow-sm hover:border-orange-200 hover:shadow-lg">
            <span className="text-5xl mb-3">{r.emoji}</span>
            <span className="font-black text-base" style={{ color: BRAND.ink }}>{r.label}</span>
            <span className="text-xs text-gray-400 mt-1">{r.sub}</span>
          </button>
        ))}
      </div>

      <button onClick={() => onSelect('admin')} className="w-full text-center text-xs text-gray-400 py-5 font-medium underline underline-offset-4">
        Admin login →
      </button>
    </div>

    <div className="text-center pb-8 text-[11px] text-gray-300 font-medium">ANDHRA'S OWN QUICK COMMERCE</div>
  </div>
);

// ─── Phone + OTP Auth (Customer & Rider) ─────────────────────────────────────
const PhoneAuthForm = ({ role, onBack }) => {
  const [step, setStep]             = useState('phone');  // phone | otp | profile | riderPending
  const [phone, setPhone]           = useState('');
  const [otp, setOtp]               = useState('');
  const [name, setName]             = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [vehicleNo, setVehicleNo]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [resendTimer, setResendTimer]   = useState(0);
  const [shakeOtp, setShakeOtp]    = useState(false);
  const verifierRef = useRef(null);

  const roleLabel = role === 'customer' ? 'Customer' : 'Rider';
  const roleEmoji = role === 'customer' ? '🛒' : '🛵';

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Auto-verify when all 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && step === 'otp' && !loading) verifyOTP();
  }, [otp]);

  const clearVerifier = () => {
    if (verifierRef.current) {
      try { verifierRef.current.clear(); } catch {}
      verifierRef.current = null;
    }
    // Also clean up the DOM element
    const el = document.getElementById('recaptcha-container');
    if (el) el.innerHTML = '';
  };

  const sendOTP = async (isResend = false) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    setLoading(true); setError(''); if (!isResend) setOtp('');

    try {
      clearVerifier();
      verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => clearVerifier(),
      });

      const result = await signInWithPhoneNumber(auth, '+91' + digits, verifierRef.current);
      setConfirmation(result);
      setStep('otp');
      setResendTimer(30);
    } catch (e) {
      clearVerifier();
      setError(cleanError(e));
    }
    setLoading(false);
  };

  const verifyOTP = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit OTP sent to your number.'); return; }
    if (!confirmation) { setError('Please request OTP first.'); return; }
    setLoading(true); setError('');

    try {
      const cred = await confirmation.confirm(otp);
      // Check if user has a profile already
      try {
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        if (snap.exists() && snap.data().name) {
          // Existing user — App.jsx takes over via onAuthStateChanged
          return;
        }
      } catch {}
      // New user — collect profile info
      setStep('profile');
    } catch (e) {
      const msg = cleanError(e);
      setError(msg);
      setOtp('');
      setShakeOtp(true);
      setTimeout(() => setShakeOtp(false), 500);
    }
    setLoading(false);
  };

  const createProfile = async () => {
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (role === 'rider' && !vehicleNo.trim()) { setError('Enter your vehicle number.'); return; }
    setLoading(true); setError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Session expired. Please sign in again.');

      const userDoc = {
        role, name: name.trim(),
        phone: '+91' + phone.replace(/\D/g, ''),
        createdAt: new Date().toISOString(), isActive: true,
      };

      if (role === 'rider') {
        Object.assign(userDoc, { vehicleType, vehicleNumber: vehicleNo.toUpperCase(), isApproved: false });
        try {
          await setDoc(doc(db, 'riderApplications', currentUser.uid), {
            uid: currentUser.uid, name: name.trim(),
            phone: '+91' + phone.replace(/\D/g, ''),
            vehicleType, vehicleNumber: vehicleNo.toUpperCase(),
            appliedAt: new Date().toISOString(),
            status: 'pending', isApproved: false, isRejected: false,
          });
        } catch {}
        try { await setDoc(doc(db, 'users', currentUser.uid), userDoc); } catch {}
        await signOut(auth);
        setStep('riderPending');
        setLoading(false);
        return;
      }

      try { await setDoc(doc(db, 'users', currentUser.uid), userDoc); } catch {}
      // App.jsx onAuthStateChanged fires and handles routing
    } catch (e) {
      setError(cleanError(e));
    }
    setLoading(false);
  };

  const goBack = () => {
    if (step === 'phone') { onBack(); return; }
    if (step === 'otp') { setStep('phone'); setOtp(''); setError(''); clearVerifier(); return; }
    if (step === 'profile') { setStep('otp'); setOtp(''); setError(''); return; }
    onBack();
  };

  // ── Rider pending ──
  if (step === 'riderPending') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif', background: '#fff' }}>
      <style>{CSS}</style>
      <div className="text-7xl mb-5 su">⏳</div>
      <h2 className="fd font-black text-3xl mb-2 su" style={{ color: BRAND.ink }}>Application Submitted!</h2>
      <p className="text-gray-500 text-sm mb-8 max-w-xs leading-relaxed su">
        Your rider application is under review. Admin will approve within <strong>24 hours</strong>.
        You'll be able to log in once approved.
      </p>
      <button onClick={onBack} className="w-full max-w-xs py-4 rounded-2xl font-black text-white text-base su"
        style={{ background: `linear-gradient(135deg,${BRAND.primary},${BRAND.red})` }}>
        Back to Home
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fff', fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
      <style>{CSS}</style>

      {/* Invisible reCAPTCHA anchor */}
      <div id="recaptcha-container" style={{ position: 'absolute', bottom: 0, opacity: 0, pointerEvents: 'none' }} />

      {/* Header bar */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={goBack} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg active:bg-gray-200 transition">
          ←
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{roleEmoji}</span>
          <span className="fd font-black text-lg" style={{ color: BRAND.ink }}>{roleLabel}</span>
        </div>
      </div>

      {/* Brand strip */}
      <div className="px-6 pt-4 pb-6 text-center su">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
          style={{ background: `linear-gradient(135deg,${BRAND.primary},${BRAND.red})` }}>
          <span style={{ fontSize: 28 }}>⚡</span>
        </div>
        <h2 className="fd font-black text-2xl" style={{ color: BRAND.ink }}>
          {step === 'phone'   ? 'Sign in to Vegu'
         : step === 'otp'    ? 'Enter OTP'
         : 'Complete Profile'}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {step === 'phone'   ? 'Enter your mobile number to continue'
         : step === 'otp'    ? `OTP sent to +91 ${phone}`
         : 'Tell us a bit about yourself'}
        </p>
      </div>

      <div className="flex-1 px-5">

        {/* ── STEP: phone ── */}
        {step === 'phone' && (
          <div className="su">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5">
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Mobile Number</label>
              <div className="flex items-center gap-3 mt-2 border-2 rounded-2xl px-4 py-3 transition-all"
                style={{ borderColor: phone.length === 10 ? BRAND.primary : '#e5e7eb', background: '#fafafa' }}>
                <div className="flex items-center gap-1.5 border-r border-gray-200 pr-3">
                  <span className="text-xl">🇮🇳</span>
                  <span className="text-sm font-black text-gray-600">+91</span>
                </div>
                <input
                  type="tel" inputMode="numeric" placeholder="9876 543 210"
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && phone.replace(/\D/g,'').length === 10 && sendOTP()}
                  className="flex-1 text-xl font-black bg-transparent tracking-widest"
                  style={{ outline: 'none', border: 'none', color: BRAND.ink }}
                  autoFocus
                />
                {phone.length === 10 && <span className="text-emerald-500 text-lg">✓</span>}
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
                  <span>⚠️</span>
                  <p className="text-sm font-medium" style={{ color: BRAND.red }}>{error}</p>
                </div>
              )}

              <button
                onClick={() => sendOTP()}
                disabled={loading || phone.replace(/\D/g,'').length !== 10}
                className="w-full mt-4 py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[.98]"
                style={{
                  background: (!loading && phone.replace(/\D/g,'').length === 10)
                    ? `linear-gradient(135deg,${BRAND.primary},${BRAND.red})`
                    : '#e5e7eb',
                  boxShadow: (!loading && phone.replace(/\D/g,'').length === 10)
                    ? '0 6px 20px rgba(255,107,53,.35)' : 'none',
                  color: (!loading && phone.replace(/\D/g,'').length === 10) ? 'white' : '#9ca3af',
                }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Sending OTP…
                  </span>
                ) : 'Get OTP →'}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed px-4">
              By continuing, you agree to our Terms of Service. A 6-digit OTP will be sent to your number.
            </p>
          </div>
        )}

        {/* ── STEP: otp ── */}
        {step === 'otp' && (
          <div className="su">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5">
              <div className="text-center mb-5">
                <div className="text-5xl mb-2">📱</div>
                <p className="text-sm text-gray-500">6-digit OTP sent to</p>
                <p className="font-black text-lg" style={{ color: BRAND.ink }}>+91 {phone}</p>
              </div>

              <div className={shakeOtp ? 'shake' : ''}>
                <OTPInput value={otp} onChange={v => { setOtp(v); setError(''); }} disabled={loading} />
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
                  <span>⚠️</span>
                  <p className="text-sm font-medium text-center" style={{ color: BRAND.red }}>{error}</p>
                </div>
              )}

              <button
                onClick={verifyOTP}
                disabled={loading || otp.length < 6}
                className="w-full mt-4 py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[.98]"
                style={{
                  background: (!loading && otp.length === 6) ? `linear-gradient(135deg,${BRAND.primary},${BRAND.red})` : '#e5e7eb',
                  boxShadow: (!loading && otp.length === 6) ? '0 6px 20px rgba(255,107,53,.35)' : 'none',
                  color: (!loading && otp.length === 6) ? 'white' : '#9ca3af',
                }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Verifying…
                  </span>
                ) : 'Verify OTP ✓'}
              </button>

              {/* Resend */}
              <div className="mt-4 text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-gray-400">
                    Resend OTP in <span className="font-black" style={{ color: BRAND.primary }}>{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={() => sendOTP(true)}
                    disabled={loading}
                    className="text-sm font-black"
                    style={{ color: BRAND.primary }}>
                    Didn't get OTP? Resend →
                  </button>
                )}
              </div>
            </div>

            <button onClick={() => setStep('phone')} className="w-full text-center text-sm py-4 text-gray-400 font-medium">
              ← Change number
            </button>
          </div>
        )}

        {/* ── STEP: profile ── */}
        {step === 'profile' && (
          <div className="su">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5 space-y-3">
              <div className="text-center pb-1">
                <div className="text-4xl mb-2">👤</div>
                <p className="fd font-black text-lg" style={{ color: BRAND.ink }}>Almost done!</p>
                <p className="text-xs text-gray-400 mt-1">Help us personalise your experience</p>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text" placeholder="Ravi Kumar"
                  value={name} onChange={e => { setName(e.target.value); setError(''); }}
                  className="w-full mt-1.5 px-4 py-3 border-2 rounded-2xl text-sm font-medium transition-colors"
                  style={{ borderColor: name.trim() ? BRAND.primary : '#e5e7eb', outline: 'none' }}
                  autoFocus
                />
              </div>

              {role === 'rider' && (
                <>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Vehicle Type</label>
                    <div className="flex gap-2 mt-1.5">
                      {[{ id: 'bike', label: '🏍️ Bike' }, { id: 'scooter', label: '🛵 Scooter' }, { id: 'bicycle', label: '🚲 Cycle' }].map(v => (
                        <button key={v.id} onClick={() => setVehicleType(v.id)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-black border-2 transition-all"
                          style={{
                            borderColor: vehicleType === v.id ? BRAND.primary : '#e5e7eb',
                            background: vehicleType === v.id ? '#fff3ee' : '#fff',
                            color: vehicleType === v.id ? BRAND.primary : '#6b7280',
                          }}>
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Vehicle Number</label>
                    <input
                      type="text" placeholder="AP 15 XX 1234"
                      value={vehicleNo} onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                      className="w-full mt-1.5 px-4 py-3 border-2 rounded-2xl text-sm font-medium tracking-widest transition-colors"
                      style={{ borderColor: vehicleNo.trim() ? BRAND.primary : '#e5e7eb', outline: 'none' }}
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
                  <span>⚠️</span>
                  <p className="text-sm font-medium" style={{ color: BRAND.red }}>{error}</p>
                </div>
              )}

              <button onClick={createProfile} disabled={loading}
                className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[.98]"
                style={{
                  background: loading ? '#e5e7eb' : `linear-gradient(135deg,${BRAND.primary},${BRAND.red})`,
                  boxShadow: loading ? 'none' : '0 6px 20px rgba(255,107,53,.35)',
                  color: loading ? '#9ca3af' : 'white',
                }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : `Start Shopping →`}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="pb-8 pt-4 text-center text-[11px] text-gray-300">vegu-repo.vercel.app</div>
    </div>
  );
};

// ─── Admin Email Login ────────────────────────────────────────────────────────
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
      const code = (e && e.code) || '';
      const msg  = (e && e.message) || '';
      const full = code + ' ' + msg;
      if (full.includes('auth/invalid-credential') || full.includes('auth/wrong-password') || full.includes('auth/user-not-found'))
        setError('Wrong email or password.');
      else if (full.includes('auth/network-request-failed'))
        setError('Network error. Check your connection.');
      else setError('Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{ background: 'linear-gradient(160deg,#f5f5f5 0%,#fff 70%)', fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
      <style>{CSS}</style>
      <div className="w-full max-w-sm su">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg active:bg-gray-200">←</button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <span className="fd font-black text-lg" style={{ color: BRAND.ink }}>Admin Login</span>
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-3">
          <div>
            <label className="text-xs font-black text-gray-500">EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium"
              style={{ outline: 'none' }} />
          </div>
          <div>
            <label className="text-xs font-black text-gray-500">PASSWORD</label>
            <div className="relative mt-1">
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium pr-16"
                style={{ outline: 'none' }} autoFocus />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {error && <div className="px-3 py-2.5 rounded-xl text-sm font-medium bg-red-50 border border-red-200" style={{ color: BRAND.red }}>{error}</div>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[.98]"
            style={{ background: loading ? '#d1d5db' : `linear-gradient(135deg,${BRAND.ink},#333)` }}>
            {loading ? 'Logging in…' : 'Login →'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Rider Pending Screen ─────────────────────────────────────────────────────
export const RiderPendingScreen = ({ onSignOut }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50"
    style={{ fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
    <style>{CSS}</style>
    <div className="text-7xl mb-5 su">🛵</div>
    <h2 className="fd font-black text-2xl mb-2 su" style={{ fontFamily: 'Fraunces,Georgia,serif' }}>Under Review</h2>
    <p className="text-gray-500 text-sm mb-8 max-w-xs leading-relaxed su">
      Your rider account is pending admin approval. Usually approved within 24 hours.
    </p>
    <button onClick={onSignOut} className="w-full max-w-xs py-3.5 rounded-2xl font-black border-2 border-red-200 text-red-500">
      Sign Out
    </button>
  </div>
);

// ─── No Firebase Config Screen ────────────────────────────────────────────────
export const SetupRequired = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50"
    style={{ fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
    <div className="text-6xl mb-4">🔧</div>
    <h2 className="font-black text-2xl mb-2">Firebase Setup Required</h2>
    <p className="text-gray-500 text-sm max-w-xs">Add Firebase environment variables to Vercel and redeploy.</p>
  </div>
);

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function AuthScreen() {
  const [role, setRole] = useState(null);
  if (!isConfigured) return <SetupRequired />;
  if (!role) return <RolePicker onSelect={setRole} />;
  if (role === 'admin') return <AdminAuthForm onBack={() => setRole(null)} />;
  return <PhoneAuthForm role={role} onBack={() => setRole(null)} />;
}
