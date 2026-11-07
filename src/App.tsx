/**
 * Offnot Energy Management System - Main Application Entry
 * Location: Ibadan, Oyo State, Nigeria
 * Slogan: Clean Energy, Stronger Tomorrow
 */

import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { OfflineSyncBanner } from './components/common/OfflineSyncBanner';
import { LoginView } from './components/auth/LoginView';
import { BranchManagement } from './components/branches/BranchManagement';
import { StaffManagement } from './components/staff/StaffManagement';
import { Dashboard } from './components/dashboard/Dashboard';
import { Inventory } from './components/inventory/Inventory';
import { POS } from './components/pos/POS';
import { SalesHistory } from './components/sales/SalesHistory';
import { Purchasing } from './components/purchasing/Purchasing';
import { Customers } from './components/customers/Customers';
import { Quotations } from './components/quotations/Quotations';
import { Projects } from './components/projects/Projects';
import { Finance } from './components/finance/Finance';
import { Reports } from './components/reports/Reports';
import { AuditLogs } from './components/audit/AuditLogs';
import { Settings } from './components/settings/Settings';
import { MigrationViewer } from './components/migration/MigrationViewer';
import { KpiDashboard } from './components/kpis/KpiDashboard';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { getAllowedTabsForUser, getDefaultTabForUser } from './utils/formatters';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, isAuthenticated, settings } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If user is not authenticated, render LoginView
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Ensure user cannot view restricted modules (redirects unauthorized roles automatically)
  const allowedTabs = getAllowedTabsForUser(currentUser);
  const effectiveTab = allowedTabs.includes(activeTab) ? activeTab : getDefaultTabForUser(currentUser);

  if (effectiveTab !== activeTab) {
    setActiveTab(effectiveTab);
  }

  const renderActiveModule = () => {
    switch (effectiveTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'branches':
        return <BranchManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'kpis':
        return <KpiDashboard />;
      case 'inventory':
        return <Inventory />;
      case 'pos':
        return <POS />;
      case 'sales_history':
        return <SalesHistory />;
      case 'purchasing':
        return <Purchasing />;
      case 'customers':
        return <Customers />;
      case 'quotations':
        return <Quotations />;
      case 'projects':
        return <Projects />;
      case 'finance':
        return <Finance />;
      case 'reports':
        return <Reports />;
      case 'audit':
        return <AuditLogs />;
      case 'settings':
        return <Settings />;
      case 'migrations':
        return <MigrationViewer />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-150">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header Bar with Hamburger */}
        <div className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-7 h-7 rounded-lg bg-white p-0.5 shadow-xs shrink-0 flex items-center justify-center overflow-hidden border border-slate-700">
              <img
                src={settings.pwaLogoUrl || '/assets/aistudio/WhatsApp_Image_2026-10-27_at_12.35.58_PM_cf69d348.jpeg'}
                alt="Logo"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/WhatsApp_Image_2026-10-27_at_12.35.58_PM_cf69d348.jpeg';
                }}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-xs sm:text-sm tracking-tight text-white uppercase truncate">
              {settings.pwaShortName || 'Offnot Energy'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <PWAInstallButton variant="header" />
          </div>
        </div>

        {/* Real-Time Offline Sync & Connectivity Banner */}
        <OfflineSyncBanner />

        {/* Global Desktop & Context Top Header */}
        <Header />

        {/* Content Viewport */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
