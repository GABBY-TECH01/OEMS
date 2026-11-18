-- =====================================================================
-- 10_golive_catalog_contacts_refunds_patch.sql
-- Offnot Energy Business Management System (Ibadan, Oyo State, Nigeria)
-- Go-Live Patch: Official Contacts, Dugbe HQ & Dalute Branch,
-- 36-SKU Official Price List, Refund Audit Columns & Realtime Sync
-- =====================================================================

-- 1. Extend sales table with item-level refund tracking columns
ALTER TABLE IF EXISTS sales
  ADD COLUMN IF NOT EXISTS original_grand_total NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS refunded_by_user_id TEXT,
  ADD COLUMN IF NOT EXISTS return_records JSONB DEFAULT '[]'::jsonb;

-- Backfill original_grand_total for existing sales rows if 0
UPDATE sales
SET original_grand_total = COALESCE(NULLIF(original_grand_total, 0), grand_total)
WHERE original_grand_total IS NULL OR original_grand_total = 0;

-- 2. Extend company_settings with dual-office addresses, direct lines, socials, warehouses & RBAC map
ALTER TABLE IF EXISTS company_settings
  ADD COLUMN IF NOT EXISTS head_office_address TEXT DEFAULT 'Opposite Sweetco, Dugbe Iyaganku Road, Ibadan',
  ADD COLUMN IF NOT EXISTS branch_office_address TEXT DEFAULT 'Inside Tipper Garage, Dalute Road, Ibadan',
  ADD COLUMN IF NOT EXISTS dugbe_phone VARCHAR(50) DEFAULT '07064159047',
  ADD COLUMN IF NOT EXISTS dalute_phone VARCHAR(50) DEFAULT '08087928125',
  ADD COLUMN IF NOT EXISTS customer_service_phone VARCHAR(50) DEFAULT '07047053453',
  ADD COLUMN IF NOT EXISTS facebook_handle VARCHAR(100) DEFAULT 'Offnot Energy',
  ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(100) DEFAULT 'offnot.energy',
  ADD COLUMN IF NOT EXISTS tiktok_handle VARCHAR(100) DEFAULT 'offnot Energy',
  ADD COLUMN IF NOT EXISTS warehouses JSONB DEFAULT '["Head Office - Dugbe Iyaganku Road, Ibadan","Branch Store - Inside Tipper Garage, Dalute Road, Ibadan"]'::jsonb,
  ADD COLUMN IF NOT EXISTS role_permissions JSONB;

-- 3. Upsert Official Company Settings (Contacts, Addresses & Socials)
INSERT INTO company_settings (
  id,
  company_name,
  slogan,
  location,
  phone,
  email,
  head_office_address,
  branch_office_address,
  dugbe_phone,
  dalute_phone,
  customer_service_phone,
  facebook_handle,
  instagram_handle,
  tiktok_handle,
  warehouses,
  receipt_footer_message,
  updated_at
)
VALUES (
  'cfg_offnot_main',
  'Offnot Energy',
  'Clean Energy, Stronger Tomorrow',
  'Opposite Sweetco, Dugbe Iyaganku Road, Ibadan, Oyo State, Nigeria',
  '07047053453',
  'offnotenergy@gmail.com',
  'Opposite Sweetco, Dugbe Iyaganku Road, Ibadan',
  'Inside Tipper Garage, Dalute Road, Ibadan',
  '07064159047',
  '08087928125',
  '07047053453',
  'Offnot Energy',
  'offnot.energy',
  'offnot Energy',
  '["Head Office - Dugbe Iyaganku Road, Ibadan","Branch Store - Inside Tipper Garage, Dalute Road, Ibadan"]'::jsonb,
  'Thank you for choosing Offnot Energy! Clean Energy, Stronger Tomorrow. Official stamped receipt.',
  timezone('utc', now())
)
ON CONFLICT (id) DO UPDATE SET
  location = EXCLUDED.location,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  head_office_address = EXCLUDED.head_office_address,
  branch_office_address = EXCLUDED.branch_office_address,
  dugbe_phone = EXCLUDED.dugbe_phone,
  dalute_phone = EXCLUDED.dalute_phone,
  customer_service_phone = EXCLUDED.customer_service_phone,
  facebook_handle = EXCLUDED.facebook_handle,
  instagram_handle = EXCLUDED.instagram_handle,
  tiktok_handle = EXCLUDED.tiktok_handle,
  warehouses = EXCLUDED.warehouses,
  updated_at = timezone('utc', now());

-- 4. Upsert Official Branches (Dugbe HQ & Dalute Road Branch)
INSERT INTO branches (id, name, code, city, state, address, phone, email, manager_name, is_headquarters, is_active)
VALUES
  (
    'br_tipper_hq',
    'Head Office - Dugbe (Opposite Sweetco)',
    'BR-IBD-01',
    'Ibadan',
    'Oyo State',
    'Opposite Sweetco, Dugbe Iyaganku Road, Ibadan',
    '07064159047',
    'offnotenergy@gmail.com',
    'Gabriel Francis',
    TRUE,
    TRUE
  ),
  (
    'br_dalute_main',
    'Branch Office - Dalute Road (Tipper Garage)',
    'BR-IBD-02',
    'Ibadan',
    'Oyo State',
    'Inside Tipper Garage, Dalute Road, Ibadan',
    '08087928125',
    'offnotenergy@gmail.com',
    'Bolanle Oladipo',
    FALSE,
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  is_headquarters = EXCLUDED.is_headquarters,
  is_active = EXCLUDED.is_active;

-- Deactivate any legacy placeholder branch if it exists
UPDATE branches SET is_active = FALSE WHERE id = 'br_iwo_road';

-- 5. Upsert Official Categories
INSERT INTO categories (id, name, display_order) VALUES
  ('cat_1', 'Itel All In One', 1),
  ('cat_2', 'Itel Inverter', 2),
  ('cat_3', 'Itel Battery', 3),
  ('cat_4', 'Tubular Batteries', 4),
  ('cat_5', 'Invertek Hybrid', 5),
  ('cat_6', 'Solar Panels', 6),
  ('cat_7', 'Cables', 7),
  ('cat_8', 'Breaker Box', 8),
  ('cat_9', 'Protecting Devices', 9),
  ('cat_10', 'Installation Accessories', 10),
  ('cat_11', 'Other Solar Accessories', 11)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

-- 6. Upsert Official Suppliers
INSERT INTO suppliers (id, company_name, contact_person, phone, email, address, categories, payment_terms)
VALUES
  ('sup_itel', 'Itel Energy Nigeria Official', 'Kazeem Mustapha', '08182233445', 'b2b@itel-energy.ng', 'Computer Village, Ikeja & Ibadan Regional Hub', ARRAY['Itel All In One','Itel Inverter','Itel Battery','Solar Panels'], '30 Days Net'),
  ('sup_felicity', 'Invertek & Powerzen West Africa', 'Mr. Biodun Adewale', '08031122334', 'orders@invertek-solar.ng', 'Plot 14 Commercial Avenue, Ikeja, Lagos', ARRAY['Invertek Hybrid','Tubular Batteries'], '14 Days Net'),
  ('sup_jinko', 'Jinko Solar West Africa Distributors', 'Mrs. Chinyere Okafor', '08029988776', 'orders@jinkowestafrica.com', 'Apapa Port Industrial Area, Lagos', ARRAY['Solar Panels'], 'Immediate'),
  ('sup_cables', 'Havells & Coleman Cable Depot Ibadan', 'Elder Samuel Ajayi', '08055566778', 'sales@ibadancablehub.ng', 'Dugbe Commercial Center, Ibadan, Oyo State', ARRAY['Cables','Breaker Box','Protecting Devices','Installation Accessories'], 'Immediate')
ON CONFLICT (id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  categories = EXCLUDED.categories;

-- 7. Upsert 36 Confirmed Official Price List SKUs (Preserving Existing Stock Quantities!)
INSERT INTO products (
  id, sku, name, brand, category, model, description, unit,
  purchase_cost, retail_price, wholesale_price, installer_price, dealer_price, min_selling_price,
  current_stock, reorder_level, warehouse_location, branch_id, branch_name, supplier_id, supplier_name, barcode, status
)
VALUES
  ('prod_itel_power_go', 'AIO-ITEL-PG', 'Itel POWER GO All-in-One Solar System', 'Itel', 'Itel All In One', 'POWER GO', 'Compact Itel All-in-One portable solar lighting & charging system.', 'Unit', 66500, 81500, 78000, 75600, 73500, 72000, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900101', 'active'),
  ('prod_itel_power_go_pro', 'AIO-ITEL-PG-PRO', 'Itel POWER GO PRO All-in-One Solar System', 'Itel', 'Itel All In One', 'POWER GO PRO', 'Upgraded Itel Power Go Pro all-in-one solar kit for home & shop backup.', 'Unit', 116000, 142500, 136000, 132000, 128000, 125500, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900102', 'active'),
  ('prod_itel_powertank_500', 'AIO-ITEL-PT500', 'ITEL 500W POWERTANK Portable Power Station', 'Itel', 'Itel All In One', '500W POWERTANK', 'Itel 500W PowerTank pure sine wave portable LiFePO4 power station.', 'Unit', 246500, 302500, 288500, 280000, 271500, 266000, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900103', 'active'),
  ('prod_itel_powertank_1000', 'AIO-ITEL-PT1000', 'ITEL 1000W Power tank Portable Power Station', 'Itel', 'Itel All In One', '1000W POWERTANK', 'Itel 1000W PowerTank high-capacity portable solar power station.', 'Unit', 528000, 648000, 618000, 600000, 582000, 570000, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900104', 'active'),

  ('prod_itel_inv_1_5kva', 'INV-ITEL-1.5KVA-12V', 'Itel 1.5KVA / 12V Hybrid Inverter', 'Itel', 'Itel Inverter', '1.5KVA/12V', 'Itel 1.5kVA 12V solar hybrid inverter with built-in MPPT charge controller.', 'Unit', 192000, 235500, 224500, 218000, 211500, 207000, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900201', 'active'),
  ('prod_itel_inv_3kva', 'INV-ITEL-3KVA-24V', 'Itel 3KVA / 24V Hybrid Inverter', 'Itel', 'Itel Inverter', '3KVA/24V', 'Itel 3kVA 24V pure sine wave hybrid solar inverter.', 'Unit', 263000, 323000, 308000, 299000, 290000, 284000, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900202', 'active'),
  ('prod_itel_inv_4kva', 'INV-ITEL-4KVA-24V', 'Itel 4KVA / 24V Hybrid Inverter', 'Itel', 'Itel Inverter', '4KVA/24V', 'Itel 4kVA 24V solar hybrid inverter with smart BMS support.', 'Unit', 333500, 409500, 390500, 379000, 367500, 360000, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900203', 'active'),
  ('prod_itel_inv_6kva', 'INV-ITEL-6KVA-48V', 'Itel 6KVA / 48V Hybrid Inverter', 'Itel', 'Itel Inverter', '6KVA/48V', 'Itel 6kVA 48V heavy-duty hybrid inverter for residential & SME loads.', 'Unit', 449000, 551000, 525500, 510000, 494500, 484500, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900204', 'active'),
  ('prod_itel_inv_8kva', 'INV-ITEL-8KVA-48V', 'Itel 8KVA / 48V Hybrid Inverter', 'Itel', 'Itel Inverter', '8KVA/48V', 'Itel 8kVA 48V dual-MPPT hybrid inverter with Wi-Fi monitoring.', 'Unit', 627500, 770000, 734500, 713000, 691500, 677500, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900205', 'active'),
  ('prod_itel_inv_11kva', 'INV-ITEL-11KVA-48V', 'Itel 11KVA / 48V Hybrid Inverter', 'Itel', 'Itel Inverter', '11KVA/48V', 'Itel 11kVA 48V commercial-grade hybrid inverter.', 'Unit', 807000, 990500, 944500, 917000, 889500, 871000, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900206', 'active'),
  ('prod_itel_inv_12kva', 'INV-ITEL-12KVA-48V', 'Itel 12KVA / 48V Hybrid Inverter', 'Itel', 'Itel Inverter', '12KVA/48V', 'Itel 12kVA 48V flagship commercial hybrid solar inverter.', 'Unit', 871000, 1069000, 1019500, 990000, 960500, 940500, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900207', 'active'),

  ('prod_itel_bat_1_28', 'BAT-ITEL-1.28-100AH', 'Itel 1.28V+100AH Lithium Solar Battery', 'Itel', 'Itel Battery', '1.28KWH-100AH', 'Itel 12.8V 100Ah (1.28kWh) LiFePO4 deep-cycle solar battery.', 'Unit', 185000, 227000, 216500, 210000, 203500, 199500, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900301', 'active'),
  ('prod_itel_bat_2_56', 'BAT-ITEL-2.56KW', 'Itel 2.56KW Lithium Solar Battery', 'Itel', 'Itel Battery', '2.56KW-24V', 'Itel 2.56kWh 24V LiFePO4 solar storage battery with smart BMS.', 'Unit', 481500, 591000, 563500, 547000, 530500, 519500, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900302', 'active'),
  ('prod_itel_bat_5kwh_48v', 'BAT-ITEL-5KWH-48V', 'Itel 5KWH 48V Lithium Solar Battery', 'Itel', 'Itel Battery', '5KWH-48V', 'Itel 5kWh 48V wall/rack-mount LiFePO4 battery bank.', 'Unit', 801000, 983000, 937500, 910000, 882500, 864500, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900303', 'active'),
  ('prod_itel_bat_5kwh_24v', 'BAT-ITEL-5KWH-24V', 'Itel 5KWH 24V Lithium Solar Battery', 'Itel', 'Itel Battery', '5KWH-24V', 'Itel 5kWh 24V high-capacity LiFePO4 battery bank.', 'Unit', 833500, 1023000, 975500, 947000, 918500, 899500, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900304', 'active'),
  ('prod_itel_bat_16kwh_4h', 'BAT-ITEL-16KWH-4H', 'Itel 16KWH 4H Lithium Battery Bank', 'Itel', 'Itel Battery', '16KWH-4H', 'Itel 16kWh 4H floor-standing LiFePO4 energy storage cabinet.', 'Unit', 2033000, 2495000, 2379500, 2310000, 2240500, 2194500, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900305', 'active'),
  ('prod_itel_bat_16kwhy', 'BAT-ITEL-16KWHY', 'Itel 16KWHY Lithium Battery Bank', 'Itel', 'Itel Battery', '16KWHY', 'Itel 16kWh Y-series LiFePO4 high-cycle commercial battery bank.', 'Unit', 2006500, 2462500, 2348500, 2280000, 2211500, 2166000, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900306', 'active'),

  ('prod_powerzen_tubular', 'BAT-PWRZ-TUB-12V', 'Powerzen Tubular Battery', 'Powerzen', 'Tubular Batteries', 'Powerzen-TUB', 'Heavy-duty Powerzen tall tubular deep-cycle solar battery.', 'Unit', 185000, 227000, 216500, 210000, 203500, 199500, 0, 5, 'Branch Store - Inside Tipper Garage, Dalute Road, Ibadan', 'br_dalute_main', 'Branch Office - Dalute Road (Tipper Garage)', 'sup_felicity', 'Invertek & Powerzen West Africa', '489448900401', 'active'),

  ('prod_invertek_1_1kva', 'INV-INVTK-1.1KVA-12V', 'Invertek Wall Mount 1.1KVA / 12V Hybrid Inverter', 'Invertek', 'Invertek Hybrid', 'Wall Mount 1.1kVA/12V', 'Compact Invertek wall-mount 1.1kVA 12V hybrid solar inverter.', 'Unit', 81000, 99500, 95000, 92000, 89000, 87500, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_felicity', 'Invertek & Powerzen West Africa', '489448900501', 'active'),
  ('prod_invertek_1_5kva', 'INV-INVTK-1.5KVA-12V', 'Invertek Wall Mount 1.5KVA / 12V Hybrid Inverter', 'Invertek', 'Invertek Hybrid', 'Wall Mount 1.5kVA/12V', 'Invertek wall-mount 1.5kVA 12V solar hybrid inverter.', 'Unit', 102000, 125500, 119500, 116000, 112500, 110000, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_felicity', 'Invertek & Powerzen West Africa', '489448900502', 'active'),
  ('prod_invertek_2kva', 'INV-INVTK-2KVA-12V', 'Invertek Hybrid 2KVA / 12V Inverter', 'Invertek', 'Invertek Hybrid', 'Hybrid 2kVA/12V', 'Invertek 2kVA 12V hybrid solar inverter.', 'Unit', 192000, 235500, 224500, 218000, 211500, 207000, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_felicity', 'Invertek & Powerzen West Africa', '489448900503', 'active'),
  ('prod_invertek_3kva', 'INV-INVTK-3KVA-24V', 'Invertek Hybrid 3KVA / 24V Inverter', 'Invertek', 'Invertek Hybrid', 'Hybrid 3kVA/24V', 'Invertek 3kVA 24V MPPT hybrid solar inverter.', 'Unit', 254500, 312000, 297500, 289000, 280500, 274500, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_felicity', 'Invertek & Powerzen West Africa', '489448900504', 'active'),
  ('prod_invertek_4_2kva', 'INV-INVTK-4.2KVA-24V', 'Invertek Hybrid 4.2KVA / 24V Inverter', 'Invertek', 'Invertek Hybrid', 'Hybrid 4.2kVA/24V', 'Invertek 4.2kVA 24V high-output hybrid solar inverter.', 'Unit', 320500, 393000, 375000, 364000, 353000, 346000, 0, 5, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_felicity', 'Invertek & Powerzen West Africa', '489448900505', 'active'),

  ('prod_panel_410w', 'PNL-SOLAR-410W', '410W Monocrystalline Solar Panel', 'Offnot Solar', 'Solar Panels', '410W Mono', 'High-efficiency 410W monocrystalline solar PV module.', 'Unit', 83500, 102500, 98000, 95000, 92000, 90500, 0, 15, 'Branch Store - Inside Tipper Garage, Dalute Road, Ibadan', 'br_dalute_main', 'Branch Office - Dalute Road (Tipper Garage)', 'sup_jinko', 'Jinko Solar West Africa Distributors', '489448900601', 'active'),
  ('prod_panel_550w_jinko', 'PNL-JNK-550W', '550W Jinko Solar Panel', 'Jinko Solar', 'Solar Panels', '550W Jinko', 'Jinko 550W Tiger Pro / Neo high-output solar panel.', 'Unit', 105500, 129500, 123500, 120000, 116500, 114000, 0, 20, 'Branch Store - Inside Tipper Garage, Dalute Road, Ibadan', 'br_dalute_main', 'Branch Office - Dalute Road (Tipper Garage)', 'sup_jinko', 'Jinko Solar West Africa Distributors', '489448900602', 'active'),
  ('prod_panel_620w_itel', 'PNL-ITEL-620W', '620W Itel Bifacial Solar Panel', 'Itel', 'Solar Panels', '620W Itel', 'Itel 620W high-wattage N-type bifacial solar panel.', 'Unit', 121500, 149000, 142000, 138000, 134000, 131000, 0, 15, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_itel', 'Itel Energy Nigeria Official', '489448900603', 'active'),

  ('prod_cable_dc_4mm', 'CBL-DC-4MM', 'DC 4mm Solar Cable (per Meter)', 'Coleman / Havells', 'Cables', 'DC 4mm', 'UV-resistant double-insulated 4mm² solar DC PV cable.', 'Meter', 2400, 2900, 2800, 2700, 2600, 2550, 0, 50, 'Branch Store - Inside Tipper Garage, Dalute Road, Ibadan', 'br_dalute_main', 'Branch Office - Dalute Road (Tipper Garage)', 'sup_cables', 'Havells & Coleman Cable Depot Ibadan', '489448900701', 'active'),
  ('prod_cable_dc_6mm', 'CBL-DC-6MM', 'DC 6mm Solar Cable (per Meter)', 'Coleman / Havells', 'Cables', 'DC 6mm', 'UV-resistant double-insulated 6mm² solar DC PV cable.', 'Meter', 3350, 4100, 3900, 3800, 3700, 3600, 0, 50, 'Branch Store - Inside Tipper Garage, Dalute Road, Ibadan', 'br_dalute_main', 'Branch Office - Dalute Road (Tipper Garage)', 'sup_cables', 'Havells & Coleman Cable Depot Ibadan', '489448900702', 'active'),
  ('prod_cable_ac_2_5mm', 'CBL-AC-2.5MM', 'AC 2.5mm Flexible Power Cable (per Meter)', 'Coleman / Havells', 'Cables', 'AC 2.5mm', 'Pure copper 2.5mm² AC distribution cable for inverter wiring.', 'Meter', 550, 650, 600, 600, 600, 550, 0, 50, 'Branch Store - Inside Tipper Garage, Dalute Road, Ibadan', 'br_dalute_main', 'Branch Office - Dalute Road (Tipper Garage)', 'sup_cables', 'Havells & Coleman Cable Depot Ibadan', '489448900703', 'active'),
  ('prod_cable_ac_4mm', 'CBL-AC-4MM', 'AC 4mm Flexible Power Cable (per Meter)', 'Coleman / Havells', 'Cables', 'AC 4mm', 'Pure copper 4mm² AC inverter output cable.', 'Meter', 800, 950, 950, 900, 850, 850, 0, 50, 'Branch Store - Inside Tipper Garage, Dalute Road, Ibadan', 'br_dalute_main', 'Branch Office - Dalute Road (Tipper Garage)', 'sup_cables', 'Havells & Coleman Cable Depot Ibadan', '489448900704', 'active'),
  ('prod_cable_ac_6mm', 'CBL-AC-6MM', 'AC 6mm Heavy-Duty Power Cable (per Meter)', 'Coleman / Havells', 'Cables', 'AC 6mm', 'Pure copper 6mm² heavy-load AC inverter distribution cable.', 'Meter', 1300, 1600, 1550, 1500, 1450, 1450, 0, 50, 'Branch Store - Inside Tipper Garage, Dalute Road, Ibadan', 'br_dalute_main', 'Branch Office - Dalute Road (Tipper Garage)', 'sup_cables', 'Havells & Coleman Cable Depot Ibadan', '489448900705', 'active'),

  ('prod_box_2way', 'BRK-BOX-2WAY', '2-Way DIN Rail Breaker Enclosure Box', 'Offnot Hardware', 'Breaker Box', '2Way box', 'IP65 waterproof 2-way DIN rail distribution enclosure.', 'Unit', 1300, 1600, 1550, 1500, 1450, 1450, 0, 10, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_cables', 'Havells & Coleman Cable Depot Ibadan', '489448900801', 'active'),
  ('prod_box_4way', 'BRK-BOX-4WAY', '4-Way DIN Rail Breaker Enclosure Box', 'Offnot Hardware', 'Breaker Box', '4way box', '4-way DIN rail distribution box for DC/AC breakers and SPDs.', 'Unit', 2650, 3250, 3100, 3000, 2900, 2850, 0, 10, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_cables', 'Havells & Coleman Cable Depot Ibadan', '489448900802', 'active'),
  ('prod_box_6way', 'BRK-BOX-6WAY', '6-Way DIN Rail Breaker Enclosure Box', 'Offnot Hardware', 'Breaker Box', '6way', '6-way DIN rail protection box for solar combiner & AC changeovers.', 'Unit', 3100, 3800, 3600, 3500, 3400, 3350, 0, 10, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_cables', 'Havells & Coleman Cable Depot Ibadan', '489448900803', 'active'),
  ('prod_box_9way', 'BRK-BOX-9WAY', '9-Way DIN Rail Breaker Enclosure Box', 'Offnot Hardware', 'Breaker Box', '9way', '9-way distribution enclosure for hybrid inverter protection gear.', 'Unit', 3950, 4850, 4650, 4500, 4350, 4300, 0, 10, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_cables', 'Havells & Coleman Cable Depot Ibadan', '489448900804', 'active'),
  ('prod_box_13way', 'BRK-BOX-13WAY', '13-Way DIN Rail Breaker Enclosure Box', 'Offnot Hardware', 'Breaker Box', '13way', '13-way multi-string solar combiner and AC protection enclosure.', 'Unit', 4400, 5400, 5150, 5000, 4850, 4750, 0, 10, 'Head Office - Dugbe Iyaganku Road, Ibadan', 'br_tipper_hq', 'Head Office - Dugbe (Opposite Sweetco)', 'sup_cables', 'Havells & Coleman Cable Depot Ibadan', '489448900805', 'active')
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  model = EXCLUDED.model,
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  purchase_cost = EXCLUDED.purchase_cost,
  retail_price = EXCLUDED.retail_price,
  wholesale_price = EXCLUDED.wholesale_price,
  installer_price = EXCLUDED.installer_price,
  dealer_price = EXCLUDED.dealer_price,
  min_selling_price = EXCLUDED.min_selling_price,
  warehouse_location = EXCLUDED.warehouse_location,
  branch_id = EXCLUDED.branch_id,
  branch_name = EXCLUDED.branch_name,
  supplier_id = EXCLUDED.supplier_id,
  supplier_name = EXCLUDED.supplier_name,
  updated_at = timezone('utc', now());

-- 8. Enable Supabase Realtime across all operational tables for instant Mobile <-> Desktop sync
DO $$
DECLARE
  tbl TEXT;
  all_tables TEXT[] := ARRAY[
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
    'company_settings',
    'staff_kpis',
    'kpi_daily_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY all_tables LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_table THEN NULL;
      WHEN insufficient_privilege THEN NULL;
    END;
  END LOOP;
END $$;

-- =====================================================================
-- OPTIONAL GO-LIVE TEST LEDGER RESET (Uncomment ONLY if you want to
-- clear old test sales/invoices & reset current_stock back to 0)
-- =====================================================================
/*
TRUNCATE TABLE payments, stock_movements, sales, purchase_orders, quotations, expenses, audit_logs, app_notifications CASCADE;
UPDATE products SET current_stock = 0;
UPDATE customers SET total_purchases = 0, outstanding_balance = 0;
UPDATE staff_kpis SET actual_sales_achieved = 0, actual_gross_profit = 0, quotations_created = 0, quotations_converted = 0, installations_completed = 0;
*/
