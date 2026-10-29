# Offnot Energy Management System - Supabase SQL Migration Guide

Location: **Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria**  
Company: **Offnot Energy**  
Slogan: **Clean Energy, Stronger Tomorrow**  
Currency: **Nigerian Naira (₦ / NGN)**

---

## 📁 Migration Files Directory

All migration scripts are stored directly in this folder (`/src/migration/`):

| File | Description | When to Use |
| :--- | :--- | :--- |
| **`05_complete_migration_single_file.sql`** | **⭐ All-in-One Master Script** (Tables, Types, Indexes, Constraints, Seed Data). | **Recommended!** Copy & paste this single script into Supabase SQL Editor to set up everything in 1 click. |
| **`01_schema.sql`** | Core schema DDL: 15 tables, custom ENUM types, primary keys, foreign keys with referential integrity, and performance indexes. | Modular migration step 1. |
| **`02_triggers_and_functions.sql`** | Stored procedures: Atomic POS sales (`fn_execute_sale`), Goods Receipt (`fn_receive_goods`), Stock adjustments (`fn_adjust_stock`), and auto-updating timestamps. | Modular migration step 2. |
| **`03_rls_security_rules.sql`** | Supabase Row Level Security (RLS) policies enforcing role-based permissions (Super Admin, CEO, Manager, Inventory, Sales, Accountant, Tech Staff). | Modular migration step 3. |
| **`04_seed_data.sql`** | Initial production seed records: Offnot Energy contact details, Ibadan warehouses, solar categories, suppliers, real products (Felicity, Deye, Jinko, Itel), and opening stock ledger. | Modular migration step 4. |

---

## 🚀 How to Migrate to Supabase in 3 Minutes

### Step 1: Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign in or create an account.
2. Click **"New Project"**.
3. Set your project details:
   - **Name**: `Offnot-Energy-Ibadan`
   - **Database Password**: Choose a strong secure password.
   - **Region**: Select Europe (Frankfurt / London) or West Africa proximity.
4. Click **"Create new project"** and wait ~60 seconds for the database to provision.

### Step 2: Run the SQL Migration
1. In your Supabase Dashboard, click on **"SQL Editor"** (the terminal `>_` icon on the left sidebar).
2. Click **"New Query"**.
3. Open [`/src/migration/05_complete_migration_single_file.sql`](05_complete_migration_single_file.sql) in this repository or in the in-app Database Migration tab.
4. Copy the entire file content, paste it into the Supabase SQL Editor, and click **"RUN"**.
5. You will see a success message: `Success. No rows returned.`

### Step 3: Verify the Tables
1. Click on **"Table Editor"** in the Supabase sidebar.
2. You will see all 15 operational tables populated:
   - `company_settings`
   - `warehouses`
   - `user_profiles`
   - `categories`
   - `suppliers`
   - `products`
   - `stock_movements` (Immutable stock ledger)
   - `customers` (CRM & registered installers)
   - `purchase_orders`
   - `sales` (POS orders)
   - `payments`
   - `quotations`
   - `installation_projects`
   - `expenses`
   - `audit_logs`

---

## 🔑 Environment Variables (.env)

Add the following keys to your `.env` file when switching your live API traffic to Supabase:

```env
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Both keys can be found in your Supabase Dashboard under:  
**Project Settings** → **API** → **Project URL** & **Project API keys (anon public)**.

---

## 🛠️ Frontend Supabase Client Integration

A client adapter is provided in `/src/services/supabaseClient.ts`. To use it in production:

```bash
npm install @supabase/supabase-js
```

And initialize with:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```
