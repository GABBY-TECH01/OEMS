import React, { useState } from 'react';
import {
  Bell,
  Search,
  ShieldCheck,
  User as UserIcon,
  ChevronDown,
  Building2,
  Check,
  MapPin,
  RefreshCw,
  LogOut,
  Layers,
  Sparkles,
  Lock,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp, ActiveTab } from '../../context/AppContext';
import { getRoleLabel } from '../../utils/formatters';
import { UserRole } from '../../types';
import { BRAND_LOGO_URL } from '../../constants/branding';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    switchRole,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    globalSearchQuery,
    setGlobalSearchQuery,
    branches,
    activeBranchId,
    setActiveBranchId,
    canAccessAllBranches,
    logout,
    resetToZeroLedger,
    theme,
    toggleTheme,
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read);

  const getBreadcrumbTitle = (tab: ActiveTab): string => {
    switch (tab) {
      case 'dashboard':
        return 'Executive Overview';
      case 'branches':
        return 'Multi-Branch Operations';
      case 'staff':
        return 'Staff Account Provisioning';
      case 'inventory':
        return 'Product Catalog & Stock Ledger';
      case 'pos':
        return 'Point of Sale Terminal (POS)';
      case 'sales_history':
        return 'Sales Orders & Invoices';
      case 'purchasing':
        return 'Purchasing & Supplier POs';
      case 'customers':
        return 'Customers & Registered Installers';
      case 'quotations':
        return 'Solar System Quotations';
      case 'projects':
        return 'Solar Installation Projects';
      case 'finance':
        return 'Operating Expenses & Financials';
      case 'reports':
        return 'Business Reports & Analytics';
      case 'audit':
        return 'Security Audit Trail';
      case 'settings':
        return 'Company & System Settings';
      case 'migrations':
        return 'Supabase & Database Migrations';
      default:
        return 'Offnot Energy';
    }
  };

  const roles: { role: UserRole; label: string }[] = [
    { role: 'super_admin', label: 'Super Administrator' },
    { role: 'ceo', label: 'CEO / Managing Director' },
    { role: 'manager', label: 'Operations Manager' },
    { role: 'inventory_officer', label: 'Inventory Officer' },
    { role: 'sales_rep', label: 'Sales Representative' },
    { role: 'accountant', label: 'Accountant' },
    { role: 'technical_staff', label: 'Solar Installation Engineer' },
  ];

  const currentBranchName =
    activeBranchId === 'all'
      ? 'All Branches (Consolidated)'
      : branches.find(b => b.id === activeBranchId)?.name || 'Select Branch';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4 select-none">
      {/* Zone 1: Breadcrumb & Context */}
      <div className="flex items-center gap-2.5 min-w-0">
        <img
          src={BRAND_LOGO_URL}
          alt="Offnot Energy"
          className="w-7 h-7 object-contain rounded-md bg-white border border-slate-200 p-0.5 shadow-2xs shrink-0"
        />
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 hidden sm:inline">
          Offnot Energy
        </span>
        <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
          /
        </span>
        <h1 className="text-sm md:text-base font-semibold text-slate-900 truncate">
          {getBreadcrumbTitle(activeTab)}
        </h1>
      </div>

      {/* Zone 2: Branch Indicator / Switcher */}
      {canAccessAllBranches ? (
        <div className="relative">
          <button
            onClick={() => {
              setShowBranchMenu(!showBranchMenu);
              setShowRoleMenu(false);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-all shadow-2xs"
            title="Superadmin: Filter view by branch or view consolidated multi-branch analytics"
          >
            {activeBranchId === 'all' ? (
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            )}
            <span className="truncate max-w-[140px] sm:max-w-[210px] font-semibold text-slate-900">
              {currentBranchName}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 opacity-80" />
          </button>

          {showBranchMenu && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Switch Active Branch View</span>
                </p>
                <p className="text-[11px] text-slate-500">Superadmin: Consolidated or individual store analytics</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveBranchId('all');
                    setShowBranchMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                    activeBranchId === 'all'
                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-emerald-700" />
                    <div>
                      <span className="block font-semibold">All Branches (Consolidated)</span>
                      <span className="text-[10px] text-slate-400">Total company-wide view</span>
                    </div>
                  </div>
                  {activeBranchId === 'all' && <Check className="w-4 h-4 text-emerald-700" />}
                </button>

                <div className="my-1 border-t border-slate-100"></div>

                {branches.map(b => {
                  const isSelected = activeBranchId === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        setActiveBranchId(b.id);
                        setShowBranchMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-900">{b.name}</span>
                          {b.isHeadquarters && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                              HQ
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{b.code}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                    </button>
                  );
                })}

                {currentUser.role === 'super_admin' && (
                  <div className="pt-1.5 mt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('branches');
                        setShowBranchMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-lg flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Manage Branch Facilities Hub</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">Open →</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100/90 border border-slate-200 rounded-lg shadow-2xs"
          title={`Assigned store: ${currentBranchName} (Store locked)`}
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-700" />
          <span className="truncate max-w-[130px] sm:max-w-[180px] font-semibold text-slate-900">
            {currentBranchName}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded ml-0.5">
            <Lock className="w-2.5 h-2.5 text-slate-400" />
            <span>Store Staff</span>
          </span>
        </div>
      )}

      {/* Zone 3: Global Search Bar */}
      <div className="flex-1 max-w-sm hidden xl:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search solar items, SKUs, customers, invoices..."
            value={globalSearchQuery}
            onChange={e => setGlobalSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
          />
          {globalSearchQuery && (
            <button
              onClick={() => setGlobalSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Zone 4: Role Switcher, Notifications & Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Role Tester - STRICTLY restricted to Super Administrator */}
        {currentUser.role === 'super_admin' && (
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowBranchMenu(false);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
              title="Superadmin: Switch active role to test permissions"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden lg:inline">{getRoleLabel(currentUser.role)}</span>
              <span className="lg:hidden">{currentUser.name.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-emerald-700 opacity-70" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">Switch Active Test Role</p>
                  <p className="text-[11px] text-slate-500">Superadmin: Verify role-based permissions</p>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {roles.map(r => {
                    const isActive = currentUser.role === r.role;
                    return (
                      <button
                        key={r.role}
                        onClick={() => {
                          switchRole(r.role);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-900 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{r.label}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRoleMenu(false);
              setShowBranchMenu(false);
              setShowUserMenu(false);
            }}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="System Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900">Notifications</span>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-medium text-emerald-700 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500 text-center">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 text-xs cursor-pointer transition-colors ${
                        n.read ? 'bg-white opacity-70' : 'bg-emerald-50/30'
                      } hover:bg-slate-50`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{n.title}</span>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                      </div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Menu */}
        <div className="relative pl-1 border-l border-slate-200">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowRoleMenu(false);
              setShowBranchMenu(false);
            }}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {currentUser.name[0]}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-slate-900 leading-none">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-none">
                {currentUser.branchName || 'Ibadan Facility'}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden lg:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                  {getRoleLabel(currentUser.role)}
                </span>
              </div>

              <div className="py-1">
                {currentUser.role === 'super_admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            'Warning: Reset all sales, purchase orders, expenses, and transaction records to strict zero ledger (₦0.00)? Only Superadmin Francis Gabriel can execute this.'
                          )
                        ) {
                          resetToZeroLedger();
                          setShowUserMenu(false);
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                      <span>Reset to Clean Zero Ledger</span>
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Sign out is available in the user profile menu above and sidebar */}
        </div>
      </div>
    </header>
  );
};
