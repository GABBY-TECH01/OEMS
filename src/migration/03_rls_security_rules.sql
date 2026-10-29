-- =====================================================================
-- OFFNOT ENERGY MANAGEMENT SYSTEM - SUPABASE POSTGRESQL MIGRATION
-- File: 03_rls_security_rules.sql
-- Description: Supabase Row Level Security (RLS) Policies & RBAC Authorization
-- Target Platform: Supabase / PostgreSQL 15+
-- =====================================================================

-- =====================================================================
-- 1. HELPER FUNCTION TO GET CURRENT USER'S ROLE
-- =====================================================================

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
  v_role user_role;
BEGIN
  -- Look up role from user_profiles matching Supabase auth.uid()
  SELECT role INTO v_role
  FROM user_profiles
  WHERE auth_id = auth.uid() OR id = auth.uid()
  LIMIT 1;

  -- Default to 'sales_rep' if authenticated but unmapped, or return NULL
  RETURN COALESCE(v_role, 'sales_rep'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================================

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
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

-- =====================================================================
-- 3. POLICIES: COMPANY SETTINGS & WAREHOUSES
-- =====================================================================

-- Everyone authenticated can read company settings & warehouses
CREATE POLICY "Allow read company settings to all authenticated"
ON company_settings FOR SELECT
TO authenticated
USING (true);

-- Only Super Admin and CEO can update company settings
CREATE POLICY "Allow update company settings to admin"
ON company_settings FOR UPDATE
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'ceo'))
WITH CHECK (get_current_user_role() IN ('super_admin', 'ceo'));

CREATE POLICY "Allow read warehouses to all authenticated"
ON warehouses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow manage warehouses to admin and manager"
ON warehouses FOR ALL
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'manager'));

-- =====================================================================
-- 4. POLICIES: PRODUCTS & CATEGORIES
-- =====================================================================

-- All authenticated users can view product catalog
CREATE POLICY "Allow view products to all authenticated"
ON products FOR SELECT
TO authenticated
USING (true);

-- Super admin, manager, and inventory officer can insert/update products
CREATE POLICY "Allow manage products to inventory managers"
ON products FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() IN ('super_admin', 'manager', 'inventory_officer'));

CREATE POLICY "Allow update products to inventory managers"
ON products FOR UPDATE
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'manager', 'inventory_officer'))
WITH CHECK (get_current_user_role() IN ('super_admin', 'manager', 'inventory_officer'));

CREATE POLICY "Allow view categories to all authenticated"
ON categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow manage categories to admin and manager"
ON categories FOR ALL
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'manager'));

-- =====================================================================
-- 5. POLICIES: STOCK MOVEMENTS (IMMUTABLE LEDGER)
-- =====================================================================

-- Users can read stock ledger if authorized
CREATE POLICY "Allow view stock ledger to authorized staff"
ON stock_movements FOR SELECT
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'ceo', 'manager', 'inventory_officer', 'accountant'));

-- Insert allowed via stored functions or inventory officers
CREATE POLICY "Allow append stock movements"
ON stock_movements FOR INSERT
TO authenticated
WITH CHECK (true);

-- Prohibit UPDATE and DELETE on stock movements (immutable audit trail)
-- No update or delete policies created = disallowed by default.

-- =====================================================================
-- 6. POLICIES: SALES ORDERS & PAYMENTS
-- =====================================================================

-- Sales reps, managers, accountants, CEO, super admin can view sales
CREATE POLICY "Allow view sales"
ON sales FOR SELECT
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'ceo', 'manager', 'sales_rep', 'accountant'));

-- Sales reps, managers, super admin can create sales
CREATE POLICY "Allow create sales"
ON sales FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() IN ('super_admin', 'manager', 'sales_rep', 'accountant'));

-- Only super admin and managers can update/refund completed sales
CREATE POLICY "Allow update sales to managers"
ON sales FOR UPDATE
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'manager'))
WITH CHECK (get_current_user_role() IN ('super_admin', 'manager'));

-- Payments
CREATE POLICY "Allow view payments"
ON payments FOR SELECT
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'ceo', 'manager', 'accountant', 'sales_rep'));

CREATE POLICY "Allow insert payments"
ON payments FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() IN ('super_admin', 'manager', 'accountant', 'sales_rep'));

-- =====================================================================
-- 7. POLICIES: CUSTOMERS & INSTALLERS (CRM)
-- =====================================================================

CREATE POLICY "Allow view customers to all authenticated"
ON customers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert customers to sales, managers, admin"
ON customers FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() IN ('super_admin', 'manager', 'sales_rep', 'accountant'));

CREATE POLICY "Allow update customers to sales, managers, admin"
ON customers FOR UPDATE
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'manager', 'sales_rep', 'accountant'))
WITH CHECK (get_current_user_role() IN ('super_admin', 'manager', 'sales_rep', 'accountant'));

-- =====================================================================
-- 8. POLICIES: PURCHASING & SUPPLIERS
-- =====================================================================

CREATE POLICY "Allow view suppliers to authorized staff"
ON suppliers FOR SELECT
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'ceo', 'manager', 'inventory_officer', 'accountant'));

CREATE POLICY "Allow manage suppliers to manager and admin"
ON suppliers FOR ALL
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'manager'));

CREATE POLICY "Allow view purchase orders"
ON purchase_orders FOR SELECT
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'ceo', 'manager', 'inventory_officer', 'accountant'));

CREATE POLICY "Allow create purchase orders"
ON purchase_orders FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() IN ('super_admin', 'manager', 'inventory_officer'));

CREATE POLICY "Allow update purchase orders"
ON purchase_orders FOR UPDATE
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'manager', 'inventory_officer'))
WITH CHECK (get_current_user_role() IN ('super_admin', 'manager', 'inventory_officer'));

-- =====================================================================
-- 9. POLICIES: SOLAR INSTALLATION PROJECTS
-- =====================================================================

CREATE POLICY "Allow view projects to staff"
ON installation_projects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow manage projects to technical staff and managers"
ON installation_projects FOR ALL
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'manager', 'technical_staff'));

-- =====================================================================
-- 10. POLICIES: EXPENSES & FINANCIALS
-- =====================================================================

CREATE POLICY "Allow view expenses to authorized roles"
ON expenses FOR SELECT
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'ceo', 'manager', 'accountant'));

CREATE POLICY "Allow create expenses to accountant, manager, admin"
ON expenses FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() IN ('super_admin', 'ceo', 'manager', 'accountant'));

-- =====================================================================
-- 11. POLICIES: AUDIT LOGS
-- =====================================================================

CREATE POLICY "Allow view audit logs to executives"
ON audit_logs FOR SELECT
TO authenticated
USING (get_current_user_role() IN ('super_admin', 'ceo', 'manager'));

CREATE POLICY "Allow append audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- No UPDATE or DELETE policy on audit_logs (Strict immutability)
