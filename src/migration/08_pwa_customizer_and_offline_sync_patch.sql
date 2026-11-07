-- =====================================================================
-- 08_pwa_customizer_and_offline_sync_patch.sql
-- Offnot Energy Business Management System (Ibadan, Oyo State, Nigeria)
-- PWA Dynamic Admin Customization, Branding & Offline Sync Patch
-- =====================================================================

-- Step 1: Add PWA branding & pop-up customization columns to company_settings
ALTER TABLE IF EXISTS company_settings
  ADD COLUMN IF NOT EXISTS pwa_app_title VARCHAR(255) DEFAULT 'Offnot Energy Management System',
  ADD COLUMN IF NOT EXISTS pwa_short_name VARCHAR(50) DEFAULT 'OffnotEnergy',
  ADD COLUMN IF NOT EXISTS pwa_logo_url TEXT DEFAULT '/pwa-512x512.png',
  ADD COLUMN IF NOT EXISTS pwa_theme_color VARCHAR(50) DEFAULT '#064e3b',
  ADD COLUMN IF NOT EXISTS pwa_background_color VARCHAR(50) DEFAULT '#0f172a',
  ADD COLUMN IF NOT EXISTS enable_pwa_prompt BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS pwa_prompt_delay_seconds INT DEFAULT 2,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- Step 2: Ensure Row Level Security (RLS) allows reading & updating PWA settings
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_settings' AND policyname = 'Allow public read access on company_settings'
  ) THEN
    CREATE POLICY "Allow public read access on company_settings"
      ON company_settings FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_settings' AND policyname = 'Allow write access on company_settings'
  ) THEN
    CREATE POLICY "Allow write access on company_settings"
      ON company_settings FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Step 3: Upsert the default official PWA configuration row if missing
INSERT INTO company_settings (
  id,
  company_name,
  slogan,
  location,
  phone,
  email,
  currency_symbol,
  currency_code,
  default_vat_rate,
  enable_tax_by_default,
  min_gross_margin_percent,
  receipt_footer_message,
  pwa_app_title,
  pwa_short_name,
  pwa_logo_url,
  pwa_theme_color,
  pwa_background_color,
  enable_pwa_prompt,
  pwa_prompt_delay_seconds,
  updated_at
)
VALUES (
  'cfg_offnot_main',
  'Offnot Energy',
  'Clean Energy, Stronger Tomorrow',
  'Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria',
  '07047053453',
  'offnotenergy@gmail.com',
  '₦',
  'NGN',
  7.5,
  false,
  12,
  'Thank you for choosing Offnot Energy! Clean Energy, Stronger Tomorrow. Official stamped receipt.',
  'Offnot Energy Management System',
  'OffnotEnergy',
  '/pwa-512x512.png',
  '#064e3b',
  '#0f172a',
  true,
  2,
  timezone('utc', now())
)
ON CONFLICT (id) DO UPDATE SET
  pwa_app_title = EXCLUDED.pwa_app_title,
  pwa_short_name = EXCLUDED.pwa_short_name,
  pwa_logo_url = EXCLUDED.pwa_logo_url,
  pwa_theme_color = EXCLUDED.pwa_theme_color,
  pwa_background_color = EXCLUDED.pwa_background_color,
  enable_pwa_prompt = EXCLUDED.enable_pwa_prompt,
  pwa_prompt_delay_seconds = EXCLUDED.pwa_prompt_delay_seconds,
  updated_at = timezone('utc', now());

-- Verification
SELECT id, company_name, pwa_app_title, pwa_short_name, pwa_logo_url, enable_pwa_prompt 
FROM company_settings;
