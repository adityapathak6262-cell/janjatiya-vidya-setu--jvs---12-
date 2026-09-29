import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StudentPortal } from './components/StudentPortal';
import { OfficerPortal } from './components/OfficerPortal';
import { AdminPortal } from './components/AdminPortal';
import { AnalyticsPortal } from './components/AnalyticsPortal';
import { ScholarshipContinuityPortal } from './components/ScholarshipContinuityPortal';
import { VerificationDelayMonitor } from './components/VerificationDelayMonitor';
import { PramaanGlobalBridge } from './components/PramaanGlobalBridge';
import { PortalHomeView } from './components/PortalHomeView';
import { NavigationDrawer } from './components/NavigationDrawer';
import { AuthModal } from './components/AuthModal';
import { ChatbotWidget } from './components/ChatbotWidget';
import { User, NotificationRecord, api, setAuthToken } from './api';
import { Shield, GraduationCap, UserCheck, RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full shadow-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto font-bold text-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Platform Display Refreshed</h2>
            <p className="text-xs text-slate-500">
              {this.state.error?.message || 'A layout render error was caught and recovered.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Continue to Janjatiya Vidya Setu
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allDemoUsers, setAllDemoUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [studentTargetSubTab, setStudentTargetSubTab] = useState<any>(undefined);
  const [officerTargetSubTab, setOfficerTargetSubTab] = useState<any>(undefined);
  const [selectedMonitorAppId, setSelectedMonitorAppId] = useState<string | undefined>(undefined);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [auditChainLength, setAuditChainLength] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [isThreeDotMenuOpen, setIsThreeDotMenuOpen] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);

  // Auth Modal State
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'STUDENT_LOGIN' | 'STUDENT_REGISTER' | 'ADMIN_LOGIN'>('STUDENT_LOGIN');

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const users = await api.getDemoUsers();
        setAllDemoUsers(users);

        // Start without active login so visitor lands on Portal Home with Login/Signup options
        setAuthToken(null);
        setCurrentUser(null);
        setActiveTab('home');

        const [notifs, analytics] = await Promise.all([
          api.getNotifications().catch(() => []),
          api.getAnalyticsOverview().catch(() => null),
        ]);
        setNotifications(notifs);
        if (analytics) {
          setAuditChainLength(analytics.auditChainLength);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Central Navigation Handler (Supports 3-Dot Overflow Menu, Tabs & SubTabs)
  const handleNavigateTab = (tab: string, subTab?: string) => {
    if (tab === 'chatbot') {
      setIsChatbotOpen(true);
      return;
    }
    if (tab === 'notifications') {
      const notifBtn = document.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement;
      if (notifBtn) notifBtn.click();
      return;
    }

    if (tab === 'student' && subTab) {
      setStudentTargetSubTab(subTab);
    }
    if (tab === 'officer' && subTab) {
      setOfficerTargetSubTab(subTab);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Switch User Handler
  const handleSwitchUser = async (user: User) => {
    setLoading(true);
    try {
      const loginRes = await api.login(user.email, 'MotA@Jvs2026');
      setAuthToken(loginRes.token);
      setCurrentUser(loginRes.user);

      // Set target portal based on role
      if (loginRes.user.role === 'STUDENT') setActiveTab('student');
      else if (loginRes.user.role === 'INSTITUTION_VERIFIER' || loginRes.user.role === 'MOTA_OFFICER') setActiveTab('officer');
      else if (loginRes.user.role === 'ADMIN' || loginRes.user.role === 'SUPER_ADMIN') setActiveTab('admin');

      const [notifs, analytics] = await Promise.all([
        api.getNotifications().catch(() => []),
        api.getAnalyticsOverview().catch(() => null),
      ]);
      setNotifications(notifs);
      if (analytics) {
        setAuditChainLength(analytics.auditChainLength);
      }
    } catch (err) {
      console.error('User switch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAuth = (mode: 'STUDENT_LOGIN' | 'STUDENT_REGISTER' | 'ADMIN_LOGIN') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'STUDENT') setActiveTab('student');
    else if (user.role === 'INSTITUTION_VERIFIER' || user.role === 'MOTA_OFFICER') setActiveTab('officer');
    else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') setActiveTab('admin');
    handleRefreshData();
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setActiveTab('home');
  };

  const handleRefreshData = async () => {
    try {
      const [notifs, analytics] = await Promise.all([
        api.getNotifications().catch(() => []),
        api.getAnalyticsOverview().catch(() => null),
      ]);
      setNotifications(notifs);
      if (analytics) {
        setAuditChainLength(analytics.auditChainLength);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !currentUser && allDemoUsers.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-700 tracking-wider uppercase">
            Initializing Janjatiya Vidya Setu Platform...
          </p>
          <p className="text-[11px] text-slate-400">Connecting to MoTA Policy Engine & PRAMAAN Verification Subsystem</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* Official Government Header with 3-Dot Overflow Menu */}
        <Header
        currentUser={currentUser}
        allDemoUsers={allDemoUsers}
        activeTab={activeTab}
        onTabChange={handleNavigateTab}
        onSwitchUser={handleSwitchUser}
        notifications={notifications}
        onNotificationRead={handleNotificationRead}
        chainLength={auditChainLength}
        onOpenAuthModal={handleOpenAuth}
        onLogout={handleLogout}
        onOpenThreeDotMenu={() => setIsThreeDotMenuOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 1. Portal Home View (Matches Reference Screenshot Layout & Vibrant Cards) */}
        {activeTab === 'home' && (
          <PortalHomeView
            currentUser={currentUser}
            onNavigateTab={handleNavigateTab}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {/* 2. Student Portal & Scholarship Desk */}
        {activeTab === 'student' && (
          currentUser ? (
            <StudentPortal
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
              onNavigateTab={handleNavigateTab}
              targetSubTab={studentTargetSubTab}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-[#ef5366] flex items-center justify-center mx-auto">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Student Portal Authentication Required</h2>
              <p className="text-xs text-slate-500">
                Please sign in to your student profile or register for OTR to access applications, document locker, and scholarship eligibility.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => handleOpenAuth('STUDENT_LOGIN')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
                >
                  Student Login
                </button>
                <button
                  onClick={() => handleOpenAuth('STUDENT_REGISTER')}
                  className="px-4 py-2 bg-[#ef5366] text-white rounded-lg text-xs font-bold hover:bg-[#e04356] transition"
                >
                  One Time Registration
                </button>
              </div>
            </div>
          )
        )}

        {/* 3. Scholarship Continuity Desk */}
        {activeTab === 'continuity' && (
          currentUser ? (
            <ScholarshipContinuityPortal
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12 space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Scholarship Continuity Login Required</h2>
              <p className="text-xs text-slate-500">
                Please sign in with your student or institutional credentials to review session progression and annual scholarship renewal.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => handleOpenAuth('STUDENT_LOGIN')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
                >
                  Student Login
                </button>
                <button
                  onClick={() => handleOpenAuth('ADMIN_LOGIN')}
                  className="px-4 py-2 bg-amber-700 text-white rounded-lg text-xs font-bold hover:bg-amber-800 transition"
                >
                  Officer Login
                </button>
              </div>
            </div>
          )
        )}

        {/* 4. Verification Delay & SLA Monitor */}
        {activeTab === 'delay-monitor' && (
          currentUser ? (
            <VerificationDelayMonitor
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
              onNavigateTab={(tab) => {
                setSelectedMonitorAppId(undefined);
                handleNavigateTab(tab);
              }}
              initialApplicationId={selectedMonitorAppId}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12 space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-[#6c5ce7] flex items-center justify-center mx-auto">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Verification Delay Monitor</h2>
              <p className="text-xs text-slate-500">
                Officer authorization is required to access system-level latency diagnostics, SLA countdowns, and queue monitoring.
              </p>
              <button
                onClick={() => handleOpenAuth('ADMIN_LOGIN')}
                className="px-5 py-2.5 bg-slate-900 text-amber-400 rounded-lg text-xs font-bold hover:bg-slate-800 transition"
              >
                Officer / Admin Login
              </button>
            </div>
          )
        )}

        {/* 5. Officer & Institute Verification Portal */}
        {activeTab === 'officer' && (
          currentUser ? (
            <OfficerPortal
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
              onNavigateTab={handleNavigateTab}
              targetSubTab={officerTargetSubTab}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12 space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-[#6c5ce7] flex items-center justify-center mx-auto">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Officer & Institute Login Required</h2>
              <p className="text-xs text-slate-500">
                Please authenticate with your official INO or MoTA Committee credentials to review application dossiers.
              </p>
              <button
                onClick={() => handleOpenAuth('ADMIN_LOGIN')}
                className="px-5 py-2.5 bg-slate-900 text-amber-400 rounded-lg text-xs font-bold hover:bg-slate-800 transition"
              >
                Officer / Admin Login
              </button>
            </div>
          )
        )}

        {/* 6. Admin & Policy Compiler Portal */}
        {activeTab === 'admin' && (
          currentUser ? (
            <AdminPortal
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12 space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Administrative Access Required</h2>
              <p className="text-xs text-slate-500">
                Please log in with Ministry Admin credentials to access the machine-readable Policy Compiler and SHA-256 Audit Trail.
              </p>
              <button
                onClick={() => handleOpenAuth('ADMIN_LOGIN')}
                className="px-5 py-2.5 bg-slate-900 text-amber-400 rounded-lg text-xs font-bold hover:bg-slate-800 transition"
              >
                Admin Login
              </button>
            </div>
          )
        )}

        {/* 7. MoTA Public Analytics Portal */}
        {activeTab === 'analytics' && (
          currentUser ? (
            <AnalyticsPortal
              currentUser={currentUser}
            />
          ) : allDemoUsers[0] ? (
            <AnalyticsPortal
              currentUser={allDemoUsers[0]}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12 space-y-4 shadow-xs">
              <p className="text-xs text-slate-500">Loading public analytics...</p>
            </div>
          )
        )}

        {/* 8. PRAMAAN Global Bridge (NOS 2021-26 Lifecycle Engine) */}
        {activeTab === 'global-bridge' && (
          <PramaanGlobalBridge
            currentUser={currentUser}
            onNavigateTab={handleNavigateTab}
          />
        )}

      </main>

      {/* 3-Dot Overflow Menu Drawer (Exposes all existing features) */}
      {isThreeDotMenuOpen && (
        <NavigationDrawer
          isOpen={isThreeDotMenuOpen}
          onClose={() => setIsThreeDotMenuOpen(false)}
          currentUser={currentUser}
          allDemoUsers={allDemoUsers}
          activeTab={activeTab}
          onNavigateTab={handleNavigateTab}
          onSwitchUser={handleSwitchUser}
          onOpenAuthModal={handleOpenAuth}
          onOpenChatbot={() => setIsChatbotOpen(true)}
          onOpenNotifications={() => {
            const notifBtn = document.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement;
            if (notifBtn) notifBtn.click();
          }}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Setu Mitra AI Assistant Chatbot */}
      <ChatbotWidget
        currentUser={currentUser}
        externalIsOpen={isChatbotOpen}
        onToggleExternal={(open) => setIsChatbotOpen(open)}
      />

      {/* Official Government Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <span>
              JANJATIYA VIDYA SETU (JVS) · Ministry of Tribal Affairs (MoTA), Government of India
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Core: Policy → Proof → Process</span>
            <span>·</span>
            <span>PRAMAAN Dual-Path Verification</span>
            <span>·</span>
            <span className="font-mono">Tamper-Evident SHA-256 Ledger</span>
          </div>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
