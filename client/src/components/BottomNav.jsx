import React from 'react';
import { Layers, MapPin, PlusCircle, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav({ activeTab, setActiveTab, onOpenCreatePost }) {
  const { user, quickLogin } = useAuth();
  const isOfficial = user?.role === 'official';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-3 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[11px] font-semibold transition-colors ${
            activeTab === 'feed' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>Feed</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[11px] font-semibold transition-colors ${
            activeTab === 'map' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span>Map</span>
        </button>

        {/* Center Report Button */}
        <button
          onClick={onOpenCreatePost}
          className="flex flex-col items-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform border-2 border-white">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-slate-700 mt-0.5">Report</span>
        </button>

        <button
          onClick={() => setActiveTab('chatbot')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[11px] font-semibold transition-colors ${
            activeTab === 'chatbot' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>AI Sahayak</span>
        </button>
      </div>
    </nav>
  );
}
