import React, { useState, useRef, useEffect } from 'react';
import { auth, db, isConfigured } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const BRAND = { primary: '#FF6B35', red: '#C1272D', accent: '#4DA167', ink: '#1A1A1A' };

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@800;900&display=swap');
  .fd { font-family: 'Fraunces', Georgia, serif; }
  @keyframes su { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:none; } }
  .su { animation: su 0.4s ease both; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%,75%{transform:translateX(-8px)} 50%{transform:translateX(8px)} }
  .shake { animation: shake 0.35s ease; }
  @keyframes pop { 0%{transform:scale(1)} 40%{transform:scale(1.25)} 100%{transform:scale(1)} }
  .pop { animation: pop 0.2s ease; }
`;

// Phone → Firebase internal email (user never sees this)
const phoneToEmail = (p) => `user_${p.replace(/\D/g,'')}@vegu.app`;
// Pad 4-digit PIN to meet Firebase 6-char minimum
const pinToPass = (pin) => `${pin}_vg!3x`;

const cleanError = (e) => {
  const full = ((e && e.code) || '') + ' ' + ((e && e.message) || String(e));
  if (full.includes('auth/user-not-found'))                        return 'NO_ACCOUNT';
  if (full.includes('auth/invalid-credential') ||
      full.includes('auth/wrong-password'))                        return 'Wrong PIN. Try again.';
  if (full.includes('auth/email-already-in-use'))                  return 'ALREADY_REGISTERED';
  if (full.includes('auth/too-many-requests'))                     return 'Too many attempts. Wait a few minutes.';
  if (full.includes('auth/network-request-failed'))                return 'Network error. Check your connection.';
  return 'Something went wrong. Try again.';
};

// ─── 4-dot PIN display ────────────────────────────────────────────────────────
const PinDots = ({ value, shake }) => (
  <div className={`flex gap-4 justify-center my-4 ${shake ? 'shake' : ''}`}>
    {[0,1,2,3].map(i => (
      <div key={i} className={`w-5 h-5 rounded-full border-[2.5px] transition-all duration-150 ${i < value.length ? 'scale-110' : 'scale-100'}`}
        style={{
          borderColor: BRAND.primary,
          background: i < value.length ? BRAND.primary : 'transparent',
          boxShadow: i < value.length ? `0 0 8px ${BRAND.primary}55` : 'none',
        }}
      />
    ))}
  </div>
);

// ─── Number keypad ────────────────────────────────────────────────────────────
const NumPad = ({ onPress }) => {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div className="grid grid-cols-3 gap-3 mt-2">
      {keys.map((k, i) => (
        <button key={i} onClick={() => k && onPress(k)} disabled={!k}
          className="py-4 rounded-2xl text-xl font-black transition-all active:scale-90"
          style={{
            background: !k ? 'transparent' : k === '⌫' ? '#fff0ee' : '#f3f4f6',
            color: k === '⌫' ? BRAND.red : BRAND.ink,
            opacity: k ? 1 : 0,
            boxShadow: k && k !== '⌫' ? '0 1px 3px rgba(0,0,0,0.07)' : 'none',
          }}>
          {k}
        </button>
      ))}
    </div>
  );
};

// ─── Role Picker ──────────────────────────────────────────────────────────────
const RolePicker = ({ onSelect }) => (
  <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(170deg,#fff8f5 0%,#fff 55%)', fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
    <style>{CSS}</style>

    <div className="px-6 pt-14 pb-8 text-center su">
      <div className="w-24 h-24 rounded-[28px] flex items-center justify-center mx-auto mb-5 shadow-2xl"
        style={{ background: `linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.red} 100%)` }}>
        <span style={{ fontSize: 44 }}>⚡</span>
      </div>
      <h1 className="fd font-black text-5xl" style={{ color: BRAND.ink }}>Vegu</h1>
      <p className="text-sm text-gray-400 mt-2 font-medium">నెల్లూరు ki 10 nimishallo! 🌶️</p>
    </div>

    <div className="flex-1 px-5">
      <p className="fd font-black text-xl text-center mb-1 su" style={{ color: BRAND.ink }}>Who are you?</p>
      <p className="text-center text-sm text-gray-400 mb-5 su">Select your role to get started</p>

      <div className="grid grid-cols-2 gap-3 su">
        {[
          { id: 'customer', emoji: '🛒', label: 'Customer',   sub: 'Order groceries' },
          { id: 'rider',    emoji: '🛵', label: 'Rider',      sub: 'Deliver orders'  },
        ].map(r => (
          <button key={r.id} onClick={() => onSelect(r.id)}
            className="flex flex-col items-center justify-center py-8 rounded-3xl bg-white border-2 border-gray-100 active:scale-95 transition-all shadow-sm hover:border-orange-200 hover:shadow-xl">
            <span className="text-5xl mb-3">{r.emoji}</span>
            <span className="font-black text-base" style={{ color: BRAND.ink }}>{r.label}</span>
            <span className="text-xs text-gray-400 mt-1">{r.sub}</span>
          </button>
        ))}
      </div>

      <button onClick={() => onSelect('admin')} className="w-full text-center text-xs text-gray-400 py-5 font-medium underline underline-offset-4 su">
        Admin login →
      </button>
    </div>

    <div className="pb-10 text-center text-[11px] text-gray-300 font-medium tracking-widest">
      ANDHRA'S OWN QUICK COMMERCE
    </div>
  </div>
);

// ─── Phone + PIN Auth ─────────────────────────────────────────────────────────
const PhoneAuthForm = ({ role, onBack }) => {
  // step: phone | pin_login | pin_new | pin_confirm | profile | riderPending
  const [step, setStep]             = useState('phone');
  const [phone, setPhone]           = useState('');
  const [pin, setPin]               = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [name, setName]             = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [vehicleNo, setVehicleNo]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [shake, setShake]           = useState(false);

  const doShake = () => { setShake(true); setTimeout(() => setShake(false), 400); };
  const showError = (msg) => { setError(msg); doShake(); };

  const roleLabel = role === 'customer' ? 'Customer' : 'Rider';
  const roleEmoji = role === 'customer' ? '🛒' : '🛵';

  // Auto-advance on 4-digit PIN
  useEffect(() => {
    if (step === 'pin_login' && pin.length === 4) handleLogin();
  }, [pin, step]);

  useEffect(() => {
    if (step === 'pin_new' && pin.length === 4) setStep('pin_confirm');
  }, [pin, step]);

  useEffect(() => {
    if (step === 'pin_confirm' && pinConfirm.length === 4) handlePinConfirm();
  }, [pinConfirm, step]);

  const pressPin = (key) => {
    if (key === '⌫') {
      setPin(p => p.slice(0,-1)); setError('');
    } else if (pin.length < 4) {
      setPin(p => p + key); setError('');
    }
  };

  const pressConfirm = (key) => {
    if (key === '⌫') {
      setPinConfirm(p => p.slice(0,-1)); setError('');
    } else if (pinConfirm.length < 4) {
      setPinConfirm(p => p + key); setError('');
    }
  };

  // ── Step 1: phone ──
  const handlePhoneNext = () => {
    const d = phone.replace(/\D/g, '');
    if (d.length !== 10) { showError('Enter a valid 10-digit mobile number.'); return; }
    setError(''); setPin(''); setPinConfirm('');
    setStep('pin_login');
  };

  // ── Step 2a: try login first ──
  const handleLogin = async () => {
    setLoading(true); setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, phoneToEmail(phone), pinToPass(pin));
      // Verify role matches
      try {
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        if (snap.exists() && snap.data().role && snap.data().role !== role) {
          await signOut(auth);
          showError(`This number is a ${snap.data().role} account. Please select the correct role.`);
          setPin('');
        }
      } catch {}
    } catch (e) {
      const msg = cleanError(e);
      if (msg === 'NO_ACCOUNT') {
        setPin(''); setError('');
        setStep('pin_new');
      } else {
        setPin('');
        showError(msg);
      }
    }
    setLoading(false);
  };

  // ── Step 2b: confirm new PIN ──
  const handlePinConfirm = () => {
    if (pin !== pinConfirm) {
      setPinConfirm('');
      showError("PINs don't match. Try again.");
      return;
    }
    setError('');
    setStep('profile');
  };

  // ── Step 3: create account ──
  const handleCreateAccount = async () => {
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (role === 'rider' && !vehicleNo.trim()) { setError('Enter your vehicle number.'); return; }
    setLoading(true); setError('');
    try {
      const email = phoneToEmail(phone);
      const cred  = await createUserWithEmailAndPassword(auth, email, pinToPass(pin));
      await updateProfile(cred.user, { displayName: name.trim() });

      const userDoc = {
        role, name: name.trim(),
        phone: '+91' + phone.replace(/\D/g,''),
        createdAt: new Date().toISOString(), isActive: true,
      };

      if (role === 'rider') {
        Object.assign(userDoc, { vehicleType, vehicleNumber: vehicleNo.toUpperCase(), isApproved: false });
        try {
          await setDoc(doc(db, 'riderApplications', cred.user.uid), {
            uid: cred.user.uid, name: name.trim(),
            phone: '+91' + phone.replace(/\D/g,''),
            vehicleType, vehicleNumber: vehicleNo.toUpperCase(),
            appliedAt: new Date().toISOString(),
            status: 'pending', isApproved: false, isRejected: false,
          });
        } catch {}
        try { await setDoc(doc(db, 'users', cred.user.uid), userDoc); } catch {}
        await signOut(auth);
        setStep('riderPending');
        setLoading(false);
        return;
      }

      try { await setDoc(doc(db, 'users', cred.user.uid), userDoc); } catch {}
      // App.jsx onAuthStateChanged fires → user enters the app
    } catch (e) {
      const msg = cleanError(e);
      if (msg === 'ALREADY_REGISTERED') {
        // Race condition — account exists; try login
        try {
          await signInWithEmailAndPassword(auth, phoneToEmail(phone), pinToPass(pin));
        } catch {}
      } else {
        setError(msg);
      }
    }
    setLoading(false);
  };

  const goBack = () => {
    setError('');
    if (step === 'phone')        { onBack(); return; }
    if (step === 'pin_login')    { setStep('phone'); setPin(''); return; }
    if (step === 'pin_new')      { setStep('pin_login'); setPin(''); return; }
    if (step === 'pin_confirm')  { setStep('pin_new'); setPinConfirm(''); setPin(''); return; }
    if (step === 'profile')      { setStep('pin_new'); setPinConfirm(''); setPin(''); return; }
    onBack();
  };

  // ── Rider pending ──
  if (step === 'riderPending') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white"
      style={{ fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
      <style>{CSS}</style>
      <div className="text-7xl mb-5 su">⏳</div>
      <h2 className="fd font-black text-3xl mb-2 su" style={{ color: BRAND.ink }}>Application Submitted!</h2>
      <p className="text-gray-500 text-sm mb-8 max-w-xs leading-relaxed su">
        Your application is under review. Admin will approve within <strong>24 hours</strong>.
      </p>
      <button onClick={onBack} className="w-full max-w-xs py-4 rounded-2xl font-black text-white text-base su"
        style={{ background: `linear-gradient(135deg,${BRAND.primary},${BRAND.red})` }}>
        Back to Home
      </button>
    </div>
  );

  const stepTitles = {
    phone:       ['Sign in to Vegu', 'Enter your mobile number to continue'],
    pin_login:   ['Welcome back!', `Enter your 4-digit PIN`],
    pin_new:     ['Create your PIN', 'This PIN keeps your account secure'],
    pin_confirm: ['Confirm your PIN', 'Re-enter the same PIN'],
    profile:     ['Almost done!', 'Tell us your name'],
  };
  const [title, subtitle] = stepTitles[step] || ['', ''];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#fff', fontFamily: '"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
      <style>{CSS}</style>

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-2">
        <button onClick={goBack} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg active:bg-gray-200 transition">←</button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{roleEmoji}</span>
          <span className="fd font-black text-lg" style={{ color: BRAND.ink }}>{roleLabel}</span>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 pt-5 pb-4 su text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
          style={{ background: `linear-gradient(135deg,${BRAND.primary},${BRAND.red})` }}>
          <span style={{ fontSize: 26 }}>⚡</span>
        </div>
        <h2 className="fd font-black text-2xl" style={{ color: BRAND.ink }}>{title}</h2>
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        {(step === 'pin_login' || step === 'pin_new' || step === 'pin_confirm') && (
          <p className="text-sm font-bold mt-1" style={{ color: BRAND.primary }}>+91 {phone}</p>
        )}
      </div>

      <div className="flex-1 px-5">

        {/* ── Phone step ── */}
        {step === 'phone' && (
          <div className="su">
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Mobile Number</label>
              <div className="flex items-center gap-3 mt-2 border-2 rounded-2xl px-4 py-3 transition-all"
                style={{ borderColor: phone.replace(/\D/g,'').length === 10 ? BRAND.primary : '#e5e7eb', background: '#fafafa' }}>
                <div className="flex items-center gap-2 border-r border-gray-200 pr-3 flex-shrink-0">
                  <span className="text-xl">🇮🇳</span>
                  <span className="text-sm font-black text-gray-600">+91</span>
                </div>
                <input
                  type="tel" inputMode="numeric" placeholder="98765 43210"
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/\D/g,'').slice(0,10)); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handlePhoneNext()}
                  className="flex-1 text-xl font-black bg-transparent tracking-widest"
                  style={{ outline:'none', border:'none', color: BRAND.ink }}
                  autoFocus
                />
                {phone.replace(/\D/g,'').length === 10 && <span className="text-emerald-500 text-xl flex-shrink-0">✓</span>}
              </div>

              {error && (
                <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
                  <span className="text-sm">⚠️</span>
                  <p className="text-sm font-medium" style={{ color: BRAND.red }}>{error}</p>
                </div>
              )}

              <button onClick={handlePhoneNext}
                disabled={phone.replace(/\D/g,'').length !== 10}
                className="w-full mt-4 py-4 rounded-2xl font-black text-base transition-all active:scale-[.97]"
                style={{
                  background: phone.replace(/\D/g,'').length === 10 ? `linear-gradient(135deg,${BRAND.primary},${BRAND.red})` : '#f3f4f6',
                  color: phone.replace(/\D/g,'').length === 10 ? 'white' : '#9ca3af',
                  boxShadow: phone.replace(/\D/g,'').length === 10 ? '0 8px 24px rgba(255,107,53,.3)' : 'none',
                }}>
                Continue →
              </button>
            </div>
            <p className="text-center text-xs text-gray-300 mt-4 px-4">
              Your number is used to identify your account. No OTP is sent.
            </p>
          </div>
        )}

        {/* ── PIN Login step ── */}
        {step === 'pin_login' && (
          <div className="su">
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-5">
              <p className="text-center text-sm text-gray-500 mb-1">Enter your 4-digit PIN</p>
              <PinDots value={pin} shake={shake} />
              {error && (
                <div className="mb-2 flex items-center gap-2 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  <span>⚠️</span>
                  <p className="text-sm font-medium" style={{ color: BRAND.red }}>{error}</p>
                </div>
              )}
              {loading ? (
                <div className="flex justify-center py-6">
                  <span className="inline-block w-7 h-7 border-[3px] border-gray-200 border-t-orange-500 rounded-full animate-spin" />
                </div>
              ) : (
                <NumPad onPress={pressPin} />
              )}
              <button onClick={() => { setPin(''); setError(''); setStep('pin_new'); }}
                className="w-full mt-4 text-center text-sm py-1 font-bold" style={{ color: BRAND.primary }}>
                New here? Create account →
              </button>
            </div>
          </div>
        )}

        {/* ── New PIN step ── */}
        {step === 'pin_new' && (
          <div className="su">
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-5">
              <div className="flex items-center gap-2 justify-center bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                <span>🔒</span>
                <p className="text-xs font-bold text-amber-800">This PIN protects your account. Remember it!</p>
              </div>
              <p className="text-center text-sm text-gray-500 mb-1">Set a 4-digit PIN</p>
              <PinDots value={pin} shake={shake} />
              {error && (
                <div className="mb-2 flex items-center gap-2 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  <span>⚠️</span>
                  <p className="text-sm font-medium" style={{ color: BRAND.red }}>{error}</p>
                </div>
              )}
              <NumPad onPress={pressPin} />
              <button onClick={() => { setPin(''); setError(''); setStep('pin_login'); }}
                className="w-full mt-4 text-center text-sm py-1 font-bold" style={{ color: BRAND.primary }}>
                Already have an account? Login →
              </button>
            </div>
          </div>
        )}

        {/* ── Confirm PIN step ── */}
        {step === 'pin_confirm' && (
          <div className="su">
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-5">
              <p className="text-center text-sm text-gray-500 mb-1">Confirm your PIN</p>
              <PinDots value={pinConfirm} shake={shake} />
              {error && (
                <div className="mb-2 flex items-center gap-2 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  <span>⚠️</span>
                  <p className="text-sm font-medium" style={{ color: BRAND.red }}>{error}</p>
                </div>
              )}
              {loading ? (
                <div className="flex justify-center py-6">
                  <span className="inline-block w-7 h-7 border-[3px] border-gray-200 border-t-orange-500 rounded-full animate-spin" />
                </div>
              ) : (
                <NumPad onPress={pressConfirm} />
              )}
            </div>
          </div>
        )}

        {/* ── Profile step ── */}
        {step === 'profile' && (
          <div className="su">
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-5 space-y-3">
              <div className="text-center pb-1">
                <div className="text-4xl mb-2">👤</div>
                <p className="text-xs text-gray-400">One last step — tell us your name</p>
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Full Name</label>
                <input type="text" placeholder="Ravi Kumar" value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleCreateAccount()}
                  className="w-full mt-1.5 px-4 py-3 border-2 rounded-2xl text-sm font-medium transition-colors"
                  style={{ borderColor: name.trim() ? BRAND.primary : '#e5e7eb', outline:'none' }}
                  autoFocus
                />
              </div>

              {role === 'rider' && (
                <>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Vehicle Type</label>
                    <div className="flex gap-2 mt-1.5">
                      {[{id:'bike',l:'🏍️ Bike'},{id:'scooter',l:'🛵 Scooter'},{id:'bicycle',l:'🚲 Cycle'}].map(v => (
                        <button key={v.id} onClick={() => setVehicleType(v.id)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-black border-2 transition-all"
                          style={{ borderColor: vehicleType===v.id ? BRAND.primary : '#e5e7eb', background: vehicleType===v.id ? '#fff3ee' : '#fff', color: vehicleType===v.id ? BRAND.primary : '#6b7280' }}>
                          {v.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Vehicle Number</label>
                    <input type="text" placeholder="AP 15 XX 1234" value={vehicleNo}
                      onChange={e => setVehicleNo(e.target.value.toUpperCase())}
                      className="w-full mt-1.5 px-4 py-3 border-2 rounded-2xl text-sm font-medium tracking-widest transition-colors"
                      style={{ borderColor: vehicleNo.trim() ? BRAND.primary : '#e5e7eb', outline:'none' }}
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
                  <span>⚠️</span>
                  <p className="text-sm font-medium" style={{ color: BRAND.red }}>{error}</p>
                </div>
              )}

              <button onClick={handleCreateAccount} disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[.97]"
                style={{
                  background: loading ? '#f3f4f6' : `linear-gradient(135deg,${BRAND.primary},${BRAND.red})`,
                  color: loading ? '#9ca3af' : 'white',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(255,107,53,.3)',
                }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : 'Start Shopping →'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="pb-8 pt-3 text-center text-[11px] text-gray-200 font-medium">vegu-repo.vercel.app</div>
    </div>
  );
};

// ─── Admin Email Login ────────────────────────────────────────────────────────
const AdminAuthForm = ({ onBack }) => {
  const [email, setEmail]     = useState('admin@vegu.in');
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
      const full = ((e&&e.code)||'') + ' ' + ((e&&e.message)||'');
      if (full.includes('auth/invalid-credential')||full.includes('auth/wrong-password')||full.includes('auth/user-not-found'))
        setError('Wrong email or password.');
      else if (full.includes('auth/network-request-failed'))
        setError('Network error. Check your connection.');
      else setError('Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{ background:'linear-gradient(160deg,#f5f5f5 0%,#fff 70%)', fontFamily:'"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
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
            <label className="text-xs font-black text-gray-400">EMAIL</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
              className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium" style={{outline:'none'}} />
          </div>
          <div>
            <label className="text-xs font-black text-gray-400">PASSWORD</label>
            <div className="relative mt-1">
              <input type={showPass?'text':'password'} placeholder="••••••••"
                value={password} onChange={e=>setPassword(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium pr-16" style={{outline:'none'}} autoFocus />
              <button type="button" onClick={()=>setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                {showPass?'Hide':'Show'}
              </button>
            </div>
          </div>
          {error && <div className="px-3 py-2.5 rounded-xl text-sm font-medium bg-red-50 border border-red-100" style={{color:BRAND.red}}>{error}</div>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[.97]"
            style={{ background: loading?'#d1d5db':`linear-gradient(135deg,${BRAND.ink},#333)` }}>
            {loading?'Logging in…':'Login →'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Exports ──────────────────────────────────────────────────────────────────
export const RiderPendingScreen = ({ onSignOut }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50"
    style={{ fontFamily:'"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
    <style>{CSS}</style>
    <div className="text-7xl mb-5 su">🛵</div>
    <h2 className="fd font-black text-2xl mb-2 su">Under Review</h2>
    <p className="text-gray-500 text-sm mb-8 max-w-xs leading-relaxed su">
      Your rider account is pending admin approval. Usually approved within 24 hours.
    </p>
    <button onClick={onSignOut} className="w-full max-w-xs py-3.5 rounded-2xl font-black border-2 border-red-200 text-red-500">Sign Out</button>
  </div>
);

export const SetupRequired = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50"
    style={{ fontFamily:'"SF Pro Display",-apple-system,system-ui,sans-serif' }}>
    <div className="text-6xl mb-4">🔧</div>
    <h2 className="font-black text-2xl mb-2">Firebase Setup Required</h2>
    <p className="text-gray-500 text-sm max-w-xs">Add Firebase environment variables to Vercel and redeploy.</p>
  </div>
);

export default function AuthScreen() {
  const [role, setRole] = useState(null);
  if (!isConfigured) return <SetupRequired />;
  if (!role) return <RolePicker onSelect={setRole} />;
  if (role === 'admin') return <AdminAuthForm onBack={() => setRole(null)} />;
  return <PhoneAuthForm role={role} onBack={() => setRole(null)} />;
}
