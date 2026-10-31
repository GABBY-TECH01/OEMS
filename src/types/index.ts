/**
 * Offnot Energy Business Management System - Domain Types
 * Location: Ibadan, Oyo State, Nigeria
 * Currency: Nigerian Naira (₦)
 */

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'ceo'
  | 'manager'
  | 'inventory_officer'
  | 'sales_rep'
  | 'accountant'
  | 'technical_staff';

export type PermissionKey =
  | 'view_financials'
  | 'override_pricing'
  | 'adjust_inventory'
  | 'approve_purchases'
  | 'manage_users'
  | 'record_sales'
  | 'manage_expenses'
  | 'manage_projects'
  | 'view_audit_logs'
  | 'manage_branches'
  | 'manage_settings'
  | 'access_all_branches';

export type ActiveTab =
  | 'dashboard'
  | 'inventory'
  | 'pos'
  | 'sales_history'
  | 'purchasing'
  | 'customers'
  | 'quotations'
  | 'projects'
  | 'finance'
  | 'reports'
  | 'audit'
  | 'settings'
  | 'migrations'
  | 'branches'
  | 'staff';

export type RolePermissionsMap = Record<UserRole, Record<PermissionKey, boolean>>;

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email?: string;
  managerName?: string;
  isHeadquarters: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  branchId?: string;
  branchName?: string;
  status: 'active' | 'inactive';
  lastActive?: string;
  temporaryPassword?: string;
  hasFullSystemAccess?: boolean; // Granted by Superadmin to Admin
  canAccessAllBranches?: boolean; // Granted by Superadmin to Admin
}

export interface StaffAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  phone: string;
  branchId: string;
  branchName: string;
  temporaryPassword?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  hasFullSystemAccess?: boolean; // Granted by Superadmin to Admin
  canAccessAllBranches?: boolean; // Granted by Superadmin to Admin
}

export type PricingTier = 'retail' | 'wholesale' | 'installer' | 'dealer';

export interface SolarSpecifications {
  powerRatingKw?: number;       // Inverter power in kW (e.g. 5kW, 10kW)
  batteryCapacityKwh?: number;  // Battery capacity in kWh (e.g. 5.12kWh, 10kWh)
  panelWattageW?: number;       // Solar panel wattage (e.g. 550W, 600W)
  voltage?: string;             // e.g. '12V', '24V', '48V', 'High Voltage'
  chemistry?: string;           // e.g. 'LiFePO4', 'Tubular Gel', 'Lead Acid'
  warrantyMonths?: number;      // e.g. 24, 60 months
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  model: string;
  description: string;
  unit: string; // 'Unit', 'Roll', 'Pair', 'Set', 'Meter', 'Pack'
  purchaseCost: number;       // Base cost in NGN
  retailPrice: number;        // Retail selling price
  wholesalePrice: number;     // Wholesale bulk price
  installerPrice: number;     // Registered installer discount price
  dealerPrice: number;        // Strategic distributor/dealer price
  minSellingPrice: number;    // Hard floor price
  currentStock: number;
  reorderLevel: number;
  warehouseLocation: string;  // e.g. 'Main Store Dalute', 'Showroom Tipper Garage'
  branchId?: string;
  branchName?: string;
  supplierId: string;
  supplierName: string;
  barcode: string;
  trackSerialNumbers?: boolean;
  serialNumbers?: string[];
  specs?: SolarSpecifications;
  status: 'active' | 'discontinued';
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType =
  | 'opening_stock'
  | 'goods_received'
  | 'sale'
  | 'customer_return'
  | 'supplier_return'
  | 'project_issue'
  | 'project_return'
  | 'adjustment_positive'
  | 'adjustment_negative'
  | 'damaged'
  | 'stocktaking';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: StockMovementType;
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalCost: number;
  referenceId: string; // e.g. PO number, Sale number, Project ID
  warehouseLocation: string;
  branchId?: string;
  branchName?: string;
  reason: string;
  performedByUserId: string;
  performedByUserName: string;
  timestamp: string;
  approvedBy?: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  categories: string[];
  paymentTerms: string; // e.g. 'Immediate', '14 Days Net', '30 Days Net'
  outstandingBalance: number;
  createdAt: string;
  notes?: string;
}

export type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'partially_received' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. OFF-PO-2026-001
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  shippingAndLogistics: number;
  totalAmount: number;
  paidAmount: number;
  status: PurchaseOrderStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  expectedDeliveryDate?: string;
  warehouseLocation: string;
  branchId?: string;
  branchName?: string;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'pos' | 'split';

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
  recordedBy: string;
  splitDetails?: {
    cashAmount?: number;
    transferAmount?: number;
    posAmount?: number;
  };
}

export type CustomerType =
  | 'retail'
  | 'homeowner'
  | 'business'
  | 'school'
  | 'church'
  | 'hospital'
  | 'solar_installer'
  | 'electrician'
  | 'dealer';

export type LeadStage =
  | 'new_lead'
  | 'contacted'
  | 'qualified'
  | 'site_survey'
  | 'quotation_sent'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address: string;
  type: CustomerType;
  pricingTier: PricingTier;
  leadStage: LeadStage;
  totalPurchases: number;
  outstandingBalance: number;
  lastPurchaseDate?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  notes?: string;
  installerDetails?: {
    certifications?: string;
    territory?: string;
    monthlyCapacityKw?: number;
  };
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  unitPrice: number;
  unitCost: number;
  quantity: number;
  discount: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string; // e.g. OFF-INV-2026-1001
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerTier: PricingTier;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  payments: PaymentRecord[];
  salesRepId: string;
  salesRepName: string;
  warehouseLocation: string;
  branchId?: string;
  branchName?: string;
  createdAt: string;
  notes?: string;
  returned?: boolean;
}

export type QuotationStatus = 'draft' | 'pending_approval' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface QuotationLineItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
  category?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. OFF-QT-2026-0045
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: QuotationLineItem[];
  installationCharges: number;
  logisticsCharges: number;
  subtotal: number;
  vatRate: number; // e.g. 0 or 7.5
  taxAmount: number;
  totalAmount: number;
  status: QuotationStatus;
  validUntil: string;
  terms: string;
  createdBy: string;
  createdAt: string;
  convertedToSaleId?: string;
  convertedToProjectId?: string;
}

export type ProjectStatus =
  | 'lead'
  | 'site_survey'
  | 'quotation'
  | 'approved'
  | 'scheduled'
  | 'in_progress'
  | 'testing'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

export interface ProjectMaterial {
  productId: string;
  productName: string;
  sku: string;
  quantityIssued: number;
  quantityReturned: number;
  unitCost: number;
  totalCost: number;
  issuedAt: string;
}

export interface InstallationProject {
  id: string;
  projectCode: string; // e.g. PRJ-IBD-2026-012
  title: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  siteAddress: string;
  capacityDescription: string; // e.g. "5kVA / 10kWh Lithium Solar Hybrid"
  leadTechnicianId: string;
  leadTechnicianName: string;
  teamMembers: string[];
  status: ProjectStatus;
  startDate?: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  quotationId?: string;
  contractAmount: number;
  equipmentCost: number;
  labourCost: number;
  transportCost: number;
  otherExpenses: number;
  totalProjectCost: number;
  grossMargin: number;
  materials: ProjectMaterial[];
  technicalNotes: string;
  warrantyPeriodMonths: number;
  branchId?: string;
  branchName?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Transport & Logistics'
  | 'Fuel & Power'
  | 'Rent & Facilities'
  | 'Salaries & Wages'
  | 'Marketing & Advertising'
  | 'Internet & Communication'
  | 'Installation Labour'
  | 'Repairs & Maintenance'
  | 'Office Supplies'
  | 'Bank Charges & POS Fees'
  | 'Other Operating Expenses';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'pos';
  payee: string;
  reference?: string;
  recordedByUserId: string;
  recordedByUserName: string;
  approvedBy?: string;
  projectId?: string; // Optional link to specific installation project
  branchId?: string;
  branchName?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: 'inventory' | 'sales' | 'purchasing' | 'projects' | 'expenses' | 'settings' | 'auth' | 'customers' | 'branches' | 'staff';
  recordId?: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'alert' | 'success';
  read: boolean;
  linkModule?: string;
  createdAt: string;
}

export interface CompanySettings {
  companyName: string;
  slogan: string;
  location: string;
  phone: string;
  email: string;
  currencySymbol: string;
  currencyCode: string;
  defaultVatRate: number; // e.g. 7.5%
  enableTaxByDefault: boolean;
  warehouses: string[];
  minGrossMarginPercent: number; // e.g. 10%
  receiptFooterMessage: string;
}
