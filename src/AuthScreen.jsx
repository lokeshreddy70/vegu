import React, { useState } from 'react';
import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
} from 'firebase/auth';

const BRAND = { primary: '#FF6B35', red: '#C1272D', ink: '#1A1A1A' };

export default function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const cleanError = (msg) =>
    msg
      .replace('Firebase: ', '')
      .replace('Error (auth/invalid-credential).', 'Wrong email or password.')
      .replace('Error (auth/email-already-in-use).', 'Email already registered. Please login.')
      .replace('Error (auth/weak-password).', 'Password must be at least 6 characters.')
      .replace('Error (auth/invalid-email).', 'Invalid email address.')
      .replace(/\(auth\/.*?\)\.?/, '');

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please enter email and password.'); return; }
    if (mode === 'signup' && !name) { setError('Please enter your name.'); return; }
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
      }
    } catch (e) {
      setError(cleanError(e.message));
    }
    setLoading(false);
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (e) {
      setError(cleanError(e.message));
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{
        background: 'linear-gradient(160deg, #fff8f5 0%, #fff 60%)',
        fontFamily: '"SF Pro Display", -apple-system, system-ui, sans-serif',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@800;900&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; }
        input:focus { outline: none; border-color: #FF6B35; }
        @keyframes slide-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .slide-up { animation: slide-up 0.35s ease; }
      `}</style>

      {/* Logo */}
      <div className="mb-8 text-center slide-up">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl"
          style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.red} 100%)` }}
        >
          <span style={{ fontSize: 38 }}>⚡</span>
        </div>
        <div className="font-display font-black text-4xl" style={{ color: BRAND.ink }}>
          Vegu
        </div>
        <div className="text-sm text-gray-500 mt-1">Nellore ki 10 nimishallo!</div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6 slide-up">
        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          {['login', 'signup'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
              style={
                mode === m
                  ? { background: BRAND.primary, color: '#fff', boxShadow: '0 2px 8px rgba(255,107,53,0.3)' }
                  : { color: '#9ca3af' }
              }
            >
              {m === 'login' ? 'Login' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-bold text-gray-500 ml-1">Full Name</label>
              <input
                type="text"
                placeholder="Ravi Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium transition-colors"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500 ml-1">Email</label>
            <input
              type="email"
              placeholder="ravi@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 ml-1">Password</label>
            <div className="relative mt-1">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-medium transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold"
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-2xl text-sm font-medium" style={{ background: '#fff1f0', color: BRAND.red }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-black text-base transition-all active:scale-[0.98] mt-2"
            style={{
              background: loading ? '#ccc' : `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.red} 100%)`,
              boxShadow: loading ? 'none' : '0 4px 15px rgba(255,107,53,0.4)',
            }}
          >
            {loading ? '...' : mode === 'login' ? 'Login →' : 'Create Account →'}
          </button>
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={handleGuest}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl text-sm font-black border-2 border-gray-200 text-gray-600 active:bg-gray-50 transition-all"
        >
          Continue as Guest 👋
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center px-6">
        By continuing, you agree to Vegu's Terms & Privacy Policy
      </p>
    </div>
  );
}
