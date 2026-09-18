import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import FeedView from './components/FeedView';
import LeafletMapView from './components/LeafletMapView';
import AIChatbotView from './components/AIChatbotView';
import OfficialDashboard from './components/OfficialDashboard';
import CreatePostModal from './components/CreatePostModal';
import AuthModal from './components/AuthModal';
import LocationSelectorModal from './components/LocationSelectorModal';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'map' | 'chatbot' | 'official'
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16 md:pb-0">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
        {activeTab === 'official' && <OfficialDashboard />}
      </main>

      {/* Floating Bottom Nav for Mobile */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
