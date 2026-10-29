import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LoadingOverlay } from './components/common/LoadingOverlay';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginPage } from './components/login/LoginPage';
import { ShieldAlert } from 'lucide-react';
import { testFirestoreConnection } from './firebase';
import { migrateExistingDataToFirestore } from './services/firestoreService';

// Module Imports
import { DashboardHome } from './components/dashboard/DashboardHome';
import { ProfileModule } from './components/dashboard/ProfileModule';
import { ServiceBookModule } from './components/dashboard/ServiceBookModule';
import { LeaveModule } from './components/dashboard/LeaveModule';
import { SalaryModule } from './components/dashboard/SalaryModule';
import { LoanModule } from './components/dashboard/LoanModule';
import { TransferModule } from './components/dashboard/TransferModule';
import { LpcModule } from './components/dashboard/LpcModule';
import { JoiningModule } from './components/dashboard/JoiningModule';
import { PromotionIncrementModule } from './components/dashboard/PromotionIncrementModule';
import { EParModule } from './components/dashboard/EParModule';
import { GrievanceModule } from './components/dashboard/GrievanceModule';
import { AdminDashboardModule } from './components/dashboard/AdminDashboardModule';
import { ReportsModule } from './components/dashboard/ReportsModule';
import { NotificationsModule } from './components/dashboard/NotificationsModule';
import { ChangePasswordModule } from './components/dashboard/ChangePasswordModule';
import { DocumentsModule } from './components/dashboard/DocumentsModule';
import { ApplicationHistoryModule } from './components/dashboard/ApplicationHistoryModule';
import { CommunicationModule } from './components/dashboard/CommunicationModule';
import { GlobalSearchModal } from './components/dashboard/GlobalSearchModal';
import { EmployeeDashboard } from './components/dashboard/EmployeeDashboard';
import { OdishaSealLogo } from './components/login/OdishaSealLogo';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Connect and verify Firestore cloud database on boot
  useEffect(() => {
    testFirestoreConnection();
    migrateExistingDataToFirestore().catch((err) => console.warn('App migration note:', err));
  }, []);

  // Read URL search parameter for direct deep linking and opening in new tab
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const moduleParam = urlParams.get('module');
      if (moduleParam) {
        setActiveTab(moduleParam);
      }
    } catch (e) {
      console.error('URL parse error:', e);
    }
  }, []);

  const isDDO = user ? ['DDO', 'SUPER_ADMIN', 'ESTABLISHMENT_OFFICER', 'REPORTING_OFFICER'].includes(user.role) : false;

  const adminOnlyTabs = [
    'admin',
    'department',
    'office',
    'reports',
    'settings',
    'create_emp',
    'create-employee',
    'employee-creation',
    'edit-employee',
    'delete-employee',
    'reset-password',
    'ddo-panel',
    'audit-logs',
    'audit'
  ];

  useEffect(() => {
    if (user && !isDDO && adminOnlyTabs.includes(activeTab.toLowerCase())) {
      const timer = setTimeout(() => {
        setActiveTab('dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, isDDO, activeTab]);

  if (!user) {
    return <LoginPage />;
  }

  // Security Gate: Block unauthorized Employee access to Admin / DDO tabs
  if (!isDDO && adminOnlyTabs.includes(activeTab.toLowerCase())) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
          unreadNotifCount={2}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-12 flex items-center justify-center">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-xl p-8 text-center space-y-5 w-full">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Access Denied – You are not authorized to access this page.
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                Administrative operations, DDO Control Panel, and Employee Creation are restricted exclusively to authorized Drawing & Disbursing Officers.
              </p>
            </div>
            <div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                Return to Employee Dashboard
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Redirecting automatically to Employee Dashboard...
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const renderModuleContent = () => {
    switch (activeTab) {
      case 'dashboard':
      case 'home':
        return <DashboardHome setActiveTab={setActiveTab} pendingLeavesCount={1} />;
      case 'profile':
        return <ProfileModule />;
      case 'service-book':
        return <ServiceBookModule />;
      case 'leave':
        return <LeaveModule />;
      case 'salary':
        return <SalaryModule />;
      case 'loans':
        return <LoanModule />;
      case 'transfers':
      case 'transfer':
        return <TransferModule />;
      case 'lpc':
        return <LpcModule />;
      case 'joining':
        return <JoiningModule />;
      case 'promotions':
        return <PromotionIncrementModule />;
      case 'epar':
        return <EParModule />;
      case 'grievances':
        return <GrievanceModule />;
      case 'change-password':
        return <ChangePasswordModule />;
      case 'admin':
      case 'department':
      case 'office':
        return <AdminDashboardModule />;
      case 'reports':
        return <ReportsModule />;
      case 'notifications':
        return <NotificationsModule />;
      case 'communication':
      case 'communications':
        return <CommunicationModule onNavigateTab={setActiveTab} />;
      case 'documents':
      case 'document':
      case 'e-vault':
        return <DocumentsModule />;
      case 'application-history':
      case 'applications':
      case 'history':
        return <ApplicationHistoryModule onNavigateTab={setActiveTab} />;
      case 'employee-view':
        return <EmployeeDashboard setActiveTab={setActiveTab} pendingLeavesCount={1} />;
      default:
        return <DashboardHome setActiveTab={setActiveTab} pendingLeavesCount={1} />;
    }
  };

  // If user is regular Employee and on main dashboard, show the 100% replica HRMS dashboard layout
  const isEmployeeDashboard = !isDDO && (activeTab === 'dashboard' || activeTab === 'home');
  const isEmployeeViewExplicit = activeTab === 'employee-view';

  if (isEmployeeDashboard || isEmployeeViewExplicit) {
    return (
      <div className="min-h-screen bg-[#f4f7fa] flex flex-col justify-between">
        <main className="flex-1 w-full">
          <EmployeeDashboard setActiveTab={setActiveTab} pendingLeavesCount={1} />
        </main>
        <Footer />
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      </div>
    );
  }

  // When Employee is viewing a sub-module, render authentic HRMS Header & Breadcrumb
  if (!isDDO) {
    return (
      <div className="min-h-screen bg-[#f4f7fa] flex flex-col justify-between text-slate-800">
        {/* Authentic Top HRMS Odisha Header */}
        <header className="w-full bg-gradient-to-r from-[#1777b7] via-[#208acf] to-[#12689f] text-white shadow-md relative overflow-hidden border-b-2 border-[#0e4d75]">
          <div className="w-full px-3 sm:px-6 py-2 flex items-center justify-between gap-2">
            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-sm bg-white border-2 border-[#e67e22] shadow-md flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                <OdishaSealLogo className="w-full h-full" />
              </div>
              <h1 className="text-xl font-black tracking-wide text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
                HRMS Odisha
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden md:inline-block text-xs font-medium text-white/95">
                Human Resources Management System, Government of Odisha
              </span>
              <div className="w-9 h-9 bg-white rounded-full p-0.5 shadow-sm border border-white/80 shrink-0 flex items-center justify-center overflow-hidden">
                <OdishaSealLogo className="w-full h-full" />
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold cursor-pointer"
              >
                &larr; Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        {/* Sub-Header Breadcrumb with Home button and New Window Action */}
        <div className="w-full bg-gradient-to-b from-[#d8e8f8] to-[#c2daf2] border-b border-[#a9c9e8] px-3 sm:px-6 pt-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-[#2c5282] font-semibold flex items-center gap-1.5 py-0.5">
              <span className="text-[#3182ce] font-bold">&gt;&gt;</span>
              <span
                onClick={() => setActiveTab('dashboard')}
                className="cursor-pointer hover:underline"
              >
                Dash Board
              </span>
              <span>/</span>
              <span className="capitalize">{activeTab.replace('-', ' ')}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}?module=${activeTab}`;
                window.open(url, '_blank');
              }}
              className="text-[11px] font-semibold text-sky-800 hover:text-sky-950 bg-white/70 hover:bg-white px-2 py-0.5 rounded border border-[#a8c6e2] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Open this module in a separate browser tab"
            >
              <span>Open in New Tab</span>
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-sky-700" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-1 mt-1">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-1.5 bg-slate-200/80 hover:bg-white border-t border-x border-[#9ebcd8] rounded-t-md text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              className="px-4 py-1.5 bg-white border-t border-x border-[#9ebcd8] rounded-t-md text-xs font-bold text-[#1a365d] shadow-xs cursor-pointer capitalize"
            >
              {activeTab.replace('-', ' ')}
            </button>
          </div>
        </div>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
          {renderModuleContent()}
        </main>

        <Footer />

        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col transition-colors duration-200">
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        unreadNotifCount={2}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {renderModuleContent()}
      </main>

      <Footer />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <LoadingOverlay />
      <ToastContainer />
      <MainApp />
    </AuthProvider>
  );
}

export default App;
