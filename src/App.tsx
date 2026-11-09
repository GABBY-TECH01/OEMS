/**
 * Offnot Energy Management System - Main Application Entry
 * Location: Ibadan, Oyo State, Nigeria
 * Slogan: Clean Energy, Stronger Tomorrow
 */

import React, { useState } from 'react';
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
        {/* Real-Time Offline Sync & Connectivity Banner */}
        <OfflineSyncBanner />

        {/* Unified Responsive Header with Mobile Menu Button */}
        <Header onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Content Viewport */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 sm:pb-8">
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
