# Offnot Energy Management System - Supabase Migration & SQL Deployment Guide

Company: **Offnot Energy Systems Ltd**  
Location: **Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria**  
Brand Slogan: **Clean Energy, Stronger Tomorrow**  
Currency: **Nigerian Naira (₦ / NGN)**  
Supabase Target: **Project OEMS / PostgreSQL 15+**  

---

## 📸 Guided Walkthrough for Your Supabase Project (Project OEMS)

In your Supabase project dashboard (**OEMS** under `francisgabriel932@gmail.com's Org`):

### Step 1: Open the SQL Editor in Supabase
1. Look at the **black left sidebar** on your Supabase screen.
2. The icons from top to bottom are:
   - **Home** (icon 1)
   - **Table Editor** (icon 2 — where your screenshot showed *"No tables or views"*)
   - **SQL Editor** (icon 3 — the terminal `<>` / `>_` symbol)
3. Click on the **SQL Editor** icon (`>_`).

### Step 2: Open a New Query
1. At the top of the SQL Editor, click the **"+ New query"** button (or choose *Empty query*).

### Step 3: Run the Master SQL Script
1. Open the master script in this folder: [`05_complete_migration_single_file.sql`](./05_complete_migration_single_file.sql).
2. Copy the entire file content (or click **"Copy Master SQL"** in the Offnot Energy app under **Company Settings ➔ Supabase Live DB & SQL**).
3. Paste the entire SQL script into the query window in Supabase.
4. Click the green **RUN** button (or press `Ctrl + Enter` / `Cmd + Enter`).
5. Supabase will execute the statements and display: `Success. No rows returned.`

### Step 4: Verify Your Tables in Supabase
1. Click the **Table Editor** icon on the left sidebar (the 2nd icon from the top, where your screenshot was taken).
2. You will now see all **16 database tables** created and populated with clean initial zero-accounting structures:
   - `company_settings`: Offnot Energy corporate profile & Ibadan address
   - `branches`: Showroom HQ (Tipper Garage), Main Store (Dalute Road), Warehouse 2 (Iwo Road Depot)
   - `user_profiles`: Superadmin Francis Gabriel (`francisgabriel932@gmail.com`) and Deputy Admin Ayomide Bakare (`admin@offnotenergy.ng`)
   - `categories`: 15 solar equipment classifications (Inverters, Panels, Lithium batteries, etc.)
   - `suppliers`: Felicity Solar, Jinko Solar, Itel Energy, Coleman Cable Depot
   - `products`: 8 core solar products with **clean zero stock (₦0.00 ledger)**
   - `stock_movements`: Stock tracking ledger
   - `customers`: Client & installer directory
   - `purchase_orders`: Vendor procurement records
   - `sales`: Point of sale invoices & transactions
   - `payments`: Split/single payment receipts
   - `quotations`: Commercial solar quotations
   - `installation_projects`: Engineering job records
   - `expenses`: Operating expense records
   - `audit_logs`: System access & security audit trail
   - `app_notifications`: Real-time system notifications

---

## 🔗 Connecting Supabase as Your Live Database

To have the Offnot Energy Management System query and persist directly to your Supabase tables:

1. In Supabase, click the **Project Settings** gear icon at the bottom of the left sidebar.
2. Click **API** under Configuration.
3. Copy your:
   - **Project URL** (e.g. `https://xyzabcdefghijklm.supabase.co`)
   - **anon public API Key** (`eyJhbGciOiJIUzI1NiIsInR5cCI6...`)
4. In the Offnot Energy app, navigate to **Company Settings ➔ Supabase Live DB & SQL**.
5. Paste both values into the connection form and click **"Save & Connect Supabase"**.
6. Click **"Test Connection & Check Tables"** — you will see green checkmarks for all 16 tables!
7. Optionally click **"Sync Local Data to Supabase"** to synchronize any existing records directly into your Supabase database.

---

## 📂 Migration Files Reference

| File | Description | Purpose |
| :--- | :--- | :--- |
| **`05_complete_migration_single_file.sql`** | **⭐ All-in-One Master Script** (Tables, Types, Indexes, Constraints, Triggers, RLS, Seed Data) | **Single-step full deployment in Supabase SQL Editor.** |
| **`01_schema.sql`** | Core Schema DDL | Modular table & enum declarations |
| **`02_triggers_and_functions.sql`** | Stored Procedures | Auto timestamps & ACID transaction functions |
| **`03_rls_security_rules.sql`** | Row Level Security | Role-based permission policies |
| **`04_seed_data.sql`** | Ibadan Business Seed Data | Clean zero ledger catalog data |
