-- =====================================================================
-- OFFNOT ENERGY MANAGEMENT SYSTEM - MASTER SUPABASE SQL SCRIPT
-- File: /migration/05_complete_migration_single_file.sql
-- Company: Offnot Energy Systems Ltd
-- Location: Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria
-- Currency: Nigerian Naira (₦ / NGN)
-- Target Platform: Supabase (PostgreSQL 15+)
-- =====================================================================

-- Step 1: Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Custom Enums & Types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin', 'admin', 'ceo', 'manager',
    'inventory_officer', 'sales_rep', 'accountant', 'technical_staff'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE pricing_tier AS ENUM ('retail', 'wholesale', 'installer', 'dealer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE stock_movement_type AS ENUM (
    'opening_stock', 'goods_received', 'sale', 'customer_return',
    'supplier_return', 'project_issue', 'project_return',
    'adjustment_positive', 'adjustment_negative', 'damaged', 'stocktaking'
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
    'retail', 'homeowner', 'business', 'school',
    'church', 'hospital', 'solar_installer', 'electrician', 'dealer'
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
    'lead', 'site_survey', 'quotation', 'approved',
    'scheduled', 'in_progress', 'testing', 'completed', 'on_hold', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Step 3: Create Tables (All 16 Relational Tables)

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

-- 3. User Profiles & Staff Accounts
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

-- 6. Products & Inventory (Strict Zero Ledger)
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

-- 14. Operating Expenses
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

-- Step 4: Indexes
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

-- Step 5: Updated_at Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'company_settings', 'user_profiles', 'suppliers', 'products',
    'customers', 'purchase_orders', 'sales', 'quotations', 'installation_projects'
  ]) LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;
      CREATE TRIGGER trg_set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END $$;

-- Step 6: Supabase Row Level Security (RLS) Permissive Access
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'company_settings', 'branches', 'user_profiles', 'categories', 'suppliers',
    'products', 'stock_movements', 'customers', 'purchase_orders', 'sales',
    'payments', 'quotations', 'installation_projects', 'expenses',
    'audit_logs', 'app_notifications'
  ]) LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "Allow all for authenticated and anon" ON %I;
      CREATE POLICY "Allow all for authenticated and anon"
      ON %I FOR ALL
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
    ', tbl, tbl);
  END LOOP;
END $$;

-- Step 7: Initial Seed Data (Clean Zero Ledger)

-- 1. Company Profile
INSERT INTO company_settings (
  id, company_name, slogan, location, phone, email,
  currency_symbol, currency_code, default_vat_rate, enable_tax_by_default,
  min_gross_margin_percent, receipt_footer_message
) VALUES (
  'cfg_offnot_main', 'Offnot Energy', 'Clean Energy, Stronger Tomorrow',
  'Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria',
  '07047053453', 'offnotenergy@gmail.com', '₦', 'NGN', 7.50, FALSE, 12.00,
  'Thank you for choosing Offnot Energy! Clean Energy, Stronger Tomorrow.'
) ON CONFLICT (id) DO NOTHING;

-- 2. Multi-Branch Hubs (Ibadan)
INSERT INTO branches (id, name, code, city, state, address, phone, email, manager_name, is_headquarters, is_active) VALUES
  ('br_tipper_hq', 'Showroom - Tipper Garage (HQ)', 'BR-IBD-01', 'Ibadan', 'Oyo State', 'Inside Tipper Garage, Dalute Road, Ibadan', '07047053453', 'tipper@offnotenergy.ng', 'Gabriel Francis', TRUE, TRUE),
  ('br_dalute_main', 'Main Store - Dalute Road', 'BR-IBD-02', 'Ibadan', 'Oyo State', 'Plot 12 Dalute Road, Beside Bovas, Ibadan', '08034567890', 'dalute@offnotenergy.ng', 'Bolanle Oladipo', FALSE, TRUE),
  ('br_iwo_depot', 'Warehouse 2 - Iwo Road Depot', 'BR-IBD-03', 'Ibadan', 'Oyo State', 'Express Interchange, Iwo Road, Ibadan', '08056789012', 'iworoad@offnotenergy.ng', 'Sunday Adeyemi', FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Staff Accounts (Francis Gabriel Superadmin & Deputy Admin Ayomide Bakare)
INSERT INTO user_profiles (
  id, name, username, email, phone, role, branch_id, branch_name,
  temporary_password, status, has_full_system_access, can_access_all_branches
) VALUES
  ('usr_super_admin', 'Francis Gabriel (Superadmin)', 'superadmin', 'francisgabriel932@gmail.com', '07047053453', 'super_admin', 'br_tipper_hq', 'Showroom - Tipper Garage (HQ)', 'SuperAdmin2026!', 'active', TRUE, TRUE),
  ('usr_admin', 'Ayomide Bakare (Deputy Admin)', 'admin', 'admin@offnotenergy.ng', '08022233344', 'admin', 'br_tipper_hq', 'Showroom - Tipper Garage (HQ)', 'Admin2026!', 'active', FALSE, FALSE),
  ('usr_ceo', 'Chief Executive Officer', 'ceo', 'ceo@offnotenergy.ng', '08023456789', 'ceo', 'br_tipper_hq', 'Showroom - Tipper Garage (HQ)', 'Ceo2026!', 'active', FALSE, TRUE),
  ('usr_manager', 'Bolanle Oladipo', 'manager', 'manager@offnotenergy.ng', '08034567890', 'manager', 'br_dalute_main', 'Main Store - Dalute Road', 'Manager2026!', 'active', FALSE, FALSE),
  ('usr_inventory', 'Sunday Adeyemi', 'inventory', 'inventory@offnotenergy.ng', '08056789012', 'inventory_officer', 'br_dalute_main', 'Main Store - Dalute Road', 'Inventory2026!', 'active', FALSE, FALSE),
  ('usr_sales', 'Kehinde Balogun', 'sales', 'sales@offnotenergy.ng', '08078901234', 'sales_rep', 'br_tipper_hq', 'Showroom - Tipper Garage (HQ)', 'Sales2026!', 'active', FALSE, FALSE),
  ('usr_accountant', 'Funmilayo Adeleke', 'accountant', 'accounts@offnotenergy.ng', '08090123456', 'accountant', 'br_tipper_hq', 'Showroom - Tipper Garage (HQ)', 'Accounts2026!', 'active', FALSE, FALSE),
  ('usr_engineer', 'Engr. Tayo Alabi', 'engineer', 'tech@offnotenergy.ng', '08123456780', 'technical_staff', 'br_dalute_main', 'Main Store - Dalute Road', 'Engineer2026!', 'active', FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 4. Solar Product Categories
INSERT INTO categories (id, name, description, display_order) VALUES
  ('cat_1', 'Hybrid inverters', 'Pure sine wave solar hybrid and grid-tied inverters', 1),
  ('cat_2', 'Solar panels', 'Tier-1 Monocrystalline, N-Type and Bifacial PV modules', 2),
  ('cat_3', 'Lithium batteries', 'LiFePO4 wall-mount and rack-mount energy storage banks', 3),
  ('cat_4', 'Tubular batteries', 'Deep cycle lead-acid and tall tubular solar batteries', 4),
  ('cat_5', 'Dry-cell batteries', 'Maintenance-free AGM and VRLA deep cycle batteries', 5),
  ('cat_6', 'Portable power stations', 'Mobile generator replacement solar power banks', 6),
  ('cat_7', 'Itel PowerTank', 'Itel official 1000W-2000W power stations', 7),
  ('cat_8', 'Itel PowerGo', 'Itel official 500W mobile solar generators', 8),
  ('cat_9', 'Itel PowerGo Pro', 'Itel professional high-output mobile backup systems', 9),
  ('cat_10', 'Itel AIO and all-in-one systems', 'Integrated inverter and lithium battery units', 10),
  ('cat_11', 'Solar cables', 'TUV certified tinned copper double insulated DC cables', 11),
  ('cat_12', 'Surge protectors and breakers', 'DC breakers, SPDs, changeovers and isolators', 12),
  ('cat_13', 'Mounting accessories', 'Anodized aluminum roof rails, mid/end clamps, L-feet', 13),
  ('cat_14', 'Installation materials', 'MC4 connectors, heat shrink, earthing rods, conduits', 14),
  ('cat_15', 'Other solar accessories', 'Battery cables, lugs, fuses, Wi-Fi dongles', 15)
ON CONFLICT (id) DO NOTHING;

-- 5. Primary Suppliers
INSERT INTO suppliers (id, company_name, contact_person, phone, email, address, categories, payment_terms, outstanding_balance, notes) VALUES
  ('sup_felicity', 'Felicity Solar Direct Nigeria', 'Mr. Zhang Wei / Biodun', '08031122334', 'sales@felicitysolar-ng.com', 'Plot 14 Commercial Avenue, Ikeja, Lagos', ARRAY['Hybrid inverters', 'Lithium batteries'], '14 Days Net', 0.00, 'Primary supplier for Felicity inverters & batteries.'),
  ('sup_jinko', 'Jinko Solar West Africa Distributors', 'Mrs. Chinyere Okafor', '08029988776', 'orders@jinkowestafrica.com', 'Apapa Port Industrial Area, Lagos', ARRAY['Solar panels'], 'Immediate', 0.00, 'Grade A Tier 1 Bifacial panels.'),
  ('sup_itel', 'Itel Energy Nigeria Official', 'Kazeem Mustapha', '08182233445', 'b2b@itel-energy.ng', 'Computer Village, Ikeja & Ibadan Regional Hub', ARRAY['Itel PowerTank', 'Itel PowerGo', 'Itel PowerGo Pro', 'Itel AIO and all-in-one systems'], '30 Days Net', 0.00, 'Official distributor of Itel energy storage products.'),
  ('sup_cables', 'Havells & Coleman Cable Depot Ibadan', 'Elder Samuel Ajayi', '08055566778', 'sales@ibadancablehub.ng', 'Dugbe Commercial Center, Ibadan, Oyo State', ARRAY['Solar cables', 'Surge protectors and breakers', 'Installation materials'], 'Immediate', 0.00, 'Coleman cables and Schneider breakers.')
ON CONFLICT (id) DO NOTHING;

-- 6. Initial Solar Products (CLEAN ZERO STOCK LEDGER)
INSERT INTO products (
  id, sku, name, brand, category, model, description, unit, purchase_cost,
  retail_price, wholesale_price, installer_price, dealer_price, min_selling_price,
  current_stock, reorder_level, warehouse_location, branch_id, branch_name,
  supplier_id, supplier_name, barcode, specs, status
) VALUES
  ('prod_felicity_5kva', 'INV-FEL-5KVA-48V', 'Felicity Solar 5kVA / 48V IVEM Pure Sine Hybrid Inverter', 'Felicity Solar', 'Hybrid inverters', 'IVEM5048', 'Pure sine wave with built-in 120A MPPT controller.', 'Unit', 480000.00, 580000.00, 535000.00, 520000.00, 510000.00, 495000.00, 0, 5, 'Main Store - Dalute Road', 'br_dalute_main', 'Main Store - Dalute Road', 'sup_felicity', 'Felicity Solar Direct Nigeria', '890123456789', '{"powerRatingKw": 5.0, "voltage": "48V", "mpptCurrentA": 120, "warrantyMonths": 24}'::jsonb, 'active'),
  ('prod_deye_8kw', 'INV-DEYE-8KW-48V', 'Deye 8kW / 48V Single Phase Hybrid Solar Inverter', 'Deye', 'Hybrid inverters', 'SUN-8K-SG01LP1-EU', 'Dual MPPT with smart load port, parallel capability.', 'Unit', 1250000.00, 1480000.00, 1390000.00, 1360000.00, 1340000.00, 1300000.00, 0, 3, 'Showroom - Tipper Garage, Ibadan', 'br_tipper_hq', 'Showroom - Tipper Garage (HQ)', 'sup_felicity', 'Felicity Solar Direct Nigeria', '890123456790', '{"powerRatingKw": 8.0, "voltage": "48V", "warrantyMonths": 60}'::jsonb, 'active'),
  ('prod_felicity_10kwh', 'BAT-FEL-10KWH-48V', 'Felicity 10.24kWh / 48V 200Ah Wall-Mount LiFePO4 Battery Bank', 'Felicity Solar', 'Lithium batteries', 'FL-LPBF48200-H', 'Grade-A prismatic lithium iron phosphate cells, smart BMS.', 'Unit', 1680000.00, 1980000.00, 1860000.00, 1820000.00, 1790000.00, 1730000.00, 0, 4, 'Main Store - Dalute Road', 'br_dalute_main', 'Main Store - Dalute Road', 'sup_felicity', 'Felicity Solar Direct Nigeria', '890123456791', '{"batteryCapacityKwh": 10.24, "voltage": "48V", "chemistry": "LiFePO4", "warrantyMonths": 60}'::jsonb, 'active'),
  ('prod_jinko_550w', 'PV-JK-550W-BIFAC', 'Jinko 550W N-Type Tiger Neo Bifacial Solar Panel', 'Jinko Solar', 'Solar panels', 'JKM550N-72HL4-BDVP', 'High efficiency 22.3%, double glass bifacial generation.', 'Unit', 78000.00, 95000.00, 88000.00, 86000.00, 84000.00, 82000.00, 0, 25, 'Warehouse 2 - Iwo Road Depot', 'br_iwo_depot', 'Warehouse 2 - Iwo Road Depot', 'sup_jinko', 'Jinko Solar West Africa Distributors', '693748291048', '{"panelWattageW": 550, "voltage": "42V", "warrantyMonths": 144}'::jsonb, 'active'),
  ('prod_itel_powertank', 'PPS-ITEL-PT1000', 'Itel PowerTank 1000Wh Portable Power Station', 'Itel', 'Itel PowerTank', 'IP-1000W', '1000W continuous output, 1000Wh LiFePO4 battery.', 'Unit', 410000.00, 510000.00, 475000.00, 460000.00, 450000.00, 435000.00, 0, 3, 'Showroom - Tipper Garage, Ibadan', 'br_tipper_hq', 'Showroom - Tipper Garage (HQ)', 'sup_itel', 'Itel Energy Nigeria Official', '489448930192', '{"powerRatingKw": 1.0, "batteryCapacityKwh": 1.0, "chemistry": "LiFePO4", "warrantyMonths": 24}'::jsonb, 'active'),
  ('prod_cable_6mm', 'CAB-DC-6MM-RED', 'Coleman 6mm² Double Insulated Pure Copper DC Solar Cable (100m Roll)', 'Coleman', 'Solar cables', 'PV1-F 1X6.0', 'TUV certified UV-resistant 1500V DC rated cable.', 'Roll', 52000.00, 68000.00, 62000.00, 59000.00, 57000.00, 55000.00, 0, 15, 'Main Store - Dalute Road', 'br_dalute_main', 'Main Store - Dalute Road', 'sup_cables', 'Havells & Coleman Cable Depot Ibadan', '789201948291', '{"warrantyMonths": 120}'::jsonb, 'active'),
  ('prod_mount_rail', 'MNT-ALU-PITCH-4P', 'Anodized Aluminum 4-Panel Pitched Roof Rail Mounting Kit', 'Offnot Solar Hardware', 'Mounting accessories', 'ALU-4P-PITCHED', 'Corrosion-proof AL6005-T5 rail set with SUS304 bolts.', 'Set', 28000.00, 42000.00, 36000.00, 34000.00, 32000.00, 30000.00, 0, 8, 'Warehouse 2 - Iwo Road Depot', 'br_iwo_depot', 'Warehouse 2 - Iwo Road Depot', 'sup_cables', 'Havells & Coleman Cable Depot Ibadan', '782910482911', '{}'::jsonb, 'active'),
  ('prod_tubular_220ah', 'BAT-TUB-220AH-12V', 'Luminous 220Ah / 12V Tall Tubular Deep Cycle Solar Battery', 'Luminous', 'Tubular batteries', 'TX220', 'Heavy duty alloy grids with porous spine tubes.', 'Unit', 245000.00, 295000.00, 278000.00, 270000.00, 265000.00, 255000.00, 0, 6, 'Main Store - Dalute Road', 'br_dalute_main', 'Main Store - Dalute Road', 'sup_felicity', 'Felicity Solar Direct Nigeria', '890123984719', '{"voltage": "12V", "chemistry": "Tubular Gel", "warrantyMonths": 18}'::jsonb, 'active')
ON CONFLICT (id) DO NOTHING;
