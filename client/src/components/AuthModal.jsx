import React, { useState } from 'react';
import { useAuth, PRESET_ACCOUNTS } from '../context/AuthContext';
import { api } from '../services/api';
import { Phone, ShieldCheck, UserCheck, X, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

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
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(phone);
      setOtpSent(true);
      setOtp('123456'); // Pre-fill mock OTP for convenience
      setInfoMsg(`Mock OTP sent! Code: ${res.mockOtp || '123456'}`);
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
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      await login(phone, otp, role, name);
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white relative">
          <button
            onClick={() => setShowAuthModal(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-100">Portal Authentication</span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight">Civic Connect Login</h3>
          <p className="text-sm text-emerald-100/90 mt-1">
            Sign in as a citizen or municipal corporation official
          </p>
        </div>

        <div className="p-6">
          {/* Quick Demo Selector */}
          <div className="mb-6 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
            <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              1-Click Demo Accounts
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PRESET_ACCOUNTS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => quickLogin(key)}
                  className="text-left px-2.5 py-2 rounded-lg bg-white hover:bg-emerald-100/80 border border-emerald-200 transition-all text-xs font-medium text-slate-800 shadow-sm hover:border-emerald-400 group"
                >
                  <div className="text-[10px] uppercase font-bold text-emerald-700 flex items-center justify-between">
                    {item.role === 'official' ? '🏛️ Official' : '👤 Citizen'}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="truncate font-semibold">{item.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-slate-500 truncate">{item.label.split('(')[1]?.replace(')', '') || item.phone}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => setRole('citizen')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                role === 'citizen'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Citizen
            </button>
            <button
              type="button"
              onClick={() => setRole('official')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                role === 'official'
                  ? 'bg-white text-indigo-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Municipality Official
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-teal-600" />
              <span>{infoMsg}</span>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Karthikeyan S."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="text-xs font-semibold text-slate-500 mr-1.5">+91</span>
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-16 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  We'll send a mock static OTP (123456) for instant demo verification
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Sending OTP...' : 'Send Verification OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Enter 6-Digit OTP</label>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Change Phone
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-bold py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Static demo code: <strong className="text-emerald-700 font-mono">123456</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtp('123456')}
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    Fill 123456
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : 'Verify & Enter Platform'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
