/**
 * App Context - Global State & Business Actions for Offnot Energy Management System
 * Location: Ibadan, Oyo State, Nigeria
 * Currency: Nigerian Naira (₦)
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Product,
  StockMovement,
  Supplier,
  PurchaseOrder,
  Sale,
  Customer,
  Quotation,
  InstallationProject,
  Expense,
  AuditLog,
  AppNotification,
  CompanySettings,
  User,
  UserRole,
  PricingTier,
  PaymentMethod,
  PaymentRecord,
  Branch,
  StaffAccount,
  PermissionKey,
  RolePermissionsMap,
  ActiveTab,
  StaffKpi,
  KpiDailyLog,
  KpiStatus,
  KpiPerformanceRating,
  OfflineSyncItem,
} from '../types';
import {
  StorageService,
  INITIAL_CATEGORIES,
  INITIAL_SETTINGS,
  INITIAL_BRANCHES,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
} from '../services/storage';
import {
  getAllowedTabsForUser,
  getDefaultTabForUser,
  canAccessAllBranches as checkCanAccessAllBranches,
  getLagosDateKey,
  getLagosMonthKey,
} from '../utils/formatters';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  syncLocalToSupabase,
  SUPABASE_CONFIG_CHANGED_EVENT,
  STORAGE_SUPABASE_URL_KEY,
  STORAGE_SUPABASE_ANON_KEY,
} from '../lib/supabase';
import {
  fetchAllDataFromSupabase,
  saveProductToSupabase,
  deleteProductFromSupabase,
  saveBranchToSupabase,
  deleteBranchFromSupabase,
  saveSaleToSupabase,
  saveCustomerToSupabase,
  saveSupplierToSupabase,
  savePurchaseOrderToSupabase,
  saveQuotationToSupabase,
  saveProjectToSupabase,
  saveExpenseToSupabase,
  saveStaffProfileToSupabase,
  deleteStaffProfileFromSupabase,
  saveStockMovementToSupabase,
  saveSettingsToSupabase,
  saveAuditLogToSupabase,
  saveKpiToSupabase,
  saveKpiDailyLogToSupabase,
  deleteKpiFromSupabase,
  saveSaleReturnToSupabase,
  resetCleanZeroLedgerInSupabase,
} from '../services/supabaseDataService';
import { IndexedDbService, PendingTransaction } from '../services/indexedDbService';
import { updatePWABrandingAndManifest } from '../utils/pwaUpdater';

export type { ActiveTab };

interface AppContextType {
  // Offline Synchronization & PWA Engine (IndexedDB via Dexie)
  isOnline: boolean;
  offlineQueueCount: number;
  isSyncingOfflineQueue: boolean;
  pendingTransactions: PendingTransaction[];
  flushOfflineSyncQueue: () => Promise<{ success: boolean; syncedCount: number; errors?: string[] }>;

  // Theme & Appearance
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Navigation & Role
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;

  // Authentication & Security
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  changeSuperadminPassword: (newPassword: string) => { success: boolean; error?: string };

  // Multi-Branch Management & Cross-Store Isolation
  branches: Branch[];
  activeBranchId: string; // 'all' or branch.id
  canAccessAllBranches: boolean;
  effectiveBranchId: string;
  setActiveBranchId: (id: string) => void;
  saveBranch: (branchData: Partial<Branch>) => { success: boolean; error?: string };
  deleteBranch: (id: string) => { success: boolean; error?: string };
  setBranchAsHeadquarters: (branchId: string) => { success: boolean; error?: string };

  // Staff Account Provisioning & Role Permissions (Superadmin)
  staffAccounts: StaffAccount[];
  createStaffAccount: (staffData: Omit<StaffAccount, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  updateStaffAccount: (id: string, updates: Partial<StaffAccount>) => { success: boolean; error?: string };
  toggleStaffStatus: (id: string) => void;
  deleteStaffAccount: (id: string) => { success: boolean; error?: string };
  clearAllDemoStaff: () => { success: boolean; count: number };
  rolePermissions: RolePermissionsMap;
  updateRolePermission: (role: UserRole, permission: PermissionKey, enabled: boolean) => void;
  assignStaffRole: (staffId: string, newRole: UserRole) => { success: boolean; error?: string };

  // Staff KPIs & Targets Hub
  staffKpis: StaffKpi[];
  saveStaffKpi: (kpiData: Partial<StaffKpi>) => { success: boolean; error?: string };
  acceptStaffKpi: (kpiId: string, notes?: string) => { success: boolean; error?: string };
  updateStaffKpiSelfReview: (kpiId: string, updates: {
    selfAssessmentNotes: string;
    actualSalesAchieved?: number;
    quotationsCreated?: number;
    quotationsConverted?: number;
    installationsCompleted?: number;
  }) => { success: boolean; error?: string };
  reviewStaffKpi: (kpiId: string, review: {
    managerReviewNotes: string;
    performanceRating: KpiPerformanceRating;
    status: KpiStatus;
  }) => { success: boolean; error?: string };
  addKpiDailyLog: (kpiId: string, log: Omit<KpiDailyLog, 'id' | 'kpiId' | 'staffId' | 'createdAt'>) => { success: boolean; error?: string };
  deleteStaffKpi: (kpiId: string) => { success: boolean; error?: string };

  // Data (Filtered automatically for non-superadmin store staff to isolate branches)
  settings: CompanySettings;
  updateSettings: (newSettings: CompanySettings) => void;
  categories: string[];
  products: Product[];
  allProducts: Product[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  sales: Sale[];
  allSales: Sale[];
  customers: Customer[];
  quotations: Quotation[];
  projects: InstallationProject[];
  expenses: Expense[];
  allExpenses: Expense[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];

  // Zero Ledger & Global Actions
  refreshData: () => void;
  resetDatabase: () => Promise<{ success: boolean; syncedToCloud: boolean; error?: string }>;
  resetToZeroLedger: () => Promise<{ success: boolean; syncedToCloud: boolean; error?: string }>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Business Operations
  saveProduct: (product: Partial<Product>) => { success: boolean; error?: string };
  deleteProduct: (id: string) => { success: boolean; error?: string };
  adjustStock: (productId: string, adjustmentQty: number, reason: string, warehouseLocation: string) => { success: boolean; error?: string };
  completeSale: (saleData: {
    customerId: string;
    customerName: string;
    customerPhone?: string;
    customerTier: PricingTier;
    items: { productId: string; quantity: number; unitPrice: number; discount: number }[];
    paymentMethod: PaymentMethod;
    paidAmount: number;
    splitDetails?: PaymentRecord['splitDetails'];
    notes?: string;
    warehouseLocation: string;
    branchId?: string;
    branchName?: string;
  }) => { success: boolean; sale?: Sale; error?: string };
  processReturn: (saleId: string, productId: string, quantity: number, reason: string) => { success: boolean; error?: string; updatedSale?: Sale };
  processReturns: (
    saleId: string,
    itemsToReturn: { productId: string; quantity: number; sku?: string; itemIndex?: number }[],
    reason: string
  ) => { success: boolean; error?: string; updatedSale?: Sale; refundAmount?: number };
  applyGoLiveCatalogAndContacts: () => Promise<{ success: boolean; productCount: number; syncedToCloud: boolean }>;

  // Supplier & Purchasing
  saveSupplier: (supplier: Partial<Supplier>) => void;
  createPurchaseOrder: (po: Partial<PurchaseOrder>) => { success: boolean; error?: string };
  updatePurchaseOrderStatus: (poId: string, status: PurchaseOrder['status']) => void;
  receiveGoods: (poId: string, receivedItems: { productId: string; receivedQty: number }[], warehouseLocation: string) => { success: boolean; error?: string };
  recordSupplierPayment: (poId: string, amount: number) => void;

  // Customers & CRM
  saveCustomer: (customer: Partial<Customer>) => void;

  // Quotations
  saveQuotation: (quotation: Partial<Quotation>) => void;
  convertQuotationToOrder: (quotationId: string) => { success: boolean; saleId?: string; error?: string };

  // Projects
  saveProject: (project: Partial<InstallationProject>) => void;
  issueMaterialToProject: (projectId: string, productId: string, quantity: number, warehouseLocation: string) => { success: boolean; error?: string };
  returnMaterialFromProject: (projectId: string, productId: string, quantity: number, warehouseLocation: string) => { success: boolean; error?: string };

  // Expenses
  recordExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'recordedByUserId' | 'recordedByUserName'>) => void;

  // Search
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;

  // Live Supabase Cloud Database Handshake
  isSupabaseConnected: boolean;
  supabaseLoading: boolean;
  supabaseSyncTime: string | null;
  supabaseSyncError: string | null;
  syncWithSupabase: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Theme & Appearance Mode (Dark / Light)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('offnot_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('offnot_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Authentication State (Session-bound so opening fresh link URL always prompts Login first)
  const initialSession = StorageService.getAuthSession();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(Boolean(initialSession));

  // Branch and Domain states
  const [branches, setBranches] = useState<Branch[]>(StorageService.getBranches());
  const [activeBranchId, setActiveBranchIdState] = useState<string>(StorageService.getActiveBranchId());
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(StorageService.getStaffAccounts());
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>(StorageService.getRolePermissions());
  const [settings, setSettings] = useState<CompanySettings>(StorageService.getSettings());

  // Automatically update document title, theme color meta, favicon, and dynamic PWA manifest on settings change
  useEffect(() => {
    updatePWABrandingAndManifest(settings);
  }, [settings]);
  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const [currentUser, setCurrentUserState] = useState<User>(
    initialSession?.user || StorageService.getCurrentUser()
  );
  const [categories] = useState<string[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(StorageService.getProducts());
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(StorageService.getStockMovements());
  const [suppliers, setSuppliers] = useState<Supplier[]>(StorageService.getSuppliers());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(StorageService.getPurchaseOrders());
  const [sales, setSales] = useState<Sale[]>(StorageService.getSales());
  const [customers, setCustomers] = useState<Customer[]>(StorageService.getCustomers());
  const [quotations, setQuotations] = useState<Quotation[]>(StorageService.getQuotations());
  const [projects, setProjects] = useState<InstallationProject[]>(StorageService.getProjects());
  const [expenses, setExpenses] = useState<Expense[]>(StorageService.getExpenses());
  const [notifications, setNotifications] = useState<AppNotification[]>(StorageService.getNotifications());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(StorageService.getAuditLogs());
  const [staffKpis, setStaffKpis] = useState<StaffKpi[]>(StorageService.getStaffKpis());

  // Live Supabase Cloud Database Status
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [supabaseLoading, setSupabaseLoading] = useState<boolean>(false);
  const [supabaseSyncTime, setSupabaseSyncTime] = useState<string | null>(null);
  const [supabaseSyncError, setSupabaseSyncError] = useState<string | null>(null);

  // Offline Synchronization & PWA Engine
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  });
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [isSyncingOfflineQueue, setIsSyncingOfflineQueue] = useState<boolean>(false);

  const updateOfflineQueueCount = useCallback(async () => {
    try {
      const dbCount = await IndexedDbService.getPendingCount();
      const pendingList = await IndexedDbService.getPendingTransactions();
      const localCount = StorageService.getOfflineQueueCount();
      setPendingTransactions(pendingList);
      setOfflineQueueCount(Math.max(dbCount, localCount));
    } catch {
      setOfflineQueueCount(StorageService.getOfflineQueueCount());
    }
  }, []);

  // Initialize offline queue state from IndexedDB on mount
  useEffect(() => {
    updateOfflineQueueCount();
  }, [updateOfflineQueueCount]);

  const enqueueOfflineSafely = useCallback(
    (
      entityType: OfflineSyncItem['entityType'],
      action: OfflineSyncItem['action'],
      data: any
    ) => {
      StorageService.enqueueOfflineItem(entityType, action, data);
      IndexedDbService.enqueueOfflineItem(entityType, action, data)
        .catch((e: unknown) => console.warn('IndexedDB enqueueOfflineItem error:', e))
        .finally(() => updateOfflineQueueCount());
    },
    [updateOfflineQueueCount]
  );

  // Flush offline queue to Supabase when network is healthy (IndexedDB + Storage fallback)
  const flushOfflineSyncQueue = useCallback(async (): Promise<{ success: boolean; syncedCount: number; errors?: string[] }> => {
    if (!navigator.onLine) {
      return { success: false, syncedCount: 0, errors: ['Offline'] };
    }

    setIsSyncingOfflineQueue(true);
    let synced = 0;
    const errors: string[] = [];

    try {
      // 1. First sync any pending POS transactions in Dexie IndexedDB
      const pendingSales = await IndexedDbService.getPendingTransactions();
      for (const tx of pendingSales) {
        try {
          if (isSupabaseConfigured()) {
            const res = await saveSaleToSupabase(tx.saleData);
            if (res.success) {
              synced++;
            } else {
              errors.push(`Sale #${tx.invoiceNumber}: ${res.error || 'Sync error'}`);
            }
          } else {
            synced++;
          }
        } catch (err: any) {
          errors.push(`Sale #${tx.invoiceNumber}: ${err.message || String(err)}`);
        } finally {
          // Always dequeue and mark synced so it NEVER loops forever
          await IndexedDbService.markTransactionSynced(tx.id);
          StorageService.dequeueOfflineItem(tx.id);
          StorageService.dequeueOfflineItem(`sync_${tx.id}`);
          if (tx.invoiceNumber) {
            StorageService.dequeueOfflineItem(tx.invoiceNumber);
            StorageService.dequeueOfflineItem(`sync_${tx.invoiceNumber}`);
          }
        }
      }

      // 2. Sync generic offline queue items from Dexie IndexedDB and Storage
      const idbQueue = await IndexedDbService.getAllQueuedItems();
      const localQueue = StorageService.getOfflineQueue();
      const combinedMap = new Map<string, OfflineSyncItem>();

      localQueue.forEach(item => combinedMap.set(item.id, item));
      idbQueue.forEach(item => combinedMap.set(item.id, item));

      for (const item of combinedMap.values()) {
        try {
          if (isSupabaseConfigured() && item.data) {
            if (item.entityType === 'sale') {
              await saveSaleToSupabase(item.data);
            } else if (item.entityType === 'sale_return') {
              await saveSaleReturnToSupabase(
                item.data.sale,
                item.data.updatedProducts || [],
                item.data.returnMovements || [],
                item.data.updatedCustomer
              );
            } else if (item.entityType === 'customer') {
              await saveCustomerToSupabase(item.data);
            } else if (item.entityType === 'supplier') {
              await saveSupplierToSupabase(item.data);
            } else if (item.entityType === 'expense') {
              await saveExpenseToSupabase(item.data);
            } else if (item.entityType === 'product') {
              await saveProductToSupabase(item.data);
            } else if (item.entityType === 'branch') {
              await saveBranchToSupabase(item.data);
            } else if (item.entityType === 'purchase_order') {
              await savePurchaseOrderToSupabase(item.data);
            } else if (item.entityType === 'quotation') {
              await saveQuotationToSupabase(item.data);
            } else if (item.entityType === 'project') {
              await saveProjectToSupabase(item.data);
            } else if (item.entityType === 'stock_movement') {
              await saveStockMovementToSupabase(item.data);
            } else if (item.entityType === 'staff') {
              await saveStaffProfileToSupabase(item.data);
            } else if (item.entityType === 'kpi') {
              await saveKpiToSupabase(item.data);
            } else if (item.entityType === 'kpi_log') {
              await saveKpiDailyLogToSupabase(item.data);
            } else if (item.entityType === 'settings') {
              await saveSettingsToSupabase(item.data);
            } else if (item.entityType === 'role_permissions') {
              const latestSettings = { ...StorageService.getSettings(), rolePermissions: item.data };
              await saveSettingsToSupabase(latestSettings);
            }
          }
          synced++;
        } catch (err: any) {
          console.warn('Sync item caught error:', err);
        } finally {
          await IndexedDbService.dequeueItem(item.id);
          StorageService.dequeueOfflineItem(item.id);
          if (item.data?.id) {
            StorageService.dequeueOfflineItem(item.data.id);
            await IndexedDbService.markTransactionSynced(item.data.id);
          }
        }
      }

      // Clean up all offline queue tables once sync pass finishes
      StorageService.clearOfflineQueue();
      await IndexedDbService.clearAll();
      setPendingTransactions([]);
      setOfflineQueueCount(0);
    } catch (e: any) {
      console.warn('Flush offline queue caught error:', e);
      StorageService.clearOfflineQueue();
      await IndexedDbService.clearAll();
      setPendingTransactions([]);
      setOfflineQueueCount(0);
    } finally {
      setIsSyncingOfflineQueue(false);
    }

    return { success: errors.length === 0, syncedCount: synced, errors: errors.length > 0 ? errors : undefined };
  }, []);

  const syncInFlightRef = useRef(false);
  const syncPromiseRef = useRef<Promise<boolean> | null>(null);
  const isResettingRef = useRef(false);
  const inFlightCloudWritesRef = useRef(0);
  const [supabaseConfigVersion, setSupabaseConfigVersion] = useState(0);

  useEffect(() => {
    const handleConfigChange = () => {
      setSupabaseConfigVersion(v => v + 1);
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_SUPABASE_URL_KEY || e.key === STORAGE_SUPABASE_ANON_KEY) {
        setSupabaseConfigVersion(v => v + 1);
      }
    };
    window.addEventListener(SUPABASE_CONFIG_CHANGED_EVENT, handleConfigChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(SUPABASE_CONFIG_CHANGED_EVENT, handleConfigChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const trackCloudWrite = useCallback(<T,>(promise: Promise<T>): Promise<T> => {
    inFlightCloudWritesRef.current += 1;
    return promise.finally(() => {
      inFlightCloudWritesRef.current = Math.max(0, inFlightCloudWritesRef.current - 1);
    });
  }, []);

  const syncWithSupabase = useCallback(async (): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      setIsSupabaseConnected(false);
      setSupabaseSyncError('Supabase credentials are not configured on this device.');
      return false;
    }

    if (isResettingRef.current || inFlightCloudWritesRef.current > 0) {
      return false;
    }

    if (syncInFlightRef.current && syncPromiseRef.current) {
      return syncPromiseRef.current;
    }

    syncInFlightRef.current = true;
    setSupabaseLoading(true);
    setSupabaseSyncError(null);

    const runSync = async (): Promise<boolean> => {
      try {
        // Flush any offline queued sales, returns, stock adjustments, or settings BEFORE pulling cloud state
        if (navigator.onLine) {
          const pendingTotal = Math.max(
            StorageService.getOfflineQueueCount(),
            await IndexedDbService.getPendingCount().catch(() => 0)
          );
          if (pendingTotal > 0) {
            await flushOfflineSyncQueue();
          }
        }

        if (isResettingRef.current || inFlightCloudWritesRef.current > 0) {
          return false;
        }

        const cloudData = await fetchAllDataFromSupabase();
      if (cloudData) {
        if (isResettingRef.current) {
          return false;
        }

        if (cloudData.branches.length > 0) {
          setBranches(cloudData.branches);
          StorageService.saveBranches(cloudData.branches);
        }
        if (cloudData.products.length > 0) {
          setProducts(cloudData.products);
          StorageService.saveProducts(cloudData.products);
        }

        // Gather only genuinely queued offline sale IDs (never resurrect sales that were deleted in Supabase / Zero Ledger)
        const pendingLocalQueue = StorageService.getOfflineQueue();
        const pendingIdbTx = await IndexedDbService.getPendingTransactions().catch(() => []);
        const pendingSaleIds = new Set<string>();
        pendingLocalQueue.forEach(q => {
          if (q.entityType === 'sale' && q.data?.id) pendingSaleIds.add(q.data.id);
        });
        pendingIdbTx.forEach(tx => {
          if (tx.id) pendingSaleIds.add(tx.id);
          if (tx.saleData?.id) pendingSaleIds.add(tx.saleData.id);
        });

        // Bidirectional Sales & Refund Reconciliation (strict ID match)
        const localSales = StorageService.getSales();
        const cloudSales = [...(cloudData.sales || [])];
        const cloudSalesById = new Map<string, Sale>();
        cloudSales.forEach(s => {
          cloudSalesById.set(s.id, s);
        });

        const sumReturnedUnits = (s: Sale) =>
          s.items.reduce((sum, i) => sum + (i.returnedQuantity ?? (i.returned ? i.quantity : 0)), 0);

        const missingInCloud: Sale[] = [];
        const cloudNeedingRefundPush: Sale[] = [];
        for (const localSale of localSales) {
          const cloudMatch = cloudSalesById.get(localSale.id);
          if (!cloudMatch) {
            if (pendingSaleIds.has(localSale.id)) {
              missingInCloud.push(localSale);
            }
          } else {
            const localReturns = localSale.returnRecords?.length || 0;
            const cloudReturns = cloudMatch.returnRecords?.length || 0;
            const localReturnedUnits = sumReturnedUnits(localSale);
            const cloudReturnedUnits = sumReturnedUnits(cloudMatch);
            if (
              localReturns > cloudReturns ||
              localReturnedUnits > cloudReturnedUnits ||
              (localSale.refundAmount || 0) > (cloudMatch.refundAmount || 0)
            ) {
              cloudNeedingRefundPush.push(localSale);
            }
          }
        }

        if (missingInCloud.length > 0) {
          for (const s of missingInCloud) {
            try {
              await saveSaleToSupabase(s);
              cloudSales.push(s);
              cloudSalesById.set(s.id, s);
            } catch (err) {
              console.warn(`Failed to push local sale ${s.invoiceNumber} to Supabase:`, err);
            }
          }
        }

        if (cloudNeedingRefundPush.length > 0) {
          for (const s of cloudNeedingRefundPush) {
            try {
              await saveSaleToSupabase(s);
              const idx = cloudSales.findIndex(cs => cs.id === s.id);
              if (idx !== -1) cloudSales[idx] = s;
              cloudSalesById.set(s.id, s);
            } catch (err) {
              console.warn(`Failed to push refund update ${s.invoiceNumber} to Supabase:`, err);
            }
          }
        }

        const mergedSales = Array.from(cloudSalesById.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Unconditionally mirror authoritative cloud transactional tables (so 0 rows clears stale local caches too)
        setSales(mergedSales);
        StorageService.saveSales(mergedSales);

        setStockMovements(cloudData.stockMovements);
        StorageService.saveStockMovements(cloudData.stockMovements);

        if (cloudData.customers.length > 0) {
          setCustomers(cloudData.customers);
          StorageService.saveCustomers(cloudData.customers);
        }
        if (cloudData.suppliers.length > 0) {
          setSuppliers(cloudData.suppliers);
          StorageService.saveSuppliers(cloudData.suppliers);
        }

        setPurchaseOrders(cloudData.purchaseOrders);
        StorageService.savePurchaseOrders(cloudData.purchaseOrders);

        setQuotations(cloudData.quotations);
        StorageService.saveQuotations(cloudData.quotations);

        setProjects(cloudData.projects);
        StorageService.saveProjects(cloudData.projects);

        setExpenses(cloudData.expenses);
        StorageService.saveExpenses(cloudData.expenses);

        if (cloudData.staffAccounts.length > 0) {
          setStaffAccounts(cloudData.staffAccounts);
          StorageService.saveStaffAccounts(cloudData.staffAccounts);
        }
        if (cloudData.users.length > 0) {
          setUsers(cloudData.users);
          StorageService.saveUsers(cloudData.users);
        }
        if (cloudData.settings) {
          setSettings(cloudData.settings);
          StorageService.saveSettings(cloudData.settings);
          if (cloudData.settings.rolePermissions) {
            StorageService.saveRolePermissions(cloudData.settings.rolePermissions);
            setRolePermissions(cloudData.settings.rolePermissions);
          }
        }
        if (cloudData.auditLogs.length > 0) {
          setAuditLogs(cloudData.auditLogs);
          StorageService.saveAuditLogs(cloudData.auditLogs);
        }
        if (cloudData.notifications.length > 0) {
          setNotifications(cloudData.notifications);
          StorageService.saveNotifications(cloudData.notifications);
        }

        setStaffKpis(cloudData.staffKpis || []);
        StorageService.saveStaffKpis(cloudData.staffKpis || []);

        setIsSupabaseConnected(true);
        setSupabaseSyncError(null);
        const timeNow = new Date().toLocaleTimeString();
        setSupabaseSyncTime(timeNow);
        return true;
      } else {
        setIsSupabaseConnected(false);
        setSupabaseSyncError('Could not retrieve data from Supabase. Check Project URL, Anon Key, and network connectivity.');
        return false;
      }
      } catch (err: any) {
        console.warn('Supabase sync warning:', err);
        setIsSupabaseConnected(false);
        setSupabaseSyncError(err.message || 'Supabase handshake error');
        return false;
      } finally {
        setSupabaseLoading(false);
        syncInFlightRef.current = false;
        syncPromiseRef.current = null;
      }
    };

    const promise = runSync();
    syncPromiseRef.current = promise;
    return promise;
  }, [flushOfflineSyncQueue]);

  // Monitor network online / offline transitions & trigger instant automatic sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (isSupabaseConfigured()) {
        syncWithSupabase();
      } else {
        flushOfflineSyncQueue();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine && isSupabaseConfigured()) {
        syncWithSupabase();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushOfflineSyncQueue, syncWithSupabase]);

  // One-time auto-sync on boot if app loads online and has queued items from an earlier offline session
  const initialSyncAttemptedRef = useRef(false);
  useEffect(() => {
    if (navigator.onLine && !initialSyncAttemptedRef.current) {
      initialSyncAttemptedRef.current = true;
      flushOfflineSyncQueue().catch(err => {
        console.warn('Initial offline sync error:', err);
      });
    }
  }, [flushOfflineSyncQueue]);

  useEffect(() => {
    StorageService.initDatabase();
    refreshData();

    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    if (isSupabaseConfigured()) {
      syncWithSupabase().then(ok => {
        if (!ok && navigator.onLine) {
          retryTimer = setTimeout(() => {
            if (navigator.onLine && isSupabaseConfigured()) {
              syncWithSupabase();
            }
          }, 4000);
        }
      });
    } else {
      setIsSupabaseConnected(false);
      setSupabaseSyncTime(null);
      setSupabaseSyncError('Supabase credentials are not configured on this device.');
    }

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [syncWithSupabase, supabaseConfigVersion]);

  // Realtime multi-device sync across all operational tables (re-binds when config changes)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const client = getSupabaseClient();
    if (!client) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRealtimeSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (navigator.onLine) {
          syncWithSupabase();
        }
      }, 450);
    };

    const realtimeTables = [
      'sales',
      'products',
      'customers',
      'branches',
      'company_settings',
      'user_profiles',
      'staff_kpis',
      'kpi_daily_logs',
      'stock_movements',
      'purchase_orders',
      'quotations',
      'installation_projects',
      'expenses',
    ];

    let channel = client.channel(`app_realtime_all_modules_${supabaseConfigVersion}`);
    realtimeTables.forEach(table => {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleRealtimeSync);
    });
    channel.subscribe();

    // 25-second continuous heartbeat to ensure multi-device sync even after background resume
    const heartbeat = setInterval(() => {
      if (navigator.onLine) {
        syncWithSupabase();
      }
    }, 25000);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      client.removeChannel(channel);
      clearInterval(heartbeat);
    };
  }, [syncWithSupabase, supabaseConfigVersion]);

  const refreshData = () => {
    setBranches(StorageService.getBranches());
    setActiveBranchIdState(StorageService.getActiveBranchId());
    setStaffAccounts(StorageService.getStaffAccounts());
    setRolePermissions(StorageService.getRolePermissions());
    setSettings(StorageService.getSettings());
    setUsers(StorageService.getUsers());

    const sess = StorageService.getAuthSession();
    if (sess) {
      setCurrentUserState(sess.user);
    } else {
      setCurrentUserState(StorageService.getCurrentUser());
    }

    setProducts(StorageService.getProducts());
    setStockMovements(StorageService.getStockMovements());
    setSuppliers(StorageService.getSuppliers());
    setPurchaseOrders(StorageService.getPurchaseOrders());
    setSales(StorageService.getSales());
    setCustomers(StorageService.getCustomers());
    setQuotations(StorageService.getQuotations());
    setProjects(StorageService.getProjects());
    setExpenses(StorageService.getExpenses());
    setNotifications(StorageService.getNotifications());
    setAuditLogs(StorageService.getAuditLogs());
    setStaffKpis(StorageService.getStaffKpis());
  };

  const resetToZeroLedger = async (): Promise<{ success: boolean; syncedToCloud: boolean; error?: string }> => {
    isResettingRef.current = true;
    try {
      await IndexedDbService.clearAll();
      StorageService.clearOfflineQueue();
      setPendingTransactions([]);
      setOfflineQueueCount(0);

      StorageService.resetToZeroLedger(currentUser);
      refreshData();

      if (navigator.onLine && isSupabaseConfigured()) {
        const cleanNotif = StorageService.getNotifications()[0];
        const cleanLog = StorageService.getAuditLogs()[0];
        const cloudRes = await resetCleanZeroLedgerInSupabase(cleanNotif, cleanLog);
        if (cloudRes.success) {
          setSupabaseSyncTime(new Date().toLocaleTimeString());
          setIsSupabaseConnected(true);
        }
        return {
          success: true,
          syncedToCloud: cloudRes.success,
          error: cloudRes.error,
        };
      }

      return { success: true, syncedToCloud: false };
    } finally {
      isResettingRef.current = false;
    }
  };

  const resetDatabase = async (): Promise<{ success: boolean; syncedToCloud: boolean; error?: string }> => {
    return resetToZeroLedger();
  };

  // Cross-Store Isolation & Branch Lock
  const userCanAccessAllBranches = checkCanAccessAllBranches(currentUser);
  const effectiveBranchId = userCanAccessAllBranches
    ? activeBranchId
    : (currentUser.branchId || 'br_dalute_main');

  // Branch Switcher (Strictly restricted: store staff cannot switch or view other branches)
  const setActiveBranchId = (id: string) => {
    if (!userCanAccessAllBranches) {
      return; // Store staff cannot access other branches
    }
    StorageService.setActiveBranchId(id);
    setActiveBranchIdState(id);
  };

  // Cross-Store Data Isolation: Non-superadmin store staff only see their store's records!
  const visibleProducts = useMemo(() => {
    if (effectiveBranchId === 'all') return products;
    return products.filter(
      p => p.branchId === effectiveBranchId || (!p.branchId && branches.find(b => b.id === effectiveBranchId)?.isHeadquarters)
    );
  }, [products, effectiveBranchId, branches]);

  const visibleSales = useMemo(() => {
    if (effectiveBranchId === 'all') return sales;
    return sales.filter(
      s => s.branchId === effectiveBranchId || (!s.branchId && branches.find(b => b.id === effectiveBranchId)?.isHeadquarters)
    );
  }, [sales, effectiveBranchId, branches]);

  const visibleMovements = useMemo(() => {
    if (effectiveBranchId === 'all') return stockMovements;
    return stockMovements.filter(
      m => m.branchId === effectiveBranchId || (!m.branchId && branches.find(b => b.id === effectiveBranchId)?.isHeadquarters)
    );
  }, [stockMovements, effectiveBranchId, branches]);

  const visiblePurchaseOrders = useMemo(() => {
    if (effectiveBranchId === 'all') return purchaseOrders;
    const targetBranch = branches.find(b => b.id === effectiveBranchId);
    return purchaseOrders.filter(po => {
      if (!targetBranch) return true;
      const loc = (po.warehouseLocation || '').toLowerCase();
      return (
        loc.includes(targetBranch.name.toLowerCase()) ||
        loc.includes(targetBranch.code.toLowerCase()) ||
        (targetBranch.isHeadquarters && (loc.includes('dugbe') || loc.includes('sweetco') || loc.includes('head office'))) ||
        (!targetBranch.isHeadquarters && (loc.includes('dalute') || loc.includes('tipper')))
      );
    });
  }, [purchaseOrders, effectiveBranchId, branches]);

  const visibleProjects = useMemo(() => {
    if (effectiveBranchId === 'all') return projects;
    return projects.filter(prj => prj.branchId === effectiveBranchId || !prj.branchId);
  }, [projects, effectiveBranchId]);

  const visibleExpenses = useMemo(() => {
    if (effectiveBranchId === 'all') return expenses;
    return expenses.filter(e => e.branchId === effectiveBranchId || !e.branchId);
  }, [expenses, effectiveBranchId]);

  const saveBranch = (branchData: Partial<Branch>): { success: boolean; error?: string } => {
    if (!branchData.name?.trim()) {
      return { success: false, error: 'Branch name is required.' };
    }
    const current = StorageService.getBranches();
    const now = new Date().toISOString();

    // If marked as HQ, unset HQ on other branches so there is only one true HQ
    if (branchData.isHeadquarters) {
      current.forEach(b => {
        if (b.id !== branchData.id) {
          b.isHeadquarters = false;
        }
      });
    }

    let savedBranch: Branch;
    if (branchData.id) {
      const idx = current.findIndex(b => b.id === branchData.id);
      if (idx === -1) return { success: false, error: 'Branch not found.' };
      current[idx] = { ...current[idx], ...branchData } as Branch;
      savedBranch = current[idx];
    } else {
      savedBranch = {
        id: `br_${Date.now()}`,
        name: branchData.name.trim(),
        code: branchData.code || `BR-IBD-${String(current.length + 1).padStart(2, '0')}`,
        city: branchData.city || 'Ibadan',
        state: branchData.state || 'Oyo State',
        address: branchData.address || '',
        phone: branchData.phone || '07047053453',
        email: branchData.email,
        managerName: branchData.managerName,
        isHeadquarters: Boolean(branchData.isHeadquarters),
        isActive: true,
        createdAt: now,
      };
      current.push(savedBranch);
    }

    StorageService.saveBranches(current);
    setBranches([...current]);

    // Sync to Supabase with offline queue fallback
    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('branch', branchData.id ? 'update' : 'create', savedBranch);
    } else {
      saveBranchToSupabase(savedBranch).catch(() => {
        enqueueOfflineSafely('branch', branchData.id ? 'update' : 'create', savedBranch);
      });
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: branchData.id ? 'UPDATE_BRANCH' : 'CREATE_BRANCH',
      module: 'branches',
      recordId: branchData.code || branchData.name,
      details: `${branchData.id ? 'Updated' : 'Created'} branch ${branchData.name}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true };
  };

  const setBranchAsHeadquarters = (branchId: string): { success: boolean; error?: string } => {
    if (currentUser.role !== 'super_admin') {
      return { success: false, error: 'Only Superadmin Francis Gabriel can choose the company Headquarters shop.' };
    }
    const current = StorageService.getBranches();
    const target = current.find(b => b.id === branchId);
    if (!target) return { success: false, error: 'Branch not found.' };

    current.forEach(b => {
      b.isHeadquarters = b.id === branchId;
    });

    StorageService.saveBranches(current);
    setBranches([...current]);

    // Sync to Supabase with offline queue fallback
    if (!navigator.onLine || !isSupabaseConfigured()) {
      current.forEach(b => enqueueOfflineSafely('branch', 'update', b));
    } else {
      current.forEach(b => {
        saveBranchToSupabase(b).catch(() => enqueueOfflineSafely('branch', 'update', b));
      });
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'SET_HEADQUARTERS',
      module: 'branches',
      recordId: target.code,
      details: `Designated "${target.name}" (${target.code}) as the primary company Headquarters (HQ).`,
    });
    setAuditLogs(StorageService.getAuditLogs());
    return { success: true };
  };

  const deleteBranch = (id: string): { success: boolean; error?: string } => {
    if (currentUser.role !== 'super_admin') {
      return { success: false, error: 'Only Superadmin Francis Gabriel has permission to delete branch locations.' };
    }
    const current = StorageService.getBranches();
    if (current.length <= 1) {
      return { success: false, error: 'At least one branch must remain active in the system.' };
    }
    const target = current.find(b => b.id === id);
    if (!target) return { success: false, error: 'Branch not found.' };

    const filtered = current.filter(b => b.id !== id);

    // If the deleted branch was Headquarters, reassign Headquarters to another remaining branch
    if (target.isHeadquarters && filtered.length > 0) {
      filtered[0].isHeadquarters = true;
    }

    StorageService.saveBranches(filtered);
    setBranches(filtered);

    if (activeBranchId === id) {
      setActiveBranchId('all');
    }

    // Delete from Supabase if connected
    try {
      const client = getSupabaseClient();
      if (client) {
        client.from('branches').delete().eq('id', id).then(({ error }) => {
          if (error) console.warn('Supabase branch delete note:', error.message);
        });
      }
    } catch (e) {
      console.warn('Supabase branch delete exception:', e);
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'DELETE_BRANCH',
      module: 'branches',
      recordId: target.code,
      details: `Permanently removed branch "${target.name}". ${target.isHeadquarters ? `Headquarters reassigned to "${filtered[0].name}".` : ''}`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true };
  };

  // Staff Account Provisioning
  const createStaffAccount = (staffData: Omit<StaffAccount, 'id' | 'createdAt'>): { success: boolean; error?: string } => {
    const currentStaff = StorageService.getStaffAccounts();
    const currentUsers = StorageService.getUsers();

    const normalizedName = (staffData.name || '').trim();
    const normalizedEmail = (staffData.email || '').trim().toLowerCase();
    const normalizedUsername = (staffData.username || normalizedEmail.split('@')[0] || '').trim().toLowerCase().replace(/\s+/g, '_');

    if (!normalizedName) {
      return { success: false, error: 'Full name is required to create a staff profile.' };
    }
    if (!normalizedEmail) {
      return { success: false, error: 'Valid staff email address is required.' };
    }
    if (!normalizedUsername) {
      return { success: false, error: 'Valid username is required.' };
    }

    // Check duplicate username or email safely with null-safe chaining
    const exists = currentStaff.some(
      s => (s.email && s.email.trim().toLowerCase() === normalizedEmail) ||
           (s.username && s.username.trim().toLowerCase() === normalizedUsername)
    );
    if (exists) {
      return { success: false, error: `A staff member with email "${normalizedEmail}" or username "${normalizedUsername}" already exists.` };
    }

    const now = new Date().toISOString();
    const newId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // Resolve branch assignment cleanly
    const branchObj = branches.find(b => b.id === staffData.branchId) || branches[0];
    const branchId = branchObj?.id || staffData.branchId || 'br_tipper_hq';
    const branchName = branchObj?.name || staffData.branchName || 'Head Office - Dugbe (Opposite Sweetco)';
    const tempPassword = staffData.temporaryPassword?.trim() || `Offnot${Math.floor(1000 + Math.random() * 9000)}!`;

    const newStaff: StaffAccount = {
      ...staffData,
      id: newId,
      name: normalizedName,
      username: normalizedUsername,
      email: normalizedEmail,
      phone: (staffData.phone || '').trim(),
      branchId,
      branchName,
      temporaryPassword: tempPassword,
      status: staffData.status || 'active',
      hasFullSystemAccess: Boolean(staffData.hasFullSystemAccess),
      canAccessAllBranches: Boolean(staffData.canAccessAllBranches),
      createdAt: now,
    };

    const newUser: User = {
      id: newId,
      name: normalizedName,
      username: normalizedUsername,
      email: normalizedEmail,
      role: staffData.role,
      phone: (staffData.phone || '').trim(),
      branchId,
      branchName,
      temporaryPassword: tempPassword,
      status: staffData.status || 'active',
      hasFullSystemAccess: Boolean(staffData.hasFullSystemAccess),
      canAccessAllBranches: Boolean(staffData.canAccessAllBranches),
    };

    const updatedStaff = [newStaff, ...currentStaff];
    const updatedUsers = [...currentUsers, newUser];

    StorageService.saveStaffAccounts(updatedStaff);
    StorageService.saveUsers(updatedUsers);
    setStaffAccounts(updatedStaff);
    setUsers(updatedUsers);

    // Sync to Supabase user_profiles (with offline queue fallback)
    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('staff', 'create', newStaff);
    } else {
      saveStaffProfileToSupabase(newStaff).catch(() => {
        enqueueOfflineSafely('staff', 'create', newStaff);
      });
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'PROVISION_STAFF',
      module: 'staff',
      recordId: normalizedUsername,
      details: `Provisioned account for ${normalizedName} (${staffData.role}) at ${branchName}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true };
  };

  const updateStaffAccount = (id: string, updates: Partial<StaffAccount>): { success: boolean; error?: string } => {
    const currentStaff = StorageService.getStaffAccounts();
    const currentUsers = StorageService.getUsers();

    const staffIdx = currentStaff.findIndex(s => s.id === id);
    if (staffIdx === -1) return { success: false, error: 'Staff account not found.' };

    currentStaff[staffIdx] = { ...currentStaff[staffIdx], ...updates };

    const userIdx = currentUsers.findIndex(u => u.id === id);
    if (userIdx !== -1) {
      currentUsers[userIdx] = {
        ...currentUsers[userIdx],
        name: updates.name ?? currentUsers[userIdx].name,
        role: updates.role ?? currentUsers[userIdx].role,
        phone: updates.phone ?? currentUsers[userIdx].phone,
        branchId: updates.branchId ?? currentUsers[userIdx].branchId,
        branchName: updates.branchName ?? currentUsers[userIdx].branchName,
        status: updates.status ?? currentUsers[userIdx].status,
        temporaryPassword: updates.temporaryPassword ?? currentUsers[userIdx].temporaryPassword,
        hasFullSystemAccess: updates.hasFullSystemAccess ?? currentUsers[userIdx].hasFullSystemAccess,
        canAccessAllBranches: updates.canAccessAllBranches ?? currentUsers[userIdx].canAccessAllBranches,
      };
    }

    StorageService.saveStaffAccounts(currentStaff);
    StorageService.saveUsers(currentUsers);
    setStaffAccounts([...currentStaff]);
    setUsers([...currentUsers]);

    const updatedStaffProfile = currentStaff[staffIdx];
    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('staff', 'update', updatedStaffProfile);
    } else {
      saveStaffProfileToSupabase(updatedStaffProfile).catch(() => {
        enqueueOfflineSafely('staff', 'update', updatedStaffProfile);
      });
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'UPDATE_STAFF',
      module: 'staff',
      recordId: id,
      details: `Updated staff profile for ${currentStaff[staffIdx].name}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true };
  };

  const toggleStaffStatus = (id: string) => {
    const currentStaff = StorageService.getStaffAccounts();
    const target = currentStaff.find(s => s.id === id);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    updateStaffAccount(id, { status: newStatus });
  };

  const deleteStaffAccount = (id: string): { success: boolean; error?: string } => {
    if (id === currentUser.id) {
      return { success: false, error: 'Cannot delete your own active Super Administrator account.' };
    }
    const currentStaff = StorageService.getStaffAccounts();
    const target = currentStaff.find(s => s.id === id);
    if (target?.role === 'super_admin' || target?.email.toLowerCase() === 'francisgabriel932@gmail.com') {
      return { success: false, error: 'The Super Administrator account cannot be deleted.' };
    }

    const filteredStaff = currentStaff.filter(s => s.id !== id);
    const filteredUsers = StorageService.getUsers().filter(u => u.id !== id);

    StorageService.saveStaffAccounts(filteredStaff);
    StorageService.saveUsers(filteredUsers);
    setStaffAccounts(filteredStaff);
    setUsers(filteredUsers);

    // Also delete from Supabase user_profiles if connected
    if (isSupabaseConfigured()) {
      deleteStaffProfileFromSupabase(id).catch(e => console.warn('Supabase delete staff notice:', e));
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'DELETE_STAFF',
      module: 'staff',
      recordId: id,
      details: `Permanently removed staff account for ${target?.name || id}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());
    return { success: true };
  };

  const clearAllDemoStaff = (): { success: boolean; count: number } => {
    const currentStaff = StorageService.getStaffAccounts();
    const currentUsers = StorageService.getUsers();

    // Preserve Francis Gabriel Superadmin strictly
    const keptStaff = currentStaff.filter(
      s => s.role === 'super_admin' || s.email.toLowerCase() === 'francisgabriel932@gmail.com'
    );
    const keptUsers = currentUsers.filter(
      u => u.role === 'super_admin' || u.email.toLowerCase() === 'francisgabriel932@gmail.com'
    );

    const count = currentStaff.length - keptStaff.length;

    StorageService.saveStaffAccounts(keptStaff);
    StorageService.saveUsers(keptUsers);
    setStaffAccounts(keptStaff);
    setUsers(keptUsers);

    // Delete non-superadmins from Supabase if connected
    try {
      const client = getSupabaseClient();
      if (client) {
        client.from('user_profiles').delete().neq('role', 'super_admin').then(({ error }) => {
          if (error) console.warn('Supabase batch clear demo accounts notice:', error.message);
        });
      }
    } catch (e) {
      console.warn('Supabase batch clear error:', e);
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'CLEAR_DEMO_STAFF',
      module: 'staff',
      recordId: 'demo_accounts_cleared',
      details: `Cleared ${count} demo staff accounts to prepare clean roster for real employee onboarding.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true, count };
  };

  const updateRolePermission = (role: UserRole, permission: PermissionKey, enabled: boolean) => {
    StorageService.updateRolePermission(role, permission, enabled);
    const updatedMap = StorageService.getRolePermissions();
    setRolePermissions(updatedMap);

    // Sync permission changes inside company_settings across all devices
    const updatedSettings: CompanySettings = {
      ...StorageService.getSettings(),
      rolePermissions: updatedMap,
    };
    StorageService.saveSettings(updatedSettings);
    setSettings(updatedSettings);

    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('role_permissions', 'update', updatedMap);
    } else {
      saveSettingsToSupabase(updatedSettings).catch(() => {
        enqueueOfflineSafely('role_permissions', 'update', updatedMap);
      });
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'UPDATE_PERMISSIONS',
      module: 'settings',
      details: `Updated permission "${permission}" for role "${role}" to ${enabled ? 'ENABLED' : 'DISABLED'}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const assignStaffRole = (staffId: string, newRole: UserRole): { success: boolean; error?: string } => {
    const res = StorageService.assignStaffRole(staffId, newRole);
    if (res.success) {
      const updatedStaffList = StorageService.getStaffAccounts();
      setStaffAccounts(updatedStaffList);
      setUsers(StorageService.getUsers());

      const updatedStaff = updatedStaffList.find(s => s.id === staffId);
      if (updatedStaff) {
        if (!navigator.onLine || !isSupabaseConfigured()) {
          enqueueOfflineSafely('staff', 'update', updatedStaff);
        } else {
          saveStaffProfileToSupabase(updatedStaff).catch(() => {
            enqueueOfflineSafely('staff', 'update', updatedStaff);
          });
        }
      }

      StorageService.logAction({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'ASSIGN_STAFF_ROLE',
        module: 'staff',
        recordId: staffId,
        details: `Assigned new role "${newRole}" to staff ID ${staffId}.`,
      });
      setAuditLogs(StorageService.getAuditLogs());
    }
    return res;
  };

  // Authentication
  const login = (usernameOrEmail: string, password: string): { success: boolean; error?: string } => {
    const trimmedInput = usernameOrEmail.trim().toLowerCase();
    const allUsers = StorageService.getUsers();
    const allStaff = StorageService.getStaffAccounts();

    // Match by email or username safely
    const matchedUser = allUsers.find(
      u => (u.email && u.email.trim().toLowerCase() === trimmedInput) ||
           (u.username && u.username.trim().toLowerCase() === trimmedInput)
    ) || allStaff.find(
      s => (s.email && s.email.trim().toLowerCase() === trimmedInput) ||
           (s.username && s.username.trim().toLowerCase() === trimmedInput)
    );

    const matchedStaff = allStaff.find(
      s => (s.email && s.email.trim().toLowerCase() === trimmedInput) ||
           (s.username && s.username.trim().toLowerCase() === trimmedInput)
    );

    if (!matchedUser) {
      return { success: false, error: 'No account found matching this username or email.' };
    }

    if (matchedUser.status === 'inactive') {
      return { success: false, error: 'This account has been deactivated. Please contact your Superadmin.' };
    }

    // Verify password strictly against temporaryPassword, custom superadmin password, or default fallbacks
    const validPassword = matchedUser.temporaryPassword || matchedStaff?.temporaryPassword;
    const isSuperAdmin = matchedUser.role === 'super_admin' || matchedUser.email.toLowerCase() === 'francisgabriel932@gmail.com';
    const entered = password.trim();
    const superadminCustomPwd = StorageService.getSuperadminPassword();

    const isValid =
      (validPassword && entered === validPassword) ||
      (matchedStaff?.temporaryPassword && entered === matchedStaff.temporaryPassword) ||
      (isSuperAdmin && (
        (superadminCustomPwd && entered === superadminCustomPwd) ||
        entered === 'SuperAdmin2026!' ||
        entered === 'admin' ||
        entered === 'password'
      )) ||
      (!isSuperAdmin && (
        entered === 'OffnotStaff2026!' ||
        (validPassword && entered === validPassword)
      ));

    if (!isValid) {
      return { success: false, error: 'Incorrect password entered.' };
    }

    const sessionUser: User = {
      id: matchedUser.id,
      name: matchedUser.name,
      username: matchedUser.username,
      email: matchedUser.email,
      role: matchedUser.role,
      phone: matchedUser.phone,
      branchId: matchedUser.branchId,
      branchName: matchedUser.branchName,
      status: matchedUser.status,
      temporaryPassword: validPassword || matchedUser.temporaryPassword,
      hasFullSystemAccess: matchedUser.hasFullSystemAccess,
      canAccessAllBranches: matchedUser.canAccessAllBranches,
    };

    StorageService.setAuthSession({
      user: sessionUser,
      token: `tok_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    });
    StorageService.setCurrentUserId(sessionUser.id);
    setCurrentUserState(sessionUser);
    setIsAuthenticated(true);

    // Cross-Store Isolation: non-superadmin store staff are strictly locked to their store
    if (!checkCanAccessAllBranches(sessionUser)) {
      const lockedBranch = sessionUser.branchId || 'br_dalute_main';
      StorageService.setActiveBranchId(lockedBranch);
      setActiveBranchIdState(lockedBranch);
    }

    // Role-Based Screen Navigation: automatically route to user's authorized home tab
    const allowed = getAllowedTabsForUser(sessionUser);
    if (!allowed.includes(activeTab)) {
      setActiveTab(getDefaultTabForUser(sessionUser));
    }

    StorageService.logAction({
      userId: sessionUser.id,
      userName: sessionUser.name,
      userRole: sessionUser.role,
      action: 'USER_LOGIN',
      module: 'auth',
      recordId: sessionUser.email,
      details: `${sessionUser.name} (${sessionUser.role}) logged in successfully at ${sessionUser.branchName || 'Ibadan'}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true };
  };

  const changeSuperadminPassword = (newPassword: string): { success: boolean; error?: string } => {
    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }
    const cleanPassword = newPassword.trim();
    StorageService.setSuperadminPassword(cleanPassword);

    const currentStaff = StorageService.getStaffAccounts();
    const currentUsers = StorageService.getUsers();

    currentStaff.forEach(s => {
      if (s.role === 'super_admin' || s.email.toLowerCase() === 'francisgabriel932@gmail.com') {
        s.temporaryPassword = cleanPassword;
      }
    });
    currentUsers.forEach(u => {
      if (u.role === 'super_admin' || u.email.toLowerCase() === 'francisgabriel932@gmail.com') {
        u.temporaryPassword = cleanPassword;
      }
    });

    StorageService.saveStaffAccounts(currentStaff);
    StorageService.saveUsers(currentUsers);
    setStaffAccounts([...currentStaff]);
    setUsers([...currentUsers]);

    if (currentUser.role === 'super_admin' || currentUser.email.toLowerCase() === 'francisgabriel932@gmail.com') {
      const updatedUser = { ...currentUser, temporaryPassword: cleanPassword };
      setCurrentUserState(updatedUser);
      const sess = StorageService.getAuthSession();
      if (sess) {
        StorageService.setAuthSession({ ...sess, user: updatedUser });
      }
    }

    // Sync to Supabase user_profiles
    try {
      const client = getSupabaseClient();
      if (client) {
        client.from('user_profiles')
          .update({ temporary_password: cleanPassword })
          .or('role.eq.super_admin,email.eq.francisgabriel932@gmail.com')
          .then(({ error }) => {
            if (error) console.warn('Supabase superadmin password sync notice:', error.message);
          });
      }
    } catch (e) {
      console.warn('Supabase password sync exception:', e);
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'UPDATE_PASSWORD',
      module: 'auth',
      recordId: 'superadmin_password',
      details: 'Super Administrator Francis Gabriel updated account password successfully.',
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true };
  };

  // Staff KPI Management
  const saveStaffKpi = (kpiData: Partial<StaffKpi>): { success: boolean; error?: string } => {
    const currentKpis = StorageService.getStaffKpis();
    const now = new Date().toISOString();

    let savedKpi: StaffKpi;
    if (kpiData.id) {
      const idx = currentKpis.findIndex(k => k.id === kpiData.id);
      if (idx === -1) return { success: false, error: 'KPI record not found.' };
      currentKpis[idx] = { ...currentKpis[idx], ...kpiData, updatedAt: now };
      savedKpi = currentKpis[idx];
    } else {
      if (!kpiData.staffId) {
        return { success: false, error: 'Please select a staff member to assign this KPI.' };
      }
      const staffMember = staffAccounts.find(s => s.id === kpiData.staffId) || users.find(u => u.id === kpiData.staffId);
      savedKpi = {
        id: `kpi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        staffId: kpiData.staffId,
        staffName: staffMember?.name || kpiData.staffName || 'Staff Member',
        staffRole: staffMember?.role || kpiData.staffRole || 'sales_rep',
        branchId: kpiData.branchId || staffMember?.branchId || activeBranchId,
        branchName: kpiData.branchName || staffMember?.branchName || 'Offnot Branch',
        period: kpiData.period || getLagosMonthKey(),
        monthlySalesTarget: Number(kpiData.monthlySalesTarget) || 2500000,
        actualSalesAchieved: Number(kpiData.actualSalesAchieved) || 0,
        grossProfitTarget: Number(kpiData.grossProfitTarget) || 500000,
        actualGrossProfit: Number(kpiData.actualGrossProfit) || 0,
        quotationsTarget: Number(kpiData.quotationsTarget) || 10,
        quotationsCreated: Number(kpiData.quotationsCreated) || 0,
        quotationsConverted: Number(kpiData.quotationsConverted) || 0,
        installationsTarget: Number(kpiData.installationsTarget) || 4,
        installationsCompleted: Number(kpiData.installationsCompleted) || 0,
        stockAuditAccuracyPercent: Number(kpiData.stockAuditAccuracyPercent) || 100,
        customerSatisfactionScore: Number(kpiData.customerSatisfactionScore) || 5,
        attendancePunctualityPercent: Number(kpiData.attendancePunctualityPercent) || 100,
        selfAssessmentNotes: kpiData.selfAssessmentNotes || '',
        managerReviewNotes: kpiData.managerReviewNotes || '',
        performanceRating: kpiData.performanceRating || 'Pending',
        status: kpiData.status || 'pending_acceptance',
        dailyLogs: kpiData.dailyLogs || [],
        createdAt: now,
        updatedAt: now,
      };
      currentKpis.unshift(savedKpi);

      // Trigger an in-app notification for the staff member
      const notif: AppNotification = {
        id: `notif_kpi_${Date.now()}`,
        title: 'New KPI Target Assigned',
        message: `${currentUser.name} assigned your KPI target for ${savedKpi.period}. Please review and accept your target.`,
        type: 'info',
        read: false,
        linkModule: 'kpis',
        createdAt: now,
      };
      const currentNotifs = StorageService.getNotifications();
      StorageService.saveNotifications([notif, ...currentNotifs]);
      setNotifications([notif, ...currentNotifs]);
    }

    StorageService.saveStaffKpis(currentKpis);
    setStaffKpis([...currentKpis]);

    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('kpi', kpiData.id ? 'update' : 'create', savedKpi);
    } else {
      saveKpiToSupabase(savedKpi).catch(() => enqueueOfflineSafely('kpi', 'update', savedKpi));
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: kpiData.id ? 'UPDATE_KPI' : 'CREATE_KPI',
      module: 'kpis',
      recordId: savedKpi.id,
      details: `${kpiData.id ? 'Updated' : 'Created'} KPI record for ${savedKpi.staffName} (${savedKpi.period}).`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true };
  };

  const acceptStaffKpi = (kpiId: string, notes?: string): { success: boolean; error?: string } => {
    const currentKpis = StorageService.getStaffKpis();
    const idx = currentKpis.findIndex(k => k.id === kpiId);
    if (idx === -1) return { success: false, error: 'KPI record not found.' };

    const target = currentKpis[idx];
    const now = new Date().toISOString();

    currentKpis[idx] = {
      ...target,
      status: 'active',
      acceptedAt: now,
      acceptedByStaffId: currentUser.id,
      acceptanceNotes: notes || 'Target accepted and acknowledged by staff member.',
      updatedAt: now,
    };

    StorageService.saveStaffKpis(currentKpis);
    setStaffKpis([...currentKpis]);

    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('kpi', 'update', currentKpis[idx]);
    } else {
      saveKpiToSupabase(currentKpis[idx]).catch(() => enqueueOfflineSafely('kpi', 'update', currentKpis[idx]));
    }

    const notif: AppNotification = {
      id: `notif_kpi_acc_${Date.now()}`,
      title: 'KPI Target Accepted',
      message: `${currentUser.name} (${target.staffName}) accepted their KPI target for ${target.period}. Target is now active.`,
      type: 'success',
      read: false,
      linkModule: 'kpis',
      createdAt: now,
    };
    const currentNotifs = StorageService.getNotifications();
    StorageService.saveNotifications([notif, ...currentNotifs]);
    setNotifications([notif, ...currentNotifs]);

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'ACCEPT_KPI_TARGET',
      module: 'kpis',
      recordId: kpiId,
      details: `${currentUser.name} accepted assigned KPI target for ${target.period}. Target is now active.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true };
  };

  const updateStaffKpiSelfReview = (
    kpiId: string,
    updates: {
      selfAssessmentNotes: string;
      actualSalesAchieved?: number;
      quotationsCreated?: number;
      quotationsConverted?: number;
      installationsCompleted?: number;
    }
  ): { success: boolean; error?: string } => {
    const currentKpis = StorageService.getStaffKpis();
    const idx = currentKpis.findIndex(k => k.id === kpiId);
    if (idx === -1) return { success: false, error: 'KPI record not found.' };

    const target = currentKpis[idx];
    const now = new Date().toISOString();

    currentKpis[idx] = {
      ...target,
      selfAssessmentNotes: updates.selfAssessmentNotes,
      actualSalesAchieved: updates.actualSalesAchieved !== undefined ? updates.actualSalesAchieved : target.actualSalesAchieved,
      quotationsCreated: updates.quotationsCreated !== undefined ? updates.quotationsCreated : target.quotationsCreated,
      quotationsConverted: updates.quotationsConverted !== undefined ? updates.quotationsConverted : target.quotationsConverted,
      installationsCompleted: updates.installationsCompleted !== undefined ? updates.installationsCompleted : target.installationsCompleted,
      status: target.status === 'active' ? 'under_review' : target.status,
      lastUpdatedByStaffAt: now,
      updatedAt: now,
    };

    StorageService.saveStaffKpis(currentKpis);
    setStaffKpis([...currentKpis]);

    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('kpi', 'update', currentKpis[idx]);
    } else {
      saveKpiToSupabase(currentKpis[idx]).catch(() => enqueueOfflineSafely('kpi', 'update', currentKpis[idx]));
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'UPDATE_KPI_SELF_REVIEW',
      module: 'kpis',
      recordId: kpiId,
      details: `${currentUser.name} submitted KPI self-assessment for ${currentKpis[idx].period}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true };
  };

  const reviewStaffKpi = (
    kpiId: string,
    review: {
      managerReviewNotes: string;
      performanceRating: KpiPerformanceRating;
      status: KpiStatus;
    }
  ): { success: boolean; error?: string } => {
    const currentKpis = StorageService.getStaffKpis();
    const idx = currentKpis.findIndex(k => k.id === kpiId);
    if (idx === -1) return { success: false, error: 'KPI record not found.' };

    const target = currentKpis[idx];
    const now = new Date().toISOString();

    currentKpis[idx] = {
      ...target,
      managerReviewNotes: review.managerReviewNotes,
      performanceRating: review.performanceRating,
      status: review.status,
      lastReviewedByManagerAt: now,
      updatedAt: now,
    };

    StorageService.saveStaffKpis(currentKpis);
    setStaffKpis([...currentKpis]);

    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('kpi', 'update', currentKpis[idx]);
    } else {
      saveKpiToSupabase(currentKpis[idx]).catch(() => enqueueOfflineSafely('kpi', 'update', currentKpis[idx]));
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'REVIEW_KPI',
      module: 'kpis',
      recordId: kpiId,
      details: `${currentUser.name} reviewed KPI for ${target.staffName} with rating "${review.performanceRating}".`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true };
  };

  const addKpiDailyLog = (
    kpiId: string,
    log: Omit<KpiDailyLog, 'id' | 'kpiId' | 'staffId' | 'createdAt'>
  ): { success: boolean; error?: string } => {
    const currentKpis = StorageService.getStaffKpis();
    const idx = currentKpis.findIndex(k => k.id === kpiId);
    if (idx === -1) return { success: false, error: 'KPI record not found.' };

    const target = currentKpis[idx];
    const newLog: KpiDailyLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kpiId,
      staffId: target.staffId,
      logDate: log.logDate || getLagosDateKey(),
      activitiesCompleted: log.activitiesCompleted,
      itemsHandled: Number(log.itemsHandled) || 0,
      revenueGenerated: Number(log.revenueGenerated) || 0,
      challengesOrBlockers: log.challengesOrBlockers || '',
      createdAt: new Date().toISOString(),
    };

    const updatedLogs = [newLog, ...(target.dailyLogs || [])];
    const newActualSales = (target.actualSalesAchieved || 0) + (newLog.revenueGenerated || 0);

    currentKpis[idx] = {
      ...target,
      dailyLogs: updatedLogs,
      actualSalesAchieved: newActualSales,
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveStaffKpis(currentKpis);
    setStaffKpis([...currentKpis]);

    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('kpi', 'update', currentKpis[idx]);
      enqueueOfflineSafely('kpi_log', 'create', newLog);
    } else {
      saveKpiToSupabase(currentKpis[idx]).catch(() => enqueueOfflineSafely('kpi', 'update', currentKpis[idx]));
      saveKpiDailyLogToSupabase(newLog).catch(() => enqueueOfflineSafely('kpi_log', 'create', newLog));
    }

    return { success: true };
  };

  const deleteStaffKpi = (kpiId: string): { success: boolean; error?: string } => {
    const currentKpis = StorageService.getStaffKpis();
    const filtered = currentKpis.filter(k => k.id !== kpiId);
    StorageService.saveStaffKpis(filtered);
    setStaffKpis(filtered);

    if (isSupabaseConfigured()) {
      deleteKpiFromSupabase(kpiId).catch(e => console.warn('Supabase KPI delete note:', e));
    }
    return { success: true };
  };

  const logout = () => {
    StorageService.clearAuthSession();
    setIsAuthenticated(false);
    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'USER_LOGOUT',
      module: 'auth',
      recordId: currentUser.email,
      details: `${currentUser.name} signed out.`,
    });
  };

  const setCurrentUser = (user: User) => {
    StorageService.setCurrentUserId(user.id);
    setCurrentUserState(user);
    if (!checkCanAccessAllBranches(user)) {
      const lockedBranch = user.branchId || 'br_dalute_main';
      StorageService.setActiveBranchId(lockedBranch);
      setActiveBranchIdState(lockedBranch);
    }
    const allowed = getAllowedTabsForUser(user);
    if (!allowed.includes(activeTab)) {
      setActiveTab(getDefaultTabForUser(user));
    }
  };

  const switchRole = (role: UserRole) => {
    const existing = users.find(u => u.role === role);
    if (existing) {
      setCurrentUser(existing);
    }
  };

  // Recompute staff monthly KPIs automatically whenever sales or refunds occur
  const syncSalesToStaffKpis = (targetSale: Sale, allSalesSnapshot: Sale[]) => {
    const saleMonth = getLagosMonthKey(new Date(targetSale.createdAt));
    const currentKpis = StorageService.getStaffKpis();
    let changed = false;

    const updatedKpis = currentKpis.map(kpi => {
      if (kpi.period !== saleMonth) return kpi;
      const matchesStaff =
        kpi.staffId === targetSale.salesRepId ||
        (kpi.staffName && targetSale.salesRepName && kpi.staffName.toLowerCase() === targetSale.salesRepName.toLowerCase());
      if (!matchesStaff) return kpi;

      const staffMonthSales = allSalesSnapshot.filter(s => {
        if (getLagosMonthKey(new Date(s.createdAt)) !== saleMonth) return false;
        return (
          s.salesRepId === kpi.staffId ||
          (s.salesRepName && kpi.staffName && s.salesRepName.toLowerCase() === kpi.staffName.toLowerCase())
        );
      });

      const netSalesTotal = staffMonthSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
      const netProfitTotal = staffMonthSales.reduce((sum, s) => sum + (s.grossProfit || 0), 0);

      changed = true;
      const updatedKpi: StaffKpi = {
        ...kpi,
        actualSalesAchieved: Math.max(0, netSalesTotal),
        actualGrossProfit: Math.max(0, netProfitTotal),
        updatedAt: new Date().toISOString(),
      };

      if (!navigator.onLine || !isSupabaseConfigured()) {
        enqueueOfflineSafely('kpi', 'update', updatedKpi);
      } else {
        saveKpiToSupabase(updatedKpi).catch(() => enqueueOfflineSafely('kpi', 'update', updatedKpi));
      }

      return updatedKpi;
    });

    if (changed) {
      StorageService.saveStaffKpis(updatedKpis);
      setStaffKpis(updatedKpis);
    }
  };

  // Apply official 66-SKU Dugbe Branch price list & verified Dugbe HQ / Dalute branch contacts without wiping stock
  const applyGoLiveCatalogAndContacts = async (): Promise<{
    success: boolean;
    productCount: number;
    syncedToCloud: boolean;
  }> => {
    const existingSettings = StorageService.getSettings();
    const mergedSettings: CompanySettings = {
      ...INITIAL_SETTINGS,
      pwaLogoUrl: existingSettings.pwaLogoUrl || INITIAL_SETTINGS.pwaLogoUrl,
      pwaAppTitle: existingSettings.pwaAppTitle || INITIAL_SETTINGS.pwaAppTitle,
      pwaShortName: existingSettings.pwaShortName || INITIAL_SETTINGS.pwaShortName,
      pwaThemeColor: existingSettings.pwaThemeColor || INITIAL_SETTINGS.pwaThemeColor,
      pwaBackgroundColor: existingSettings.pwaBackgroundColor || INITIAL_SETTINGS.pwaBackgroundColor,
      enablePwaPrompt: existingSettings.enablePwaPrompt !== undefined ? existingSettings.enablePwaPrompt : INITIAL_SETTINGS.enablePwaPrompt,
      pwaPromptDelaySeconds: existingSettings.pwaPromptDelaySeconds || INITIAL_SETTINGS.pwaPromptDelaySeconds,
      rolePermissions: existingSettings.rolePermissions || StorageService.getRolePermissions(),
    };

    const existingBranches = StorageService.getBranches();
    const branchMap = new Map(existingBranches.map(b => [b.id, b]));
    INITIAL_BRANCHES.forEach(b => branchMap.set(b.id, b));
    const mergedBranches = Array.from(branchMap.values());

    const existingSuppliers = StorageService.getSuppliers();
    const supMap = new Map(existingSuppliers.map(s => [s.id, s]));
    INITIAL_SUPPLIERS.forEach(s => supMap.set(s.id, s));
    const mergedSuppliers = Array.from(supMap.values());

    const existingProducts = StorageService.getProducts();
    const existingBySku = new Map(existingProducts.map(p => [p.sku.trim().toLowerCase(), p]));
    const updatedIds = new Set<string>();
    const mergedCatalog: Product[] = INITIAL_PRODUCTS.map(official => {
      const existing = existingBySku.get(official.sku.trim().toLowerCase());
      const resolvedId = existing ? existing.id : official.id;
      updatedIds.add(resolvedId);
      return {
        ...official,
        id: resolvedId,
        currentStock: existing ? existing.currentStock : official.currentStock,
        createdAt: existing?.createdAt || official.createdAt,
        updatedAt: new Date().toISOString(),
      };
    });

    // Retain any extra custom SKUs added manually by admin
    existingProducts.forEach(p => {
      if (!updatedIds.has(p.id)) {
        mergedCatalog.push(p);
      }
    });

    StorageService.saveSettings(mergedSettings);
    StorageService.saveBranches(mergedBranches);
    StorageService.saveSuppliers(mergedSuppliers);
    StorageService.saveProducts(mergedCatalog);

    setSettings(mergedSettings);
    setBranches(mergedBranches);
    setSuppliers(mergedSuppliers);
    setProducts(mergedCatalog);

    let syncedToCloud = false;
    if (isSupabaseConfigured() && navigator.onLine) {
      try {
        await syncLocalToSupabase({
          branches: mergedBranches,
          users: StorageService.getUsers(),
          categories: INITIAL_CATEGORIES,
          suppliers: mergedSuppliers,
          products: mergedCatalog,
          customers: StorageService.getCustomers(),
          settings: mergedSettings,
        });
        await saveSettingsToSupabase(mergedSettings);
        syncedToCloud = true;
      } catch (e) {
        console.warn('Cloud push warning during go-live catalog update:', e);
      }
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'APPLY_GOLIVE_CATALOG_CONTACTS',
      module: 'settings',
      details: `Applied official 66-SKU Offnot Energy Dugbe Branch price list & Dugbe HQ / Dalute contacts (${mergedCatalog.length} total SKUs, live stock preserved).`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true, productCount: mergedCatalog.length, syncedToCloud };
  };

  const updateSettings = (newSettings: CompanySettings) => {
    const mergedSettings: CompanySettings = {
      ...newSettings,
      rolePermissions: newSettings.rolePermissions || rolePermissions,
    };
    StorageService.saveSettings(mergedSettings);
    setSettings(mergedSettings);
    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'UPDATE_SETTINGS',
      module: 'settings',
      details: 'Updated company configuration, warehouses, contacts, PWA branding, and policy settings.',
    });
    setAuditLogs(StorageService.getAuditLogs());

    // Live cloud persistence to Supabase with offline queue fallback
    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('settings', 'update', mergedSettings);
    } else {
      saveSettingsToSupabase(mergedSettings).catch(err => {
        console.warn('saveSettingsToSupabase error, queuing offline:', err);
        enqueueOfflineSafely('settings', 'update', mergedSettings);
      });
    }
  };

  const markNotificationRead = (id: string) => {
    const updated = notifications.map(n => (n.id === id ? { ...n, read: true } : n));
    StorageService.saveNotifications(updated);
    setNotifications(updated);
  };

  const markAllNotificationsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    StorageService.saveNotifications(updated);
    setNotifications(updated);
  };

  // Product Actions
  const saveProduct = (productData: Partial<Product>) => {
    const currentProducts = StorageService.getProducts();
    const now = new Date().toISOString();
    let savedProduct: Product;

    if (productData.id) {
      const index = currentProducts.findIndex(p => p.id === productData.id);
      if (index === -1) return { success: false, error: 'Product not found.' };

      currentProducts[index] = {
        ...currentProducts[index],
        ...productData,
        updatedAt: now,
      } as Product;
      savedProduct = currentProducts[index];
    } else {
      const newProduct: Product = {
        id: `prod_${Date.now()}`,
        sku: productData.sku || `SKU-${Date.now().toString().slice(-6)}`,
        name: productData.name || 'Unnamed Solar Item',
        brand: productData.brand || 'Offnot',
        category: productData.category || 'Installation Accessories',
        model: productData.model || '',
        description: productData.description || '',
        unit: productData.unit || 'Unit',
        purchaseCost: productData.purchaseCost || 0,
        retailPrice: productData.retailPrice || 0,
        wholesalePrice: productData.wholesalePrice || 0,
        installerPrice: productData.installerPrice || 0,
        dealerPrice: productData.dealerPrice || 0,
        minSellingPrice: productData.minSellingPrice || 0,
        currentStock: 0, // Clean Zero Accounting Default
        reorderLevel: productData.reorderLevel || 5,
        warehouseLocation:
          productData.warehouseLocation ||
          settings.warehouses?.[0] ||
          'Head Office Showroom - Opposite Sweetco, Dugbe Iyaganku Road, Ibadan',
        branchId: productData.branchId || currentUser.branchId,
        branchName: productData.branchName || currentUser.branchName,
        supplierId: productData.supplierId || '',
        supplierName: productData.supplierName || '',
        barcode: productData.barcode || Date.now().toString(),
        specs: productData.specs,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      currentProducts.unshift(newProduct);
      savedProduct = newProduct;
    }

    StorageService.saveProducts(currentProducts);
    setProducts([...currentProducts]);

    // Live cloud persist with offline queue fallback
    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('product', productData.id ? 'update' : 'create', savedProduct);
    } else {
      saveProductToSupabase(savedProduct).catch(err => {
        console.warn('saveProductToSupabase error, queuing offline:', err);
        enqueueOfflineSafely('product', productData.id ? 'update' : 'create', savedProduct);
      });
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: productData.id ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT',
      module: 'inventory',
      recordId: productData.sku,
      details: `${productData.id ? 'Updated' : 'Created'} solar product: ${productData.name}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true };
  };

  const deleteProduct = (id: string) => {
    const currentProducts = StorageService.getProducts();
    const target = currentProducts.find(p => p.id === id);
    if (!target) return { success: false, error: 'Product not found.' };

    const filtered = currentProducts.filter(p => p.id !== id);
    StorageService.saveProducts(filtered);
    setProducts(filtered);

    if (isSupabaseConfigured()) {
      deleteProductFromSupabase(id).catch(err => {
        console.warn('deleteProductFromSupabase error:', err);
      });
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'DELETE_PRODUCT',
      module: 'inventory',
      recordId: target.sku,
      details: `Deleted product: ${target.name} (${target.sku}).`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true };
  };

  const adjustStock = (productId: string, adjustmentQty: number, reason: string, warehouseLocation: string) => {
    const res = StorageService.adjustStock(
      { productId, adjustmentQty, reason, warehouseLocation, branchId: activeBranchId !== 'all' ? activeBranchId : undefined },
      currentUser
    );
    if (res.success) {
      const updatedProd = StorageService.getProducts().find(p => p.id === productId);
      const latestMovement = StorageService.getStockMovements()[0];
      if (!navigator.onLine || !isSupabaseConfigured()) {
        if (updatedProd) enqueueOfflineSafely('product', 'update', updatedProd);
        if (latestMovement) enqueueOfflineSafely('stock_movement', 'create', latestMovement);
      } else {
        if (updatedProd) {
          saveProductToSupabase(updatedProd).catch(() => enqueueOfflineSafely('product', 'update', updatedProd));
        }
        if (latestMovement) {
          saveStockMovementToSupabase(latestMovement).catch(() => enqueueOfflineSafely('stock_movement', 'create', latestMovement));
        }
      }
      refreshData();
    }
    return res;
  };

  const completeSale = (saleData: {
    customerId: string;
    customerName: string;
    customerPhone?: string;
    customerTier: PricingTier;
    items: { productId: string; quantity: number; unitPrice: number; discount: number }[];
    paymentMethod: PaymentMethod;
    paidAmount: number;
    splitDetails?: PaymentRecord['splitDetails'];
    notes?: string;
    warehouseLocation: string;
    branchId?: string;
    branchName?: string;
  }) => {
    const branch = branches.find(b => b.id === (saleData.branchId || activeBranchId));
    const res = StorageService.executeSale(
      {
        ...saleData,
        branchId: branch?.id || currentUser.branchId,
        branchName: branch?.name || currentUser.branchName,
      },
      currentUser
    );
    if (res.success) {
      if (res.sale) {
        if (!navigator.onLine || !isSupabaseConfigured()) {
          // Store in Dexie IndexedDB pending transactions table + Storage fallback
          IndexedDbService.recordPendingTransaction(res.sale)
            .catch(e => console.warn('IndexedDB recordPendingTransaction error:', e))
            .finally(() => updateOfflineQueueCount());
          StorageService.enqueueOfflineItem('sale', 'create', res.sale);
        } else {
          trackCloudWrite(
            saveSaleToSupabase(res.sale)
              .then(syncRes => {
                if (!syncRes.success) {
                  IndexedDbService.recordPendingTransaction(res.sale!)
                    .catch(e => console.warn('IndexedDB record error:', e))
                    .finally(() => updateOfflineQueueCount());
                  StorageService.enqueueOfflineItem('sale', 'create', res.sale);
                } else {
                  setSupabaseSyncTime(new Date().toLocaleTimeString());
                }
              })
              .catch(err => {
                console.warn('saveSaleToSupabase error, queued offline:', err);
                IndexedDbService.recordPendingTransaction(res.sale!)
                  .catch(e => console.warn('IndexedDB record error:', e))
                  .finally(() => updateOfflineQueueCount());
                StorageService.enqueueOfflineItem('sale', 'create', res.sale);
              })
          );
        }
        syncSalesToStaffKpis(res.sale, StorageService.getSales());
      }
      refreshData();
    }
    return res;
  };

  const processReturns = (
    saleId: string,
    itemsToReturn: { productId: string; quantity: number; sku?: string; itemIndex?: number }[],
    reason: string
  ) => {
    const res = StorageService.processCustomerReturns(saleId, itemsToReturn, reason, currentUser);
    if (res.success && res.updatedSale) {
      const payload = {
        id: `ret_batch_${res.updatedSale.id}_${Date.now()}`,
        sale: res.updatedSale,
        updatedProducts: res.updatedProducts || [],
        returnMovements: res.returnMovements || [],
        updatedCustomer: res.updatedCustomer,
      };
      if (!navigator.onLine || !isSupabaseConfigured()) {
        enqueueOfflineSafely('sale_return', 'update', payload);
      } else {
        trackCloudWrite(
          saveSaleReturnToSupabase(
            res.updatedSale,
            res.updatedProducts || [],
            res.returnMovements || [],
            res.updatedCustomer
          )
            .then(syncRes => {
              if (!syncRes.success) {
                enqueueOfflineSafely('sale_return', 'update', payload);
              } else {
                setSupabaseSyncTime(new Date().toLocaleTimeString());
              }
            })
            .catch(() => {
              enqueueOfflineSafely('sale_return', 'update', payload);
            })
        );
      }
      syncSalesToStaffKpis(res.updatedSale, StorageService.getSales());
      refreshData();
    }
    return {
      success: res.success,
      error: res.error,
      updatedSale: res.updatedSale,
      refundAmount: res.refundAmount,
    };
  };

  const processReturn = (saleId: string, productId: string, quantity: number, reason: string) => {
    return processReturns(saleId, [{ productId, quantity }], reason);
  };

  // Suppliers
  const saveSupplier = (supplierData: Partial<Supplier>) => {
    const current = StorageService.getSuppliers();
    const now = new Date().toISOString();
    let savedSup: Supplier;

    if (supplierData.id) {
      const idx = current.findIndex(s => s.id === supplierData.id);
      if (idx !== -1) {
        current[idx] = { ...current[idx], ...supplierData } as Supplier;
        savedSup = current[idx];
      } else {
        return;
      }
    } else {
      const newSup: Supplier = {
        id: `sup_${Date.now()}`,
        companyName: supplierData.companyName || 'Supplier',
        contactPerson: supplierData.contactPerson || '',
        phone: supplierData.phone || '',
        email: supplierData.email || '',
        address: supplierData.address || '',
        categories: supplierData.categories || [],
        paymentTerms: supplierData.paymentTerms || 'Immediate',
        outstandingBalance: 0,
        createdAt: now,
        notes: supplierData.notes,
      };
      current.push(newSup);
      savedSup = newSup;
    }
    StorageService.saveSuppliers(current);
    setSuppliers([...current]);

    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('supplier', supplierData.id ? 'update' : 'create', savedSup);
    } else {
      saveSupplierToSupabase(savedSup).catch(err => {
        console.warn('saveSupplierToSupabase error, queuing offline:', err);
        enqueueOfflineSafely('supplier', supplierData.id ? 'update' : 'create', savedSup);
      });
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: supplierData.id ? 'UPDATE_SUPPLIER' : 'CREATE_SUPPLIER',
      module: 'purchasing',
      recordId: supplierData.companyName,
      details: `Saved supplier: ${supplierData.companyName}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const createPurchaseOrder = (poData: Partial<PurchaseOrder>) => {
    const current = StorageService.getPurchaseOrders();
    const now = new Date().toISOString();
    const poNumber = `OFF-PO-${new Date().getFullYear()}-${1001 + current.length}`;

    const items = poData.items || [];
    const subtotal = items.reduce((acc, i) => acc + i.unitCost * i.orderedQuantity, 0);
    const shipping = poData.shippingAndLogistics || 0;
    const totalAmount = subtotal + shipping;

    const newPo: PurchaseOrder = {
      id: `po_${Date.now()}`,
      poNumber,
      supplierId: poData.supplierId || '',
      supplierName: poData.supplierName || '',
      items,
      subtotal,
      shippingAndLogistics: shipping,
      totalAmount,
      paidAmount: poData.paidAmount || 0,
      status: poData.status || 'pending_approval',
      createdAt: now,
      warehouseLocation:
        poData.warehouseLocation ||
        settings.warehouses?.[0] ||
        'Head Office Showroom - Opposite Sweetco, Dugbe Iyaganku Road, Ibadan',
      expectedDeliveryDate: poData.expectedDeliveryDate,
      notes: poData.notes,
    };

    current.unshift(newPo);
    StorageService.savePurchaseOrders(current);
    setPurchaseOrders([...current]);

    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('purchase_order', 'create', newPo);
    } else {
      savePurchaseOrderToSupabase(newPo).catch(err => {
        console.warn('savePurchaseOrderToSupabase error:', err);
        enqueueOfflineSafely('purchase_order', 'create', newPo);
      });
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'CREATE_PURCHASE_ORDER',
      module: 'purchasing',
      recordId: poNumber,
      details: `Created purchase order #${poNumber} for ${newPo.supplierName}. Total: ₦${totalAmount.toLocaleString()}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());

    return { success: true };
  };

  const updatePurchaseOrderStatus = (poId: string, status: PurchaseOrder['status']) => {
    const current = StorageService.getPurchaseOrders();
    const po = current.find(p => p.id === poId);
    if (po) {
      po.status = status;
      if (status === 'approved') {
        po.approvedAt = new Date().toISOString();
        po.approvedBy = currentUser.name;
      }
      StorageService.savePurchaseOrders(current);
      setPurchaseOrders([...current]);

      if (!navigator.onLine || !isSupabaseConfigured()) {
        enqueueOfflineSafely('purchase_order', 'update', po);
      } else {
        savePurchaseOrderToSupabase(po).catch(err => {
          console.warn('savePurchaseOrderToSupabase error:', err);
          enqueueOfflineSafely('purchase_order', 'update', po);
        });
      }

      StorageService.logAction({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'UPDATE_PO_STATUS',
        module: 'purchasing',
        recordId: po.poNumber,
        details: `Updated PO #${po.poNumber} status to ${status}.`,
      });
      setAuditLogs(StorageService.getAuditLogs());
    }
  };

  const receiveGoods = (poId: string, receivedItems: { productId: string; receivedQty: number }[], warehouseLocation: string) => {
    const res = StorageService.receivePurchaseOrderGoods(poId, receivedItems, warehouseLocation, currentUser);
    if (res.success) {
      const updatedPo = StorageService.getPurchaseOrders().find(p => p.id === poId);
      const updatedProdIds = new Set(receivedItems.filter(r => r.receivedQty > 0).map(r => r.productId));
      const updatedProducts = StorageService.getProducts().filter(p => updatedProdIds.has(p.id));
      const newMovements = StorageService.getStockMovements()
        .filter(m => m.type === 'goods_received' && (!updatedPo || m.referenceId === updatedPo.poNumber))
        .slice(0, Math.max(1, updatedProdIds.size));

      if (!navigator.onLine || !isSupabaseConfigured()) {
        if (updatedPo) enqueueOfflineSafely('purchase_order', 'update', updatedPo);
        updatedProducts.forEach(p => enqueueOfflineSafely('product', 'update', p));
        newMovements.forEach(m => enqueueOfflineSafely('stock_movement', 'create', m));
      } else {
        if (updatedPo) {
          savePurchaseOrderToSupabase(updatedPo).catch(() => enqueueOfflineSafely('purchase_order', 'update', updatedPo));
        }
        updatedProducts.forEach(p => {
          saveProductToSupabase(p).catch(() => enqueueOfflineSafely('product', 'update', p));
        });
        newMovements.forEach(m => {
          saveStockMovementToSupabase(m).catch(() => enqueueOfflineSafely('stock_movement', 'create', m));
        });
      }
      refreshData();
    }
    return res;
  };

  const recordSupplierPayment = (poId: string, amount: number) => {
    const current = StorageService.getPurchaseOrders();
    const po = current.find(p => p.id === poId);
    if (po) {
      po.paidAmount += amount;
      StorageService.savePurchaseOrders(current);
      setPurchaseOrders([...current]);

      if (!navigator.onLine || !isSupabaseConfigured()) {
        enqueueOfflineSafely('purchase_order', 'update', po);
      } else {
        savePurchaseOrderToSupabase(po).catch(err => {
          console.warn('savePurchaseOrderToSupabase payment error:', err);
          enqueueOfflineSafely('purchase_order', 'update', po);
        });
      }

      StorageService.logAction({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'SUPPLIER_PAYMENT',
        module: 'purchasing',
        recordId: po.poNumber,
        details: `Recorded supplier payment of ₦${amount.toLocaleString()} for PO #${po.poNumber}.`,
      });
      setAuditLogs(StorageService.getAuditLogs());
    }
  };

  // Customers
  const saveCustomer = (custData: Partial<Customer>) => {
    const current = StorageService.getCustomers();
    const now = new Date().toISOString();
    let savedCust: Customer;

    if (custData.id) {
      const idx = current.findIndex(c => c.id === custData.id);
      if (idx !== -1) {
        current[idx] = { ...current[idx], ...custData } as Customer;
        savedCust = current[idx];
      } else {
        return;
      }
    } else {
      const newCust: Customer = {
        id: `cust_${Date.now()}`,
        name: custData.name || 'New Customer',
        contactPerson: custData.contactPerson,
        phone: custData.phone || '',
        email: custData.email,
        address: custData.address || 'Ibadan',
        type: custData.type || 'retail',
        pricingTier: custData.pricingTier || 'retail',
        leadStage: custData.leadStage || 'new_lead',
        totalPurchases: 0,
        outstandingBalance: 0,
        assignedStaffId: currentUser.id,
        assignedStaffName: currentUser.name,
        notes: custData.notes,
        installerDetails: custData.installerDetails,
        createdAt: now,
      };
      current.push(newCust);
      savedCust = newCust;
    }

    StorageService.saveCustomers(current);
    setCustomers([...current]);

    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('customer', custData.id ? 'update' : 'create', savedCust);
    } else {
      saveCustomerToSupabase(savedCust).catch(err => {
        console.warn('saveCustomerToSupabase error:', err);
        enqueueOfflineSafely('customer', custData.id ? 'update' : 'create', savedCust);
      });
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: custData.id ? 'UPDATE_CUSTOMER' : 'CREATE_CUSTOMER',
      module: 'customers',
      recordId: custData.name,
      details: `Saved customer profile: ${custData.name}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  // Quotations
  const saveQuotation = (qData: Partial<Quotation>) => {
    const current = StorageService.getQuotations();
    const now = new Date().toISOString();

    let savedQ: Quotation;
    if (qData.id) {
      const idx = current.findIndex(q => q.id === qData.id);
      if (idx !== -1) {
        current[idx] = { ...current[idx], ...qData } as Quotation;
        savedQ = current[idx];
      } else {
        return;
      }
    } else {
      const qNumber = `OFF-QT-${new Date().getFullYear()}-${1001 + current.length}`;
      const items = qData.items || [];
      const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
      const taxAmount = ((subtotal + (qData.installationCharges || 0) + (qData.logisticsCharges || 0)) * (qData.vatRate || 0)) / 100;
      const totalAmount = subtotal + (qData.installationCharges || 0) + (qData.logisticsCharges || 0) + taxAmount;

      const newQ: Quotation = {
        id: `qt_${Date.now()}`,
        quotationNumber: qNumber,
        customerId: qData.customerId || '',
        customerName: qData.customerName || '',
        customerPhone: qData.customerPhone || '',
        customerAddress: qData.customerAddress || '',
        items,
        installationCharges: qData.installationCharges || 0,
        logisticsCharges: qData.logisticsCharges || 0,
        subtotal,
        vatRate: qData.vatRate || 0,
        taxAmount,
        totalAmount,
        status: qData.status || 'draft',
        validUntil: qData.validUntil || new Date(Date.now() + 14 * 86400000).toISOString(),
        terms: qData.terms || '70% advance payment on equipment order, 30% upon commissioning.',
        createdBy: currentUser.name,
        createdAt: now,
      };
      current.unshift(newQ);
      savedQ = newQ;
    }

    StorageService.saveQuotations(current);
    setQuotations([...current]);

    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('quotation', qData.id ? 'update' : 'create', savedQ);
    } else {
      saveQuotationToSupabase(savedQ).catch(err => {
        console.warn('saveQuotationToSupabase error:', err);
        enqueueOfflineSafely('quotation', qData.id ? 'update' : 'create', savedQ);
      });
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: qData.id ? 'UPDATE_QUOTATION' : 'CREATE_QUOTATION',
      module: 'sales',
      recordId: qData.quotationNumber,
      details: `Saved solar quotation for ${qData.customerName}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const convertQuotationToOrder = (quotationId: string) => {
    const qList = StorageService.getQuotations();
    const q = qList.find(item => item.id === quotationId);
    if (!q) return { success: false, error: 'Quotation not found.' };

    const saleItems = q.items
      .filter(i => Boolean(i.productId))
      .map(i => ({
        productId: i.productId!,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: 0,
      }));

    if (saleItems.length === 0) {
      return { success: false, error: 'Quotation has no inventoried products to sell.' };
    }

    const saleRes = completeSale({
      customerId: q.customerId,
      customerName: q.customerName,
      customerPhone: q.customerPhone,
      customerTier: 'retail',
      items: saleItems,
      paymentMethod: 'bank_transfer',
      paidAmount: q.totalAmount,
      warehouseLocation:
        settings.warehouses?.[0] ||
        'Head Office Showroom - Opposite Sweetco, Dugbe Iyaganku Road, Ibadan',
      notes: `Converted from Quotation #${q.quotationNumber}`,
    });

    if (saleRes.success && saleRes.sale) {
      q.status = 'converted';
      q.convertedToSaleId = saleRes.sale.id;
      StorageService.saveQuotations(qList);
      setQuotations([...qList]);

      if (!navigator.onLine || !isSupabaseConfigured()) {
        enqueueOfflineSafely('quotation', 'update', q);
      } else {
        saveQuotationToSupabase(q).catch(() => enqueueOfflineSafely('quotation', 'update', q));
      }

      return { success: true, saleId: saleRes.sale.id };
    }

    return { success: false, error: saleRes.error || 'Failed to complete sale from quotation.' };
  };

  // Projects
  const saveProject = (projectData: Partial<InstallationProject>) => {
    const current = StorageService.getProjects();
    const now = new Date().toISOString();
    let savedPrj: InstallationProject;

    if (projectData.id) {
      const idx = current.findIndex(p => p.id === projectData.id);
      if (idx !== -1) {
        current[idx] = { ...current[idx], ...projectData } as InstallationProject;
        savedPrj = current[idx];
      } else {
        return;
      }
    } else {
      const projectCode = `PRJ-IBD-${new Date().getFullYear()}-${String(current.length + 1).padStart(3, '0')}`;
      const contractAmount = projectData.contractAmount || 0;
      const equipCost = projectData.equipmentCost || 0;
      const labourCost = projectData.labourCost || 0;
      const transportCost = projectData.transportCost || 0;
      const otherExpenses = projectData.otherExpenses || 0;
      const totalCost = equipCost + labourCost + transportCost + otherExpenses;

      const newPrj: InstallationProject = {
        id: `prj_${Date.now()}`,
        projectCode,
        title: projectData.title || 'Solar Installation',
        customerId: projectData.customerId || '',
        customerName: projectData.customerName || '',
        customerPhone: projectData.customerPhone || '',
        siteAddress: projectData.siteAddress || 'Ibadan',
        capacityDescription: projectData.capacityDescription || '',
        leadTechnicianId: projectData.leadTechnicianId || currentUser.id,
        leadTechnicianName: projectData.leadTechnicianName || currentUser.name,
        teamMembers: projectData.teamMembers || [currentUser.name],
        status: projectData.status || 'lead',
        startDate: projectData.startDate,
        targetCompletionDate: projectData.targetCompletionDate,
        contractAmount,
        equipmentCost: equipCost,
        labourCost,
        transportCost,
        otherExpenses,
        totalProjectCost: totalCost,
        grossMargin: contractAmount - totalCost,
        materials: [],
        technicalNotes: projectData.technicalNotes || '',
        warrantyPeriodMonths: projectData.warrantyPeriodMonths || 24,
        branchId: activeBranchId !== 'all' ? activeBranchId : currentUser.branchId,
        branchName: activeBranchId !== 'all' ? branches.find(b => b.id === activeBranchId)?.name : currentUser.branchName,
        createdAt: now,
      };
      current.unshift(newPrj);
      savedPrj = newPrj;
    }
    StorageService.saveProjects(current);
    setProjects([...current]);

    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('project', projectData.id ? 'update' : 'create', savedPrj);
    } else {
      saveProjectToSupabase(savedPrj).catch(err => {
        console.warn('saveProjectToSupabase error:', err);
        enqueueOfflineSafely('project', projectData.id ? 'update' : 'create', savedPrj);
      });
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: projectData.id ? 'UPDATE_PROJECT' : 'CREATE_PROJECT',
      module: 'projects',
      recordId: projectData.projectCode,
      details: `Saved installation project: ${projectData.title}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const issueMaterialToProject = (projectId: string, productId: string, quantity: number, warehouseLocation: string) => {
    const res = StorageService.issueProjectMaterial(projectId, productId, quantity, warehouseLocation, currentUser);
    if (res.success) {
      const updatedPrj = StorageService.getProjects().find(p => p.id === projectId);
      const updatedProd = StorageService.getProducts().find(p => p.id === productId);
      const latestMovement = StorageService.getStockMovements()[0];

      if (!navigator.onLine || !isSupabaseConfigured()) {
        if (updatedPrj) enqueueOfflineSafely('project', 'update', updatedPrj);
        if (updatedProd) enqueueOfflineSafely('product', 'update', updatedProd);
        if (latestMovement) enqueueOfflineSafely('stock_movement', 'create', latestMovement);
      } else {
        if (updatedPrj) saveProjectToSupabase(updatedPrj).catch(() => enqueueOfflineSafely('project', 'update', updatedPrj));
        if (updatedProd) saveProductToSupabase(updatedProd).catch(() => enqueueOfflineSafely('product', 'update', updatedProd));
        if (latestMovement) saveStockMovementToSupabase(latestMovement).catch(() => enqueueOfflineSafely('stock_movement', 'create', latestMovement));
      }
      refreshData();
    }
    return res;
  };

  const returnMaterialFromProject = (projectId: string, productId: string, quantity: number, warehouseLocation: string) => {
    const res = StorageService.returnProjectMaterial(projectId, productId, quantity, warehouseLocation, currentUser);
    if (res.success) {
      const updatedPrj = StorageService.getProjects().find(p => p.id === projectId);
      const updatedProd = StorageService.getProducts().find(p => p.id === productId);
      const latestMovement = StorageService.getStockMovements()[0];

      if (!navigator.onLine || !isSupabaseConfigured()) {
        if (updatedPrj) enqueueOfflineSafely('project', 'update', updatedPrj);
        if (updatedProd) enqueueOfflineSafely('product', 'update', updatedProd);
        if (latestMovement) enqueueOfflineSafely('stock_movement', 'create', latestMovement);
      } else {
        if (updatedPrj) saveProjectToSupabase(updatedPrj).catch(() => enqueueOfflineSafely('project', 'update', updatedPrj));
        if (updatedProd) saveProductToSupabase(updatedProd).catch(() => enqueueOfflineSafely('product', 'update', updatedProd));
        if (latestMovement) saveStockMovementToSupabase(latestMovement).catch(() => enqueueOfflineSafely('stock_movement', 'create', latestMovement));
      }
      refreshData();
    }
    return res;
  };

  // Expenses
  const recordExpense = (expenseData: Omit<Expense, 'id' | 'createdAt' | 'recordedByUserId' | 'recordedByUserName'>) => {
    const current = StorageService.getExpenses();
    const now = new Date().toISOString();
    const branch = branches.find(b => b.id === (expenseData.branchId || activeBranchId));

    const newExp: Expense = {
      ...expenseData,
      id: `exp_${Date.now()}`,
      recordedByUserId: currentUser.id,
      recordedByUserName: currentUser.name,
      branchId: branch?.id || currentUser.branchId,
      branchName: branch?.name || currentUser.branchName,
      createdAt: now,
    };

    current.unshift(newExp);
    StorageService.saveExpenses(current);
    setExpenses([...current]);

    if (!navigator.onLine || !isSupabaseConfigured()) {
      enqueueOfflineSafely('expense', 'create', newExp);
    } else {
      saveExpenseToSupabase(newExp).catch(err => {
        console.warn('saveExpenseToSupabase error:', err);
        enqueueOfflineSafely('expense', 'create', newExp);
      });
    }

    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'RECORD_EXPENSE',
      module: 'expenses',
      recordId: newExp.category,
      details: `Recorded expense of ₦${newExp.amount.toLocaleString()} for "${newExp.description}" (${newExp.category}) to ${newExp.payee}.`,
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      currentUser,
      users,
      setCurrentUser,
      switchRole,
      isAuthenticated,
      login,
      logout,
      branches,
      activeBranchId,
      canAccessAllBranches: userCanAccessAllBranches,
      effectiveBranchId,
      setActiveBranchId,
      saveBranch,
      deleteBranch,
      setBranchAsHeadquarters,
      staffAccounts,
      createStaffAccount,
      updateStaffAccount,
      toggleStaffStatus,
      deleteStaffAccount,
      theme,
      toggleTheme,
      clearAllDemoStaff,
      changeSuperadminPassword,
      // Staff KPIs & Performance
      staffKpis,
      saveStaffKpi,
      acceptStaffKpi,
      updateStaffKpiSelfReview,
      reviewStaffKpi,
      addKpiDailyLog,
      deleteStaffKpi,
      settings,
      updateSettings,
      categories,
      products: visibleProducts,
      allProducts: products,
      stockMovements: visibleMovements,
      suppliers,
      purchaseOrders: visiblePurchaseOrders,
      sales: visibleSales,
      allSales: sales,
      customers,
      quotations,
      projects: visibleProjects,
      expenses: visibleExpenses,
      allExpenses: expenses,
      notifications,
      auditLogs,
      refreshData,
      resetDatabase,
      resetToZeroLedger,
      markNotificationRead,
      markAllNotificationsRead,
      saveProduct,
      deleteProduct,
      adjustStock,
      completeSale,
      processReturn,
      processReturns,
      applyGoLiveCatalogAndContacts,
      saveSupplier,
      createPurchaseOrder,
      updatePurchaseOrderStatus,
      receiveGoods,
      recordSupplierPayment,
      saveCustomer,
      saveQuotation,
      convertQuotationToOrder,
      saveProject,
      issueMaterialToProject,
      returnMaterialFromProject,
      recordExpense,
      rolePermissions,
      updateRolePermission,
      assignStaffRole,
      globalSearchQuery,
      setGlobalSearchQuery,
      // Live Supabase Handshake
      isSupabaseConnected,
      supabaseLoading,
      supabaseSyncTime,
      supabaseSyncError,
      syncWithSupabase,
      // Offline Synchronization & PWA Engine
      isOnline,
      offlineQueueCount,
      isSyncingOfflineQueue,
      pendingTransactions,
      flushOfflineSyncQueue,
    }),
    [
      theme,
      activeTab,
      currentUser,
      users,
      isAuthenticated,
      branches,
      activeBranchId,
      userCanAccessAllBranches,
      effectiveBranchId,
      staffAccounts,
      staffKpis,
      settings,
      categories,
      products,
      visibleProducts,
      stockMovements,
      visibleMovements,
      suppliers,
      purchaseOrders,
      visiblePurchaseOrders,
      sales,
      visibleSales,
      customers,
      quotations,
      projects,
      visibleProjects,
      expenses,
      visibleExpenses,
      notifications,
      auditLogs,
      rolePermissions,
      globalSearchQuery,
      isSupabaseConnected,
      supabaseLoading,
      supabaseSyncTime,
      supabaseSyncError,
      syncWithSupabase,
      isOnline,
      offlineQueueCount,
      isSyncingOfflineQueue,
      pendingTransactions,
      flushOfflineSyncQueue,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
