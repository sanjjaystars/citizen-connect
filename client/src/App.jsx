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

function MainApp() {
  const { user } = useAuth();
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
