/**
 * Supabase Client Service Adapter for Offnot Energy Management System
 * Ready for live database connection once VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.
 */

import { getSupabaseUrl, getSupabaseAnonKey, isSupabaseConfigured } from '../lib/supabase';

export interface SupabaseConfig {
  url?: string;
  anonKey?: string;
  isConfigured: boolean;
}

export const getSupabaseConfig = (): SupabaseConfig => {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  return {
    url,
    anonKey,
    isConfigured: isSupabaseConfigured(),
  };
};

/**
 * Migration SQL Manifest for in-app viewing & downloading
 */
export interface MigrationFile {
  filename: string;
  title: string;
  description: string;
  category: 'master' | 'schema' | 'functions' | 'security' | 'seed';
}

export const MIGRATION_FILES: MigrationFile[] = [
  {
    filename: '09_company_logo_and_pwa_icons_patch.sql',
    title: '🎨 Company Logo & Dynamic PWA Manifest Patch',
    description: 'Stores Superadmin uploaded company logo URL in company_settings, creates company-assets storage bucket, and dynamically syncs PWA manifest icons.',
    category: 'master',
  },
  {
    filename: '08_pwa_customizer_and_offline_sync_patch.sql',
    title: '📱 PWA Mobile App Customizer & Pop-up Sync Patch',
    description: 'Adds pwa_app_title, pwa_short_name, pwa_logo_url, and enable_pwa_prompt columns to company_settings for Superadmin app personalization.',
    category: 'master',
  },
  {
    filename: '07_kpi_and_auth_patch.sql',
    title: '🏆 KPI Performance Hub & Password Fix Patch',
    description: 'Creates staff_kpis and kpi_daily_logs tables with RLS policies, ensures password persistence, and enables live multi-device KPI logging.',
    category: 'master',
  },
  {
    filename: '06_incremental_handshake_patch.sql',
    title: '⚡ Incremental Handshake & Multi-Device Patch',
    description: 'Quick lightweight SQL patch to ensure RLS permissions and live two-way sync across laptop, mobile, and Vercel.',
    category: 'security',
  },
  {
    filename: '05_complete_migration_single_file.sql',
    title: '⭐ Master All-in-One Supabase Migration',
    description: 'Complete standalone SQL script (tables, enums, triggers, RLS, and seed data) ready to paste into Supabase SQL Editor.',
    category: 'master',
  },
  {
    filename: '01_schema.sql',
    title: 'Core Schema DDL',
    description: '15 database tables, custom ENUMs, primary keys, foreign keys, and performance indexes.',
    category: 'schema',
  },
  {
    filename: '02_triggers_and_functions.sql',
    title: 'Stored Functions & Stock Triggers',
    description: 'Atomic POS sales execution (fn_execute_sale), Goods Receipt (fn_receive_goods), and stock adjustments.',
    category: 'functions',
  },
  {
    filename: '03_rls_security_rules.sql',
    title: 'Row Level Security (RLS) Policies',
    description: 'Strict role-based access control policies for Super Admin, CEO, Manager, Inventory, Sales, Accountant, and Tech Staff.',
    category: 'security',
  },
  {
    filename: '04_seed_data.sql',
    title: 'Ibadan Business Seed Data',
    description: 'Pre-populated company info, Ibadan depots, solar products (Felicity, Deye, Jinko, Itel), and opening stock ledger.',
    category: 'seed',
  },
];

// Re-export core client and helpers from src/lib/supabase.ts
export {
  supabase,
  isSupabaseConfigured,
  supabaseSelect,
  supabaseInsert,
  supabaseUpdate,
  supabaseDelete,
  executeRpc,
  testSupabaseConnection,
} from '../lib/supabase';
