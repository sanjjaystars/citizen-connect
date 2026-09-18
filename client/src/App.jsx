import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import FeedView from './components/FeedView';
import LeafletMapView from './components/LeafletMapView';
import AIChatbotView from './components/AIChatbotView';
import AdminPage from './components/AdminPage';
import CreatePostModal from './components/CreatePostModal';
import AuthModal from './components/AuthModal';
import LocationSelectorModal from './components/LocationSelectorModal';
import SignInGate from './components/SignInGate';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.hash === '#admin' || window.location.pathname === '/admin') {
      return 'admin';
    }
    return 'feed';
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync route hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setActiveTab('admin');
      } else if (window.location.hash === '#feed') {
        setActiveTab('feed');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'admin') {
      window.location.hash = 'admin';
    } else {
      window.location.hash = tab;
    }
  };

  const handlePostCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  // 1. Loading state while checking token / session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#ebf0f7] flex flex-col items-center justify-center p-4">
        <div className="neu-card p-8 rounded-3xl flex flex-col items-center gap-4 text-slate-700">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-sm font-bold tracking-wide">Connecting to Civic Connect...</span>
        </div>
      </div>
    );
  }

  // 2. Strict Sign-In Gate: User MUST sign in to continue into the website
  if (!user) {
    return <SignInGate />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16 md:pb-0">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenCreatePost={() => setIsCreateOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'feed' && (
          <FeedView
            key={refreshKey}
            onOpenCreatePost={() => setIsCreateOpen(true)}
          />
        )}
        {activeTab === 'map' && (
          <LeafletMapView
            key={refreshKey}
            onOpenCreatePost={() => setIsCreateOpen(true)}
          />
        )}
        {activeTab === 'chatbot' && <AIChatbotView />}
        {activeTab === 'admin' && (
          <AdminPage
            onSwitchToCitizen={() => handleTabChange('feed')}
          />
        )}
      </main>

      {/* Floating Bottom Nav for Mobile */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenCreatePost={() => setIsCreateOpen(true)}
      />

      {/* Modals */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPostCreated={handlePostCreated}
      />
      <AuthModal />
      <LocationSelectorModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
