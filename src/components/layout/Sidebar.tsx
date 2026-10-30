import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Package,
  ShoppingCart,
  Receipt,
  Truck,
  Users,
  FileSpreadsheet,
  Wrench,
  CircleDollarSign,
  BarChart3,
  History,
  Settings,
  SunMedium,
  ShieldCheck,
  Sparkles,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp, ActiveTab } from '../../context/AppContext';
import { getRoleLabel, getAllowedTabsForUser } from '../../utils/formatters';
import { BRAND_LOGO_URL } from '../../constants/branding';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeTab,
    setActiveTab,
    products,
    purchaseOrders,
    projects,
    branches,
    staffAccounts,
    currentUser,
    logout,
    theme,
    toggleTheme,
  } = useApp();

  const lowStockCount = products.filter(p => p.currentStock <= p.reorderLevel).length;
  const pendingPoCount = purchaseOrders.filter(p => p.status === 'pending_approval').length;
  const activeProjectsCount = projects.filter(p => p.status === 'in_progress' || p.status === 'scheduled').length;

  interface NavItem {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }

  const allowedTabs = getAllowedTabsForUser(currentUser);

  const allNavSections: { group: string; items: NavItem[] }[] = [
    {
      group: 'Enterprise Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Overview',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'branches',
          label: 'Branches & Hubs',
          icon: <Building2 className="w-4 h-4" />,
          badge: branches.length,
          badgeColor: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
        },
        {
          id: 'staff',
          label: 'Staff Provisioning',
          icon: <ShieldCheck className="w-4 h-4" />,
          badge: staffAccounts.length,
          badgeColor: 'bg-purple-900/60 text-purple-300 border border-purple-700/50',
        },
        {
          id: 'pos',
          label: 'Point of Sale (POS)',
          icon: <ShoppingCart className="w-4 h-4" />,
        },
        {
          id: 'inventory',
          label: 'Products & Inventory',
          icon: <Package className="w-4 h-4" />,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-600/30',
        },
        {
          id: 'sales_history',
          label: 'Sales & Invoices',
          icon: <Receipt className="w-4 h-4" />,
        },
      ],
    },
    {
      group: 'Procurement & CRM',
      items: [
        {
          id: 'purchasing',
          label: 'Purchasing & POs',
          icon: <Truck className="w-4 h-4" />,
          badge: pendingPoCount > 0 ? pendingPoCount : undefined,
          badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-600/30',
        },
        {
          id: 'customers',
          label: 'Customers & Installers',
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: 'quotations',
          label: 'Solar Quotations',
          icon: <FileSpreadsheet className="w-4 h-4" />,
        },
      ],
    },
    {
      group: 'Engineering & Accounts',
      items: [
        {
          id: 'projects',
          label: 'Installation Projects',
          icon: <Wrench className="w-4 h-4" />,
          badge: activeProjectsCount > 0 ? activeProjectsCount : undefined,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-600/30',
        },
        {
          id: 'finance',
          label: 'Operating Expenses',
          icon: <CircleDollarSign className="w-4 h-4" />,
        },
        {
          id: 'reports',
          label: 'Reports & P&L',
          icon: <BarChart3 className="w-4 h-4" />,
        },
      ],
    },
    {
      group: 'Governance & Security',
      items: [
        {
          id: 'audit',
          label: 'Security Audit Trail',
          icon: <History className="w-4 h-4" />,
        },
        {
          id: 'settings',
          label: 'Company Settings',
          icon: <Settings className="w-4 h-4" />,
          badge: 'Superadmin',
          badgeColor: 'bg-purple-900/70 text-purple-200 border border-purple-700/60',
        },
      ],
    },
  ];

  // Strictly filter items to only what this user's role is permitted to see
  const visibleNavSections = allNavSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => allowedTabs.includes(item.id)),
    }))
    .filter(section => section.items.length > 0);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 border-r border-slate-800 shrink-0 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-800 bg-slate-950/80">
          <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-sm shrink-0 flex items-center justify-center overflow-hidden border border-slate-700">
            <img
              src={BRAND_LOGO_URL}
              alt="Offnot Energy Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white uppercase truncate">
                Offnot Energy
              </span>
            </div>
            <p className="text-[10px] text-emerald-400 font-medium truncate">
              Clean Energy, Stronger Tomorrow
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {visibleNavSections.map(section => (
            <div key={section.group}>
              <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {section.group}
              </div>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={isActive ? 'text-amber-300' : 'text-slate-400'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-emerald-950 text-emerald-200'
                              : item.badgeColor || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card & Dedicated Log Out Button */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-slate-300">
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {currentUser.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate leading-none">{currentUser.name}</p>
              <p className="text-[10px] text-emerald-400 font-medium truncate mt-0.5">
                {getRoleLabel(currentUser.role)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 shadow-xs"
              title="Toggle Light / Dark mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dark</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={logout}
              className="py-1.5 px-2.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800/60 text-rose-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              title="Log out of Offnot Energy Workspace"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="mt-1 text-center text-[10px] text-slate-500 font-mono">
            HQ: Tipper Garage, Ibadan • ₦ NGN
          </div>
        </div>
      </aside>
    </>
  );
};
