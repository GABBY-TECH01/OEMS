-- =====================================================================
-- OFFNOT ENERGY MANAGEMENT SYSTEM - SUPABASE INCREMENTAL HANDSHAKE PATCH
-- File: 06_incremental_handshake_patch.sql
-- Description: Incremental migration for live two-way sync, cross-device
--              handshake, and ensuring public Anon Key access policies.
-- Target: Supabase SQL Editor
-- Location: Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria
-- =====================================================================

-- Step 1: Ensure All 16 Tables Have RLS Enabled & Accessible to Anon Public Key
-- This allows both authenticated and anon client calls to query & update store records
-- across laptop, mobile (Android), and Vercel deployments.

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'branches',
    'user_profiles',
    'categories',
    'suppliers',
    'products',
    'stock_movements',
    'customers',
    'purchase_orders',
    'sales',
    'payments',
    'quotations',
    'installation_projects',
    'expenses',
    'audit_logs',
    'app_notifications',
    'company_settings'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY;', tbl);

    -- Drop existing permissive policy if exists to avoid duplication
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon public full access" ON %I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon read access" ON %I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated full access" ON %I;', tbl);

    -- Create unified policy for client access
    EXECUTE format(
      'CREATE POLICY "Allow anon public full access" ON %I FOR ALL USING (true) WITH CHECK (true);',
      tbl
    );
  END LOOP;
END $$;

-- Step 2: Grant Permissions to Anon and Authenticated Roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Step 3: Verification & Health Check Function
CREATE OR REPLACE FUNCTION check_oems_handshake()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_branches_count int;
  v_products_count int;
  v_users_count int;
  v_sales_count int;
  v_res json;
BEGIN
  SELECT count(*) INTO v_branches_count FROM branches;
  SELECT count(*) INTO v_products_count FROM products;
  SELECT count(*) INTO v_users_count FROM user_profiles;
  SELECT count(*) INTO v_sales_count FROM sales;

  v_res := json_build_object(
    'status', 'ACTIVE_CONNECTED',
    'timestamp', timezone('utc', now()),
    'branches_count', v_branches_count,
    'products_count', v_products_count,
    'users_count', v_users_count,
    'sales_count', v_sales_count,
    'message', 'Supabase PostgreSQL OEMS Handshake is active and healthy.'
  );

  RETURN v_res;
END;
$$;

-- Run Health Check
SELECT check_oems_handshake();
