-- =====================================================================
-- OFFNOT ENERGY MANAGEMENT SYSTEM - SUPABASE POSTGRESQL MIGRATION
-- File: 04_seed_data.sql
-- Description: Realistic Initial Business Seed Data for Ibadan Operations
-- Target Platform: Supabase / PostgreSQL 15+
-- =====================================================================

-- 1. Insert Company Settings
INSERT INTO company_settings (
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
  receipt_footer_message
) VALUES (
  'Offnot Energy',
  'Clean Energy, Stronger Tomorrow',
  'Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria',
  '07047053453',
  'offnotenergy@gmail.com',
  '₦',
  'NGN',
  7.50,
  FALSE,
  12.00,
  'Thank you for choosing Offnot Energy! Clean Energy, Stronger Tomorrow. Official warranty valid only with stamped receipt.'
) ON CONFLICT DO NOTHING;

-- 2. Insert Warehouses
INSERT INTO warehouses (name, location_address) VALUES
  ('Main Store - Dalute Road', 'Tipper Garage, Dalute Road, Ibadan'),
  ('Showroom - Tipper Garage, Ibadan', 'Frontage Showroom, Tipper Garage, Ibadan'),
  ('Warehouse 2 - Iwo Road Depot', 'Iwo Road Industrial Logistics Depot, Ibadan')
ON CONFLICT (name) DO NOTHING;

-- 3. Insert Initial Product Categories
INSERT INTO categories (name, description, display_order) VALUES
  ('Hybrid inverters', 'Pure sine wave solar hybrid and grid-tied inverters', 1),
  ('Solar panels', 'Tier-1 Monocrystalline, N-Type and Bifacial PV modules', 2),
  ('Lithium batteries', 'LiFePO4 wall-mount and rack-mount energy storage banks', 3),
  ('Tubular batteries', 'Deep cycle lead-acid and tall tubular solar batteries', 4),
  ('Dry-cell batteries', 'Maintenance-free AGM and VRLA deep cycle batteries', 5),
  ('Portable power stations', 'Mobile generator replacement solar power banks', 6),
  ('Itel PowerTank', 'Itel official 1000W-2000W power stations', 7),
  ('Itel PowerGo', 'Itel official 500W mobile solar generators', 8),
  ('Itel PowerGo Pro', 'Itel professional high-output mobile backup systems', 9),
  ('Itel AIO and all-in-one systems', 'Integrated inverter and lithium battery units', 10),
  ('Solar cables', 'TUV certified tinned copper double insulated DC cables', 11),
  ('Surge protectors and breakers', 'DC breakers, SPDs, changeovers and isolators', 12),
  ('Mounting accessories', 'Anodized aluminum roof rails, mid/end clamps, L-feet', 13),
  ('Installation materials', 'MC4 connectors, heat shrink, earthing rods, conduits', 14),
  ('Other solar accessories', 'Battery cables, lugs, fuses, Wi-Fi dongles', 15)
ON CONFLICT (name) DO NOTHING;

-- 4. Insert Initial Suppliers
INSERT INTO suppliers (id, company_name, contact_person, phone, email, address, categories, payment_terms, outstanding_balance, notes) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'Felicity Solar Direct Nigeria',
    'Mr. Zhang Wei / Biodun',
    '08031122334',
    'sales@felicitysolar-ng.com',
    'Plot 14 Commercial Avenue, Ikeja, Lagos',
    ARRAY['Hybrid inverters', 'Lithium batteries'],
    '14 Days Net',
    0.00,
    'Primary vendor for 5kW/10kW hybrid inverters & wall-mount batteries.'
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'Jinko Solar West Africa Distributors',
    'Mrs. Chinyere Okafor',
    '08029988776',
    'orders@jinkowestafrica.com',
    'Apapa Port Industrial Area, Lagos',
    ARRAY['Solar panels'],
    'Immediate',
    350000.00,
    'Direct distributor for Jinko 550W/600W N-type bifacial panels.'
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'Itel Energy Nigeria Official',
    'Kazeem Mustapha',
    '08182233445',
    'b2b@itel-energy.ng',
    'Computer Village, Ikeja & Ibadan Regional Hub',
    ARRAY['Itel PowerTank', 'Itel PowerGo', 'Itel PowerGo Pro', 'Itel AIO and all-in-one systems'],
    '30 Days Net',
    0.00,
    'Official distributor of Itel energy storage products.'
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'Havells & Coleman Cable Depot Ibadan',
    'Elder Samuel Ajayi',
    '08055566778',
    'sales@ibadancablehub.ng',
    'Dugbe Commercial Center, Ibadan, Oyo State',
    ARRAY['Solar cables', 'Surge protectors and breakers', 'Installation materials'],
    'Immediate',
    0.00,
    'Regional stockist of solar DC pure copper cables and circuit breakers.'
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Initial Products
INSERT INTO products (
  id, sku, name, brand, category_name, model, description, unit,
  purchase_cost, retail_price, wholesale_price, installer_price, dealer_price, min_selling_price,
  current_stock, reorder_level, warehouse_location, supplier_id, supplier_name, barcode,
  track_serial_numbers, specs, status
) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'INV-FEL-5KW-48V',
    'Felicity Solar 5kVA / 5kW 48V Pure Sine Wave Hybrid Inverter',
    'Felicity Solar',
    'Hybrid inverters',
    'IVEM5048',
    'High-voltage MPPT 120A, parallel capable up to 6 units, dual AC outputs, Wi-Fi monitoring.',
    'Unit',
    620000.00, 750000.00, 700000.00, 685000.00, 670000.00, 650000.00,
    14, 4, 'Main Store - Dalute Road',
    'a0000000-0000-0000-0000-000000000001', 'Felicity Solar Direct Nigeria', '694857201948',
    TRUE, '{"powerRatingKw": 5.0, "voltage": "48V", "warrantyMonths": 24}'::jsonb, 'active'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'INV-DEY-8KW-48V',
    'Deye 8kW SunSync Low-Voltage Hybrid Inverter',
    'Deye',
    'Hybrid inverters',
    'SUN-8K-SG01LP1-EU',
    'European standard hybrid inverter, dual MPPT, 48V battery input, smart load output.',
    'Unit',
    1550000.00, 1850000.00, 1750000.00, 1710000.00, 1680000.00, 1620000.00,
    6, 2, 'Showroom - Tipper Garage, Ibadan',
    'a0000000-0000-0000-0000-000000000001', 'Felicity Solar Direct Nigeria', '697483920194',
    TRUE, '{"powerRatingKw": 8.0, "voltage": "48V", "warrantyMonths": 60}'::jsonb, 'active'
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'BAT-LITH-5.12KWH',
    'Offnot PowerMaster 5.12kWh 51.2V 100Ah LiFePO4 Wall-Mount Battery',
    'Offnot Energy',
    'Lithium batteries',
    'OPM-51100-W',
    'Grade A EVE cells, 6000 cycles at 80% DoD, smart CAN/RS485 BMS communication.',
    'Unit',
    980000.00, 1200000.00, 1120000.00, 1090000.00, 1060000.00, 1020000.00,
    18, 5, 'Main Store - Dalute Road',
    'a0000000-0000-0000-0000-000000000001', 'Felicity Solar Direct Nigeria', '793847291038',
    TRUE, '{"batteryCapacityKwh": 5.12, "voltage": "51.2V", "chemistry": "LiFePO4", "warrantyMonths": 60}'::jsonb, 'active'
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'PNL-JNK-550W-BF',
    'Jinko 550W N-Type Tiger Neo Bifacial Solar Panel',
    'Jinko Solar',
    'Solar panels',
    'JKM550N-72HL4-BDVP',
    'High efficiency 22.3%, double glass bifacial generation, superior low-light performance.',
    'Unit',
    78000.00, 95000.00, 88000.00, 86000.00, 84000.00, 82000.00,
    95, 25, 'Warehouse 2 - Iwo Road Depot',
    'a0000000-0000-0000-0000-000000000002', 'Jinko Solar West Africa Distributors', '693748291048',
    FALSE, '{"panelWattageW": 550, "voltage": "42V", "warrantyMonths": 144}'::jsonb, 'active'
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'PPS-ITEL-PT1000',
    'Itel PowerTank 1000Wh Portable Power Station',
    'Itel',
    'Itel PowerTank',
    'IP-1000W',
    '1000W continuous pure sine wave output, 1000Wh LiFePO4 battery, super-fast 1.5hr charging.',
    'Unit',
    410000.00, 510000.00, 475000.00, 460000.00, 450000.00, 435000.00,
    12, 3, 'Showroom - Tipper Garage, Ibadan',
    'a0000000-0000-0000-0000-000000000003', 'Itel Energy Nigeria Official', '489448930192',
    FALSE, '{"powerRatingKw": 1.0, "batteryCapacityKwh": 1.0, "voltage": "220V AC", "chemistry": "LiFePO4"}'::jsonb, 'active'
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    'BAT-TUB-220AH-12V',
    'Luminous 220Ah / 12V Tall Tubular Deep Cycle Solar Battery',
    'Luminous',
    'Tubular batteries',
    'TX220',
    'Heavy duty alloy grids with porous spine tubes for prolonged power outages in Nigeria.',
    'Unit',
    245000.00, 295000.00, 278000.00, 270000.00, 265000.00, 255000.00,
    3, 6, 'Main Store - Dalute Road',
    'a0000000-0000-0000-0000-000000000001', 'Felicity Solar Direct Nigeria', '890123984719',
    FALSE, '{"voltage": "12V", "chemistry": "Tubular Gel", "warrantyMonths": 18}'::jsonb, 'active'
  ),
  (
    'b0000000-0000-0000-0000-000000000007',
    'CBL-DC-6MM-RED',
    'TUV Certified 6mm² Single-Core PV Solar Cable (100m Roll, Red)',
    'Havells / Coleman',
    'Solar cables',
    'PV1-F-6MM-R',
    'Tinned copper stranded wire, double insulation, UV resistant, halogen-free.',
    'Roll',
    58000.00, 75000.00, 69000.00, 66000.00, 64000.00, 62000.00,
    35, 10, 'Main Store - Dalute Road',
    'a0000000-0000-0000-0000-000000000004', 'Havells & Coleman Cable Depot Ibadan', '890123456789',
    FALSE, '{}'::jsonb, 'active'
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Initial Stock Movements (Opening Stock Ledger)
INSERT INTO stock_movements (
  product_id, product_name, sku, type, quantity, previous_stock, new_stock,
  unit_cost, total_cost, reference_id, warehouse_location, reason, performed_by_user_name
)
SELECT
  id, name, sku, 'opening_stock'::stock_movement_type, current_stock, 0, current_stock,
  purchase_cost, (current_stock * purchase_cost), 'OFF-INIT-2026', warehouse_location,
  'Opening business inventory recorded at Dalute Road Ibadan facility', 'Gabriel Francis'
FROM products
ON CONFLICT DO NOTHING;

-- 7. Insert Initial Customers & Registered Installers
INSERT INTO customers (
  id, name, contact_person, phone, email, address, type, pricing_tier, lead_stage,
  total_purchases, outstanding_balance, installer_details
) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'Adekunle Solar Innovations',
    'Engr. Adekunle Jimoh',
    '08033445566',
    'adekunle.solar@gmail.com',
    'Suite 4, Bodija Shopping Mall, Bodija, Ibadan',
    'solar_installer'::customer_type,
    'installer'::pricing_tier,
    'won'::lead_stage,
    4850000.00,
    120000.00,
    '{"certifications": "COREN Registered, NEMSA Solar Certified", "territory": "Ibadan Metro & Oyo Town", "monthlyCapacityKw": 25}'::jsonb
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'Dominion Specialist Medical Hospital',
    'Dr. (Mrs.) Yinka Balogun',
    '08022334455',
    'admin@dominionhospital.org',
    'Ring Road By Challenge Intersection, Ibadan',
    'hospital'::customer_type,
    'retail'::pricing_tier,
    'won'::lead_stage,
    8900000.00,
    0.00,
    '{}'::jsonb
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'Chief Alabi Ogunmola',
    'Chief Alabi',
    '08133221100',
    'alabi.residence@gmail.com',
    'Plot 7, Oluyole Estate Ext, Ibadan',
    'homeowner'::customer_type,
    'retail'::pricing_tier,
    'won'::lead_stage,
    3200000.00,
    0.00,
    '{}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Initial Installation Projects
INSERT INTO installation_projects (
  project_code, title, customer_name, customer_phone, site_address,
  capacity_description, lead_technician_name, status,
  contract_amount, equipment_cost, labour_cost, transport_cost, other_expenses,
  total_project_cost, gross_margin, technical_notes
) VALUES
  (
    'PRJ-IBD-2026-001',
    'Dominion Hospital Emergency Ward 10kVA Solar Backup',
    'Dominion Specialist Medical Hospital',
    '08022334455',
    'Ring Road By Challenge Intersection, Ibadan',
    '10kVA Hybrid Inverter, 20kWh LiFePO4, 16x 550W Jinko Panels',
    'Engr. Tayo Alabi',
    'in_progress'::project_status,
    8500000.00, 5800000.00, 450000.00, 80000.00, 40000.00,
    6370000.00, 2130000.00,
    'Phase balancing checked. DC roof combiner box mounted on North-South pitched galvanised strut.'
  )
ON CONFLICT (project_code) DO NOTHING;

-- 9. Insert Initial Operating Expenses
INSERT INTO expenses (
  date, category, description, amount, payment_method, payee, reference, recorded_by_user_name, approved_by
) VALUES
  (
    timezone('utc', now() - interval '2 days'),
    'Transport & Logistics',
    'Offloading & logistics for 40ft container panels from Apapa port to Ibadan depot',
    145000.00,
    'bank_transfer'::payment_method,
    'Oyo State Truck Haulage Ltd',
    'HAUL-9948',
    'Funmilayo Adeleke',
    'Gabriel Francis'
  ),
  (
    timezone('utc', now() - interval '3 days'),
    'Fuel & Power',
    'Generator diesel fueling (100L) for Dalute Road showroom & testing bench',
    110000.00,
    'cash'::payment_method,
    'Bovas Filling Station Dalute',
    'BOV-29401',
    'Bolanle Oladipo',
    'Gabriel Francis'
  ),
  (
    timezone('utc', now() - interval '5 days'),
    'Internet & Communication',
    'Starlink monthly business priority subscription for Ibadan head office',
    75000.00,
    'bank_transfer'::payment_method,
    'Starlink Nigeria',
    'STR-NG-2026-10',
    'Funmilayo Adeleke',
    'Bolanle Oladipo'
  )
ON CONFLICT DO NOTHING;
