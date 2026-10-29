-- =====================================================================
-- OFFNOT ENERGY MANAGEMENT SYSTEM - MASTER SUPABASE SQL SCRIPT
-- File: 05_complete_migration_single_file.sql
-- Description: Complete All-in-One SQL Migration for Supabase SQL Editor
-- Instructions: Copy and paste this entire script into your Supabase SQL Editor and click RUN.
-- Target: Supabase / PostgreSQL 15+
-- Location: Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria
-- Currency: Nigerian Naira (₦ / NGN)
-- =====================================================================

-- Step 1: Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Types & Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'ceo', 'manager', 'inventory_officer', 'sales_rep', 'accountant', 'technical_staff');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE pricing_tier AS ENUM ('retail', 'wholesale', 'installer', 'dealer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE stock_movement_type AS ENUM ('opening_stock', 'goods_received', 'sale', 'customer_return', 'supplier_return', 'project_issue', 'project_return', 'adjustment_positive', 'adjustment_negative', 'damaged', 'stocktaking');
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
  CREATE TYPE customer_type AS ENUM ('retail', 'homeowner', 'business', 'school', 'church', 'hospital', 'solar_installer', 'electrician', 'dealer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE lead_stage AS ENUM ('new_lead', 'contacted', 'qualified', 'site_survey', 'quotation_sent', 'negotiation', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE quotation_status AS ENUM ('draft', 'pending_approval', 'sent', 'accepted', 'rejected', 'expired', 'converted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('lead', 'site_survey', 'quotation', 'approved', 'scheduled', 'in_progress', 'testing', 'completed', 'on_hold', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Step 3: Tables
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

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
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
  categories TEXT[],
  payment_terms VARCHAR(100) DEFAULT 'Immediate',
  outstanding_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

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
  purchase_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_cost >= 0),
  retail_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (retail_price >= 0),
  wholesale_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (wholesale_price >= 0),
  installer_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (installer_price >= 0),
  dealer_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (dealer_price >= 0),
  min_selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (min_selling_price >= 0),
  current_stock INT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  reorder_level INT NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
  warehouse_location VARCHAR(255) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name VARCHAR(255),
  barcode VARCHAR(100) UNIQUE,
  track_serial_numbers BOOLEAN NOT NULL DEFAULT FALSE,
  serial_numbers TEXT[] DEFAULT '{}',
  specs JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  type stock_movement_type NOT NULL,
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  reference_id VARCHAR(100) NOT NULL,
  warehouse_location VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  performed_by_user_id UUID,
  performed_by_user_name VARCHAR(255) NOT NULL,
  approved_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

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
  installer_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

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

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_tier pricing_tier NOT NULL DEFAULT 'retail',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  discount_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  balance_due NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_stock_movements_time ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_po_number ON purchase_orders(po_number);

-- Seed Essential Company Info
INSERT INTO company_settings (
  company_name, slogan, location, phone, email, currency_symbol, currency_code
) VALUES (
  'Offnot Energy',
  'Clean Energy, Stronger Tomorrow',
  'Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria',
  '07047053453',
  'offnotenergy@gmail.com',
  '₦',
  'NGN'
) ON CONFLICT DO NOTHING;

-- Seed Warehouses
INSERT INTO warehouses (name, location_address) VALUES
  ('Main Store - Dalute Road', 'Tipper Garage, Dalute Road, Ibadan'),
  ('Showroom - Tipper Garage, Ibadan', 'Frontage Showroom, Tipper Garage, Ibadan'),
  ('Warehouse 2 - Iwo Road Depot', 'Iwo Road Industrial Logistics Depot, Ibadan')
ON CONFLICT (name) DO NOTHING;

-- Seed Categories
INSERT INTO categories (name, display_order) VALUES
  ('Hybrid inverters', 1),
  ('Solar panels', 2),
  ('Lithium batteries', 3),
  ('Tubular batteries', 4),
  ('Dry-cell batteries', 5),
  ('Portable power stations', 6),
  ('Itel PowerTank', 7),
  ('Itel PowerGo', 8),
  ('Itel PowerGo Pro', 9),
  ('Itel AIO and all-in-one systems', 10),
  ('Solar cables', 11),
  ('Surge protectors and breakers', 12),
  ('Mounting accessories', 13),
  ('Installation materials', 14),
  ('Other solar accessories', 15)
ON CONFLICT (name) DO NOTHING;
