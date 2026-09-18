import React, { useState } from 'react';
import { useAuth, PRESET_ACCOUNTS } from '../context/AuthContext';
import {
  Building2,
  MapPin,
  Shield,
  User,
  PlusCircle,
  MessageSquareCode,
  LogOut,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function Header({ activeTab, setActiveTab, onOpenCreatePost }) {
  const { user, currentWard, setShowAuthModal, setShowLocationModal, logout, quickLogin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isOfficial = user?.role === 'official';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('feed')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-950 to-slate-700 bg-clip-text text-transparent">
                    Civic Connect
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    AI Enabled
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Citizen Reporting & Municipal Guidance
                </p>
              </div>
            </button>

            {/* Current Ward Selector Pill (Citizen feed scope) */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="ml-2 sm:ml-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-slate-700 hover:text-emerald-800 transition-all text-xs font-semibold shadow-2xs group"
              title="Click to switch your ward or municipal area"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="max-w-[140px] sm:max-w-[180px] truncate">
                {currentWard?.ward_name?.split('-')[1]?.trim() || currentWard?.ward_name || 'Select Ward'}
              </span>
              <span className="text-slate-400 text-[10px] hidden md:inline">
                ({currentWard?.municipality_name?.includes('Chennai') ? 'Chennai' : 'Coimbatore'})
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'feed'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Community Feed
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Issue Map
            </button>
            <button
              onClick={() => setActiveTab('chatbot')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'chatbot'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              AI Sahayak (Guidance)
            </button>

            {/* Official Dashboard Tab */}
            <button
              onClick={() => {
                if (!isOfficial) {
                  quickLogin('official-chennai');
                }
                setActiveTab('official');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'official'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Official Portal {isOfficial && '✓'}
            </button>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2.5">
            {/* Report Issue Button */}
            <button
              onClick={onOpenCreatePost}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/25 hover:shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Report Civic Issue</span>
              <span className="sm:hidden">Report</span>
            </button>

            {/* User Account / Role Switcher Menu */}
            <div className="relative">
              {user ? (
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                      isOfficial ? 'bg-indigo-600' : 'bg-emerald-600'
                    }`}
                  >
                    {isOfficial ? <Shield className="w-4 h-4" /> : user.name[0] || 'C'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                      {user.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400 capitalize">
                      {isOfficial ? '🏛️ Official' : '👤 Citizen'}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs"
                >
                  Sign In
                </button>
              )}

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900">{user?.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{user?.phone}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isOfficial ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOfficial ? 'Municipal Official' : 'Citizen Account'}
                      </span>
                    </div>
                  </div>

                  {/* Fast Switch Role Accounts */}
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Switch Role (Demo Profiles)
                    </div>
                    <div className="space-y-1">
                      {Object.entries(PRESET_ACCOUNTS).map(([key, item]) => (
                        <button
                          key={key}
                          onClick={() => quickLogin(key)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-xs flex items-center justify-between text-slate-700"
                        >
                          <span className="truncate">{item.label}</span>
                          {user?.phone === item.phone && (
                            <span className="text-emerald-600 font-bold text-[10px]">Active</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="px-2 pt-1">
                    <button
                      onClick={() => setShowLocationModal(true)}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      Change Ward Location
                    </button>
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
