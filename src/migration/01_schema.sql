-- =====================================================================
-- OFFNOT ENERGY MANAGEMENT SYSTEM - SUPABASE POSTGRESQL MIGRATION
-- File: 01_schema.sql
-- Description: Core Database Tables, Enums, Primary & Foreign Keys, Indexes
-- Target Platform: Supabase / PostgreSQL 15+
-- Location: Ibadan, Oyo State, Nigeria
-- Currency: Nigerian Naira (NGN / ₦)
-- =====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing schema if re-running (optional, safe with IF EXISTS)
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'ceo',
    'manager',
    'inventory_officer',
    'sales_rep',
    'accountant',
    'technical_staff'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pricing_tier AS ENUM (
    'retail',
    'wholesale',
    'installer',
    'dealer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE stock_movement_type AS ENUM (
    'opening_stock',
    'goods_received',
    'sale',
    'customer_return',
    'supplier_return',
    'project_issue',
    'project_return',
    'adjustment_positive',
    'adjustment_negative',
    'damaged',
    'stocktaking'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE po_status AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'partially_received',
    'received',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'cash',
    'bank_transfer',
    'pos',
    'split'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'paid',
    'partial',
    'unpaid'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE customer_type AS ENUM (
    'retail',
    'homeowner',
    'business',
    'school',
    'church',
    'hospital',
    'solar_installer',
    'electrician',
    'dealer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_stage AS ENUM (
    'new_lead',
    'contacted',
    'qualified',
    'site_survey',
    'quotation_sent',
    'negotiation',
    'won',
    'lost'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE quotation_status AS ENUM (
    'draft',
    'pending_approval',
    'sent',
    'accepted',
    'rejected',
    'expired',
    'converted'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM (
    'lead',
    'site_survey',
    'quotation',
    'approved',
    'scheduled',
    'in_progress',
    'testing',
    'completed',
    'on_hold',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================================
-- 2. COMPANY SETTINGS & WAREHOUSES
-- =====================================================================

CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL DEFAULT 'Offnot Energy',
  slogan VARCHAR(255) NOT NULL DEFAULT 'Clean Energy, Stronger Tomorrow',
  location TEXT NOT NULL DEFAULT 'Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria',
  phone VARCHAR(50) NOT NULL DEFAULT '07047053453',
  email VARCHAR(100) NOT NULL DEFAULT 'offnotenergy@gmail.com',
  currency_symbol VARCHAR(10) NOT NULL DEFAULT '₦',
  currency_code VARCHAR(10) NOT NULL DEFAULT 'NGN',
  default_vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 7.50,
  enable_tax_by_default BOOLEAN NOT NULL DEFAULT FALSE,
  min_gross_margin_percent NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
  receipt_footer_message TEXT DEFAULT 'Thank you for choosing Offnot Energy! Clean Energy, Stronger Tomorrow.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  location_address TEXT,
  manager_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- 3. USER ACCOUNTS & PROFILES (SYNCED WITH SUPABASE AUTH)
-- =====================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE, -- References auth.users(id) in Supabase
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  role user_role NOT NULL DEFAULT 'sales_rep',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  avatar_url TEXT,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- 4. PRODUCT CATEGORIES & SUPPLIERS
-- =====================================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  categories TEXT[], -- Array of category names or IDs
  payment_terms VARCHAR(100) DEFAULT 'Immediate',
  outstanding_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (outstanding_balance >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- 5. PRODUCTS & SOLAR SPECIFICATIONS
-- =====================================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL DEFAULT 'Offnot Energy',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name VARCHAR(255) NOT NULL,
  model VARCHAR(100),
  description TEXT,
  unit VARCHAR(50) NOT NULL DEFAULT 'Unit',
  
  -- Price Architecture (NGN ₦)
  purchase_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_cost >= 0),
  retail_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (retail_price >= 0),
  wholesale_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (wholesale_price >= 0),
  installer_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (installer_price >= 0),
  dealer_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (dealer_price >= 0),
  min_selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (min_selling_price >= 0),
  
  -- Inventory Balances
  current_stock INT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  reorder_level INT NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
  warehouse_location VARCHAR(255) NOT NULL,
  
  -- Supplier linkage
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name VARCHAR(255),
  
  -- Identification
  barcode VARCHAR(100) UNIQUE,
  track_serial_numbers BOOLEAN NOT NULL DEFAULT FALSE,
  serial_numbers TEXT[] DEFAULT '{}',
  
  -- Solar Specifications (JSONB)
  -- Contains: powerRatingKw, batteryCapacityKwh, panelWattageW, voltage, chemistry, warrantyMonths
  specs JSONB DEFAULT '{}'::jsonb,
  
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- 6. STOCK MOVEMENTS (IMMUTABLE AUDITABLE LEDGER)
-- =====================================================================

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  type stock_movement_type NOT NULL,
  quantity INT NOT NULL, -- Positive for receipts/returns, negative for sales/issues
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  reference_id VARCHAR(100) NOT NULL, -- e.g. OFF-INV-2026-1001, OFF-PO-2026-1001, PRJ-IBD-2026-001
  warehouse_location VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  performed_by_user_id UUID,
  performed_by_user_name VARCHAR(255) NOT NULL,
  approved_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- 7. CUSTOMERS & REGISTERED INSTALLERS (CRM)
-- =====================================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT NOT NULL,
  type customer_type NOT NULL DEFAULT 'retail',
  pricing_tier pricing_tier NOT NULL DEFAULT 'retail',
  lead_stage lead_stage NOT NULL DEFAULT 'new_lead',
  total_purchases NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  outstanding_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  last_purchase_date TIMESTAMPTZ,
  assigned_staff_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  assigned_staff_name VARCHAR(255),
  notes TEXT,
  
  -- Installer details: certifications, territory, monthlyCapacityKw
  installer_details JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- 8. PURCHASING & GOODS RECEIPTS (PO & GRN)
-- =====================================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(100) NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  supplier_name VARCHAR(255) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  shipping_and_logistics NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  status po_status NOT NULL DEFAULT 'draft',
  warehouse_location VARCHAR(255) NOT NULL,
  expected_delivery_date TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- 9. SALES ORDERS & POS INVOICES
-- =====================================================================

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_tier pricing_tier NOT NULL DEFAULT 'retail',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Financial totals
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  discount_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  balance_due NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  
  -- Profitability Reconciliation
  cost_of_goods_sold NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  gross_profit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  
  payment_method payment_method NOT NULL DEFAULT 'bank_transfer',
  payment_status payment_status NOT NULL DEFAULT 'paid',
  
  sales_rep_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  sales_rep_name VARCHAR(255) NOT NULL,
  warehouse_location VARCHAR(255) NOT NULL,
  notes TEXT,
  is_returned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  method payment_method NOT NULL,
  reference VARCHAR(100),
  recorded_by VARCHAR(255) NOT NULL,
  split_details JSONB,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- 10. SOLAR SYSTEM QUOTATIONS
-- =====================================================================

CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number VARCHAR(100) NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  installation_charges NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  logistics_charges NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  status quotation_status NOT NULL DEFAULT 'sent',
  valid_until TIMESTAMPTZ NOT NULL,
  terms TEXT NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  converted_to_sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- 11. SOLAR INSTALLATION PROJECTS
-- =====================================================================

CREATE TABLE IF NOT EXISTS installation_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  site_address TEXT NOT NULL,
  capacity_description TEXT NOT NULL,
  lead_technician_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  lead_technician_name VARCHAR(255) NOT NULL,
  team_members TEXT[] DEFAULT '{}',
  status project_status NOT NULL DEFAULT 'scheduled',
  start_date TIMESTAMPTZ,
  target_completion_date TIMESTAMPTZ,
  actual_completion_date TIMESTAMPTZ,
  quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
  
  -- Project Financials
  contract_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  equipment_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  labour_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  transport_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  other_expenses NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_project_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  gross_margin NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  
  -- Materials issued to project (JSONB array of items issued/returned)
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  technical_notes TEXT,
  warranty_period_months INT DEFAULT 24,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- 12. OPERATING EXPENSES
-- =====================================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  payment_method payment_method NOT NULL DEFAULT 'bank_transfer',
  payee VARCHAR(255) NOT NULL,
  reference VARCHAR(100),
  recorded_by_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  recorded_by_user_name VARCHAR(255) NOT NULL,
  approved_by VARCHAR(255),
  project_id UUID REFERENCES installation_projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- 13. AUDIT LOGS & NOTIFICATIONS
-- =====================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_name VARCHAR(255) NOT NULL,
  user_role user_role NOT NULL,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  record_id VARCHAR(100),
  details TEXT NOT NULL,
  ip_address VARCHAR(50),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('warning', 'info', 'alert', 'success')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link_module VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- 14. PERFORMANCE INDEXES
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_name);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(current_stock);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON stock_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_time ON stock_movements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_time ON sales(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(pricing_tier);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);

CREATE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);

CREATE INDEX IF NOT EXISTS idx_projects_code ON installation_projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON installation_projects(status);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
