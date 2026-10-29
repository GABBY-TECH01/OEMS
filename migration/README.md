# Offnot Energy Management System - Supabase Migration Files

Location: **Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria**  
Company: **Offnot Energy**  
Slogan: **Clean Energy, Stronger Tomorrow**  

All SQL migration codes are organized in this folder:

1. **`05_complete_migration_single_file.sql`** - ⭐ **Master All-in-One SQL Script**. Copy and paste this directly into your Supabase SQL Editor.
2. **`01_schema.sql`** - Schema definition: 15 tables, custom ENUM types, primary keys, foreign keys, and indexes.
3. **`02_triggers_and_functions.sql`** - Stored procedures for atomic POS sales (`fn_execute_sale`), Goods Receipt (`fn_receive_goods`), stock adjustments (`fn_adjust_stock`), and auto timestamps.
4. **`03_rls_security_rules.sql`** - Supabase Row Level Security (RLS) policies for RBAC authorization.
5. **`04_seed_data.sql`** - Realistic seed data for Offnot Energy in Ibadan (products, categories, suppliers, customers, and opening stock ledger).

Duplicate copies are maintained in `/src/migration/` and accessible directly in the web app under the **"Supabase Migrations"** tab.
