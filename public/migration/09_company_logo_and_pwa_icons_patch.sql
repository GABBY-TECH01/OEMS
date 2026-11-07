-- =====================================================================
-- 09_company_logo_and_pwa_icons_patch.sql
-- Offnot Energy Business Management System (Ibadan, Oyo State, Nigeria)
-- Superadmin Company Logo & Dynamic PWA Manifest Branding Patch
-- =====================================================================

-- =====================================================================
-- SECTION A: PostgreSQL / Supabase SQL Execution
-- =====================================================================

-- Ensure company_settings has the logo and PWA branding columns
ALTER TABLE IF EXISTS company_settings
  ADD COLUMN IF NOT EXISTS pwa_logo_url TEXT DEFAULT '/pwa-512x512.png',
  ADD COLUMN IF NOT EXISTS pwa_app_title VARCHAR(255) DEFAULT 'Offnot Energy Management System',
  ADD COLUMN IF NOT EXISTS pwa_short_name VARCHAR(50) DEFAULT 'OffnotEnergy',
  ADD COLUMN IF NOT EXISTS pwa_theme_color VARCHAR(50) DEFAULT '#064e3b',
  ADD COLUMN IF NOT EXISTS pwa_background_color VARCHAR(50) DEFAULT '#0f172a',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- Update the primary configuration row with company logo & PWA branding
UPDATE company_settings
SET 
  pwa_logo_url = COALESCE(pwa_logo_url, '/pwa-512x512.png'),
  pwa_app_title = 'Offnot Energy Management System',
  pwa_short_name = 'OffnotEnergy',
  pwa_theme_color = '#064e3b',
  pwa_background_color = '#0f172a',
  updated_at = timezone('utc', now())
WHERE id = 'cfg_offnot_main';

-- Create company-assets storage bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access to company assets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Public Access to company-assets'
  ) THEN
    CREATE POLICY "Public Access to company-assets"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'company-assets');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Allow upload to company-assets'
  ) THEN
    CREATE POLICY "Allow upload to company-assets"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'company-assets');
  END IF;
END $$;

-- Verify updated logo and PWA identity
SELECT id, company_name, pwa_logo_url, pwa_app_title, pwa_short_name, updated_at 
FROM company_settings;

-- =====================================================================
-- SECTION B: Pure MySQL Compatible SQL Equivalent
-- =====================================================================
-- If executing in a traditional MySQL 8.0+ / MariaDB RDBMS database:
/*
UPDATE company_settings 
SET 
  pwa_logo_url = '/pwa-512x512.png',
  pwa_app_title = 'Offnot Energy Management System',
  pwa_short_name = 'OffnotEnergy',
  pwa_theme_color = '#064e3b',
  pwa_background_color = '#0f172a',
  updated_at = NOW()
WHERE id = 'cfg_offnot_main';
*/
