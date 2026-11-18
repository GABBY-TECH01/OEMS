/**
 * Data Persistence & Business Logic Layer for Offnot Energy Management System
 * Location: Ibadan, Oyo State, Nigeria
 * Currency: Nigerian Naira (₦)
 * 
 * Configured with Clean Zero Ledger: all sales, expenses, and current stock figures
 * initialize strictly to 0 so no accounting records contain discrepancies.
 */

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
  Branch,
  StaffAccount,
  PricingTier,
  PaymentMethod,
  PaymentRecord,
  PermissionKey,
  RolePermissionsMap,
  StaffKpi,
  KpiDailyLog,
  OfflineSyncItem,
  OfflineSyncEntityType,
  SaleReturnRecord,
} from '../types';

export const STORAGE_KEYS = {
  PRODUCTS: 'offnot_products_v3',
  MOVEMENTS: 'offnot_stock_movements_v3',
  SUPPLIERS: 'offnot_suppliers_v3',
  PURCHASE_ORDERS: 'offnot_purchase_orders_v3',
  SALES: 'offnot_sales_v3',
  CUSTOMERS: 'offnot_customers_v3',
  QUOTATIONS: 'offnot_quotations_v3',
  PROJECTS: 'offnot_projects_v3',
  EXPENSES: 'offnot_expenses_v3',
  NOTIFICATIONS: 'offnot_notifications_v3',
  AUDIT_LOGS: 'offnot_audit_logs_v3',
  SETTINGS: 'offnot_settings_v3',
  USERS: 'offnot_users_v3',
  STAFF_ACCOUNTS: 'offnot_staff_accounts_v3',
  CURRENT_USER_ID: 'offnot_current_user_id_v3',
  BRANCHES: 'offnot_branches_v3',
  ACTIVE_BRANCH_ID: 'offnot_active_branch_id_v3',
  AUTH_SESSION: 'offnot_auth_session_v3',
  ROLE_PERMISSIONS: 'offnot_role_permissions_v3',
  STAFF_KPIS: 'offnot_staff_kpis_v3',
  SUPERADMIN_PASSWORD: 'offnot_superadmin_password_v3',
  OFFLINE_SYNC_QUEUE: 'offnot_offline_sync_queue_v3',
};

export const INITIAL_ROLE_PERMISSIONS: RolePermissionsMap = {
  super_admin: {
    view_financials: true,
    override_pricing: true,
    adjust_inventory: true,
    approve_purchases: true,
    manage_users: true,
    record_sales: true,
    manage_expenses: true,
    manage_projects: true,
    view_audit_logs: true,
    manage_branches: true,
    manage_settings: true,
    access_all_branches: true,
  },
  admin: {
    view_financials: true,
    override_pricing: true,
    adjust_inventory: true,
    approve_purchases: true,
    manage_users: true,
    record_sales: true,
    manage_expenses: true,
    manage_projects: true,
    view_audit_logs: true,
    manage_branches: true,
    manage_settings: false, // Granted by Superadmin if full access is enabled
    access_all_branches: false, // Granted by Superadmin if all-branch access is enabled
  },
  ceo: {
    view_financials: true,
    override_pricing: true,
    adjust_inventory: false,
    approve_purchases: true,
    manage_users: false,
    record_sales: false,
    manage_expenses: true,
    manage_projects: true,
    view_audit_logs: true,
    manage_branches: true, // Branches hub accessible by Superadmin, CEO, and Inventory Manager
    manage_settings: false,
    access_all_branches: false,
  },
  manager: {
    view_financials: true,
    override_pricing: true,
    adjust_inventory: true,
    approve_purchases: true,
    manage_users: false,
    record_sales: true,
    manage_expenses: true,
    manage_projects: true,
    view_audit_logs: true,
    manage_branches: false,
    manage_settings: false,
    access_all_branches: false,
  },
  inventory_officer: {
    view_financials: false,
    override_pricing: false,
    adjust_inventory: true,
    approve_purchases: true,
    manage_users: false,
    record_sales: false,
    manage_expenses: false,
    manage_projects: false,
    view_audit_logs: false,
    manage_branches: true, // Branches hub accessible by Superadmin, CEO, and Inventory Manager
    manage_settings: false,
    access_all_branches: false,
  },
  sales_rep: {
    view_financials: false,
    override_pricing: false,
    adjust_inventory: false,
    approve_purchases: false,
    manage_users: false,
    record_sales: true,
    manage_expenses: false,
    manage_projects: false,
    view_audit_logs: false,
    manage_branches: false,
    manage_settings: false,
    access_all_branches: false,
  },
  accountant: {
    view_financials: true,
    override_pricing: false,
    adjust_inventory: false,
    approve_purchases: false,
    manage_users: false,
    record_sales: true,
    manage_expenses: true,
    manage_projects: false,
    view_audit_logs: true,
    manage_branches: false,
    manage_settings: false,
    access_all_branches: false,
  },
  technical_staff: {
    view_financials: false,
    override_pricing: false,
    adjust_inventory: false,
    approve_purchases: false,
    manage_users: false,
    record_sales: false,
    manage_expenses: false,
    manage_projects: true,
    view_audit_logs: false,
    manage_branches: false,
    manage_settings: false,
    access_all_branches: false,
  },
};

export const INITIAL_SETTINGS: CompanySettings = {
  companyName: 'Offnot Energy',
  slogan: 'Clean Energy, Stronger Tomorrow',
  location: 'Opposite Sweetco, Dugbe Iyaganku Road, Ibadan, Oyo State, Nigeria',
  phone: '07047053453',
  email: 'offnotenergy@gmail.com',
  headOfficeAddress: 'Opposite Sweetco, Dugbe Iyaganku Road, Ibadan',
  branchOfficeAddress: 'Inside Tipper Garage, Dalute Road, Ibadan',
  dugbePhone: '07064159047',
  dalutePhone: '08087928125',
  customerServicePhone: '07047053453',
  facebookHandle: 'Offnot Energy',
  instagramHandle: 'offnot.energy',
  tiktokHandle: 'offnot Energy',
  currencySymbol: '₦',
  currencyCode: 'NGN',
  defaultVatRate: 7.5,
  enableTaxByDefault: false,
  warehouses: [
    'Head Office - Dugbe Iyaganku Road, Ibadan',
    'Branch Store - Inside Tipper Garage, Dalute Road, Ibadan',
  ],
  minGrossMarginPercent: 12,
  receiptFooterMessage: 'Thank you for choosing Offnot Energy! Clean Energy, Stronger Tomorrow. Official stamped receipt.',
  pwaAppTitle: 'Offnot Energy Management System',
  pwaShortName: 'OffnotEnergy',
  pwaLogoUrl: '/pwa-512x512.png',
  pwaThemeColor: '#064e3b',
  pwaBackgroundColor: '#0f172a',
  enablePwaPrompt: true,
  pwaPromptDelaySeconds: 2,
};

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br_tipper_hq',
    name: 'Head Office - Dugbe (Opposite Sweetco)',
    code: 'BR-IBD-01',
    city: 'Ibadan',
    state: 'Oyo State',
    address: 'Opposite Sweetco, Dugbe Iyaganku Road, Ibadan',
    phone: '07064159047',
    email: 'offnotenergy@gmail.com',
    managerName: 'Gabriel Francis',
    isHeadquarters: true,
    isActive: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'br_dalute_main',
    name: 'Branch Office - Dalute Road (Tipper Garage)',
    code: 'BR-IBD-02',
    city: 'Ibadan',
    state: 'Oyo State',
    address: 'Inside Tipper Garage, Dalute Road, Ibadan',
    phone: '08087928125',
    email: 'offnotenergy@gmail.com',
    managerName: 'Bolanle Oladipo',
    isHeadquarters: false,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_super_admin',
    name: 'Francis Gabriel (Superadmin)',
    username: 'superadmin',
    email: 'francisgabriel932@gmail.com',
    role: 'super_admin',
    phone: '07047053453',
    branchId: 'br_tipper_hq',
    branchName: 'Head Office - Dugbe (Opposite Sweetco)',
    temporaryPassword: 'SuperAdmin2026!',
    status: 'active',
    hasFullSystemAccess: true,
    canAccessAllBranches: true,
  },
  {
    id: 'usr_admin',
    name: 'Ayomide Bakare (Deputy Admin)',
    username: 'admin',
    email: 'admin@offnotenergy.ng',
    role: 'admin',
    phone: '07064159047',
    branchId: 'br_tipper_hq',
    branchName: 'Head Office - Dugbe (Opposite Sweetco)',
    temporaryPassword: 'Admin2026!',
    status: 'active',
    hasFullSystemAccess: false,
    canAccessAllBranches: false,
  },
  {
    id: 'usr_ceo',
    name: 'Chief Executive Officer',
    username: 'ceo',
    email: 'ceo@offnotenergy.ng',
    role: 'ceo',
    phone: '07047053453',
    branchId: 'br_tipper_hq',
    branchName: 'Head Office - Dugbe (Opposite Sweetco)',
    temporaryPassword: 'Ceo2026!',
    status: 'active',
  },
  {
    id: 'usr_manager',
    name: 'Bolanle Oladipo',
    username: 'manager',
    email: 'manager@offnotenergy.ng',
    role: 'manager',
    phone: '08087928125',
    branchId: 'br_dalute_main',
    branchName: 'Branch Office - Dalute Road (Tipper Garage)',
    temporaryPassword: 'Manager2026!',
    status: 'active',
  },
  {
    id: 'usr_inventory',
    name: 'Sunday Adeyemi',
    username: 'inventory',
    email: 'inventory@offnotenergy.ng',
    role: 'inventory_officer',
    phone: '08087928125',
    branchId: 'br_dalute_main',
    branchName: 'Branch Office - Dalute Road (Tipper Garage)',
    temporaryPassword: 'Inventory2026!',
    status: 'active',
  },
  {
    id: 'usr_sales',
    name: 'Kehinde Balogun',
    username: 'sales',
    email: 'sales@offnotenergy.ng',
    role: 'sales_rep',
    phone: '07064159047',
    branchId: 'br_tipper_hq',
    branchName: 'Head Office - Dugbe (Opposite Sweetco)',
    temporaryPassword: 'Sales2026!',
    status: 'active',
  },
  {
    id: 'usr_accountant',
    name: 'Funmilayo Adeleke',
    username: 'accountant',
    email: 'accounts@offnotenergy.ng',
    role: 'accountant',
    phone: '07047053453',
    branchId: 'br_tipper_hq',
    branchName: 'Head Office - Dugbe (Opposite Sweetco)',
    temporaryPassword: 'Accounts2026!',
    status: 'active',
  },
  {
    id: 'usr_engineer',
    name: 'Engr. Tayo Alabi',
    username: 'engineer',
    email: 'tech@offnotenergy.ng',
    role: 'technical_staff',
    phone: '08087928125',
    branchId: 'br_dalute_main',
    branchName: 'Branch Office - Dalute Road (Tipper Garage)',
    temporaryPassword: 'Engineer2026!',
    status: 'active',
  },
];

export const INITIAL_STAFF_ACCOUNTS: StaffAccount[] = INITIAL_USERS.map(u => ({
  id: u.id,
  name: u.name,
  username: u.username || u.email.split('@')[0],
  email: u.email,
  role: u.role,
  phone: u.phone || '07047053453',
  branchId: u.branchId || 'br_tipper_hq',
  branchName: u.branchName || 'Head Office - Dugbe (Opposite Sweetco)',
  temporaryPassword: u.temporaryPassword,
  status: u.status,
  hasFullSystemAccess: u.hasFullSystemAccess,
  canAccessAllBranches: u.canAccessAllBranches,
  createdAt: '2026-01-01T08:00:00Z',
  lastLogin: '2026-10-28T08:00:00Z',
}));

export const INITIAL_CATEGORIES = [
  'Itel All In One',
  'Itel Inverter',
  'Itel Battery',
  'Tubular Batteries',
  'Invertek Hybrid',
  'Solar Panels',
  'Cables',
  'Breaker Box',
  'Protecting Devices',
  'Lighting & Flood Lights',
  'Solar Cameras',
  'Trucking Pipes',
  'Installation Accessories',
  'Distilled Water',
  'Extension Boxes',
  'Other Solar Accessories',
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_itel',
    companyName: 'Itel Energy Nigeria Official',
    contactPerson: 'Kazeem Mustapha',
    phone: '08182233445',
    email: 'b2b@itel-energy.ng',
    address: 'Computer Village, Ikeja & Ibadan Regional Hub',
    categories: ['Itel All In One', 'Itel Inverter', 'Itel Battery', 'Solar Panels'],
    paymentTerms: '30 Days Net',
    outstandingBalance: 0,
    createdAt: '2026-02-01T10:00:00Z',
    notes: 'Primary supplier for Itel All-in-One PowerGo/PowerTank, Itel Hybrid Inverters, Lithium Batteries & 620W Panels.',
  },
  {
    id: 'sup_felicity',
    companyName: 'Invertek & Powerzen West Africa',
    contactPerson: 'Mr. Biodun Adewale',
    phone: '08031122334',
    email: 'orders@invertek-solar.ng',
    address: 'Plot 14 Commercial Avenue, Ikeja, Lagos',
    categories: ['Invertek Hybrid', 'Tubular Batteries'],
    paymentTerms: '14 Days Net',
    outstandingBalance: 0,
    createdAt: '2026-01-10T08:00:00Z',
    notes: 'Supplier for Invertek Hybrid inverters and Powerzen tubular batteries.',
  },
  {
    id: 'sup_jinko',
    companyName: 'Jinko Solar West Africa Distributors',
    contactPerson: 'Mrs. Chinyere Okafor',
    phone: '08029988776',
    email: 'orders@jinkowestafrica.com',
    address: 'Apapa Port Industrial Area, Lagos',
    categories: ['Solar Panels'],
    paymentTerms: 'Immediate',
    outstandingBalance: 0,
    createdAt: '2026-01-15T09:30:00Z',
    notes: 'Grade A Tier 1 Jinko Solar Panels.',
  },
  {
    id: 'sup_cables',
    companyName: 'Havells & Coleman Cable Depot Ibadan',
    contactPerson: 'Elder Samuel Ajayi',
    phone: '08055566778',
    email: 'sales@ibadancablehub.ng',
    address: 'Dugbe Commercial Center, Ibadan, Oyo State',
    categories: [
      'Cables',
      'Breaker Box',
      'Protecting Devices',
      'Lighting & Flood Lights',
      'Solar Cameras',
      'Trucking Pipes',
      'Installation Accessories',
      'Distilled Water',
      'Extension Boxes',
    ],
    paymentTerms: 'Immediate',
    outstandingBalance: 0,
    createdAt: '2026-02-10T11:00:00Z',
  },
];

function roundNairaStep(val: number, basePrice: number): number {
  if (basePrice < 1000) return Math.round(val / 10) * 10;
  if (basePrice < 10000) return Math.round(val / 50) * 50;
  return Math.round(val / 500) * 500;
}

function buildCatalogProduct(params: {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  model: string;
  description: string;
  unit?: string;
  price: number;
  reorderLevel?: number;
  supplierId?: string;
  supplierName?: string;
  barcode: string;
  branchId?: string;
  specs?: Product['specs'];
}): Product {
  const p = params.price;
  const isHQ = (params.branchId || 'br_tipper_hq') === 'br_tipper_hq';
  return {
    id: params.id,
    sku: params.sku,
    name: params.name,
    brand: params.brand,
    category: params.category,
    model: params.model,
    description: params.description,
    unit: params.unit || 'Unit',
    purchaseCost: roundNairaStep(p * 0.88, p),
    retailPrice: roundNairaStep(p * 1.08, p),
    wholesalePrice: roundNairaStep(p * 1.03, p),
    installerPrice: p,
    dealerPrice: roundNairaStep(p * 0.97, p),
    minSellingPrice: roundNairaStep(p * 0.95, p),
    currentStock: 0,
    reorderLevel: params.reorderLevel ?? 5,
    warehouseLocation: isHQ
      ? 'Head Office - Dugbe Iyaganku Road, Ibadan'
      : 'Branch Store - Inside Tipper Garage, Dalute Road, Ibadan',
    branchId: isHQ ? 'br_tipper_hq' : 'br_dalute_main',
    branchName: isHQ
      ? 'Head Office - Dugbe (Opposite Sweetco)'
      : 'Branch Office - Dalute Road (Tipper Garage)',
    supplierId: params.supplierId || 'sup_itel',
    supplierName: params.supplierName || 'Itel Energy Nigeria Official',
    barcode: params.barcode,
    specs: params.specs,
    status: 'active',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  };
}

/**
 * Official Offnot Energy Price List Product Catalog (66 Confirmed SKUs — Dugbe Branch)
 * All 66 available products are assigned to Head Office - Dugbe (Opposite Sweetco) (br_tipper_hq).
 * Base prices from price list are assigned as Installer Price, with proportional
 * Retail / Wholesale / Dealer / Min Floor / Purchase Cost tiers and 0 opening stock.
 */
export const INITIAL_PRODUCTS: Product[] = [
  // 1. Itel All In One
  buildCatalogProduct({
    id: 'prod_itel_power_go',
    sku: 'AIO-ITEL-PG',
    name: 'Itel POWER GO All-in-One Solar System',
    brand: 'Itel',
    category: 'Itel All In One',
    model: 'POWER GO',
    description: 'Compact Itel All-in-One portable solar lighting & charging system.',
    price: 75600,
    barcode: '489448900101',
  }),
  buildCatalogProduct({
    id: 'prod_itel_power_go_pro',
    sku: 'AIO-ITEL-PG-PRO',
    name: 'Itel POWER GO PRO All-in-One Solar System',
    brand: 'Itel',
    category: 'Itel All In One',
    model: 'POWER GO PRO',
    description: 'Upgraded Itel Power Go Pro all-in-one solar kit for home & shop backup.',
    price: 132000,
    barcode: '489448900102',
  }),
  buildCatalogProduct({
    id: 'prod_itel_powertank_500',
    sku: 'AIO-ITEL-PT500',
    name: 'ITEL 500W POWERTANK Portable Power Station',
    brand: 'Itel',
    category: 'Itel All In One',
    model: '500W POWERTANK',
    description: 'Itel 500W PowerTank pure sine wave portable LiFePO4 power station.',
    price: 280000,
    barcode: '489448900103',
    specs: { powerRatingKw: 0.5, chemistry: 'LiFePO4', warrantyMonths: 24 },
  }),
  buildCatalogProduct({
    id: 'prod_itel_powertank_1000',
    sku: 'AIO-ITEL-PT1000',
    name: 'ITEL 1000W Power tank Portable Power Station',
    brand: 'Itel',
    category: 'Itel All In One',
    model: '1000W POWERTANK',
    description: 'Itel 1000W PowerTank high-capacity portable solar power station.',
    price: 600000,
    barcode: '489448900104',
    specs: { powerRatingKw: 1.0, chemistry: 'LiFePO4', warrantyMonths: 24 },
  }),

  // 2. ITEL INVERTER
  buildCatalogProduct({
    id: 'prod_itel_inv_1_5kva',
    sku: 'INV-ITEL-1.5KVA-12V',
    name: 'Itel 1.5KVA / 12V Hybrid Inverter',
    brand: 'Itel',
    category: 'Itel Inverter',
    model: '1.5KVA/12V',
    description: 'Itel 1.5kVA 12V solar hybrid inverter with built-in MPPT charge controller.',
    price: 218000,
    barcode: '489448900201',
    specs: { powerRatingKw: 1.5, voltage: '12V', warrantyMonths: 24 },
  }),
  buildCatalogProduct({
    id: 'prod_itel_inv_3kva',
    sku: 'INV-ITEL-3KVA-24V',
    name: 'Itel 3KVA / 24V Hybrid Inverter',
    brand: 'Itel',
    category: 'Itel Inverter',
    model: '3KVA/24V',
    description: 'Itel 3kVA 24V pure sine wave hybrid solar inverter.',
    price: 299000,
    barcode: '489448900202',
    specs: { powerRatingKw: 3.0, voltage: '24V', warrantyMonths: 24 },
  }),
  buildCatalogProduct({
    id: 'prod_itel_inv_4kva',
    sku: 'INV-ITEL-4KVA-24V',
    name: 'Itel 4KVA / 24V Hybrid Inverter',
    brand: 'Itel',
    category: 'Itel Inverter',
    model: '4KVA/24V',
    description: 'Itel 4kVA 24V solar hybrid inverter with smart BMS support.',
    price: 379000,
    barcode: '489448900203',
    specs: { powerRatingKw: 4.0, voltage: '24V', warrantyMonths: 24 },
  }),
  buildCatalogProduct({
    id: 'prod_itel_inv_6kva',
    sku: 'INV-ITEL-6KVA-48V',
    name: 'Itel 6KVA / 48V Hybrid Inverter',
    brand: 'Itel',
    category: 'Itel Inverter',
    model: '6KVA/48V',
    description: 'Itel 6kVA 48V heavy-duty hybrid inverter for residential & SME loads.',
    price: 510000,
    barcode: '489448900204',
    specs: { powerRatingKw: 6.0, voltage: '48V', warrantyMonths: 24 },
  }),
  buildCatalogProduct({
    id: 'prod_itel_inv_8kva',
    sku: 'INV-ITEL-8KVA-48V',
    name: 'Itel 8KVA / 48V Hybrid Inverter',
    brand: 'Itel',
    category: 'Itel Inverter',
    model: '8KVA/48V',
    description: 'Itel 8kVA 48V dual-MPPT hybrid inverter with Wi-Fi monitoring.',
    price: 713000,
    barcode: '489448900205',
    specs: { powerRatingKw: 8.0, voltage: '48V', warrantyMonths: 24 },
  }),
  buildCatalogProduct({
    id: 'prod_itel_inv_11kva',
    sku: 'INV-ITEL-11KVA-48V',
    name: 'Itel 11KVA / 48V Hybrid Inverter',
    brand: 'Itel',
    category: 'Itel Inverter',
    model: '11KVA/48V',
    description: 'Itel 11kVA 48V commercial-grade hybrid inverter.',
    price: 917000,
    barcode: '489448900206',
    specs: { powerRatingKw: 11.0, voltage: '48V', warrantyMonths: 24 },
  }),
  buildCatalogProduct({
    id: 'prod_itel_inv_12kva',
    sku: 'INV-ITEL-12KVA-48V',
    name: 'Itel 12KVA / 48V Hybrid Inverter',
    brand: 'Itel',
    category: 'Itel Inverter',
    model: '12KVA/48V',
    description: 'Itel 12kVA 48V flagship commercial hybrid solar inverter.',
    price: 990000,
    barcode: '489448900207',
    specs: { powerRatingKw: 12.0, voltage: '48V', warrantyMonths: 24 },
  }),

  // 3. ITEL BATTERY
  buildCatalogProduct({
    id: 'prod_itel_bat_1_28',
    sku: 'BAT-ITEL-1.28-100AH',
    name: 'Itel 1.28V+100AH Lithium Solar Battery',
    brand: 'Itel',
    category: 'Itel Battery',
    model: '1.28KWH-100AH',
    description: 'Itel 12.8V 100Ah (1.28kWh) LiFePO4 deep-cycle solar battery.',
    price: 210000,
    barcode: '489448900301',
    specs: { batteryCapacityKwh: 1.28, voltage: '12.8V', chemistry: 'LiFePO4', warrantyMonths: 36 },
  }),
  buildCatalogProduct({
    id: 'prod_itel_bat_2_56',
    sku: 'BAT-ITEL-2.56KW',
    name: 'Itel 2.56KW Lithium Solar Battery',
    brand: 'Itel',
    category: 'Itel Battery',
    model: '2.56KW-24V',
    description: 'Itel 2.56kWh 24V LiFePO4 solar storage battery with smart BMS.',
    price: 547000,
    barcode: '489448900302',
    specs: { batteryCapacityKwh: 2.56, voltage: '25.6V', chemistry: 'LiFePO4', warrantyMonths: 60 },
  }),
  buildCatalogProduct({
    id: 'prod_itel_bat_5kwh_48v',
    sku: 'BAT-ITEL-5KWH-48V',
    name: 'Itel 5KWH 48V Lithium Solar Battery',
    brand: 'Itel',
    category: 'Itel Battery',
    model: '5KWH-48V',
    description: 'Itel 5kWh 48V wall/rack-mount LiFePO4 battery bank.',
    price: 910000,
    barcode: '489448900303',
    specs: { batteryCapacityKwh: 5.0, voltage: '48V', chemistry: 'LiFePO4', warrantyMonths: 60 },
  }),
  buildCatalogProduct({
    id: 'prod_itel_bat_5kwh_24v',
    sku: 'BAT-ITEL-5KWH-24V',
    name: 'Itel 5KWH 24V Lithium Solar Battery',
    brand: 'Itel',
    category: 'Itel Battery',
    model: '5KWH-24V',
    description: 'Itel 5kWh 24V high-capacity LiFePO4 battery bank.',
    price: 947000,
    barcode: '489448900304',
    specs: { batteryCapacityKwh: 5.0, voltage: '24V', chemistry: 'LiFePO4', warrantyMonths: 60 },
  }),
  buildCatalogProduct({
    id: 'prod_itel_bat_16kwh_4h',
    sku: 'BAT-ITEL-16KWH-4H',
    name: 'Itel 16KWH 4H Lithium Battery Bank',
    brand: 'Itel',
    category: 'Itel Battery',
    model: '16KWH-4H',
    description: 'Itel 16kWh 4H floor-standing LiFePO4 energy storage cabinet.',
    price: 2310000,
    barcode: '489448900305',
    specs: { batteryCapacityKwh: 16.0, voltage: '48V', chemistry: 'LiFePO4', warrantyMonths: 60 },
  }),
  buildCatalogProduct({
    id: 'prod_itel_bat_16kwhy',
    sku: 'BAT-ITEL-16KWHY',
    name: 'Itel 16KWHY Lithium Battery Bank',
    brand: 'Itel',
    category: 'Itel Battery',
    model: '16KWHY',
    description: 'Itel 16kWh Y-series LiFePO4 high-cycle commercial battery bank.',
    price: 2280000,
    barcode: '489448900306',
    specs: { batteryCapacityKwh: 16.0, voltage: '48V', chemistry: 'LiFePO4', warrantyMonths: 60 },
  }),

  // 4. TUBULAR BATTERIES
  buildCatalogProduct({
    id: 'prod_powerzen_tubular',
    sku: 'BAT-PWRZ-TUB-12V',
    name: 'Powerzen Tubular Battery',
    brand: 'Powerzen',
    category: 'Tubular Batteries',
    model: 'Powerzen-TUB',
    description: 'Heavy-duty Powerzen tall tubular deep-cycle solar battery.',
    price: 210000,
    supplierId: 'sup_felicity',
    supplierName: 'Invertek & Powerzen West Africa',
    barcode: '489448900401',
    specs: { voltage: '12V', chemistry: 'Tubular', warrantyMonths: 18 },
  }),

  // 5. INVERTEK HYBRID
  buildCatalogProduct({
    id: 'prod_invertek_1_1kva',
    sku: 'INV-INVTK-1.1KVA-12V',
    name: 'Invertek Wall Mount 1.1KVA / 12V Hybrid Inverter',
    brand: 'Invertek',
    category: 'Invertek Hybrid',
    model: 'Wall Mount 1.1kVA/12V',
    description: 'Compact Invertek wall-mount 1.1kVA 12V hybrid solar inverter.',
    price: 92000,
    supplierId: 'sup_felicity',
    supplierName: 'Invertek & Powerzen West Africa',
    barcode: '489448900501',
    specs: { powerRatingKw: 1.1, voltage: '12V', warrantyMonths: 18 },
  }),
  buildCatalogProduct({
    id: 'prod_invertek_1_5kva',
    sku: 'INV-INVTK-1.5KVA-12V',
    name: 'Invertek Wall Mount 1.5KVA / 12V Hybrid Inverter',
    brand: 'Invertek',
    category: 'Invertek Hybrid',
    model: 'Wall Mount 1.5kVA/12V',
    description: 'Invertek wall-mount 1.5kVA 12V solar hybrid inverter.',
    price: 116000,
    supplierId: 'sup_felicity',
    supplierName: 'Invertek & Powerzen West Africa',
    barcode: '489448900502',
    specs: { powerRatingKw: 1.5, voltage: '12V', warrantyMonths: 18 },
  }),
  buildCatalogProduct({
    id: 'prod_invertek_2kva',
    sku: 'INV-INVTK-2KVA-12V',
    name: 'Invertek Hybrid 2KVA / 12V Inverter',
    brand: 'Invertek',
    category: 'Invertek Hybrid',
    model: 'Hybrid 2kVA/12V',
    description: 'Invertek 2kVA 12V hybrid solar inverter.',
    price: 218000,
    supplierId: 'sup_felicity',
    supplierName: 'Invertek & Powerzen West Africa',
    barcode: '489448900503',
    specs: { powerRatingKw: 2.0, voltage: '12V', warrantyMonths: 24 },
  }),
  buildCatalogProduct({
    id: 'prod_invertek_3kva',
    sku: 'INV-INVTK-3KVA-24V',
    name: 'Invertek Hybrid 3KVA / 24V Inverter',
    brand: 'Invertek',
    category: 'Invertek Hybrid',
    model: 'Hybrid 3kVA/24V',
    description: 'Invertek 3kVA 24V MPPT hybrid solar inverter.',
    price: 289000,
    supplierId: 'sup_felicity',
    supplierName: 'Invertek & Powerzen West Africa',
    barcode: '489448900504',
    specs: { powerRatingKw: 3.0, voltage: '24V', warrantyMonths: 24 },
  }),
  buildCatalogProduct({
    id: 'prod_invertek_4_2kva',
    sku: 'INV-INVTK-4.2KVA-24V',
    name: 'Invertek Hybrid 4.2KVA / 24V Inverter',
    brand: 'Invertek',
    category: 'Invertek Hybrid',
    model: 'Hybrid 4.2kVA/24V',
    description: 'Invertek 4.2kVA 24V high-output hybrid solar inverter.',
    price: 364000,
    supplierId: 'sup_felicity',
    supplierName: 'Invertek & Powerzen West Africa',
    barcode: '489448900505',
    specs: { powerRatingKw: 4.2, voltage: '24V', warrantyMonths: 24 },
  }),

  // 6. SOLAR PANELS
  buildCatalogProduct({
    id: 'prod_panel_410w',
    sku: 'PNL-SOLAR-410W',
    name: '410W Monocrystalline Solar Panel',
    brand: 'Offnot Solar',
    category: 'Solar Panels',
    model: '410W Mono',
    description: 'High-efficiency 410W monocrystalline solar PV module.',
    price: 95000,
    reorderLevel: 15,
    supplierId: 'sup_jinko',
    supplierName: 'Jinko Solar West Africa Distributors',
    barcode: '489448900601',
    specs: { panelWattageW: 410, warrantyMonths: 144 },
  }),
  buildCatalogProduct({
    id: 'prod_panel_550w_jinko',
    sku: 'PNL-JNK-550W',
    name: '550W Jinko Solar Panel',
    brand: 'Jinko Solar',
    category: 'Solar Panels',
    model: '550W Jinko',
    description: 'Jinko 550W Tiger Pro / Neo high-output solar panel.',
    price: 120000,
    reorderLevel: 20,
    supplierId: 'sup_jinko',
    supplierName: 'Jinko Solar West Africa Distributors',
    barcode: '489448900602',
    specs: { panelWattageW: 550, warrantyMonths: 144 },
  }),
  buildCatalogProduct({
    id: 'prod_panel_620w_itel',
    sku: 'PNL-ITEL-620W',
    name: '620W Itel Bifacial Solar Panel',
    brand: 'Itel',
    category: 'Solar Panels',
    model: '620W Itel',
    description: 'Itel 620W high-wattage N-type bifacial solar panel.',
    price: 138000,
    reorderLevel: 15,
    supplierId: 'sup_itel',
    supplierName: 'Itel Energy Nigeria Official',
    barcode: '489448900603',
    specs: { panelWattageW: 620, warrantyMonths: 144 },
  }),

  // 7. CABLES
  buildCatalogProduct({
    id: 'prod_cable_dc_4mm',
    sku: 'CBL-DC-4MM',
    name: 'DC 4mm Solar Cable (per Meter)',
    brand: 'Coleman / Havells',
    category: 'Cables',
    model: 'DC 4mm',
    description: 'UV-resistant double-insulated 4mm² solar DC PV cable.',
    unit: 'Meter',
    price: 2700,
    reorderLevel: 50,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900701',
  }),
  buildCatalogProduct({
    id: 'prod_cable_dc_6mm',
    sku: 'CBL-DC-6MM',
    name: 'DC 6mm Solar Cable (per Meter)',
    brand: 'Coleman / Havells',
    category: 'Cables',
    model: 'DC 6mm',
    description: 'UV-resistant double-insulated 6mm² solar DC PV cable.',
    unit: 'Meter',
    price: 3800,
    reorderLevel: 50,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900702',
  }),
  buildCatalogProduct({
    id: 'prod_cable_ac_2_5mm',
    sku: 'CBL-AC-2.5MM',
    name: 'AC 2.5mm Flexible Power Cable (per Meter)',
    brand: 'Coleman / Havells',
    category: 'Cables',
    model: 'AC 2.5mm',
    description: 'Pure copper 2.5mm² AC distribution cable for inverter wiring.',
    unit: 'Meter',
    price: 600,
    reorderLevel: 50,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900703',
  }),
  buildCatalogProduct({
    id: 'prod_cable_ac_4mm',
    sku: 'CBL-AC-4MM',
    name: 'AC 4mm Flexible Power Cable (per Meter)',
    brand: 'Coleman / Havells',
    category: 'Cables',
    model: 'AC 4mm',
    description: 'Pure copper 4mm² AC inverter output cable.',
    unit: 'Meter',
    price: 900,
    reorderLevel: 50,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900704',
  }),
  buildCatalogProduct({
    id: 'prod_cable_ac_6mm',
    sku: 'CBL-AC-6MM',
    name: 'AC 6mm Heavy-Duty Power Cable (per Meter)',
    brand: 'Coleman / Havells',
    category: 'Cables',
    model: 'AC 6mm',
    description: 'Pure copper 6mm² heavy-load AC inverter distribution cable.',
    unit: 'Meter',
    price: 1500,
    reorderLevel: 50,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900705',
  }),

  // 8. BREAKER BOX
  buildCatalogProduct({
    id: 'prod_box_2way',
    sku: 'BRK-BOX-2WAY',
    name: '2-Way DIN Rail Breaker Enclosure Box',
    brand: 'Offnot Hardware',
    category: 'Breaker Box',
    model: '2Way box',
    description: 'IP65 waterproof 2-way DIN rail distribution enclosure.',
    price: 1500,
    reorderLevel: 10,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900801',
  }),
  buildCatalogProduct({
    id: 'prod_box_4way',
    sku: 'BRK-BOX-4WAY',
    name: '4-Way DIN Rail Breaker Enclosure Box',
    brand: 'Offnot Hardware',
    category: 'Breaker Box',
    model: '4way box',
    description: '4-way DIN rail distribution box for DC/AC breakers and SPDs.',
    price: 3000,
    reorderLevel: 10,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900802',
  }),
  buildCatalogProduct({
    id: 'prod_box_6way',
    sku: 'BRK-BOX-6WAY',
    name: '6-Way DIN Rail Breaker Enclosure Box',
    brand: 'Offnot Hardware',
    category: 'Breaker Box',
    model: '6way',
    description: '6-way DIN rail protection box for solar combiner & AC changeovers.',
    price: 3500,
    reorderLevel: 10,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900803',
  }),
  buildCatalogProduct({
    id: 'prod_box_9way',
    sku: 'BRK-BOX-9WAY',
    name: '9-Way DIN Rail Breaker Enclosure Box',
    brand: 'Offnot Hardware',
    category: 'Breaker Box',
    model: '9way',
    description: '9-way distribution enclosure for hybrid inverter protection gear.',
    price: 4500,
    reorderLevel: 10,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900804',
  }),
  buildCatalogProduct({
    id: 'prod_box_13way',
    sku: 'BRK-BOX-13WAY',
    name: '13-Way DIN Rail Breaker Enclosure Box',
    brand: 'Offnot Hardware',
    category: 'Breaker Box',
    model: '13way',
    description: '13-way multi-string solar combiner and AC protection enclosure.',
    price: 5000,
    reorderLevel: 10,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900805',
  }),

  // 9. PROTECTING DEVICES
  buildCatalogProduct({
    id: 'prod_voltage_regulator',
    sku: 'PRT-VREG-STD',
    name: 'Voltage Regulator',
    brand: 'Offnot Hardware',
    category: 'Protecting Devices',
    model: 'Voltage Regulator',
    description: 'Automatic AC voltage stabilizer and protector for solar & inverter lines.',
    price: 8000,
    reorderLevel: 10,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900901',
  }),
  buildCatalogProduct({
    id: 'prod_dc_breaker_63a',
    sku: 'PRT-DCBRK-63A',
    name: 'DC Breaker 63A',
    brand: 'Offnot Hardware',
    category: 'Protecting Devices',
    model: 'DC Breaker 63A',
    description: '2-Pole 63A DC Miniature Circuit Breaker (MCB) for solar battery & PV arrays.',
    price: 6000,
    reorderLevel: 15,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900902',
  }),
  buildCatalogProduct({
    id: 'prod_dc_breaker_32a',
    sku: 'PRT-DCBRK-32A',
    name: 'DC Breaker 32A',
    brand: 'Offnot Hardware',
    category: 'Protecting Devices',
    model: 'DC Breaker 32A',
    description: '2-Pole 32A DC Miniature Circuit Breaker (MCB) for solar PV strings.',
    price: 5500,
    reorderLevel: 15,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900903',
  }),
  buildCatalogProduct({
    id: 'prod_ac_breaker',
    sku: 'PRT-ACBRK-STD',
    name: 'AC Breaker',
    brand: 'Offnot Hardware',
    category: 'Protecting Devices',
    model: 'AC Breaker',
    description: 'DIN rail AC Miniature Circuit Breaker for inverter input & output protection.',
    price: 5000,
    reorderLevel: 15,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900904',
  }),
  buildCatalogProduct({
    id: 'prod_dc_surge_protector',
    sku: 'PRT-DCSPD-STD',
    name: 'DC Surge Protector',
    brand: 'Offnot Hardware',
    category: 'Protecting Devices',
    model: 'DC Surge Protector',
    description: 'PV DC Surge Protection Device (SPD) to shield MPPT charge controllers from lightning surges.',
    price: 8000,
    reorderLevel: 10,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900905',
  }),
  buildCatalogProduct({
    id: 'prod_ac_surge_protector',
    sku: 'PRT-ACSPD-STD',
    name: 'AC Surge Protector',
    brand: 'Offnot Hardware',
    category: 'Protecting Devices',
    model: 'AC Surge Protector',
    description: 'AC Surge Protection Device (SPD) for grid/generator overvoltage protection.',
    price: 6000,
    reorderLevel: 10,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448900906',
  }),

  // 10. BULB & FLOOD LIGHT
  buildCatalogProduct({
    id: 'prod_bulb_5w',
    sku: 'LGT-BULB-5W',
    name: '5W LED Solar Bulb',
    brand: 'Offnot Lighting',
    category: 'Lighting & Flood Lights',
    model: '5W Bulb',
    description: 'Energy-saving 5W LED bulb ideal for solar home lighting.',
    price: 700,
    reorderLevel: 30,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901001',
  }),
  buildCatalogProduct({
    id: 'prod_bulb_6w_surface',
    sku: 'LGT-SURF-6W',
    name: '6W Surface Light',
    brand: 'Offnot Lighting',
    category: 'Lighting & Flood Lights',
    model: '6W Surface light',
    description: 'Slim 6W LED surface-mounted ceiling light fixture.',
    price: 1500,
    reorderLevel: 25,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901002',
  }),
  buildCatalogProduct({
    id: 'prod_floodlight_100w',
    sku: 'LGT-FLD-100W',
    name: '100W Solar Flood Light',
    brand: 'Offnot Lighting',
    category: 'Lighting & Flood Lights',
    model: '100W Flood Light',
    description: '100W IP66 outdoor solar flood light with solar panel and remote control.',
    price: 24000,
    reorderLevel: 10,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901003',
  }),
  buildCatalogProduct({
    id: 'prod_floodlight_200w',
    sku: 'LGT-FLD-200W',
    name: '200W Solar Flood Light',
    brand: 'Offnot Lighting',
    category: 'Lighting & Flood Lights',
    model: '200W Flood Light',
    description: '200W high-lumen IP66 outdoor solar flood light with dusk-to-dawn sensor.',
    price: 30000,
    reorderLevel: 10,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901004',
  }),
  buildCatalogProduct({
    id: 'prod_floodlight_300w',
    sku: 'LGT-FLD-300W',
    name: '300W Solar Flood Light',
    brand: 'Offnot Lighting',
    category: 'Lighting & Flood Lights',
    model: '300W Flood Light',
    description: '300W heavy-duty commercial solar flood light with high-capacity LiFePO4 battery.',
    price: 37000,
    reorderLevel: 10,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901005',
  }),
  buildCatalogProduct({
    id: 'prod_streetlight',
    sku: 'LGT-STREET-STD',
    name: 'Solar Streetlight',
    brand: 'Offnot Lighting',
    category: 'Lighting & Flood Lights',
    model: 'Streetlight',
    description: 'All-in-one outdoor solar LED streetlight with motion sensor.',
    price: 30000,
    reorderLevel: 10,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901006',
  }),

  // 11. SOLAR CAMERAS
  buildCatalogProduct({
    id: 'prod_solar_cam_dual',
    sku: 'CAM-SOLAR-DUAL',
    name: 'Dual Lens Solar Camera',
    brand: 'Offnot Security',
    category: 'Solar Cameras',
    model: 'Dual lens Solar Camera',
    description: 'Smart Wi-Fi/4G dual-lens outdoor solar CCTV camera with solar panel & night vision.',
    price: 50000,
    reorderLevel: 5,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901101',
  }),
  buildCatalogProduct({
    id: 'prod_solar_cam_multi',
    sku: 'CAM-SOLAR-MULTI',
    name: 'Multi-Lens Solar Camera',
    brand: 'Offnot Security',
    category: 'Solar Cameras',
    model: 'Multi-lens Solar Camera',
    description: 'Wide-coverage multi-lens PTZ solar security CCTV camera with 24/7 battery backup.',
    price: 70000,
    reorderLevel: 5,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901102',
  }),

  // 12. TRUCKING PIPES (TRUNKING PIPES)
  buildCatalogProduct({
    id: 'prod_trucking_pipe_20_40',
    sku: 'TRK-PIPE-20-40',
    name: 'Trucking Pipe 20/40 (Trunking Conduit)',
    brand: 'Offnot Hardware',
    category: 'Trucking Pipes',
    model: '20/40',
    description: 'PVC 20/40mm cable trucking/trunking pipe for neat solar & AC wiring.',
    price: 1500,
    reorderLevel: 20,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901201',
  }),
  buildCatalogProduct({
    id: 'prod_trucking_pipe_50_50',
    sku: 'TRK-PIPE-50-50',
    name: 'Trucking Pipe 50/50 (Heavy Trunking Conduit)',
    brand: 'Offnot Hardware',
    category: 'Trucking Pipes',
    model: '50/50',
    description: 'Heavy-duty PVC 50/50mm cable trucking/trunking pipe for main inverter cables.',
    price: 3000,
    reorderLevel: 20,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901202',
  }),

  // 13. INSTALLATION ACCESSORIES
  buildCatalogProduct({
    id: 'prod_acc_knife_switch',
    sku: 'ACC-KNIFE-SWT',
    name: 'Knife Switch',
    brand: 'Offnot Hardware',
    category: 'Installation Accessories',
    model: 'Knife Switch',
    description: 'Heavy-duty manual changeover knife switch for inverter & grid isolation.',
    price: 3000,
    reorderLevel: 10,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901301',
  }),
  buildCatalogProduct({
    id: 'prod_acc_plough_13a',
    sku: 'ACC-PLUG-13A',
    name: '13amps Plough (13A Plug Top)',
    brand: 'Offnot Hardware',
    category: 'Installation Accessories',
    model: '13amps plough',
    description: 'Heavy-duty 13A fused power plug top (13amps plough) for inverter output.',
    price: 1100,
    reorderLevel: 25,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901302',
  }),
  buildCatalogProduct({
    id: 'prod_acc_plough_15a',
    sku: 'ACC-PLUG-15A',
    name: '15amps Plough (15A Plug Top)',
    brand: 'Offnot Hardware',
    category: 'Installation Accessories',
    model: '15amps plough',
    description: 'Heavy-duty 15A round-pin power plug top (15amps plough) for AC & inverter loads.',
    price: 1100,
    reorderLevel: 25,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901303',
  }),
  buildCatalogProduct({
    id: 'prod_acc_socket',
    sku: 'ACC-SOCKET-STD',
    name: 'Wall Socket',
    brand: 'Offnot Hardware',
    category: 'Installation Accessories',
    model: 'Socket',
    description: 'Switched AC wall socket outlet for solar & inverter installations.',
    price: 1200,
    reorderLevel: 25,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901304',
  }),
  buildCatalogProduct({
    id: 'prod_acc_patress',
    sku: 'ACC-PATRESS-STD',
    name: 'Patress Box',
    brand: 'Offnot Hardware',
    category: 'Installation Accessories',
    model: 'Patress',
    description: 'Surface-mount PVC patress back box for sockets and switches.',
    price: 200,
    reorderLevel: 40,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901305',
  }),
  buildCatalogProduct({
    id: 'prod_acc_cable_log_16mm',
    sku: 'ACC-LUG-16MM',
    name: 'Cable Log 16mm (16mm Copper Cable Lug)',
    brand: 'Offnot Hardware',
    category: 'Installation Accessories',
    model: 'Cable log 16mm',
    description: 'Tinned copper 16mm² battery & inverter terminal cable lug (cable log).',
    price: 200,
    reorderLevel: 50,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901306',
  }),
  buildCatalogProduct({
    id: 'prod_acc_cable_log_25mm',
    sku: 'ACC-LUG-25MM',
    name: 'Cable Log 25mm (25mm Copper Cable Lug)',
    brand: 'Offnot Hardware',
    category: 'Installation Accessories',
    model: 'Cable log 25mm',
    description: 'Heavy-duty tinned copper 25mm² battery & inverter terminal cable lug (cable log).',
    price: 200,
    reorderLevel: 50,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901307',
  }),
  buildCatalogProduct({
    id: 'prod_acc_battery_rack',
    sku: 'ACC-BAT-RACK',
    name: 'Battery Rack',
    brand: 'Offnot Hardware',
    category: 'Installation Accessories',
    model: 'Battery rack',
    description: 'Powder-coated steel battery rack stand for tubular & lithium battery banks.',
    price: 12000,
    reorderLevel: 5,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901308',
  }),
  buildCatalogProduct({
    id: 'prod_acc_panel_rails',
    sku: 'ACC-PNL-RAILS',
    name: 'Panel Rails (Solar Mounting Rail)',
    brand: 'Offnot Hardware',
    category: 'Installation Accessories',
    model: 'Panel rails',
    description: 'Anodized aluminum solar panel mounting rail for roof installations.',
    price: 12000,
    reorderLevel: 10,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901309',
  }),
  buildCatalogProduct({
    id: 'prod_acc_electrical_tape',
    sku: 'ACC-ELEC-TAPE',
    name: 'Electrical Tape',
    brand: 'Offnot Hardware',
    category: 'Installation Accessories',
    model: 'Electrical tape',
    description: 'High-dielectric PVC electrical insulation tape.',
    unit: 'Roll',
    price: 300,
    reorderLevel: 40,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901310',
  }),
  buildCatalogProduct({
    id: 'prod_acc_bolt_knot_screw',
    sku: 'ACC-BOLT-SCREW',
    name: 'Bolt / Knot & Screw Set',
    brand: 'Offnot Hardware',
    category: 'Installation Accessories',
    model: 'Bolt/knot,screw',
    description: 'Stainless steel solar mounting bolt, nut/knot, and roofing screw kit.',
    unit: 'Pack',
    price: 500,
    reorderLevel: 30,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901311',
  }),

  // 14. DISTILLED WATER
  buildCatalogProduct({
    id: 'prod_offnot_distilled_water',
    sku: 'WTR-OFFNOT-DIST',
    name: 'Offnot Distilled Water (Battery Electrolyte Top-Up)',
    brand: 'Offnot Energy',
    category: 'Distilled Water',
    model: 'Offnot distilled water',
    description: 'Ultra-pure deionized distilled battery water for tubular & lead-acid solar batteries.',
    unit: 'Keg',
    price: 3500,
    reorderLevel: 15,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901401',
  }),

  // 15. EXTENSION BOXES
  buildCatalogProduct({
    id: 'prod_ext_4way_usb',
    sku: 'EXT-4WAY-USB',
    name: '4WAY Extension with USB',
    brand: 'Offnot Hardware',
    category: 'Extension Boxes',
    model: '4WAY extension with USB',
    description: 'Surge-protected 4-way power extension box with integrated USB fast-charging ports.',
    price: 6500,
    reorderLevel: 15,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901501',
  }),
  buildCatalogProduct({
    id: 'prod_ext_4way_1_8mm',
    sku: 'EXT-4WAY-1.8MM',
    name: '4Way 1.8mm Extension Box',
    brand: 'Offnot Hardware',
    category: 'Extension Boxes',
    model: '4way 1.8mm extension',
    description: 'Heavy-duty 4-way power extension box with 1.8mm pure copper cable.',
    price: 4500,
    reorderLevel: 15,
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '489448901502',
  }),
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_adekunle',
    name: 'Adekunle Solar Innovations',
    contactPerson: 'Engr. Adekunle Jimoh',
    phone: '08033445566',
    email: 'adekunle.solar@gmail.com',
    address: 'Suite 4, Bodija Shopping Mall, Bodija, Ibadan',
    type: 'solar_installer',
    pricingTier: 'installer',
    leadStage: 'won',
    totalPurchases: 0,
    outstandingBalance: 0,
    assignedStaffId: 'usr_sales',
    assignedStaffName: 'Kehinde Balogun',
    notes: 'Certified solar installer in Ibadan metro. Qualified for wholesale installer rates.',
    installerDetails: {
      certifications: 'COREN Registered, NEMSA Solar Certified',
      territory: 'Ibadan Metro & Oyo Town',
      monthlyCapacityKw: 25,
    },
    createdAt: '2026-01-22T10:00:00Z',
  },
  {
    id: 'cust_dominion',
    name: 'Dominion Specialist Medical Hospital',
    contactPerson: 'Dr. (Mrs.) Yinka Balogun',
    phone: '08022334455',
    email: 'admin@dominionhospital.org',
    address: 'Ring Road By Challenge Intersection, Ibadan',
    type: 'hospital',
    pricingTier: 'retail',
    leadStage: 'qualified',
    totalPurchases: 0,
    outstandingBalance: 0,
    assignedStaffId: 'usr_sales',
    assignedStaffName: 'Kehinde Balogun',
    notes: 'Hospital facility with high daytime critical load. Solar hybrid candidate.',
    createdAt: '2026-02-10T12:00:00Z',
  },
  {
    id: 'cust_alabi',
    name: 'Chief Alabi Ogunmola',
    contactPerson: 'Chief Alabi',
    phone: '08133221100',
    email: 'alabi.residence@gmail.com',
    address: 'Plot 7, Oluyole Estate Ext, Ibadan',
    type: 'homeowner',
    pricingTier: 'retail',
    leadStage: 'qualified',
    totalPurchases: 0,
    outstandingBalance: 0,
    assignedStaffId: 'usr_sales',
    assignedStaffName: 'Kehinde Balogun',
    notes: 'Residential client in Oluyole Estate.',
    createdAt: '2026-03-01T14:00:00Z',
  },
];

// Pristine Zero-Figure Transaction Registries
export const INITIAL_INSTALLATION_PROJECTS: InstallationProject[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_SALES: Sale[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_welcome',
    title: 'Clean Zero-Ledger Active',
    message: 'Welcome to Offnot Energy Business Management System. Multi-branch tracking and Zero Accounting Ledger are active.',
    type: 'info',
    read: false,
    linkModule: 'dashboard',
    createdAt: new Date().toISOString(),
  },
];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_init_001',
    userId: 'usr_super_admin',
    userName: 'Gabriel Francis',
    userRole: 'super_admin',
    action: 'SYSTEM_INITIALIZATION',
    module: 'settings',
    details: 'Initialized Offnot Energy System with clean zero accounting ledger and 3 Ibadan branches.',
    timestamp: new Date().toISOString(),
  },
];

/**
 * Storage Helper Functions
 */
function getStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

/**
 * Storage Management Service
 */
export const StorageService = {
  // Initialization
  initDatabase(): void {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      setStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BRANCHES)) {
      setStorage(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_BRANCH_ID)) {
      setStorage(STORAGE_KEYS.ACTIVE_BRANCH_ID, 'all');
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      setStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STAFF_ACCOUNTS)) {
      setStorage(STORAGE_KEYS.STAFF_ACCOUNTS, INITIAL_STAFF_ACCOUNTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      setStorage(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_USERS[0].id);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
      setStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      setStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      setStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
      setStorage(STORAGE_KEYS.PROJECTS, INITIAL_INSTALLATION_PROJECTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
      setStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      setStorage(STORAGE_KEYS.SALES, INITIAL_SALES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      setStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      setStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MOVEMENTS)) {
      setStorage(STORAGE_KEYS.MOVEMENTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS)) {
      setStorage(STORAGE_KEYS.PURCHASE_ORDERS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUOTATIONS)) {
      setStorage(STORAGE_KEYS.QUOTATIONS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROLE_PERMISSIONS)) {
      setStorage(STORAGE_KEYS.ROLE_PERMISSIONS, INITIAL_ROLE_PERMISSIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STAFF_KPIS)) {
      setStorage(STORAGE_KEYS.STAFF_KPIS, []);
    }
  },

  // Reset strictly to Clean Zero Ledger
  resetToZeroLedger(): void {
    setStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    setStorage(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
    setStorage(STORAGE_KEYS.ACTIVE_BRANCH_ID, 'all');
    setStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    setStorage(STORAGE_KEYS.STAFF_ACCOUNTS, INITIAL_STAFF_ACCOUNTS);
    setStorage(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_USERS[0].id);
    setStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    setStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    setStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    setStorage(STORAGE_KEYS.PROJECTS, []);
    setStorage(STORAGE_KEYS.EXPENSES, []);
    setStorage(STORAGE_KEYS.SALES, []);
    setStorage(STORAGE_KEYS.MOVEMENTS, []);
    setStorage(STORAGE_KEYS.PURCHASE_ORDERS, []);
    setStorage(STORAGE_KEYS.QUOTATIONS, []);
    setStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    setStorage(STORAGE_KEYS.ROLE_PERMISSIONS, INITIAL_ROLE_PERMISSIONS);
  },

  // Role Permissions Matrix
  getRolePermissions(): RolePermissionsMap {
    return getStorage<RolePermissionsMap>(STORAGE_KEYS.ROLE_PERMISSIONS, INITIAL_ROLE_PERMISSIONS);
  },
  saveRolePermissions(permissions: RolePermissionsMap): void {
    setStorage(STORAGE_KEYS.ROLE_PERMISSIONS, permissions);
  },
  updateRolePermission(role: UserRole, permission: PermissionKey, enabled: boolean): void {
    const current = this.getRolePermissions();
    if (!current[role]) {
      current[role] = { ...INITIAL_ROLE_PERMISSIONS[role] };
    }
    current[role][permission] = enabled;
    this.saveRolePermissions(current);
  },
  assignStaffRole(staffId: string, newRole: UserRole): { success: boolean; error?: string } {
    const staffList = this.getStaffAccounts();
    const userList = this.getUsers();

    const staffIdx = staffList.findIndex(s => s.id === staffId);
    if (staffIdx !== -1) {
      staffList[staffIdx].role = newRole;
      this.saveStaffAccounts(staffList);
    }

    const userIdx = userList.findIndex(u => u.id === staffId);
    if (userIdx !== -1) {
      userList[userIdx].role = newRole;
      this.saveUsers(userList);
    }

    return { success: true };
  },

  // Core Data Getters & Setters
  getSettings(): CompanySettings {
    return getStorage<CompanySettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  saveSettings(settings: CompanySettings): void {
    setStorage(STORAGE_KEYS.SETTINGS, settings);
  },

  // Branches
  getBranches(): Branch[] {
    return getStorage<Branch[]>(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
  },
  saveBranches(branches: Branch[]): void {
    setStorage(STORAGE_KEYS.BRANCHES, branches);
  },
  getActiveBranchId(): string {
    return getStorage<string>(STORAGE_KEYS.ACTIVE_BRANCH_ID, 'all');
  },
  setActiveBranchId(id: string): void {
    setStorage(STORAGE_KEYS.ACTIVE_BRANCH_ID, id);
  },

  getSuperadminPassword(): string {
    return getStorage<string>(STORAGE_KEYS.SUPERADMIN_PASSWORD, 'SuperAdmin2026!');
  },
  setSuperadminPassword(pwd: string): void {
    const clean = pwd.trim();
    setStorage(STORAGE_KEYS.SUPERADMIN_PASSWORD, clean);
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const sa = users.find(u => u.id === 'usr_super_admin' || u.role === 'super_admin' || u.email.toLowerCase() === 'francisgabriel932@gmail.com');
    if (sa) {
      sa.temporaryPassword = clean;
      setStorage(STORAGE_KEYS.USERS, users);
    }
    const staff = getStorage<StaffAccount[]>(STORAGE_KEYS.STAFF_ACCOUNTS, INITIAL_STAFF_ACCOUNTS);
    const sSa = staff.find(s => s.id === 'usr_super_admin' || s.role === 'super_admin' || s.email.toLowerCase() === 'francisgabriel932@gmail.com');
    if (sSa) {
      sSa.temporaryPassword = clean;
      setStorage(STORAGE_KEYS.STAFF_ACCOUNTS, staff);
    }
  },

  // Users & Staff
  getUsers(): User[] {
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const superAdmin = users.find(u => u.id === 'usr_super_admin' || u.role === 'super_admin' || u.email.toLowerCase() === 'francisgabriel932@gmail.com');
    if (superAdmin) {
      superAdmin.name = 'Francis Gabriel (Superadmin)';
      superAdmin.email = 'francisgabriel932@gmail.com';
      superAdmin.username = 'superadmin';
      superAdmin.role = 'super_admin';
      superAdmin.temporaryPassword = this.getSuperadminPassword();
    }
    const adminUser = users.find(u => u.id === 'usr_admin');
    if (adminUser) {
      adminUser.name = 'Ayomide Bakare (Deputy Admin)';
      adminUser.username = 'admin';
      adminUser.email = 'admin@offnotenergy.ng';
      adminUser.role = 'admin';
      if (!adminUser.temporaryPassword) adminUser.temporaryPassword = 'Admin2026!';
    }
    return users;
  },
  saveUsers(users: User[]): void {
    setStorage(STORAGE_KEYS.USERS, users);
  },
  getStaffAccounts(): StaffAccount[] {
    const staff = getStorage<StaffAccount[]>(STORAGE_KEYS.STAFF_ACCOUNTS, INITIAL_STAFF_ACCOUNTS);
    const superAdmin = staff.find(s => s.id === 'usr_super_admin' || s.role === 'super_admin' || s.email.toLowerCase() === 'francisgabriel932@gmail.com');
    if (superAdmin) {
      superAdmin.name = 'Francis Gabriel (Superadmin)';
      superAdmin.email = 'francisgabriel932@gmail.com';
      superAdmin.username = 'superadmin';
      superAdmin.role = 'super_admin';
      superAdmin.temporaryPassword = this.getSuperadminPassword();
    }
    const adminUser = staff.find(s => s.id === 'usr_admin');
    if (adminUser) {
      adminUser.name = 'Ayomide Bakare (Deputy Admin)';
      adminUser.username = 'admin';
      adminUser.email = 'admin@offnotenergy.ng';
      adminUser.role = 'admin';
      if (!adminUser.temporaryPassword) adminUser.temporaryPassword = 'Admin2026!';
    }
    return staff;
  },
  saveStaffAccounts(staff: StaffAccount[]): void {
    setStorage(STORAGE_KEYS.STAFF_ACCOUNTS, staff);
    // Keep users list in sync with staff passwords
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, []);
    staff.forEach(s => {
      const u = users.find(usr => usr.id === s.id || usr.email.toLowerCase() === s.email.toLowerCase());
      if (u) {
        u.temporaryPassword = s.temporaryPassword;
        u.name = s.name;
        u.role = s.role;
        u.branchId = s.branchId;
        u.branchName = s.branchName;
        u.status = s.status;
      }
    });
    setStorage(STORAGE_KEYS.USERS, users);
  },

  // Staff KPIs
  getStaffKpis(): StaffKpi[] {
    return getStorage<StaffKpi[]>(STORAGE_KEYS.STAFF_KPIS, []);
  },
  saveStaffKpis(kpis: StaffKpi[]): void {
    setStorage(STORAGE_KEYS.STAFF_KPIS, kpis);
  },

  getCurrentUser(): User {
    const users = this.getUsers();
    const currentId = getStorage<string>(STORAGE_KEYS.CURRENT_USER_ID, users[0]?.id || 'usr_super_admin');
    return users.find(u => u.id === currentId) || users[0];
  },
  setCurrentUserId(id: string): void {
    setStorage(STORAGE_KEYS.CURRENT_USER_ID, id);
  },

  // Authentication Session (Stored in sessionStorage so opening new links or browser sessions always prompts Login first)
  getAuthSession(): { user: User; token: string } | null {
    if (typeof window === 'undefined') return null;
    try {
      const sessionStr = sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (sessionStr) {
        return JSON.parse(sessionStr);
      }
    } catch (e) {
      console.error('Error reading auth session:', e);
    }
    return null;
  },
  setAuthSession(session: { user: User; token: string } | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (session) {
        sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      }
      // Clear any legacy persistent session so new tabs/links always require login
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    } catch (e) {
      console.error('Error saving auth session:', e);
    }
  },
  clearAuthSession(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    }
  },

  // Products
  getProducts(): Product[] {
    return getStorage<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },
  saveProducts(products: Product[]): void {
    setStorage(STORAGE_KEYS.PRODUCTS, products);
  },

  // Movements
  getStockMovements(): StockMovement[] {
    return getStorage<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, []);
  },
  saveStockMovements(movements: StockMovement[]): void {
    setStorage(STORAGE_KEYS.MOVEMENTS, movements);
  },

  // Suppliers
  getSuppliers(): Supplier[] {
    return getStorage<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  },
  saveSuppliers(suppliers: Supplier[]): void {
    setStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
  },

  // POs
  getPurchaseOrders(): PurchaseOrder[] {
    return getStorage<PurchaseOrder[]>(STORAGE_KEYS.PURCHASE_ORDERS, []);
  },
  savePurchaseOrders(pos: PurchaseOrder[]): void {
    setStorage(STORAGE_KEYS.PURCHASE_ORDERS, pos);
  },

  // Sales
  getSales(): Sale[] {
    return getStorage<Sale[]>(STORAGE_KEYS.SALES, []);
  },
  saveSales(sales: Sale[]): void {
    setStorage(STORAGE_KEYS.SALES, sales);
  },

  // Customers
  getCustomers(): Customer[] {
    return getStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },
  saveCustomers(customers: Customer[]): void {
    setStorage(STORAGE_KEYS.CUSTOMERS, customers);
  },

  // Quotations
  getQuotations(): Quotation[] {
    return getStorage<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
  },
  saveQuotations(quotations: Quotation[]): void {
    setStorage(STORAGE_KEYS.QUOTATIONS, quotations);
  },

  // Projects
  getProjects(): InstallationProject[] {
    return getStorage<InstallationProject[]>(STORAGE_KEYS.PROJECTS, []);
  },
  saveProjects(projects: InstallationProject[]): void {
    setStorage(STORAGE_KEYS.PROJECTS, projects);
  },

  // Expenses
  getExpenses(): Expense[] {
    return getStorage<Expense[]>(STORAGE_KEYS.EXPENSES, []);
  },
  saveExpenses(expenses: Expense[]): void {
    setStorage(STORAGE_KEYS.EXPENSES, expenses);
  },

  // Notifications
  getNotifications(): AppNotification[] {
    return getStorage<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },
  saveNotifications(notifs: AppNotification[]): void {
    setStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return getStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },
  saveAuditLogs(logs: AuditLog[]): void {
    setStorage(STORAGE_KEYS.AUDIT_LOGS, logs);
  },
  logAction(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setStorage(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
  },

  /**
   * ATOMIC STOCK TRANSACTIONS
   */

  // 1. Execute Sale - Concurrency guarded, updates stock & movements atomically
  executeSale(
    saleData: {
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
    },
    user: User
  ): { success: boolean; sale?: Sale; error?: string } {
    const products = this.getProducts();
    const productMap = new Map(products.map(p => [p.id, p]));

    // Validation: Verify all products exist and have sufficient stock
    for (const item of saleData.items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        return { success: false, error: `Product ID ${item.productId} not found.` };
      }
      if (prod.currentStock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${prod.name}". Available: ${prod.currentStock}, requested: ${item.quantity}. Overselling is prevented.`,
        };
      }
    }

    const now = new Date().toISOString();
    const sales = this.getSales();
    const uniqueSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const invoiceNumber = `OFF-INV-${new Date().getFullYear()}-${1001 + sales.length}-${uniqueSuffix}`;

    let subtotal = 0;
    let discountTotal = 0;
    let costOfGoodsSold = 0;

    const populatedItems = saleData.items.map(item => {
      const prod = productMap.get(item.productId)!;
      const itemSubtotal = item.unitPrice * item.quantity - (item.discount || 0);
      subtotal += item.unitPrice * item.quantity;
      discountTotal += item.discount || 0;
      costOfGoodsSold += prod.purchaseCost * item.quantity;

      return {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.unit,
        unitPrice: item.unitPrice,
        unitCost: prod.purchaseCost,
        quantity: item.quantity,
        discount: item.discount || 0,
        subtotal: itemSubtotal,
      };
    });

    const grandTotal = Math.max(0, subtotal - discountTotal);
    const paid = Math.min(grandTotal, Math.max(0, saleData.paidAmount));
    const balanceDue = Math.max(0, grandTotal - paid);
    const grossProfit = grandTotal - costOfGoodsSold;

    const payments: PaymentRecord[] = [];
    if (paid > 0) {
      payments.push({
        id: `pmt_${Date.now()}_${uniqueSuffix}`,
        amount: paid,
        method: saleData.paymentMethod,
        reference: `${saleData.paymentMethod.toUpperCase()}-${uniqueSuffix}`,
        paidAt: now,
        recordedBy: user.name,
        splitDetails: saleData.splitDetails,
      });
    }

    const newSale: Sale = {
      id: `sale_${Date.now()}_${uniqueSuffix.toLowerCase()}`,
      invoiceNumber,
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      customerTier: saleData.customerTier,
      items: populatedItems,
      subtotal,
      discountTotal,
      taxAmount: 0,
      grandTotal,
      originalGrandTotal: grandTotal,
      paidAmount: paid,
      balanceDue,
      costOfGoodsSold,
      grossProfit,
      paymentMethod: saleData.paymentMethod,
      paymentStatus: balanceDue === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
      payments,
      salesRepId: user.id,
      salesRepName: user.name,
      warehouseLocation: saleData.warehouseLocation,
      branchId: saleData.branchId || user.branchId,
      branchName: saleData.branchName || user.branchName,
      createdAt: now,
      notes: saleData.notes,
    };

    // Update Product Stock and Record Stock Movements
    const movements = this.getStockMovements();
    const newMovements: StockMovement[] = [];

    for (const item of saleData.items) {
      const prod = productMap.get(item.productId)!;
      const previousStock = prod.currentStock;
      const newStock = previousStock - item.quantity;
      prod.currentStock = newStock;
      prod.updatedAt = now;

      newMovements.push({
        id: `mov_sale_${Date.now()}_${uniqueSuffix}_${prod.sku}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        type: 'sale',
        quantity: -item.quantity,
        previousStock,
        newStock,
        unitCost: prod.purchaseCost,
        totalCost: item.quantity * prod.purchaseCost,
        referenceId: invoiceNumber,
        warehouseLocation: saleData.warehouseLocation,
        branchId: saleData.branchId || user.branchId,
        branchName: saleData.branchName || user.branchName,
        reason: `POS sale to ${saleData.customerName}`,
        performedByUserId: user.id,
        performedByUserName: user.name,
        timestamp: now,
      });

      // Low stock notification trigger
      if (newStock <= prod.reorderLevel) {
        const notifs = this.getNotifications();
        notifs.unshift({
          id: `notif_low_${Date.now()}_${prod.id}`,
          title: newStock === 0 ? 'Out of Stock Alert' : 'Low Stock Warning',
          message: `${prod.name} has reached ${newStock} ${prod.unit}s in stock (reorder level: ${prod.reorderLevel}).`,
          type: newStock === 0 ? 'alert' : 'warning',
          read: false,
          linkModule: 'inventory',
          createdAt: now,
        });
        this.saveNotifications(notifs);
      }
    }

    // Update customer total purchases and outstanding balance
    const customers = this.getCustomers();
    const custIndex = customers.findIndex(c => c.id === saleData.customerId);
    if (custIndex !== -1) {
      customers[custIndex].totalPurchases += grandTotal;
      customers[custIndex].outstandingBalance += balanceDue;
      customers[custIndex].lastPurchaseDate = now;
      this.saveCustomers(customers);
    }

    // Atomic write
    this.saveProducts(Array.from(productMap.values()));
    this.saveStockMovements([...newMovements, ...movements]);
    this.saveSales([newSale, ...sales]);

    // Audit log
    this.logAction({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'SALE_COMPLETED',
      module: 'sales',
      recordId: invoiceNumber,
      details: `Completed sale #${invoiceNumber} for ₦${grandTotal.toLocaleString()} (${populatedItems.length} items). Gross Profit: ₦${grossProfit.toLocaleString()}.`,
    });

    return { success: true, sale: newSale };
  },

  // 2. Adjust Stock - authorized stock correction with reason
  adjustStock(
    adjustment: {
      productId: string;
      adjustmentQty: number; // positive or negative
      reason: string;
      warehouseLocation: string;
      branchId?: string;
    },
    user: User
  ): { success: boolean; error?: string } {
    const products = this.getProducts();
    const prodIndex = products.findIndex(p => p.id === adjustment.productId);
    if (prodIndex === -1) {
      return { success: false, error: 'Product not found.' };
    }

    const prod = products[prodIndex];
    const previousStock = prod.currentStock;
    const newStock = previousStock + adjustment.adjustmentQty;

    if (newStock < 0) {
      return { success: false, error: 'Stock balance cannot be negative.' };
    }

    const now = new Date().toISOString();
    prod.currentStock = newStock;
    prod.updatedAt = now;

    const movement: StockMovement = {
      id: `mov_adj_${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      type: adjustment.adjustmentQty >= 0 ? 'adjustment_positive' : 'adjustment_negative',
      quantity: adjustment.adjustmentQty,
      previousStock,
      newStock,
      unitCost: prod.purchaseCost,
      totalCost: Math.abs(adjustment.adjustmentQty) * prod.purchaseCost,
      referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
      warehouseLocation: adjustment.warehouseLocation,
      branchId: adjustment.branchId || user.branchId,
      reason: adjustment.reason,
      performedByUserId: user.id,
      performedByUserName: user.name,
      timestamp: now,
    };

    const movements = this.getStockMovements();
    this.saveProducts(products);
    this.saveStockMovements([movement, ...movements]);

    this.logAction({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'STOCK_ADJUSTMENT',
      module: 'inventory',
      recordId: prod.sku,
      details: `Adjusted ${prod.name} (${prod.sku}) by ${adjustment.adjustmentQty > 0 ? '+' : ''}${adjustment.adjustmentQty} units. Previous: ${previousStock}, New: ${newStock}. Reason: ${adjustment.reason}`,
    });

    return { success: true };
  },

  // 3. Receive Goods from Purchase Order - increases stock only upon confirmed receipt
  receivePurchaseOrderGoods(
    poId: string,
    receivedItems: { productId: string; receivedQty: number }[],
    warehouseLocation: string,
    user: User
  ): { success: boolean; error?: string } {
    const pos = this.getPurchaseOrders();
    const poIndex = pos.findIndex(p => p.id === poId);
    if (poIndex === -1) {
      return { success: false, error: 'Purchase order not found.' };
    }

    const po = pos[poIndex];
    const products = this.getProducts();
    const productMap = new Map(products.map(p => [p.id, p]));
    const movements = this.getStockMovements();
    const newMovements: StockMovement[] = [];
    const now = new Date().toISOString();

    let allReceived = true;

    for (const recItem of receivedItems) {
      if (recItem.receivedQty <= 0) continue;

      const itemInPo = po.items.find(i => i.productId === recItem.productId);
      const prod = productMap.get(recItem.productId);

      if (!itemInPo || !prod) continue;

      itemInPo.receivedQuantity += recItem.receivedQty;
      if (itemInPo.receivedQuantity < itemInPo.orderedQuantity) {
        allReceived = false;
      }

      const previousStock = prod.currentStock;
      const newStock = previousStock + recItem.receivedQty;
      prod.currentStock = newStock;
      prod.updatedAt = now;

      newMovements.push({
        id: `mov_rec_${Date.now()}_${prod.sku}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        type: 'goods_received',
        quantity: recItem.receivedQty,
        previousStock,
        newStock,
        unitCost: itemInPo.unitCost,
        totalCost: recItem.receivedQty * itemInPo.unitCost,
        referenceId: po.poNumber,
        warehouseLocation,
        branchId: user.branchId,
        branchName: user.branchName,
        reason: `Goods receipt for PO ${po.poNumber} from ${po.supplierName}`,
        performedByUserId: user.id,
        performedByUserName: user.name,
        timestamp: now,
      });
    }

    po.status = allReceived ? 'received' : 'partially_received';

    this.saveProducts(Array.from(productMap.values()));
    this.savePurchaseOrders(pos);
    this.saveStockMovements([...newMovements, ...movements]);

    this.logAction({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'GOODS_RECEIVED',
      module: 'purchasing',
      recordId: po.poNumber,
      details: `Received supplier delivery for PO ${po.poNumber} (${po.supplierName}). Status: ${po.status}.`,
    });

    return { success: true };
  },

  // 4. Issue Materials to Installation Project
  issueProjectMaterial(
    projectId: string,
    productId: string,
    quantity: number,
    warehouseLocation: string,
    user: User
  ): { success: boolean; error?: string } {
    const projects = this.getProjects();
    const prj = projects.find(p => p.id === projectId);
    if (!prj) return { success: false, error: 'Installation project not found.' };

    const products = this.getProducts();
    const prod = products.find(p => p.id === productId);
    if (!prod) return { success: false, error: 'Product not found.' };

    if (prod.currentStock < quantity) {
      return { success: false, error: `Insufficient stock for ${prod.name}. Available: ${prod.currentStock}` };
    }

    const now = new Date().toISOString();
    const previousStock = prod.currentStock;
    const newStock = previousStock - quantity;
    prod.currentStock = newStock;
    prod.updatedAt = now;

    const lineTotalCost = quantity * prod.purchaseCost;
    const existingMat = prj.materials.find(m => m.productId === productId);

    if (existingMat) {
      existingMat.quantityIssued += quantity;
      existingMat.totalCost += lineTotalCost;
    } else {
      prj.materials.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantityIssued: quantity,
        quantityReturned: 0,
        unitCost: prod.purchaseCost,
        totalCost: lineTotalCost,
        issuedAt: now,
      });
    }

    prj.equipmentCost += lineTotalCost;
    prj.totalProjectCost = prj.equipmentCost + prj.labourCost + prj.transportCost + prj.otherExpenses;
    prj.grossMargin = prj.contractAmount - prj.totalProjectCost;

    const movement: StockMovement = {
      id: `mov_prj_${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      type: 'project_issue',
      quantity: -quantity,
      previousStock,
      newStock,
      unitCost: prod.purchaseCost,
      totalCost: lineTotalCost,
      referenceId: prj.projectCode,
      warehouseLocation,
      branchId: user.branchId,
      branchName: user.branchName,
      reason: `Issued to solar installation project: ${prj.title} (${prj.projectCode})`,
      performedByUserId: user.id,
      performedByUserName: user.name,
      timestamp: now,
    };

    const movements = this.getStockMovements();
    this.saveProducts(products);
    this.saveProjects(projects);
    this.saveStockMovements([movement, ...movements]);

    this.logAction({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PROJECT_MATERIAL_ISSUED',
      module: 'projects',
      recordId: prj.projectCode,
      details: `Issued ${quantity}x ${prod.name} to ${prj.projectCode}. Cost: ₦${lineTotalCost.toLocaleString()}.`,
    });

    return { success: true };
  },

  // 5. Return Unused Material from Project back to Inventory
  returnProjectMaterial(
    projectId: string,
    productId: string,
    quantity: number,
    warehouseLocation: string,
    user: User
  ): { success: boolean; error?: string } {
    const projects = this.getProjects();
    const prj = projects.find(p => p.id === projectId);
    if (!prj) return { success: false, error: 'Project not found.' };

    const mat = prj.materials.find(m => m.productId === productId);
    if (!mat) return { success: false, error: 'Material not recorded on this project.' };

    const netIssued = mat.quantityIssued - mat.quantityReturned;
    if (quantity > netIssued) {
      return { success: false, error: `Cannot return ${quantity} units. Only ${netIssued} units remain issued.` };
    }

    const products = this.getProducts();
    const prod = products.find(p => p.id === productId);
    if (!prod) return { success: false, error: 'Product not found in catalog.' };

    const now = new Date().toISOString();
    mat.quantityReturned += quantity;
    const returnedValue = quantity * mat.unitCost;
    mat.totalCost -= returnedValue;

    prj.equipmentCost -= returnedValue;
    prj.totalProjectCost = prj.equipmentCost + prj.labourCost + prj.transportCost + prj.otherExpenses;
    prj.grossMargin = prj.contractAmount - prj.totalProjectCost;

    const previousStock = prod.currentStock;
    const newStock = previousStock + quantity;
    prod.currentStock = newStock;
    prod.updatedAt = now;

    const movement: StockMovement = {
      id: `mov_prjr_${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      type: 'project_return',
      quantity: quantity,
      previousStock,
      newStock,
      unitCost: mat.unitCost,
      totalCost: returnedValue,
      referenceId: prj.projectCode,
      warehouseLocation,
      branchId: user.branchId,
      branchName: user.branchName,
      reason: `Unused material returned from solar project ${prj.projectCode}`,
      performedByUserId: user.id,
      performedByUserName: user.name,
      timestamp: now,
    };

    const movements = this.getStockMovements();
    this.saveProducts(products);
    this.saveProjects(projects);
    this.saveStockMovements([movement, ...movements]);

    this.logAction({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PROJECT_MATERIAL_RETURNED',
      module: 'projects',
      recordId: prj.projectCode,
      details: `Returned ${quantity}x ${prod.name} from ${prj.projectCode} to ${warehouseLocation}. Value: ₦${returnedValue.toLocaleString()}.`,
    });

    return { success: true };
  },

  // 6. Record Multi-Item or Full Customer Return & Refund with Net Revenue & Stock Reversal
  processCustomerReturns(
    saleId: string,
    itemsToReturn: { productId: string; quantity: number }[],
    reason: string,
    user: User
  ): {
    success: boolean;
    error?: string;
    returnMovements?: StockMovement[];
    updatedProducts?: Product[];
    updatedSale?: Sale;
    updatedCustomer?: Customer;
    refundAmount?: number;
  } {
    if (!itemsToReturn || itemsToReturn.length === 0) {
      return { success: false, error: 'Please select at least one product to refund.' };
    }

    const sales = this.getSales();
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return { success: false, error: 'Sale record not found.' };

    const products = this.getProducts();
    const now = new Date().toISOString();
    const batchSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

    // Validate all requested return items before mutating anything
    for (const req of itemsToReturn) {
      if (req.quantity <= 0) {
        return { success: false, error: 'Return quantity must be greater than zero.' };
      }
      const item = sale.items.find(i => i.productId === req.productId);
      if (!item) {
        return { success: false, error: `Product ${req.productId} was not part of this sale.` };
      }
      const currentReturned = item.returnedQuantity || 0;
      const availableToReturn = item.quantity - currentReturned;
      if (req.quantity > availableToReturn) {
        return {
          success: false,
          error: `Cannot return ${req.quantity}x "${item.productName}". Eligible remaining: ${availableToReturn}.`,
        };
      }
      const prod = products.find(p => p.id === req.productId);
      if (!prod) {
        return { success: false, error: `Product "${item.productName}" not found in inventory catalog.` };
      }
    }

    // Preserve original sale total prior to first refund
    if (sale.originalGrandTotal === undefined) {
      sale.originalGrandTotal = sale.grandTotal + (sale.refundAmount || 0);
    }

    if (!Array.isArray(sale.returnRecords)) {
      sale.returnRecords = [];
    }

    const returnMovements: StockMovement[] = [];
    const updatedProducts: Product[] = [];
    let totalBatchRefund = 0;
    let totalBatchCogsReversed = 0;

    for (const req of itemsToReturn) {
      const item = sale.items.find(i => i.productId === req.productId)!;
      const prod = products.find(p => p.id === req.productId)!;

      const previousStock = prod.currentStock;
      const newStock = previousStock + req.quantity;
      prod.currentStock = newStock;
      prod.updatedAt = now;
      updatedProducts.push(prod);

      const currentReturned = item.returnedQuantity || 0;
      const discountPortion = item.quantity > 0 ? ((item.discount || 0) / item.quantity) * req.quantity : 0;
      const itemRefundAmount = Math.max(0, (item.unitPrice * req.quantity) - discountPortion);
      const itemCogsReversed = (item.unitCost || prod.purchaseCost || 0) * req.quantity;

      totalBatchRefund += itemRefundAmount;
      totalBatchCogsReversed += itemCogsReversed;

      item.returnedQuantity = currentReturned + req.quantity;
      if (item.returnedQuantity >= item.quantity) {
        item.returned = true;
      }

      const movement: StockMovement = {
        id: `mov_ret_${Date.now()}_${batchSuffix}_${prod.sku}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        type: 'customer_return',
        quantity: req.quantity,
        previousStock,
        newStock,
        unitCost: item.unitCost || prod.purchaseCost,
        totalCost: itemCogsReversed,
        referenceId: sale.invoiceNumber,
        warehouseLocation: sale.warehouseLocation || prod.warehouseLocation,
        branchId: sale.branchId || user.branchId,
        branchName: sale.branchName || user.branchName,
        reason: `Customer return & refund for #${sale.invoiceNumber}: ${reason}`,
        performedByUserId: user.id,
        performedByUserName: user.name,
        timestamp: now,
      };
      returnMovements.push(movement);

      const returnRecord: SaleReturnRecord = {
        id: `ret_${Date.now()}_${batchSuffix}_${Math.random().toString(36).substring(2, 5)}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: req.quantity,
        refundAmount: itemRefundAmount,
        reason,
        timestamp: now,
        performedByUserName: user.name,
        previousStock,
        newStock,
      };
      sale.returnRecords.unshift(returnRecord);
    }

    // Deduct refunded amount from active net daily/period revenue & profit
    sale.returned = true;
    sale.refunded = true;
    sale.refundAmount = (sale.refundAmount || 0) + totalBatchRefund;
    sale.refundReason = reason;
    sale.refundedAt = now;
    sale.refundedBy = user.name;
    sale.refundedByUserId = user.id;

    sale.grandTotal = Math.max(0, sale.grandTotal - totalBatchRefund);
    sale.costOfGoodsSold = Math.max(0, sale.costOfGoodsSold - totalBatchCogsReversed);
    sale.grossProfit = sale.grandTotal - sale.costOfGoodsSold;

    let balReduction = 0;
    if (sale.balanceDue > 0) {
      balReduction = Math.min(sale.balanceDue, totalBatchRefund);
      sale.balanceDue = Math.max(0, sale.balanceDue - balReduction);
      const cashRefunded = Math.max(0, totalBatchRefund - balReduction);
      sale.paidAmount = Math.max(0, sale.paidAmount - cashRefunded);
    } else {
      sale.paidAmount = Math.max(0, sale.paidAmount - totalBatchRefund);
    }

    sale.paymentStatus =
      sale.grandTotal === 0 || sale.balanceDue === 0
        ? 'paid'
        : sale.paidAmount > 0
        ? 'partial'
        : 'unpaid';

    // Update customer ledger balance
    let updatedCustomer: Customer | undefined;
    const customers = this.getCustomers();
    const custIndex = customers.findIndex(c => c.id === sale.customerId);
    if (custIndex !== -1) {
      customers[custIndex].totalPurchases = Math.max(0, customers[custIndex].totalPurchases - totalBatchRefund);
      if (balReduction > 0) {
        customers[custIndex].outstandingBalance = Math.max(0, customers[custIndex].outstandingBalance - balReduction);
      }
      updatedCustomer = customers[custIndex];
      this.saveCustomers(customers);
    }

    const movements = this.getStockMovements();
    this.saveProducts(products);
    this.saveSales(sales);
    this.saveStockMovements([...returnMovements, ...movements]);

    const itemSummary = itemsToReturn
      .map(req => {
        const prod = updatedProducts.find(p => p.id === req.productId);
        return `${req.quantity}x ${prod?.name || req.productId}`;
      })
      .join(', ');

    this.logAction({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CUSTOMER_RETURN_PROCESSED',
      module: 'sales',
      recordId: sale.invoiceNumber,
      details: `Refunded & restocked [${itemSummary}] for invoice #${sale.invoiceNumber}. Refund amount deducted: ₦${totalBatchRefund.toLocaleString()}. Reason: ${reason}`,
    });

    return {
      success: true,
      returnMovements,
      updatedProducts,
      updatedSale: sale,
      updatedCustomer,
      refundAmount: totalBatchRefund,
    };
  },

  // Single-item wrapper delegating to multi-item processor
  processCustomerReturn(
    saleId: string,
    productId: string,
    quantity: number,
    reason: string,
    user: User
  ): {
    success: boolean;
    error?: string;
    returnMovement?: StockMovement;
    updatedProduct?: Product;
    updatedSale?: Sale;
    refundAmount?: number;
  } {
    const res = this.processCustomerReturns(saleId, [{ productId, quantity }], reason, user);
    return {
      success: res.success,
      error: res.error,
      returnMovement: res.returnMovements?.[0],
      updatedProduct: res.updatedProducts?.[0],
      updatedSale: res.updatedSale,
      refundAmount: res.refundAmount,
    };
  },

  // -------------------------------------------------------------------------
  // OFFLINE-FIRST SYNCHRONIZATION QUEUE ENGINE
  // -------------------------------------------------------------------------
  getOfflineQueue(): OfflineSyncItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to read offline sync queue', e);
      return [];
    }
  },

  enqueueOfflineItem(
    entityType: OfflineSyncEntityType,
    action: 'create' | 'update' | 'delete',
    data: any
  ): OfflineSyncItem {
    const recordId = data?.id || data?.invoiceNumber;
    const item: OfflineSyncItem = {
      id: recordId ? `sync_${recordId}` : `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entityType,
      action,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    
    const queue = this.getOfflineQueue();
    // Avoid duplicate sync items for exact same record id and entity
    let updatedQueue: OfflineSyncItem[];
    if (recordId) {
      updatedQueue = queue.filter(
        (q: OfflineSyncItem) => !(q.entityType === entityType && (q.data?.id === recordId || q.data?.invoiceNumber === recordId))
      );
      updatedQueue.push(item);
    } else {
      updatedQueue = [...queue, item];
    }

    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE, JSON.stringify(updatedQueue));
    } catch (e) {
      console.error('Failed to write to offline sync queue', e);
    }
    return item;
  },

  dequeueOfflineItem(itemIdOrRecordId: string): void {
    const queue = this.getOfflineQueue();
    const filtered = queue.filter(q => {
      if (q.id === itemIdOrRecordId) return false;
      if (q.data?.id && (q.data.id === itemIdOrRecordId || `sync_${q.data.id}` === itemIdOrRecordId)) return false;
      if (q.data?.invoiceNumber && (q.data.invoiceNumber === itemIdOrRecordId || `sync_${q.data.invoiceNumber}` === itemIdOrRecordId)) return false;
      return true;
    });
    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to dequeue offline item', e);
    }
  },

  clearOfflineQueue(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.OFFLINE_SYNC_QUEUE);
    } catch (e) {
      console.error('Failed to clear offline queue', e);
    }
  },

  getOfflineQueueCount(): number {
    return this.getOfflineQueue().length;
  },
};

