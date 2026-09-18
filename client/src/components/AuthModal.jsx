import React, { useState } from 'react';
import { useAuth, PRESET_ACCOUNTS } from '../context/AuthContext';
import { api } from '../services/api';
import { Phone, ShieldCheck, UserCheck, X, Sparkles, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, login, quickLogin } = useAuth();
  const [role, setRole] = useState('citizen'); // 'citizen' | 'official'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!showAuthModal) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    const clean = phone.replace(/\D/g, '');
    if (!clean || clean.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(clean);
      setOtpSent(true);
      setOtp('123456'); // Pre-fill mock OTP for instant demo access
      setInfoMsg(`OTP code: ${res.mockOtp || '123456'} sent to +91 ${clean.slice(-10)}`);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp) {
      setError('Please enter the verification OTP');
      return;
    }

    setLoading(true);
    try {
      await login(phone, otp, role, name);
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md neu-card rounded-3xl p-6 sm:p-8 border border-white/80 overflow-hidden">
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-5 right-5 p-2 rounded-xl neu-btn text-slate-600 hover:text-slate-900"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-[#ebf0f7] shadow-[inset_2px_2px_4px_#cbd6e4,inset_-2px_-2px_4px_#ffffff] text-emerald-700">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Secure Mobile Login
            </span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Welcome to Civic Connect
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Real-world mobile OTP login for citizens & municipal authorities
          </p>
        </div>

        {/* Quick 1-Click Demo Profiles */}
        <div className="mb-5 p-3.5 bg-[#ebf0f7] shadow-[inset_3px_3px_6px_#cad5e3,inset_-3px_-3px_6px_#ffffff] rounded-2xl border border-white/60">
          <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            1-Click Demo Profiles (Instant Access)
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PRESET_ACCOUNTS).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => quickLogin(key)}
                className="text-left p-2 rounded-xl neu-btn text-xs font-semibold text-slate-800 group"
              >
                <div className="text-[10px] uppercase font-bold text-emerald-700 flex items-center justify-between">
                  {item.role === 'official' ? '🏛️ Official' : '👤 Citizen'}
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="truncate font-bold mt-0.5">{item.name.split(' ')[0]}</div>
                <div className="text-[10px] text-slate-500 truncate">{item.phone}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#ebf0f7] shadow-[inset_3px_3px_6px_#cad5e3,inset_-3px_-3px_6px_#ffffff] rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => setRole('citizen')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              role === 'citizen' ? 'neu-pill-active' : 'text-slate-600'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Citizen
          </button>
          <button
            type="button"
            onClick={() => setRole('official')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              role === 'official' ? 'neu-pill-active text-indigo-700' : 'text-slate-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Municipality Agent
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{infoMsg}</span>
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Karthik Kumar"
                className="w-full px-4 py-2.5 rounded-2xl neu-input text-xs sm:text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number (Any 10-Digit Mobile) <span className="text-rose-500">*</span>
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
              <p className="text-[11px] text-slate-400 mt-1">
                Enter your real phone number. OTP is simulated for instant verification.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl neu-btn-primary text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? 'Sending OTP...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Enter 6-Digit OTP
                </label>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-xs text-emerald-700 font-bold hover:underline"
                >
                  Change Mobile
                </button>
              </div>

              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg font-black py-2.5 rounded-2xl neu-input text-slate-900"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                <span>Code sent: <strong className="text-emerald-700 font-mono">123456</strong></span>
                <button
                  type="button"
                  onClick={() => setOtp('123456')}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Fill 123456
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl neu-btn-primary text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? 'Verifying...' : 'Verify & Enter Platform'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
