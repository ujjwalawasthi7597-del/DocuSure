import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { UploadModal } from './components/UploadModal';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { ReviewsQueuePage } from './pages/ReviewsQueuePage';
import { AIAnalyzerHubPage } from './pages/AIAnalyzerHubPage';
import { ExpiryManagementPage } from './pages/ExpiryManagementPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { TeamManagementPage } from './pages/TeamManagementPage';
import { documentsApi } from './services/api';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Badge counters
  const [pendingReviewCount, setPendingReviewCount] = useState<number>(0);
  const [expiringCount, setExpiringCount] = useState<number>(0);

  const fetchGlobalStats = async () => {
    if (!user) return;
    try {
      const res = await documentsApi.getDocuments();
      const docs = res.documents || [];
      const pending = docs.filter(
        (d) => d.status === 'Pending Review' || d.status === 'Under Review' || d.status === 'Uploaded'
      ).length;

      const now = new Date();
      const expiring = docs.filter((d) => {
        if (!d.expiryDate) return false;
        const exp = new Date(d.expiryDate);
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
        return diffDays <= 30;
      }).length;

      setPendingReviewCount(pending);
      setExpiringCount(expiring);
    } catch (e) {
      // ignore silently
    }
  };

  useEffect(() => {
    if (user) {
      fetchGlobalStats();
    }
  }, [user?._id, currentTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-300">Loading DocuSure Platform...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated view
  if (!user) {
    if (authView === 'register') {
      return <RegisterPage onNavigateLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onNavigateRegister={() => setAuthView('register')} />;
  }

  // Handler for document selection
  const handleSelectDocument = (id: string) => {
    setSelectedDocId(id);
  };

  const handleTabChange = (tab: string) => {
    setSelectedDocId(null);
    setCurrentTab(tab);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={selectedDocId ? '' : currentTab}
        onSelectTab={handleTabChange}
        pendingReviewCount={pendingReviewCount}
        expiringCount={expiringCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onOpenUpload={() => setShowUploadModal(true)}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (currentTab !== 'documents' && !selectedDocId) {
              setCurrentTab('documents');
            }
          }}
          onSelectDocument={handleSelectDocument}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {selectedDocId ? (
            <DocumentDetailPage
              documentId={selectedDocId}
              onBack={() => setSelectedDocId(null)}
            />
          ) : currentTab === 'dashboard' ? (
            <DashboardPage
              onOpenUpload={() => setShowUploadModal(true)}
              onSelectDocument={handleSelectDocument}
              onNavigateTab={handleTabChange}
            />
          ) : currentTab === 'documents' ? (
            <DocumentsPage
              onOpenUpload={() => setShowUploadModal(true)}
              onSelectDocument={handleSelectDocument}
              searchFilter={searchQuery}
            />
          ) : currentTab === 'reviews' ? (
            <ReviewsQueuePage onSelectDocument={handleSelectDocument} />
          ) : currentTab === 'ai-analyzer' ? (
            <AIAnalyzerHubPage
              onOpenUpload={() => setShowUploadModal(true)}
              onSelectDocument={handleSelectDocument}
            />
          ) : currentTab === 'expiry' ? (
            <ExpiryManagementPage onSelectDocument={handleSelectDocument} />
          ) : currentTab === 'audit' && user.role === 'admin' ? (
            <AuditTrailPage onSelectDocument={handleSelectDocument} />
          ) : currentTab === 'team' && user.role === 'admin' ? (
            <TeamManagementPage />
          ) : (
            <DashboardPage
              onOpenUpload={() => setShowUploadModal(true)}
              onSelectDocument={handleSelectDocument}
              onNavigateTab={handleTabChange}
            />
          )}
        </main>
      </div>

      {/* Global Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={(newDocId) => {
          fetchGlobalStats();
          if (newDocId) {
            setSelectedDocId(newDocId);
          } else {
            setCurrentTab('documents');
          }
        }}
      />
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
