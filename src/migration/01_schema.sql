-- =====================================================================
-- OFFNOT ENERGY MANAGEMENT SYSTEM - SUPABASE POSTGRESQL MIGRATION
-- File: 01_schema.sql
-- Description: Core Schema DDL - All 16 Relational Tables, Custom ENUMs,
--              Primary Keys, Foreign Keys, and Performance Indexes
-- Target Platform: Supabase / PostgreSQL 15+
-- Location: Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria
-- Currency: Nigerian Naira (₦ / NGN)
-- =====================================================================

-- Step 1: Enable Necessary Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- Step 2: Custom Enums & Types
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'admin',
    'ceo',
    'manager',
    'inventory_officer',
    'sales_rep',
    'accountant',
    'technical_staff'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE pricing_tier AS ENUM ('retail', 'wholesale', 'installer', 'dealer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

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
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE po_status AS ENUM ('draft', 'pending_approval', 'approved', 'partially_received', 'received', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'pos', 'split');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('paid', 'partial', 'unpaid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

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
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE lead_stage AS ENUM ('new_lead', 'contacted', 'qualified', 'site_survey', 'quotation_sent', 'negotiation', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE quotation_status AS ENUM ('draft', 'pending_approval', 'sent', 'accepted', 'rejected', 'expired', 'converted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

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
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================================
-- Step 3: Create Tables (All 16 Primary Database Tables)
-- =====================================================================

-- 1. Company Settings
CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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

-- 2. Multi-Branch Operations Hub
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  city VARCHAR(100) NOT NULL DEFAULT 'Ibadan',
  state VARCHAR(100) NOT NULL DEFAULT 'Oyo State',
  address TEXT,
  phone VARCHAR(50) DEFAULT '07047053453',
  email VARCHAR(100),
  manager_name VARCHAR(255),
  is_headquarters BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. User Profiles & Staff Accounts (Synced with App RBAC)
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  auth_id UUID UNIQUE,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'sales_rep',
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  branch_name VARCHAR(255),
  temporary_password VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  has_full_system_access BOOLEAN NOT NULL DEFAULT FALSE,
  can_access_all_branches BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url TEXT,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. Product Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. Equipment Suppliers & Vendors
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  categories TEXT[],
  payment_terms VARCHAR(100) DEFAULT 'Immediate',
  outstanding_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. Products & Inventory (Strict Zero Ledger Initial Balance)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL DEFAULT 'Offnot Energy',
  category VARCHAR(255) NOT NULL,
  model VARCHAR(100),
  description TEXT,
  unit VARCHAR(50) NOT NULL DEFAULT 'Unit',
  purchase_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_cost >= 0),
  retail_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (retail_price >= 0),
  wholesale_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (wholesale_price >= 0),
  installer_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (installer_price >= 0),
  dealer_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (dealer_price >= 0),
  min_selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (min_selling_price >= 0),
  current_stock INT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  reorder_level INT NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
  warehouse_location VARCHAR(255) NOT NULL,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  branch_name VARCHAR(255),
  supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name VARCHAR(255),
  barcode VARCHAR(100),
  track_serial_numbers BOOLEAN NOT NULL DEFAULT FALSE,
  serial_numbers TEXT[] DEFAULT '{}',
  specs JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. Stock Movements (Immutable Inventory Ledger)
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  reference_id VARCHAR(100) NOT NULL,
  warehouse_location VARCHAR(255) NOT NULL,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  branch_name VARCHAR(255),
  reason TEXT NOT NULL,
  performed_by_user_id TEXT,
  performed_by_user_name VARCHAR(255) NOT NULL,
  approved_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. Customers & Solar Installers (CRM)
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'retail',
  pricing_tier VARCHAR(50) NOT NULL DEFAULT 'retail',
  lead_stage VARCHAR(50) NOT NULL DEFAULT 'new_lead',
  total_purchases NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  outstanding_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  last_purchase_date TIMESTAMPTZ,
  assigned_staff_id TEXT,
  assigned_staff_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. Purchase Orders (Procurement)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  po_number VARCHAR(100) NOT NULL UNIQUE,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  supplier_name VARCHAR(255) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  shipping_and_logistics NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  warehouse_location VARCHAR(255) NOT NULL,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  expected_delivery_date TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. Sales Transactions & Invoices (Point of Sale)
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_tier VARCHAR(50) NOT NULL DEFAULT 'retail',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  discount_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  balance_due NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  cost_of_goods_sold NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  gross_profit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'paid',
  payments JSONB DEFAULT '[]'::jsonb,
  sales_rep_id TEXT,
  sales_rep_name VARCHAR(255) NOT NULL,
  warehouse_location VARCHAR(255) NOT NULL,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  branch_name VARCHAR(255),
  notes TEXT,
  is_returned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 11. Payments Ledger
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sale_id TEXT REFERENCES sales(id) ON DELETE CASCADE,
  purchase_order_id TEXT REFERENCES purchase_orders(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  method VARCHAR(50) NOT NULL,
  reference VARCHAR(100),
  recorded_by VARCHAR(255) NOT NULL,
  split_details JSONB,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 12. Commercial Solar Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  quotation_number VARCHAR(100) NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
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
  status VARCHAR(50) NOT NULL DEFAULT 'sent',
  valid_until TIMESTAMPTZ NOT NULL,
  terms TEXT NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  converted_to_sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL,
  converted_to_project_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 13. Solar Installation Projects
CREATE TABLE IF NOT EXISTS installation_projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_code VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  site_address TEXT NOT NULL,
  capacity_description TEXT NOT NULL,
  lead_technician_id TEXT,
  lead_technician_name VARCHAR(255) NOT NULL,
  team_members TEXT[] DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  start_date TIMESTAMPTZ,
  target_completion_date TIMESTAMPTZ,
  actual_completion_date TIMESTAMPTZ,
  quotation_id TEXT REFERENCES quotations(id) ON DELETE SET NULL,
  contract_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  equipment_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  labour_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  transport_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  other_expenses NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_project_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  gross_margin NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  technical_notes TEXT,
  warranty_period_months INT DEFAULT 24,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 14. Operating Expenses & OPEX Ledger
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  payee VARCHAR(255) NOT NULL,
  reference VARCHAR(100),
  recorded_by_user_id TEXT,
  recorded_by_user_name VARCHAR(255) NOT NULL,
  approved_by VARCHAR(255),
  project_id TEXT REFERENCES installation_projects(id) ON DELETE SET NULL,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 15. Security & System Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  record_id VARCHAR(100),
  details TEXT NOT NULL,
  ip_address VARCHAR(50),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 16. In-App Notifications
CREATE TABLE IF NOT EXISTS app_notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link_module VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- Step 4: Performance Indexes (Fixed column names)
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_branches_code ON branches(code);
CREATE INDEX IF NOT EXISTS idx_users_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_branch ON sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_time ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
