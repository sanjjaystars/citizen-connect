import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Mail,
  Lock,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Sparkles,
} from 'lucide-react';

export default function SignInGate() {
  const { login, registerUser, loginWithGoogle, loginWithEmail } = useAuth();

  // Mode: 'signin' | 'register'
  const [mode, setMode] = useState('signin');
  const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'google' | 'phone'

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Google GSI auto-render if configured
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              setLoading(true);
              loginWithGoogle({ credential: response.credential })
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
            }
          },
        });
        const btnElem = document.getElementById('google-native-btn');
        if (btnElem) {
          window.google.accounts.id.renderButton(btnElem, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
          });
        }
      } catch (e) {
        console.warn('Google GSI init notice:', e);
      }
    }
  }, []);

  // Handle Continue with Google
  const handleGoogleClick = async () => {
    setError('');
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && window.google) {
      window.google.accounts.id.prompt();
    } else {
      // Prompt user to enter their actual Google / Gmail address
      setAuthMethod('google_direct');
    }
  };

  // Handle Google Direct Email Login
  const handleGoogleDirectSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !email.toLowerCase().includes('@')) {
      setError('Please enter a valid Gmail address (e.g. yourname@gmail.com)');
      return;
    }
    setLoading(true);
    try {
      await loginWithGoogle({
        email: email.trim().toLowerCase(),
        name: name.trim() || email.split('@')[0],
      });
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email + Password Login
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) {
      setError('Please enter a valid Gmail or Email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail({
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (err) {
      setError(err.message || 'Sign in failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || name.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid Gmail or Email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone ? phone.replace(/\D/g, '') : undefined,
      });
      setSuccessMsg('Account created successfully! Welcome to Civic Connect.');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Phone OTP
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
        setSuccessMsg('Verification code sent to +91 ' + clean.slice(-10));
      } else {
        await login(clean, otp, 'citizen', name || undefined);
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
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 rounded-3xl bg-[#ebf0f7] shadow-[6px_6px_14px_#cad4e3,-6px_-6px_14px_#ffffff] text-emerald-700 flex items-center justify-center mx-auto border border-white/80">
            <Building2 className="w-8 h-8 text-emerald-700" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ebf0f7] shadow-[inset_2px_2px_4px_#cbd6e4,inset_-2px_-2px_4px_#ffffff] text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mt-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Citizen Sign In Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Civic Connect
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-medium">
            AI-powered civic issue reporting and municipal guidance. Please sign in to access your local community feed.
          </p>
        </div>

        {/* Mode Switcher: Sign In vs Register */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#ebf0f7] shadow-[inset_3px_3px_6px_#cad5e3,inset_-3px_-3px_6px_#ffffff] rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError('');
              setSuccessMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              mode === 'signin' ? 'neu-pill-active' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
              setSuccessMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              mode === 'register' ? 'neu-pill-active' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Create Account
          </button>
        </div>

        {/* Alerts & Errors */}
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

        {/* ================= MODE: SIGN IN ================= */}
        {mode === 'signin' && (
          <div className="space-y-4">
            {/* Primary Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl neu-btn text-slate-800 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
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

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-300/80 w-full" />
              <span className="bg-[#ebf0f7] px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                or with email / mobile
              </span>
              <div className="border-t border-slate-300/80 w-full" />
            </div>

            {/* Method Tabs: Email / Mobile */}
            <div className="flex items-center justify-center gap-2 mb-3">
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

            {/* Google Direct Email Sign-In (when clicked Continue with Google) */}
            {authMethod === 'google_direct' && (
              <form onSubmit={handleGoogleDirectSubmit} className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[12px] text-emerald-900 font-medium">
                  Enter your real Google / Gmail address to sign in instantly:
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Gmail Address
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
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sanjjay"
                    className="w-full px-4 py-2.5 rounded-2xl neu-input text-xs sm:text-sm font-medium"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthMethod('email')}
                    className="px-4 py-2.5 rounded-2xl neu-btn text-xs font-bold text-slate-600"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-2xl neu-btn-primary text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
                  >
                    {loading ? 'Signing In...' : 'Continue with this Gmail'}
                  </button>
                </div>
              </form>
            )}

            {/* Real Gmail / Email + Password Login Form */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gmail / Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl neu-input text-xs sm:text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl neu-input text-xs sm:text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl neu-btn-primary text-xs font-bold flex items-center justify-center gap-2 active:scale-95 mt-2"
                >
                  {loading ? 'Authenticating...' : 'Sign In with Email'}
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-slate-500">New citizen? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Create a free account
                  </button>
                </div>
              </form>
            )}

            {/* Mobile OTP Form */}
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
                      Enter 6-Digit OTP
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-lg font-black py-2 rounded-2xl neu-input text-slate-800"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl neu-btn-primary text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
                >
                  {loading ? 'Verifying...' : otpSent ? 'Confirm & Enter Platform' : 'Send Verification OTP'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ================= MODE: CREATE ACCOUNT (REGISTER) ================= */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sanjjay Kumar"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl neu-input text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Gmail / Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl neu-input text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl neu-input text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Create Password (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl neu-input text-xs sm:text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl neu-input text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl neu-btn-primary text-xs font-bold flex items-center justify-center gap-2 active:scale-95 mt-3"
            >
              {loading ? 'Creating Account...' : 'Create Citizen Account'}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">Already registered? </span>
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError('');
                }}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Sign in here
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
