import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import FeedCalculator from './pages/FeedCalculator';
import FeedHistory from './pages/FeedHistory';
import PondManagement from './pages/PondManagement';
import Help from './pages/Help';
import FCRModule from './components/FCRModule';
import HelpModal from './components/HelpModal';
import Login from './pages/Login';
import { 
  fetchFeedingRules, 
  fetchFeedHistory, 
  saveFeedRecord, 
  deleteFeedRecord, 
  fetchPonds, 
  savePondRecord, 
  deletePondRecord,
  isSupabaseConfigured 
} from './services/supabase';
import { PREDEFINED_RULES } from './data/predefinedRules';
import { getCurrentUser, logoutUser } from './services/authService';

export default function App() {
  // 1. Language state (stored in localStorage)
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('aquaculture_app_lang') || 'mr'; // Default Marathi for Maharashtra farmers
  });

  // 2. Authentication state
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  // 3. Active Tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // 4. Modals
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSupabaseOnline, setIsSupabaseOnline] = useState(isSupabaseConfigured());

  // 5. Data states
  const [rulesList, setRulesList] = useState(PREDEFINED_RULES);
  const [feedHistory, setFeedHistory] = useState([]);
  const [ponds, setPonds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data on auth change or online status change
  useEffect(() => {
    async function loadData() {
      if (!currentUser) {
        setPonds([]);
        setFeedHistory([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [rulesRes, historyRes, pondsRes] = await Promise.all([
          fetchFeedingRules(),
          fetchFeedHistory(currentUser.id),
          fetchPonds(currentUser.id),
        ]);

        if (rulesRes?.data) setRulesList(rulesRes.data);
        if (historyRes?.data) setFeedHistory(historyRes.data);
        if (pondsRes?.data) setPonds(pondsRes.data);
      } catch (err) {
        console.error('Error during app data load:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [currentUser?.id, isSupabaseOnline]);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setPonds([]);
    setFeedHistory([]);
  };

  // Feed Record Handlers
  const handleSaveRecord = async (record) => {
    const saved = await saveFeedRecord(record, currentUser?.id);
    setFeedHistory((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
    return saved;
  };

  const handleDeleteRecord = async (recordId) => {
    await deleteFeedRecord(recordId, currentUser?.id);
    setFeedHistory((prev) => prev.filter((r) => r.id !== recordId));
  };

  // Pond Handlers
  const handleSavePond = async (pond) => {
    const saved = await savePondRecord(pond, currentUser?.id);
    setPonds((prev) => {
      const exists = prev.find((p) => p.id === saved.id);
      return exists
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [saved, ...prev];
    });
    return saved;
  };

  const handleDeletePond = async (pondId) => {
    await deletePondRecord(pondId, currentUser?.id);
    setPonds((prev) => prev.filter((p) => p.id !== pondId));
  };

  // IF NOT LOGGED IN: Render Login Screen Firstly!
  if (!currentUser) {
    return (
      <Login
        lang={lang}
        setLang={setLang}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('dashboard');
        }}
      />
    );
  }

  // IF LOGGED IN: Render the complete Aquaculture Application
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Sticky Bilingual Header with User & Logout */}
      <Header
        lang={lang}
        setLang={setLang}
        onOpenHelpModal={() => setIsHelpOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Navigation (Sticky Desktop Tabs & Mobile Bottom Bar) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-12 pt-2">
        {activeTab === 'dashboard' && (
          <Dashboard
            lang={lang}
            feedHistory={feedHistory}
            ponds={ponds}
            onNavigateToCalculator={() => setActiveTab('calculator')}
            onNavigateToHistory={() => setActiveTab('history')}
            onNavigateToPonds={() => setActiveTab('ponds')}
            onNavigateToFCR={() => setActiveTab('fcr')}
          />
        )}

        {activeTab === 'calculator' && (
          <FeedCalculator
            lang={lang}
            rulesList={rulesList}
            onSaveRecord={handleSaveRecord}
          />
        )}

        {activeTab === 'history' && (
          <FeedHistory
            lang={lang}
            feedHistory={feedHistory}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {activeTab === 'ponds' && (
          <PondManagement
            lang={lang}
            ponds={ponds}
            onSavePond={handleSavePond}
            onDeletePond={handleDeletePond}
          />
        )}

        {activeTab === 'fcr' && (
          <FCRModule lang={lang} />
        )}

        {activeTab === 'help' && (
          <Help lang={lang} />
        )}
      </main>

      {/* Help & Knowledge Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        lang={lang}
      />

    </div>
  );
}
