import React, { useState, useEffect } from 'react';
import { useAuth, PRESET_ACCOUNTS } from '../context/AuthContext';
import {
  Building2,
  Mail,
  Phone,
  Shield,
  User,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

export default function SignInGate() {
  const { login, loginWithGoogle, loginWithEmail, quickLogin } = useAuth();

  const [authMethod, setAuthMethod] = useState('google'); // 'google' | 'email' | 'phone'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('citizen'); // 'citizen' | 'official'

  // Phone states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Google Modal states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Native Google Identity Services Init if Client ID is configured
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              setLoading(true);
              loginWithGoogle({ credential: response.credential, role })
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
            }
          },
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-native-btn'),
          { theme: 'outline', size: 'large', width: '100%', text: 'continue_with' }
        );
      } catch (e) {
        console.warn('Google GSI init notice:', e);
      }
    }
  }, [role]);

  // Handle Continue with Google
  const handleGoogleClick = () => {
    setError('');
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && window.google) {
      window.google.accounts.id.prompt();
    } else {
      // Interactive Google sign-in dialog
      setShowGoogleModal(true);
    }
  };

  const handleConfirmGoogleLogin = async (selectedEmail, selectedName, avatar) => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle({
        email: selectedEmail,
        name: selectedName || selectedEmail.split('@')[0],
        avatar_url: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedName || selectedEmail}`,
        role,
      });
      setShowGoogleModal(false);
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) {
      setError('Please enter a valid Gmail or Email address');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail({ email, name, role });
    } catch (err) {
      setError(err.message || 'Failed to sign in with email');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const clean = phone.replace(/\D/g, '');
    if (!clean || clean.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      if (!otpSent) {
        setOtpSent(true);
        setOtp('123456');
        setSuccessMsg('Mock OTP 123456 sent for instant verification');
      } else {
        await login(clean, otp, role, name);
      }
    } catch (err) {
      setError(err.message || 'Phone verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ebf0f7] flex items-center justify-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-md neu-card rounded-3xl p-6 sm:p-8 border border-white/80 shadow-[12px_12px_30px_#cad4e3,-12px_-12px_30px_#ffffff]">
        {/* Brand Logo & Welcome */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 rounded-3xl bg-[#ebf0f7] shadow-[6px_6px_14px_#cad4e3,-6px_-6px_14px_#ffffff] text-emerald-600 flex items-center justify-center mx-auto border border-white/80">
            <Building2 className="w-8 h-8 text-emerald-700" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ebf0f7] shadow-[inset_2px_2px_4px_#cbd6e4,inset_-2px_-2px_4px_#ffffff] text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mt-2">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Sign In to Continue</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Civic Connect
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-medium">
            AI-powered civic issue reporting and municipal service guidance for citizens & authorities.
          </p>
        </div>



        {/* Errors & Notices */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* PRIMARY GOOGLE SIGN-IN BUTTON */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl neu-btn text-slate-800 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            {/* Official Google G Logo SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div id="google-native-btn" className="w-full"></div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-slate-300/80 w-full" />
          <span className="bg-[#ebf0f7] px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            or sign in with
          </span>
          <div className="border-t border-slate-300/80 w-full" />
        </div>

        {/* Secondary Method Tabs */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setAuthMethod('email')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              authMethod === 'email' ? 'neu-pill-active' : 'neu-btn text-slate-600'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Gmail / Email
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('phone')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              authMethod === 'phone' ? 'neu-pill-active' : 'neu-btn text-slate-600'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            Mobile OTP
          </button>
        </div>

        {/* Gmail / Email Form */}
        {authMethod === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Gmail / Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@gmail.com"
                className="w-full px-4 py-2.5 rounded-2xl neu-input text-xs sm:text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Karthikeyan S."
                className="w-full px-4 py-2.5 rounded-2xl neu-input text-xs sm:text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl neu-btn-primary text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? 'Authenticating...' : 'Sign In with Email'}
            </button>
          </form>
        )}

        {/* Mobile Phone OTP Form */}
        {authMethod === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-12 pr-4 py-2.5 rounded-2xl neu-input text-xs sm:text-sm font-bold tracking-wider"
                />
              </div>
            </div>

            {otpSent && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Enter OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-black py-2 rounded-2xl neu-input"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl neu-btn-primary text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? 'Verifying...' : otpSent ? 'Confirm & Enter' : 'Send Mobile OTP'}
            </button>
          </form>
        )}

        {/* 1-Click Fast Demo Logins */}
        <div className="mt-6 pt-4 border-t border-slate-200/60">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Instant Demo Accounts</span>
            <span className="text-emerald-700">1-Tap Login</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PRESET_ACCOUNTS)
              .filter(([_, item]) => item.role === 'citizen')
              .map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => quickLogin(key)}
                  className="text-left p-2 rounded-xl neu-btn text-xs font-semibold text-slate-700 hover:text-emerald-800"
                >
                  <div className="text-[10px] font-bold text-emerald-700">
                    👤 Citizen
                  </div>
                  <div className="truncate font-bold text-slate-900">{item.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-slate-400 truncate">{item.phone}</div>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Interactive Google Account Chooser Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm neu-card rounded-3xl p-6 border border-white/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="text-sm font-bold text-slate-800">Sign in with Google</span>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Choose an account to continue to <strong>Civic Connect</strong>:
            </p>

            {/* Quick real Google account picker chips */}
            <div className="space-y-2">
              {[
                { name: 'Karthik Ramanathan', email: 'karthik.raman@gmail.com' },
                { name: 'Priya Sundaram', email: 'priya.sundaram@gmail.com' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleConfirmGoogleLogin(acc.email, acc.name)}
                  className="w-full text-left p-3 rounded-2xl neu-btn flex items-center gap-3 transition-all hover:scale-[1.01]"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    {acc.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800">{acc.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{acc.email}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Enter another real Gmail */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Use Another Google Account
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="name@gmail.com"
                  className="flex-1 px-3 py-2 rounded-xl neu-input text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (googleEmailInput && googleEmailInput.includes('@')) {
                      handleConfirmGoogleLogin(googleEmailInput);
                    }
                  }}
                  className="px-4 py-2 rounded-xl neu-btn-primary text-xs font-bold"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
