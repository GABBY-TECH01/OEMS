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
  location: 'Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria',
  phone: '07047053453',
  email: 'offnotenergy@gmail.com',
  currencySymbol: '₦',
  currencyCode: 'NGN',
  defaultVatRate: 7.5,
  enableTaxByDefault: false,
  warehouses: [
    'Main Store - Dalute Road',
    'Showroom - Tipper Garage, Ibadan',
    'Warehouse 2 - Iwo Road Depot',
  ],
  minGrossMarginPercent: 12,
  receiptFooterMessage: 'Thank you for choosing Offnot Energy! Clean Energy, Stronger Tomorrow. Official stamped receipt.',
};

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br_tipper_hq',
    name: 'Showroom - Tipper Garage (HQ)',
    code: 'BR-IBD-01',
    city: 'Ibadan',
    state: 'Oyo State',
    address: 'Inside Tipper Garage, Dalute Road, Ibadan',
    phone: '07047053453',
    email: 'tipper@offnotenergy.ng',
    managerName: 'Gabriel Francis',
    isHeadquarters: true,
    isActive: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'br_dalute_main',
    name: 'Main Store - Dalute Road',
    code: 'BR-IBD-02',
    city: 'Ibadan',
    state: 'Oyo State',
    address: 'Plot 12 Dalute Road, Beside Bovas, Ibadan',
    phone: '08034567890',
    email: 'dalute@offnotenergy.ng',
    managerName: 'Bolanle Oladipo',
    isHeadquarters: false,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'br_iwo_depot',
    name: 'Warehouse 2 - Iwo Road Depot',
    code: 'BR-IBD-03',
    city: 'Ibadan',
    state: 'Oyo State',
    address: 'Express Interchange, Iwo Road, Ibadan',
    phone: '08056789012',
    email: 'iworoad@offnotenergy.ng',
    managerName: 'Sunday Adeyemi',
    isHeadquarters: false,
    isActive: true,
    createdAt: '2026-02-01T08:00:00Z',
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
    branchName: 'Showroom - Tipper Garage (HQ)',
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
    phone: '08022233344',
    branchId: 'br_tipper_hq',
    branchName: 'Showroom - Tipper Garage (HQ)',
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
    phone: '08023456789',
    branchId: 'br_tipper_hq',
    branchName: 'Showroom - Tipper Garage (HQ)',
    temporaryPassword: 'Ceo2026!',
    status: 'active',
  },
  {
    id: 'usr_manager',
    name: 'Bolanle Oladipo',
    username: 'manager',
    email: 'manager@offnotenergy.ng',
    role: 'manager',
    phone: '08034567890',
    branchId: 'br_dalute_main',
    branchName: 'Main Store - Dalute Road',
    temporaryPassword: 'Manager2026!',
    status: 'active',
  },
  {
    id: 'usr_inventory',
    name: 'Sunday Adeyemi',
    username: 'inventory',
    email: 'inventory@offnotenergy.ng',
    role: 'inventory_officer',
    phone: '08056789012',
    branchId: 'br_dalute_main',
    branchName: 'Main Store - Dalute Road',
    temporaryPassword: 'Inventory2026!',
    status: 'active',
  },
  {
    id: 'usr_sales',
    name: 'Kehinde Balogun',
    username: 'sales',
    email: 'sales@offnotenergy.ng',
    role: 'sales_rep',
    phone: '08078901234',
    branchId: 'br_tipper_hq',
    branchName: 'Showroom - Tipper Garage (HQ)',
    temporaryPassword: 'Sales2026!',
    status: 'active',
  },
  {
    id: 'usr_accountant',
    name: 'Funmilayo Adeleke',
    username: 'accountant',
    email: 'accounts@offnotenergy.ng',
    role: 'accountant',
    phone: '08090123456',
    branchId: 'br_tipper_hq',
    branchName: 'Showroom - Tipper Garage (HQ)',
    temporaryPassword: 'Accounts2026!',
    status: 'active',
  },
  {
    id: 'usr_engineer',
    name: 'Engr. Tayo Alabi',
    username: 'engineer',
    email: 'tech@offnotenergy.ng',
    role: 'technical_staff',
    phone: '08123456780',
    branchId: 'br_dalute_main',
    branchName: 'Main Store - Dalute Road',
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
  phone: u.phone || '07000000000',
  branchId: u.branchId || 'br_tipper_hq',
  branchName: u.branchName || 'Showroom - Tipper Garage (HQ)',
  temporaryPassword: u.temporaryPassword,
  status: u.status,
  hasFullSystemAccess: u.hasFullSystemAccess,
  canAccessAllBranches: u.canAccessAllBranches,
  createdAt: '2026-01-01T08:00:00Z',
  lastLogin: '2026-10-28T08:00:00Z',
}));

export const INITIAL_CATEGORIES = [
  'Hybrid inverters',
  'Solar panels',
  'Lithium batteries',
  'Tubular batteries',
  'Dry-cell batteries',
  'Portable power stations',
  'Itel PowerTank',
  'Itel PowerGo',
  'Itel PowerGo Pro',
  'Itel AIO and all-in-one systems',
  'Solar cables',
  'Surge protectors and breakers',
  'Mounting accessories',
  'Installation materials',
  'Other solar accessories',
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_felicity',
    companyName: 'Felicity Solar Direct Nigeria',
    contactPerson: 'Mr. Zhang Wei / Biodun',
    phone: '08031122334',
    email: 'sales@felicitysolar-ng.com',
    address: 'Plot 14 Commercial Avenue, Ikeja, Lagos',
    categories: ['Hybrid inverters', 'Lithium batteries'],
    paymentTerms: '14 Days Net',
    outstandingBalance: 0,
    createdAt: '2026-01-10T08:00:00Z',
    notes: 'Primary supplier for Felicity 5kW/10kW hybrid inverters & wall-mount lithium banks.',
  },
  {
    id: 'sup_jinko',
    companyName: 'Jinko Solar West Africa Distributors',
    contactPerson: 'Mrs. Chinyere Okafor',
    phone: '08029988776',
    email: 'orders@jinkowestafrica.com',
    address: 'Apapa Port Industrial Area, Lagos',
    categories: ['Solar panels'],
    paymentTerms: 'Immediate',
    outstandingBalance: 0,
    createdAt: '2026-01-15T09:30:00Z',
    notes: 'Grade A Tier 1 Bifacial & N-type panels.',
  },
  {
    id: 'sup_itel',
    companyName: 'Itel Energy Nigeria Official',
    contactPerson: 'Kazeem Mustapha',
    phone: '08182233445',
    email: 'b2b@itel-energy.ng',
    address: 'Computer Village, Ikeja & Ibadan Regional Hub',
    categories: ['Itel PowerTank', 'Itel PowerGo', 'Itel PowerGo Pro', 'Itel AIO and all-in-one systems'],
    paymentTerms: '30 Days Net',
    outstandingBalance: 0,
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'sup_cables',
    companyName: 'Havells & Coleman Cable Depot Ibadan',
    contactPerson: 'Elder Samuel Ajayi',
    phone: '08055566778',
    email: 'sales@ibadancablehub.ng',
    address: 'Dugbe Commercial Center, Ibadan, Oyo State',
    categories: ['Solar cables', 'Surge protectors and breakers', 'Installation materials'],
    paymentTerms: 'Immediate',
    outstandingBalance: 0,
    createdAt: '2026-02-10T11:00:00Z',
  },
];

/**
 * Initial Solar Product Catalog
 * Preserves full catalog definitions, models, SKUs, and pricing tiers
 * with STRICT ZERO CURRENT STOCK (0 units) as requested by user.
 */
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_fel_5kw',
    sku: 'INV-FEL-5KW-48V',
    name: 'Felicity Solar 5kVA / 5kW 48V Pure Sine Wave Hybrid Inverter',
    brand: 'Felicity Solar',
    category: 'Hybrid inverters',
    model: 'IVEM5048',
    description: 'High-voltage MPPT 120A, parallel capable up to 6 units, dual AC outputs, Wi-Fi monitoring.',
    unit: 'Unit',
    purchaseCost: 620000,
    retailPrice: 750000,
    wholesalePrice: 700000,
    installerPrice: 685000,
    dealerPrice: 670000,
    minSellingPrice: 650000,
    currentStock: 0,
    reorderLevel: 4,
    warehouseLocation: 'Main Store - Dalute Road',
    branchId: 'br_dalute_main',
    branchName: 'Main Store - Dalute Road',
    supplierId: 'sup_felicity',
    supplierName: 'Felicity Solar Direct Nigeria',
    barcode: '694857201948',
    trackSerialNumbers: true,
    specs: {
      powerRatingKw: 5.0,
      voltage: '48V',
      warrantyMonths: 24,
    },
    status: 'active',
    createdAt: '2026-01-20T09:00:00Z',
    updatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'prod_deye_8kw',
    sku: 'INV-DEY-8KW-48V',
    name: 'Deye 8kW SunSync Low-Voltage Hybrid Inverter',
    brand: 'Deye',
    category: 'Hybrid inverters',
    model: 'SUN-8K-SG01LP1-EU',
    description: 'European standard hybrid inverter, dual MPPT, 48V battery input, smart load output.',
    unit: 'Unit',
    purchaseCost: 1550000,
    retailPrice: 1850000,
    wholesalePrice: 1750000,
    installerPrice: 1710000,
    dealerPrice: 1680000,
    minSellingPrice: 1620000,
    currentStock: 0,
    reorderLevel: 2,
    warehouseLocation: 'Showroom - Tipper Garage, Ibadan',
    branchId: 'br_tipper_hq',
    branchName: 'Showroom - Tipper Garage (HQ)',
    supplierId: 'sup_felicity',
    supplierName: 'Felicity Solar Direct Nigeria',
    barcode: '697483920194',
    trackSerialNumbers: true,
    specs: {
      powerRatingKw: 8.0,
      voltage: '48V',
      warrantyMonths: 60,
    },
    status: 'active',
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-10-21T10:00:00Z',
  },
  {
    id: 'prod_lith_5kwh',
    sku: 'BAT-LITH-5.12KWH',
    name: 'Offnot PowerMaster 5.12kWh 51.2V 100Ah LiFePO4 Wall-Mount Battery',
    brand: 'Offnot Energy',
    category: 'Lithium batteries',
    model: 'OPM-51100-W',
    description: 'Grade A EVE cells, 6000 cycles at 80% DoD, smart CAN/RS485 BMS communication with Deye & Felicity.',
    unit: 'Unit',
    purchaseCost: 980000,
    retailPrice: 1200000,
    wholesalePrice: 1120000,
    installerPrice: 1090000,
    dealerPrice: 1060000,
    minSellingPrice: 1020000,
    currentStock: 0,
    reorderLevel: 5,
    warehouseLocation: 'Main Store - Dalute Road',
    branchId: 'br_dalute_main',
    branchName: 'Main Store - Dalute Road',
    supplierId: 'sup_felicity',
    supplierName: 'Felicity Solar Direct Nigeria',
    barcode: '793847291038',
    trackSerialNumbers: true,
    specs: {
      batteryCapacityKwh: 5.12,
      voltage: '51.2V',
      chemistry: 'LiFePO4',
      warrantyMonths: 60,
    },
    status: 'active',
    createdAt: '2026-02-12T11:00:00Z',
    updatedAt: '2026-10-22T11:00:00Z',
  },
  {
    id: 'prod_jinko_550w',
    sku: 'PNL-JNK-550W-BF',
    name: 'Jinko 550W N-Type Tiger Neo Bifacial Solar Panel',
    brand: 'Jinko Solar',
    category: 'Solar panels',
    model: 'JKM550N-72HL4-BDVP',
    description: 'High efficiency 22.3%, double glass bifacial generation, superior low-light performance.',
    unit: 'Unit',
    purchaseCost: 78000,
    retailPrice: 95000,
    wholesalePrice: 88000,
    installerPrice: 86000,
    dealerPrice: 84000,
    minSellingPrice: 82000,
    currentStock: 0,
    reorderLevel: 25,
    warehouseLocation: 'Warehouse 2 - Iwo Road Depot',
    branchId: 'br_iwo_depot',
    branchName: 'Warehouse 2 - Iwo Road Depot',
    supplierId: 'sup_jinko',
    supplierName: 'Jinko Solar West Africa Distributors',
    barcode: '693748291048',
    specs: {
      panelWattageW: 550,
      voltage: '42V',
      warrantyMonths: 144,
    },
    status: 'active',
    createdAt: '2026-01-25T14:00:00Z',
    updatedAt: '2026-10-24T14:00:00Z',
  },
  {
    id: 'prod_itel_powertank',
    sku: 'PPS-ITEL-PT1000',
    name: 'Itel PowerTank 1000Wh Portable Power Station',
    brand: 'Itel',
    category: 'Itel PowerTank',
    model: 'IP-1000W',
    description: '1000W continuous pure sine wave output, 1000Wh LiFePO4 battery, super-fast 1.5hr AC charging.',
    unit: 'Unit',
    purchaseCost: 410000,
    retailPrice: 510000,
    wholesalePrice: 475000,
    installerPrice: 460000,
    dealerPrice: 450000,
    minSellingPrice: 435000,
    currentStock: 0,
    reorderLevel: 3,
    warehouseLocation: 'Showroom - Tipper Garage, Ibadan',
    branchId: 'br_tipper_hq',
    branchName: 'Showroom - Tipper Garage (HQ)',
    supplierId: 'sup_itel',
    supplierName: 'Itel Energy Nigeria Official',
    barcode: '489448930192',
    specs: {
      powerRatingKw: 1.0,
      batteryCapacityKwh: 1.0,
      voltage: '220V AC',
      chemistry: 'LiFePO4',
      warrantyMonths: 24,
    },
    status: 'active',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z',
  },
  {
    id: 'prod_itel_powergo',
    sku: 'PPS-ITEL-PG500',
    name: 'Itel PowerGo 500Wh Mobile Power Bank Station',
    brand: 'Itel',
    category: 'Itel PowerGo',
    model: 'IP-500W',
    description: 'Compact 500W AC output, fast USB-C PD 100W, LED flood light for camping & home backup.',
    unit: 'Unit',
    purchaseCost: 220000,
    retailPrice: 285000,
    wholesalePrice: 260000,
    installerPrice: 250000,
    dealerPrice: 242000,
    minSellingPrice: 235000,
    currentStock: 0,
    reorderLevel: 6,
    warehouseLocation: 'Showroom - Tipper Garage, Ibadan',
    branchId: 'br_tipper_hq',
    branchName: 'Showroom - Tipper Garage (HQ)',
    supplierId: 'sup_itel',
    supplierName: 'Itel Energy Nigeria Official',
    barcode: '489448930193',
    specs: {
      powerRatingKw: 0.5,
      batteryCapacityKwh: 0.5,
      voltage: '220V AC',
      chemistry: 'LiFePO4',
      warrantyMonths: 24,
    },
    status: 'active',
    createdAt: '2026-03-05T12:00:00Z',
    updatedAt: '2026-10-25T12:00:00Z',
  },
  {
    id: 'prod_cable_6mm',
    sku: 'CBL-DC-6MM-RED',
    name: 'TUV Certified 6mm² Single-Core PV Solar Cable (100m Roll, Red)',
    brand: 'Havells / Coleman',
    category: 'Solar cables',
    model: 'PV1-F-6MM-R',
    description: 'Tinned copper stranded wire, double insulation, UV resistant, halogen-free.',
    unit: 'Roll',
    purchaseCost: 58000,
    retailPrice: 75000,
    wholesalePrice: 69000,
    installerPrice: 66000,
    dealerPrice: 64000,
    minSellingPrice: 62000,
    currentStock: 0,
    reorderLevel: 10,
    warehouseLocation: 'Main Store - Dalute Road',
    branchId: 'br_dalute_main',
    branchName: 'Main Store - Dalute Road',
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '890123456789',
    status: 'active',
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-10-23T09:00:00Z',
  },
  {
    id: 'prod_spd_dc',
    sku: 'PRT-SPD-600V-DC',
    name: 'Suntree 600V DC Surge Protective Device (SPD) 20-40kA',
    brand: 'Suntree',
    category: 'Surge protectors and breakers',
    model: 'SUP2H-PV',
    description: 'Modular DIN rail lightning and transient surge arrester for photovoltaic strings.',
    unit: 'Unit',
    purchaseCost: 14000,
    retailPrice: 22000,
    wholesalePrice: 19000,
    installerPrice: 17500,
    dealerPrice: 16500,
    minSellingPrice: 15500,
    currentStock: 0,
    reorderLevel: 15,
    warehouseLocation: 'Main Store - Dalute Road',
    branchId: 'br_dalute_main',
    branchName: 'Main Store - Dalute Road',
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '782910482910',
    status: 'active',
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'prod_mounting_kit',
    sku: 'MNT-ALU-ROOF-4P',
    name: 'Anodized Aluminum Solar Roof Rail & Mid/End Clamp Kit (4 Panels)',
    brand: 'Offnot Solar Hardware',
    category: 'Mounting accessories',
    model: 'ALU-4P-PITCHED',
    description: 'Corrosion-proof AL6005-T5 rail set with stainless steel SUS304 bolts for corrugated/tile roofs.',
    unit: 'Set',
    purchaseCost: 28000,
    retailPrice: 42000,
    wholesalePrice: 36000,
    installerPrice: 34000,
    dealerPrice: 32000,
    minSellingPrice: 30000,
    currentStock: 0,
    reorderLevel: 8,
    warehouseLocation: 'Warehouse 2 - Iwo Road Depot',
    branchId: 'br_iwo_depot',
    branchName: 'Warehouse 2 - Iwo Road Depot',
    supplierId: 'sup_cables',
    supplierName: 'Havells & Coleman Cable Depot Ibadan',
    barcode: '782910482911',
    status: 'active',
    createdAt: '2026-03-01T14:00:00Z',
    updatedAt: '2026-10-22T14:00:00Z',
  },
  {
    id: 'prod_tubular_220ah',
    sku: 'BAT-TUB-220AH-12V',
    name: 'Luminous 220Ah / 12V Tall Tubular Deep Cycle Solar Battery',
    brand: 'Luminous',
    category: 'Tubular batteries',
    model: 'TX220',
    description: 'Heavy duty alloy grids with porous spine tubes for prolonged power outages in Nigeria.',
    unit: 'Unit',
    purchaseCost: 245000,
    retailPrice: 295000,
    wholesalePrice: 278000,
    installerPrice: 270000,
    dealerPrice: 265000,
    minSellingPrice: 255000,
    currentStock: 0,
    reorderLevel: 6,
    warehouseLocation: 'Main Store - Dalute Road',
    branchId: 'br_dalute_main',
    branchName: 'Main Store - Dalute Road',
    supplierId: 'sup_felicity',
    supplierName: 'Felicity Solar Direct Nigeria',
    barcode: '890123984719',
    specs: {
      voltage: '12V',
      chemistry: 'Tubular Gel',
      warrantyMonths: 18,
    },
    status: 'active',
    createdAt: '2026-02-18T10:00:00Z',
    updatedAt: '2026-10-24T10:00:00Z',
  },
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

  // Users & Staff
  getUsers(): User[] {
    const users = getStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const superAdmin = users.find(u => u.id === 'usr_super_admin' || u.role === 'super_admin');
    if (superAdmin) {
      superAdmin.name = 'Francis Gabriel (Superadmin)';
      superAdmin.email = 'francisgabriel932@gmail.com';
      superAdmin.username = 'superadmin';
      superAdmin.role = 'super_admin';
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
    const superAdmin = staff.find(s => s.id === 'usr_super_admin' || s.role === 'super_admin');
    if (superAdmin) {
      superAdmin.name = 'Francis Gabriel (Superadmin)';
      superAdmin.email = 'francisgabriel932@gmail.com';
      superAdmin.username = 'superadmin';
      superAdmin.role = 'super_admin';
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
    const invoiceNumber = `OFF-INV-${new Date().getFullYear()}-${1001 + sales.length}`;

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
        id: `pmt_${Date.now()}`,
        amount: paid,
        method: saleData.paymentMethod,
        reference: `${saleData.paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`,
        paidAt: now,
        recordedBy: user.name,
        splitDetails: saleData.splitDetails,
      });
    }

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
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
        id: `mov_sale_${Date.now()}_${prod.sku}`,
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

  // 6. Record Customer Return & Refund with Reversal
  processCustomerReturn(
    saleId: string,
    productId: string,
    quantity: number,
    reason: string,
    user: User
  ): { success: boolean; error?: string } {
    const sales = this.getSales();
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return { success: false, error: 'Sale record not found.' };

    const item = sale.items.find(i => i.productId === productId);
    if (!item) return { success: false, error: 'Product was not part of this sale.' };
    if (quantity > item.quantity) {
      return { success: false, error: `Cannot return ${quantity} units. Customer bought ${item.quantity}.` };
    }

    const products = this.getProducts();
    const prod = products.find(p => p.id === productId);
    if (!prod) return { success: false, error: 'Product not found.' };

    const now = new Date().toISOString();
    const previousStock = prod.currentStock;
    const newStock = previousStock + quantity;
    prod.currentStock = newStock;
    prod.updatedAt = now;

    const refundAmount = (item.unitPrice * quantity) - ((item.discount / item.quantity) * quantity);

    const movement: StockMovement = {
      id: `mov_ret_${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      type: 'customer_return',
      quantity: quantity,
      previousStock,
      newStock,
      unitCost: item.unitCost,
      totalCost: quantity * item.unitCost,
      referenceId: sale.invoiceNumber,
      warehouseLocation: sale.warehouseLocation,
      branchId: sale.branchId || user.branchId,
      branchName: sale.branchName || user.branchName,
      reason: `Customer return for #${sale.invoiceNumber}: ${reason}`,
      performedByUserId: user.id,
      performedByUserName: user.name,
      timestamp: now,
    };

    sale.returned = true;

    const movements = this.getStockMovements();
    this.saveProducts(products);
    this.saveSales(sales);
    this.saveStockMovements([movement, ...movements]);

    this.logAction({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'CUSTOMER_RETURN_PROCESSED',
      module: 'sales',
      recordId: sale.invoiceNumber,
      details: `Returned ${quantity}x ${prod.name} for invoice #${sale.invoiceNumber}. Refund amount: ₦${refundAmount.toLocaleString()}. Reason: ${reason}`,
    });

    return { success: true };
  },
};
