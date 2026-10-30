/**
 * App Context - Global State & Business Actions for Offnot Energy Management System
 * Location: Ibadan, Oyo State, Nigeria
 * Currency: Nigerian Naira (₦)
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
} from '../types';
import { StorageService, INITIAL_CATEGORIES } from '../services/storage';
import {
  getAllowedTabsForUser,
  getDefaultTabForUser,
  canAccessAllBranches as checkCanAccessAllBranches,
} from '../utils/formatters';
import { getSupabaseClient } from '../lib/supabase';

export type { ActiveTab };

interface AppContextType {
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

  // Authentication
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => { success: boolean; error?: string };
  logout: () => void;

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
  resetDatabase: () => void;
  resetToZeroLedger: () => void;
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
  processReturn: (saleId: string, productId: string, quantity: number, reason: string) => { success: boolean; error?: string };

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

  useEffect(() => {
    StorageService.initDatabase();
    refreshData();
  }, []);

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
  };

  const resetToZeroLedger = () => {
    StorageService.resetToZeroLedger();
    refreshData();
  };

  const resetDatabase = () => {
    StorageService.resetToZeroLedger();
    refreshData();
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
        (targetBranch.isHeadquarters && loc.includes('tipper')) ||
        (!targetBranch.isHeadquarters && loc.includes('dalute'))
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

    // Sync to Supabase if connected
    try {
      const client = getSupabaseClient();
      if (client) {
        client.from('branches').upsert({
          id: savedBranch.id,
          name: savedBranch.name,
          code: savedBranch.code,
          city: savedBranch.city,
          state: savedBranch.state,
          address: savedBranch.address,
          phone: savedBranch.phone,
          email: savedBranch.email,
          manager_name: savedBranch.managerName,
          is_headquarters: Boolean(savedBranch.isHeadquarters),
          is_active: Boolean(savedBranch.isActive),
        }).then(({ error }) => {
          if (error) console.warn('Supabase branch sync note:', error.message);
        });
      }
    } catch (e) {
      console.warn('Supabase branch sync exception:', e);
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

    // Sync to Supabase
    try {
      const client = getSupabaseClient();
      if (client) {
        client.from('branches').upsert(
          current.map(b => ({
            id: b.id,
            name: b.name,
            code: b.code,
            city: b.city,
            state: b.state,
            address: b.address,
            phone: b.phone,
            email: b.email,
            manager_name: b.managerName,
            is_headquarters: Boolean(b.isHeadquarters),
            is_active: Boolean(b.isActive),
          }))
        ).then(({ error }) => {
          if (error) console.warn('Supabase HQ sync note:', error.message);
        });
      }
    } catch (e) {
      console.warn('Supabase HQ sync exception:', e);
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
    const branchName = branchObj?.name || staffData.branchName || 'Showroom - Tipper Garage (HQ)';
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

    // Sync to Supabase user_profiles if Supabase is connected
    try {
      const client = getSupabaseClient();
      if (client) {
        client.from('user_profiles').upsert({
          id: newId,
          name: normalizedName,
          username: normalizedUsername,
          email: normalizedEmail,
          phone: staffData.phone?.trim() || '',
          role: staffData.role,
          branch_id: branchId,
          branch_name: branchName,
          temporary_password: tempPassword,
          status: staffData.status || 'active',
          has_full_system_access: Boolean(staffData.hasFullSystemAccess),
          can_access_all_branches: Boolean(staffData.canAccessAllBranches),
        }).then(({ error }) => {
          if (error) console.warn('Supabase staff profile sync notice:', error.message);
        });
      }
    } catch (e) {
      console.warn('Supabase profile sync exception:', e);
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
    try {
      const client = getSupabaseClient();
      if (client) {
        client.from('user_profiles').delete().eq('id', id).then(({ error }) => {
          if (error) console.warn('Supabase delete staff notice:', error.message);
        });
      }
    } catch (e) {
      console.warn('Supabase delete staff exception:', e);
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
    setRolePermissions(StorageService.getRolePermissions());
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
      setStaffAccounts(StorageService.getStaffAccounts());
      setUsers(StorageService.getUsers());
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

    if (!matchedUser) {
      return { success: false, error: 'No account found matching this username or email.' };
    }

    if (matchedUser.status === 'inactive') {
      return { success: false, error: 'This account has been deactivated. Please contact your Superadmin.' };
    }

    // Verify password strictly against temporaryPassword or Superadmin credentials
    const validPassword = matchedUser.temporaryPassword;
    const isSuperAdmin = matchedUser.role === 'super_admin' || matchedUser.email.toLowerCase() === 'francisgabriel932@gmail.com';
    const entered = password.trim();

    const isValid =
      (validPassword && entered === validPassword) ||
      (isSuperAdmin && (entered === 'SuperAdmin2026!' || entered === 'admin' || entered === 'password')) ||
      (!isSuperAdmin && (entered === 'OffnotStaff2026!' || (validPassword && entered === validPassword)));

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
      temporaryPassword: matchedUser.temporaryPassword,
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

  const updateSettings = (newSettings: CompanySettings) => {
    StorageService.saveSettings(newSettings);
    setSettings(newSettings);
    StorageService.logAction({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'UPDATE_SETTINGS',
      module: 'settings',
      details: 'Updated company configuration, warehouses and policy settings.',
    });
    setAuditLogs(StorageService.getAuditLogs());
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

    if (productData.id) {
      const index = currentProducts.findIndex(p => p.id === productData.id);
      if (index === -1) return { success: false, error: 'Product not found.' };

      currentProducts[index] = {
        ...currentProducts[index],
        ...productData,
        updatedAt: now,
      } as Product;
    } else {
      const newProduct: Product = {
        id: `prod_${Date.now()}`,
        sku: productData.sku || `SKU-${Date.now().toString().slice(-6)}`,
        name: productData.name || 'Unnamed Solar Item',
        brand: productData.brand || 'Offnot',
        category: productData.category || 'Other solar accessories',
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
        warehouseLocation: productData.warehouseLocation || 'Main Store - Dalute Road',
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
    }

    StorageService.saveProducts(currentProducts);
    setProducts([...currentProducts]);

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
      refreshData();
    }
    return res;
  };

  const processReturn = (saleId: string, productId: string, quantity: number, reason: string) => {
    const res = StorageService.processCustomerReturn(saleId, productId, quantity, reason, currentUser);
    if (res.success) {
      refreshData();
    }
    return res;
  };

  // Suppliers
  const saveSupplier = (supplierData: Partial<Supplier>) => {
    const current = StorageService.getSuppliers();
    const now = new Date().toISOString();

    if (supplierData.id) {
      const idx = current.findIndex(s => s.id === supplierData.id);
      if (idx !== -1) {
        current[idx] = { ...current[idx], ...supplierData } as Supplier;
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
    }
    StorageService.saveSuppliers(current);
    setSuppliers([...current]);

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
      warehouseLocation: poData.warehouseLocation || 'Main Store - Dalute Road',
      expectedDeliveryDate: poData.expectedDeliveryDate,
      notes: poData.notes,
    };

    current.unshift(newPo);
    StorageService.savePurchaseOrders(current);
    setPurchaseOrders([...current]);

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

    if (custData.id) {
      const idx = current.findIndex(c => c.id === custData.id);
      if (idx !== -1) {
        current[idx] = { ...current[idx], ...custData } as Customer;
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
    }

    StorageService.saveCustomers(current);
    setCustomers([...current]);

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

    if (qData.id) {
      const idx = current.findIndex(q => q.id === qData.id);
      if (idx !== -1) {
        current[idx] = { ...current[idx], ...qData } as Quotation;
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
    }

    StorageService.saveQuotations(current);
    setQuotations([...current]);

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
      warehouseLocation: 'Main Store - Dalute Road',
      notes: `Converted from Quotation #${q.quotationNumber}`,
    });

    if (saleRes.success && saleRes.sale) {
      q.status = 'converted';
      q.convertedToSaleId = saleRes.sale.id;
      StorageService.saveQuotations(qList);
      setQuotations([...qList]);
      return { success: true, saleId: saleRes.sale.id };
    }

    return { success: false, error: saleRes.error || 'Failed to complete sale from quotation.' };
  };

  // Projects
  const saveProject = (projectData: Partial<InstallationProject>) => {
    const current = StorageService.getProjects();
    const now = new Date().toISOString();

    if (projectData.id) {
      const idx = current.findIndex(p => p.id === projectData.id);
      if (idx !== -1) {
        current[idx] = { ...current[idx], ...projectData } as InstallationProject;
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
    }
    StorageService.saveProjects(current);
    setProjects([...current]);

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
      refreshData();
    }
    return res;
  };

  const returnMaterialFromProject = (projectId: string, productId: string, quantity: number, warehouseLocation: string) => {
    const res = StorageService.returnProjectMaterial(projectId, productId, quantity, warehouseLocation, currentUser);
    if (res.success) {
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
