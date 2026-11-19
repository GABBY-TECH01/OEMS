import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  Package,
  Users,
  Wrench,
  X,
  ArrowRight,
  CornerDownLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp, ActiveTab } from '../../context/AppContext';
import { Product, Customer, InstallationProject } from '../../types';
import {
  formatNaira,
  getAllowedTabsForUser,
  hasPermission,
} from '../../utils/formatters';

type SearchScope = 'all' | 'products' | 'customers' | 'projects';

interface SearchResultItem {
  id: string;
  entityType: 'product' | 'customer' | 'project';
  title: string;
  subtitleParts: string[];
  primaryValue?: string;
  secondaryValue?: string;
  secondaryTone?: 'default' | 'emerald' | 'amber' | 'rose';
  targetTab: ActiveTab;
  filterToken: string;
  score: number;
}

function formatCustomerType(type: Customer['type']): string {
  switch (type) {
    case 'solar_installer':
      return 'Solar Installer';
    case 'homeowner':
      return 'Homeowner';
    case 'business':
      return 'Business';
    case 'school':
      return 'School';
    case 'church':
      return 'Church';
    case 'hospital':
      return 'Hospital';
    case 'electrician':
      return 'Electrician';
    case 'dealer':
      return 'Dealer';
    case 'retail':
    default:
      return 'Retail';
  }
}

function formatProjectStatus(status: InstallationProject['status']): string {
  switch (status) {
    case 'lead':
      return 'Lead';
    case 'site_survey':
      return 'Site Survey';
    case 'quotation':
      return 'Quotation';
    case 'approved':
      return 'Approved';
    case 'scheduled':
      return 'Scheduled';
    case 'in_progress':
      return 'In Progress';
    case 'testing':
      return 'Testing';
    case 'completed':
      return 'Completed';
    case 'on_hold':
      return 'On Hold';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

function getProjectStatusTone(status: InstallationProject['status']): SearchResultItem['secondaryTone'] {
  switch (status) {
    case 'completed':
    case 'approved':
      return 'emerald';
    case 'in_progress':
    case 'testing':
    case 'scheduled':
    case 'on_hold':
      return 'amber';
    case 'cancelled':
      return 'rose';
    default:
      return 'default';
  }
}

function computeMatchScore(query: string, primaryFields: string[], secondaryFields: string[]): number {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return 1;

  const terms = trimmed.split(/\s+/).filter(Boolean);
  const allText = [...primaryFields, ...secondaryFields].join(' ').toLowerCase();

  for (const term of terms) {
    if (!allText.includes(term)) {
      return 0;
    }
  }

  let score = 10;
  for (const field of primaryFields) {
    const f = field.toLowerCase();
    if (f === trimmed) score += 100;
    else if (f.startsWith(trimmed)) score += 50;
    else if (f.includes(trimmed)) score += 25;
  }
  return score;
}

const HighlightMatch: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const trimmed = query.trim();
  if (!trimmed || !text) return <>{text}</>;

  const firstTerm = trimmed.split(/\s+/)[0];
  if (!firstTerm) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerTerm = firstTerm.toLowerCase();
  const idx = lowerText.indexOf(lowerTerm);
  if (idx === -1) return <>{text}</>;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + firstTerm.length);
  const after = text.slice(idx + firstTerm.length);

  return (
    <>
      {before}
      <mark className="bg-emerald-100 dark:bg-emerald-900/70 text-emerald-950 dark:text-emerald-200 rounded-xs px-0.5 font-semibold">
        {match}
      </mark>
      {after}
    </>
  );
};

export const GlobalSearch: React.FC = () => {
  const {
    products,
    customers,
    projects,
    currentUser,
    activeTab,
    setActiveTab,
    globalSearchQuery,
    setGlobalSearchQuery,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(globalSearchQuery);
  const [scope, setScope] = useState<SearchScope>('all');
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allowedTabs = useMemo(() => getAllowedTabsForUser(currentUser), [currentUser]);
  const canSearchProducts = allowedTabs.includes('inventory') || allowedTabs.includes('pos');
  const productTargetTab: ActiveTab = allowedTabs.includes('inventory') ? 'inventory' : 'pos';
  const canSearchCustomers = allowedTabs.includes('customers');
  const canSearchProjects = allowedTabs.includes('projects');
  const canViewFinancials = hasPermission(currentUser.role, 'view_financials', currentUser);

  const openModal = useCallback(() => {
    setLocalQuery(globalSearchQuery);
    setActiveIndex(0);
    setIsOpen(true);
  }, [globalSearchQuery]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Sync local query when modal opens or globalSearchQuery changes externally
  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 20);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  // Global keyboard shortcuts: Cmd/Ctrl + K and '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          closeModal();
        } else {
          openModal();
        }
        return;
      }

      if (e.key === '/' && !isOpen) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        const isEditable =
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          Boolean(target?.isContentEditable);
        if (!isEditable) {
          e.preventDefault();
          openModal();
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openModal, closeModal]);

  const matchedProducts = useMemo<SearchResultItem[]>(() => {
    if (!canSearchProducts) return [];
    const activeProducts = products.filter((p: Product) => p.status !== 'discontinued');
    const q = localQuery.trim();

    if (!q) {
      return activeProducts.slice(0, 4).map((p) => ({
        id: `product-${p.id}`,
        entityType: 'product',
        title: p.name,
        subtitleParts: [p.sku, p.brand, p.category].filter(Boolean),
        primaryValue: formatNaira(p.retailPrice),
        secondaryValue: `${p.currentStock} ${p.unit}${p.currentStock === 1 ? '' : 's'}`,
        secondaryTone:
          p.currentStock <= 0 ? 'rose' : p.currentStock <= p.reorderLevel ? 'amber' : 'emerald',
        targetTab: productTargetTab,
        filterToken: p.sku || p.name,
        score: 1,
      }));
    }

    return activeProducts
      .map((p) => {
        const score = computeMatchScore(
          q,
          [p.name, p.sku, p.model, p.barcode],
          [p.brand, p.category, p.warehouseLocation, p.description || '']
        );
        return { product: p, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ product: p, score }) => ({
        id: `product-${p.id}`,
        entityType: 'product' as const,
        title: p.name,
        subtitleParts: [p.sku, p.brand, p.category].filter(Boolean),
        primaryValue: formatNaira(p.retailPrice),
        secondaryValue: `${p.currentStock} ${p.unit}${p.currentStock === 1 ? '' : 's'}`,
        secondaryTone:
          p.currentStock <= 0 ? 'rose' : p.currentStock <= p.reorderLevel ? 'amber' : 'emerald',
        targetTab: productTargetTab,
        filterToken: p.sku || p.name,
        score,
      }));
  }, [products, localQuery, canSearchProducts, productTargetTab]);

  const matchedCustomers = useMemo<SearchResultItem[]>(() => {
    if (!canSearchCustomers) return [];
    const q = localQuery.trim();

    if (!q) {
      return customers.slice(0, 4).map((c: Customer) => ({
        id: `customer-${c.id}`,
        entityType: 'customer',
        title: c.name,
        subtitleParts: [formatCustomerType(c.type), c.phone, c.address].filter(Boolean),
        primaryValue: c.totalPurchases > 0 ? formatNaira(c.totalPurchases) : undefined,
        secondaryValue: `${c.pricingTier.charAt(0).toUpperCase()}${c.pricingTier.slice(1)} Tier`,
        secondaryTone: c.outstandingBalance > 0 ? 'amber' : 'default',
        targetTab: 'customers',
        filterToken: c.phone || c.name,
        score: 1,
      }));
    }

    return customers
      .map((c) => {
        const score = computeMatchScore(
          q,
          [c.name, c.phone, c.contactPerson || ''],
          [
            c.email || '',
            c.address || '',
            formatCustomerType(c.type),
            c.pricingTier,
            c.installerDetails?.territory || '',
          ]
        );
        return { customer: c, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map(({ customer: c, score }) => ({
        id: `customer-${c.id}`,
        entityType: 'customer' as const,
        title: c.name,
        subtitleParts: [formatCustomerType(c.type), c.phone, c.address].filter(Boolean),
        primaryValue: c.totalPurchases > 0 ? formatNaira(c.totalPurchases) : undefined,
        secondaryValue:
          c.outstandingBalance > 0
            ? `Balance: ${formatNaira(c.outstandingBalance)}`
            : `${c.pricingTier.charAt(0).toUpperCase()}${c.pricingTier.slice(1)} Tier`,
        secondaryTone: c.outstandingBalance > 0 ? 'amber' : 'default',
        targetTab: 'customers' as const,
        filterToken: c.phone || c.name,
        score,
      }));
  }, [customers, localQuery, canSearchCustomers]);

  const matchedProjects = useMemo<SearchResultItem[]>(() => {
    if (!canSearchProjects) return [];
    const q = localQuery.trim();

    if (!q) {
      return projects.slice(0, 4).map((p: InstallationProject) => ({
        id: `project-${p.id}`,
        entityType: 'project',
        title: p.title,
        subtitleParts: [p.projectCode, p.customerName, p.siteAddress].filter(Boolean),
        primaryValue: canViewFinancials ? formatNaira(p.contractAmount) : p.capacityDescription,
        secondaryValue: formatProjectStatus(p.status),
        secondaryTone: getProjectStatusTone(p.status),
        targetTab: 'projects',
        filterToken: p.projectCode || p.title,
        score: 1,
      }));
    }

    return projects
      .map((p) => {
        const score = computeMatchScore(
          q,
          [p.projectCode, p.title, p.customerName],
          [p.siteAddress, p.customerPhone, p.capacityDescription, p.leadTechnicianName, p.status]
        );
        return { project: p, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map(({ project: p, score }) => ({
        id: `project-${p.id}`,
        entityType: 'project' as const,
        title: p.title,
        subtitleParts: [p.projectCode, p.customerName, p.siteAddress].filter(Boolean),
        primaryValue: canViewFinancials ? formatNaira(p.contractAmount) : p.capacityDescription,
        secondaryValue: formatProjectStatus(p.status),
        secondaryTone: getProjectStatusTone(p.status),
        targetTab: 'projects' as const,
        filterToken: p.projectCode || p.title,
        score,
      }));
  }, [projects, localQuery, canSearchProjects, canViewFinancials]);

  // Keep scope valid if role changed
  useEffect(() => {
    if (scope === 'products' && !canSearchProducts) setScope('all');
    if (scope === 'customers' && !canSearchCustomers) setScope('all');
    if (scope === 'projects' && !canSearchProjects) setScope('all');
  }, [scope, canSearchProducts, canSearchCustomers, canSearchProjects]);

  const visibleResults = useMemo<SearchResultItem[]>(() => {
    if (scope === 'products') return matchedProducts;
    if (scope === 'customers') return matchedCustomers;
    if (scope === 'projects') return matchedProjects;

    if (!localQuery.trim()) {
      return [...matchedProducts, ...matchedCustomers, ...matchedProjects];
    }

    return [...matchedProducts, ...matchedCustomers, ...matchedProjects].sort(
      (a, b) => b.score - a.score
    );
  }, [scope, matchedProducts, matchedCustomers, matchedProjects, localQuery]);

  // Keep activeIndex in bounds
  useEffect(() => {
    setActiveIndex(0);
  }, [localQuery, scope]);

  const handleSelectResult = useCallback(
    (item: SearchResultItem) => {
      setGlobalSearchQuery(item.filterToken);
      setActiveTab(item.targetTab);
      setIsOpen(false);
    },
    [setGlobalSearchQuery, setActiveTab]
  );

  const handleApplyAsFilter = useCallback(() => {
    const trimmed = localQuery.trim();
    setGlobalSearchQuery(trimmed);
    setIsOpen(false);
  }, [localQuery, setGlobalSearchQuery]);

  const handleClearSearch = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setLocalQuery('');
      setGlobalSearchQuery('');
      if (isOpen) {
        inputRef.current?.focus();
      }
    },
    [isOpen, setGlobalSearchQuery]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (visibleResults.length > 0) {
        setActiveIndex((prev) => {
          const next = (prev + 1) % visibleResults.length;
          const el = listRef.current?.querySelector(`[data-result-index="${next}"]`);
          el?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (visibleResults.length > 0) {
        setActiveIndex((prev) => {
          const next = (prev - 1 + visibleResults.length) % visibleResults.length;
          const el = listRef.current?.querySelector(`[data-result-index="${next}"]`);
          el?.scrollIntoView({ block: 'nearest' });
          return next;
        });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = visibleResults[activeIndex];
      if (chosen) {
        handleSelectResult(chosen);
      } else {
        handleApplyAsFilter();
      }
    }
  };

  const totalCount =
    matchedProducts.length + matchedCustomers.length + matchedProjects.length;

  const getEntityIcon = (type: SearchResultItem['entityType']) => {
    switch (type) {
      case 'product':
        return <Package className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />;
      case 'customer':
        return <Users className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0" />;
      case 'project':
        return <Wrench className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />;
    }
  };

  const getEntityLabel = (type: SearchResultItem['entityType']) => {
    switch (type) {
      case 'product':
        return productTargetTab === 'pos' ? 'POS Catalog' : 'Product';
      case 'customer':
        return 'Customer';
      case 'project':
        return 'Project';
    }
  };

  const getToneClass = (tone: SearchResultItem['secondaryTone']) => {
    switch (tone) {
      case 'emerald':
        return 'text-emerald-700 dark:text-emerald-400';
      case 'amber':
        return 'text-amber-700 dark:text-amber-400';
      case 'rose':
        return 'text-rose-700 dark:text-rose-400';
      default:
        return 'text-slate-500 dark:text-slate-400';
    }
  };

  const hasAnySearchScope = canSearchProducts || canSearchCustomers || canSearchProjects;
  if (!hasAnySearchScope) {
    return null;
  }

  return (
    <>
      {/* Header Search Trigger (responsive, never squishes) */}
      <div className="flex items-center shrink-0">
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={openModal}
            aria-label="Search products, customers, or projects (Ctrl+K)"
            title="Global Search: Products, Customers & Solar Projects (Ctrl+K or /)"
            className={`group flex items-center gap-2 rounded-lg border transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              globalSearchQuery
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 px-2.5 py-1.5 lg:w-48 xl:w-56 2xl:w-64'
                : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-2.5 py-1.5 lg:w-44 xl:w-56 2xl:w-64'
            }`}
          >
            <Search
              className={`w-4 h-4 shrink-0 ${
                globalSearchQuery
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
              }`}
            />
            <span className="hidden lg:inline flex-1 text-left text-xs truncate">
              {globalSearchQuery ? (
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                  Filter: {globalSearchQuery}
                </span>
              ) : (
                'Search products, customers, projects...'
              )}
            </span>
            <span className="hidden sm:inline lg:hidden text-xs font-medium">
              {globalSearchQuery ? globalSearchQuery.slice(0, 12) : 'Search'}
            </span>
            {!globalSearchQuery && (
              <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                Ctrl K
              </kbd>
            )}
          </button>

          {globalSearchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear active search filter"
              title="Clear active search filter"
              className="ml-1 p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Global Search Command Palette Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="Global system search"
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Search Input Row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <Search className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search products, SKUs, customers, phone numbers, or projects..."
                aria-label="Search across products, customers, and projects"
                className="flex-1 bg-transparent border-0 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0"
              />
              {localQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close global search"
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter Segmented Bar */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                    scope === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({totalCount})
                </button>
                {canSearchProducts && (
                  <button
                    type="button"
                    onClick={() => setScope('products')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                      scope === 'products'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Products ({matchedProducts.length})
                  </button>
                )}
                {canSearchCustomers && (
                  <button
                    type="button"
                    onClick={() => setScope('customers')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                      scope === 'customers'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Customers ({matchedCustomers.length})
                  </button>
                )}
                {canSearchProjects && (
                  <button
                    type="button"
                    onClick={() => setScope('projects')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                      scope === 'projects'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Projects ({matchedProjects.length})
                  </button>
                )}
              </div>

              {localQuery.trim() && (
                <button
                  type="button"
                  onClick={handleApplyAsFilter}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md transition-colors whitespace-nowrap shrink-0"
                  title="Filter the current module using this search query"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filter Current Page</span>
                </button>
              )}
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              role="listbox"
              aria-label="Search results"
              className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
            >
              {!localQuery.trim() && (
                <div className="px-4 py-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900/40">
                  Quick Preview Across System
                </div>
              )}

              {visibleResults.length === 0 ? (
                <div className="py-12 px-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Search className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {localQuery.trim()
                        ? `No matches found for "${localQuery.trim()}"`
                        : 'No records available in this category yet'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Try searching by product name, SKU, customer phone, or project code.
                    </p>
                  </div>
                  {localQuery.trim() && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="px-4 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                visibleResults.map((item, idx) => {
                  const isHighlighted = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      data-result-index={idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelectResult(item)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                        isHighlighted
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                          {getEntityIcon(item.entityType)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              <HighlightMatch text={item.title} query={localQuery} />
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                              · {getEntityLabel(item.entityType)}
                            </span>
                          </div>
                          {item.subtitleParts.length > 0 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {item.subtitleParts.map((part, pIdx) => (
                                <React.Fragment key={`${item.id}-part-${pIdx}`}>
                                  {pIdx > 0 && (
                                    <span className="mx-1.5 text-slate-300 dark:text-slate-600" aria-hidden="true">
                                      ·
                                    </span>
                                  )}
                                  <HighlightMatch text={part} query={localQuery} />
                                </React.Fragment>
                              ))}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        {(item.primaryValue || item.secondaryValue) && (
                          <div className="hidden sm:block">
                            {item.primaryValue && (
                              <p className="text-xs font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                                {item.primaryValue}
                              </p>
                            )}
                            {item.secondaryValue && (
                              <p
                                className={`text-[11px] font-medium tabular-nums ${getToneClass(
                                  item.secondaryTone
                                )}`}
                              >
                                {item.secondaryValue}
                              </p>
                            )}
                          </div>
                        )}
                        <ArrowRight
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isHighlighted
                              ? 'text-emerald-700 dark:text-emerald-400 translate-x-0.5'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Shortcuts & Active Module Context */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">
                    ↑↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] inline-flex items-center">
                    <CornerDownLeft className="w-2.5 h-2.5" />
                  </kbd>
                  <span>Open record</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">
                    Esc
                  </kbd>
                  <span>Close</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                {globalSearchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="text-rose-600 dark:text-rose-400 font-semibold hover:underline"
                  >
                    Clear Active Filter
                  </button>
                )}
                <span className="hidden md:inline font-mono">
                  Active view: {activeTab.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
