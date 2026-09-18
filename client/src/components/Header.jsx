import React, { useState } from 'react';
import { useAuth, PRESET_ACCOUNTS } from '../context/AuthContext';
import {
  Building2,
  MapPin,
  Shield,
  User,
  PlusCircle,
  LogOut,
  ChevronDown,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default function Header({ activeTab, setActiveTab, onOpenCreatePost }) {
  const { user, currentWard, setShowAuthModal, setShowLocationModal, logout, quickLogin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isOfficial = user?.role === 'official';

  return (
    <header className="sticky top-0 z-40 bg-[#ebf0f7] border-b border-[#cbd6e4]/60 shadow-[0_4px_12px_#cbd6e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('feed')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#ebf0f7] shadow-[5px_5px_12px_#cbd6e4,-5px_-5px_12px_#ffffff] flex items-center justify-center text-emerald-600 border border-white/60 group-hover:scale-105 transition-all">
                <Building2 className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-800">
                    Civic Connect
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ebf0f7] shadow-[inset_2px_2px_4px_#cbd6e4,inset_-2px_-2px_4px_#ffffff] text-emerald-700 uppercase tracking-wider">
                    AI Sahayak
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Citizens Report • Municipality Resolves
                </p>
              </div>
            </button>

            {/* Current Ward Selector Pill (Citizen feed scope) */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="ml-2 sm:ml-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full neu-btn text-slate-700 text-xs font-semibold"
              title="Click to switch your ward or municipal area"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="max-w-[130px] sm:max-w-[180px] truncate">
                {currentWard?.ward_name?.split('-')[1]?.trim() || currentWard?.ward_name || 'Select Ward'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Desktop Navigation Tabs (Neumorphic Pills) */}
          <nav className="hidden md:flex items-center gap-2 bg-[#ebf0f7] p-1.5 rounded-2xl shadow-[inset_3px_3px_6px_#cbd6e4,inset_-3px_-3px_6px_#ffffff]">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'feed'
                  ? 'neu-pill-active'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Community Feed
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'neu-pill-active'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Issue Map
            </button>
            <button
              onClick={() => setActiveTab('chatbot')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'chatbot'
                  ? 'neu-pill-active text-amber-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              AI Sahayak (Guidance)
            </button>

            {/* Municipality Agent Admin Portal Tab */}
            <button
              onClick={() => {
                if (!isOfficial) {
                  quickLogin('official-chennai');
                }
                setActiveTab('admin');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-[inset_2px_2px_4px_#3730a3,inset_-2px_-2px_4px_#6366f1]'
                  : 'text-indigo-800 hover:text-indigo-950 font-bold'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>🏛️ Municipality Admin</span>
              {isOfficial && (
                <span className="text-[10px] bg-indigo-500/30 text-indigo-900 px-1.5 py-0.2 rounded font-bold">
                  Agent
                </span>
              )}
            </button>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2.5">
            {/* Report Issue Button */}
            <button
              onClick={onOpenCreatePost}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl neu-btn-primary text-xs font-bold active:scale-95"
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
                  className="flex items-center gap-2 px-3 py-2 rounded-xl neu-btn"
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
                    <div className="text-[10px] font-semibold text-slate-500 capitalize">
                      {isOfficial ? '🏛️ Official' : '👤 Citizen'}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 rounded-xl neu-btn text-slate-800 text-xs font-bold"
                >
                  Sign In
                </button>
              )}

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-3 w-72 bg-[#ebf0f7] rounded-2xl shadow-[10px_10px_25px_#cad4e3,-10px_-10px_25px_#ffffff] border border-white/60 py-3 z-50 animate-in fade-in"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-200">
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
                  <div className="px-3 py-2 border-b border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Switch Role (Demo Profiles)
                    </div>
                    <div className="space-y-1">
                      {Object.entries(PRESET_ACCOUNTS).map(([key, item]) => (
                        <button
                          key={key}
                          onClick={() => quickLogin(key)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/60 text-xs flex items-center justify-between text-slate-700"
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
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-white/60 rounded-lg flex items-center gap-2"
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
