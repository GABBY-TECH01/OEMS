-- =====================================================================
-- 07_kpi_and_auth_patch.sql
-- Offnot Energy Business Management System (Ibadan, Oyo State, Nigeria)
-- Permanent KPI Management & Staff Authentication Enhancement Patch
-- =====================================================================

-- Step 1: Ensure user_profiles table has temporary_password and auth columns
ALTER TABLE IF EXISTS user_profiles 
  ADD COLUMN IF NOT EXISTS temporary_password VARCHAR(255),
  ADD COLUMN IF NOT EXISTS has_full_system_access BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS can_access_all_branches BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- Step 2: Create Staff KPIs Table
CREATE TABLE IF NOT EXISTS staff_kpis (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  staff_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  staff_name VARCHAR(255) NOT NULL,
  staff_role VARCHAR(50) NOT NULL,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  branch_name VARCHAR(255),
  period VARCHAR(50) NOT NULL, -- e.g. 'November 2026', '2026-Q4'
  
  -- Target Metrics (Currency in ₦ NGN)
  monthly_sales_target NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  actual_sales_achieved NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  gross_profit_target NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  actual_gross_profit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  
  -- Operational Targets
  quotations_target INT NOT NULL DEFAULT 0,
  quotations_created INT NOT NULL DEFAULT 0,
  quotations_converted INT NOT NULL DEFAULT 0,
  stock_audit_accuracy_percent NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
  installations_target INT NOT NULL DEFAULT 0,
  installations_completed INT NOT NULL DEFAULT 0,
  customer_satisfaction_score NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  attendance_punctuality_percent NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
  
  -- Assessment & Governance
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'completed', 'exceeded')),
  self_assessment_notes TEXT DEFAULT '',
  manager_review_notes TEXT DEFAULT '',
  performance_rating VARCHAR(50) NOT NULL DEFAULT 'Pending',
  
  last_updated_by_staff_at TIMESTAMPTZ,
  last_reviewed_by_manager_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Step 3: Create KPI Daily Activity Logs Table
CREATE TABLE IF NOT EXISTS kpi_daily_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  kpi_id TEXT NOT NULL REFERENCES staff_kpis(id) ON DELETE CASCADE,
  staff_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activities_completed TEXT NOT NULL,
  items_handled INT NOT NULL DEFAULT 0,
  revenue_generated NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  challenges_or_blockers TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Step 4: Performance Indexes
CREATE INDEX IF NOT EXISTS idx_staff_kpis_staff_id ON staff_kpis(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_kpis_period ON staff_kpis(period);
CREATE INDEX IF NOT EXISTS idx_staff_kpis_branch_id ON staff_kpis(branch_id);
CREATE INDEX IF NOT EXISTS idx_kpi_daily_logs_kpi_id ON kpi_daily_logs(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_daily_logs_staff_id ON kpi_daily_logs(staff_id);

-- Step 5: Enable Row Level Security (RLS)
ALTER TABLE staff_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_daily_logs ENABLE ROW LEVEL SECURITY;

-- Step 6: Public Access Policies for seamless two-way app synchronization
DROP POLICY IF EXISTS "Public access staff_kpis" ON staff_kpis;
CREATE POLICY "Public access staff_kpis"
  ON staff_kpis FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public access kpi_daily_logs" ON kpi_daily_logs;
CREATE POLICY "Public access kpi_daily_logs"
  ON kpi_daily_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 7: Grant permissions to anon and authenticated roles
GRANT ALL ON staff_kpis TO anon, authenticated, service_role;
GRANT ALL ON kpi_daily_logs TO anon, authenticated, service_role;

-- Step 8: Ensure Francis Gabriel Superadmin password in user_profiles
UPDATE user_profiles
SET temporary_password = COALESCE(temporary_password, 'SuperAdmin2026!'),
    updated_at = timezone('utc', now())
WHERE role = 'super_admin' OR email = 'francisgabriel932@gmail.com';
