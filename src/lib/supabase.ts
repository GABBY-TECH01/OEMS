/**
 * Supabase Client Initialization and Database Synchronization Helpers
 * Offnot Energy Management System
 * Location: Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_SUPABASE_CONFIG, SUPABASE_STORAGE_KEYS } from '../config/supabaseConfig';

// Configuration keys in localStorage
export const STORAGE_SUPABASE_URL_KEY = SUPABASE_STORAGE_KEYS.URL;
export const STORAGE_SUPABASE_ANON_KEY = SUPABASE_STORAGE_KEYS.ANON_KEY;

export type SupabaseConfigSource = 'local_storage' | 'vercel_env' | 'project_config' | 'none';
export const SUPABASE_CONFIG_CHANGED_EVENT = 'offnot:supabase-config-changed';

function cleanCredentialValue(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.trim().replace(/^['"]+|['"]+$/g, '').trim();
}

export function normalizeSupabaseUrl(raw: string | null | undefined): string {
  let cleaned = cleanCredentialValue(raw).replace(/\/+$/, '');
  if (!cleaned) return '';

  // Auto-convert pasted Supabase Dashboard URL (e.g. https://supabase.com/dashboard/project/<ref>)
  const dashboardMatch = cleaned.match(/^https?:\/\/supabase\.com\/dashboard\/project\/([a-z0-9-]+)(?:\/.*)?$/i);
  if (dashboardMatch && dashboardMatch[1]) {
    cleaned = `https://${dashboardMatch[1]}.supabase.co`;
  }

  // Add https:// if user entered bare domain like xyz.supabase.co
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://') && cleaned.includes('.supabase.co')) {
    cleaned = `https://${cleaned}`;
  }

  return cleaned;
}

export function getSupabaseConfigSource(): SupabaseConfigSource {
  if (typeof window !== 'undefined') {
    const localUrl = normalizeSupabaseUrl(localStorage.getItem(STORAGE_SUPABASE_URL_KEY));
    const localKey = cleanCredentialValue(localStorage.getItem(STORAGE_SUPABASE_ANON_KEY));
    if (localUrl && localUrl.startsWith('http') && localKey.length >= 20) return 'local_storage';
  }
  const envVal = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
  const envKey = cleanCredentialValue(import.meta.env.VITE_SUPABASE_ANON_KEY);
  if (envVal && envVal.startsWith('http') && envKey.length >= 20) return 'vercel_env';

  if (
    DEFAULT_SUPABASE_CONFIG.url &&
    DEFAULT_SUPABASE_CONFIG.url.startsWith('http') &&
    !DEFAULT_SUPABASE_CONFIG.url.includes('placeholder') &&
    DEFAULT_SUPABASE_CONFIG.anonKey &&
    DEFAULT_SUPABASE_CONFIG.anonKey.length >= 20
  ) {
    return 'project_config';
  }
  return 'none';
}

export function getSupabaseUrl(): string {
  if (typeof window !== 'undefined') {
    const local = normalizeSupabaseUrl(localStorage.getItem(STORAGE_SUPABASE_URL_KEY));
    if (local && local.startsWith('http')) return local;
  }
  const envVal = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
  if (envVal && envVal.startsWith('http')) return envVal;

  const defaultUrl = normalizeSupabaseUrl(DEFAULT_SUPABASE_CONFIG.url);
  if (defaultUrl && defaultUrl.startsWith('http')) {
    return defaultUrl;
  }
  return '';
}

export function getSupabaseAnonKey(): string {
  if (typeof window !== 'undefined') {
    const local = cleanCredentialValue(localStorage.getItem(STORAGE_SUPABASE_ANON_KEY));
    if (local && local.length > 10) return local;
  }
  const envVal = cleanCredentialValue(import.meta.env.VITE_SUPABASE_ANON_KEY);
  if (envVal && envVal.length > 10) return envVal;

  const defaultKey = cleanCredentialValue(DEFAULT_SUPABASE_CONFIG.anonKey);
  if (defaultKey && defaultKey.length > 10) {
    return defaultKey;
  }
  return '';
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    key.length >= 20 &&
    !url.includes('placeholder') &&
    !url.includes('your-project-ref') &&
    !key.includes('placeholder') &&
    !key.includes('your-anon-public-key')
  );
}

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key || !url.startsWith('http')) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Default export client
export const supabase: SupabaseClient | null = getSupabaseClient();

function notifySupabaseConfigChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SUPABASE_CONFIG_CHANGED_EVENT));
  }
}

export function saveSupabaseCredentials(url: string, anonKey: string): { success: boolean; error?: string } {
  try {
    const rawTrimmed = cleanCredentialValue(url);
    if (rawTrimmed.startsWith('postgres://') || rawTrimmed.startsWith('postgresql://')) {
      return {
        success: false,
        error: 'Please enter the HTTPS Project URL (from Project Settings → API, e.g. https://xxxx.supabase.co), not the PostgreSQL connection string.',
      };
    }

    const trimmedUrl = normalizeSupabaseUrl(rawTrimmed);
    const trimmedKey = cleanCredentialValue(anonKey);

    if (!trimmedUrl.startsWith('http')) {
      return { success: false, error: 'Invalid URL. Project URL must start with https://' };
    }
    if (trimmedKey.length < 20) {
      return { success: false, error: 'Invalid anon public key provided.' };
    }

    localStorage.setItem(STORAGE_SUPABASE_URL_KEY, trimmedUrl);
    localStorage.setItem(STORAGE_SUPABASE_ANON_KEY, trimmedKey);

    // Refresh client & notify AppContext immediately
    cachedClient = null;
    lastUsedUrl = '';
    lastUsedKey = '';
    getSupabaseClient();
    notifySupabaseConfigChanged();

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export function clearSupabaseCredentials(): void {
  localStorage.removeItem(STORAGE_SUPABASE_URL_KEY);
  localStorage.removeItem(STORAGE_SUPABASE_ANON_KEY);
  cachedClient = null;
  lastUsedUrl = '';
  lastUsedKey = '';
  notifySupabaseConfigChanged();
}

/**
 * Helper: Query records from any Supabase table
 */
export async function supabaseSelect<T = Record<string, unknown>>(
  table: string,
  options?: {
    select?: string;
    match?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }
): Promise<{ data: T[] | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase client is not configured. Provide Project URL and Anon Key.' };
  }

  try {
    let query = client.from(table).select(options?.select || '*');

    if (options?.match) {
      for (const [key, val] of Object.entries(options.match)) {
        if (val !== undefined && val !== null) {
          query = query.eq(key, val);
        }
      }
    }

    if (options?.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data: data as T[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

/**
 * Helper: Upsert record(s) into a Supabase table
 */
export async function supabaseUpsert<T = Record<string, unknown>>(
  table: string,
  records: Record<string, unknown> | Record<string, unknown>[]
): Promise<{ data: T[] | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase client is not configured.' };
  }

  try {
    const payload = Array.isArray(records) ? records : [records];
    const { data, error } = await client.from(table).upsert(payload).select();
    if (error) throw error;
    return { data: data as T[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

/**
 * Helper: Insert record(s) into a Supabase table
 */
export async function supabaseInsert<T = Record<string, unknown>>(
  table: string,
  records: Record<string, unknown> | Record<string, unknown>[]
): Promise<{ data: T[] | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase client is not configured.' };
  }

  try {
    const payload = Array.isArray(records) ? records : [records];
    const { data, error } = await client.from(table).insert(payload).select();
    if (error) throw error;
    return { data: data as T[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

/**
 * Helper: Update record(s) matching criteria
 */
export async function supabaseUpdate<T = Record<string, unknown>>(
  table: string,
  updates: Record<string, unknown>,
  match: Record<string, unknown>
): Promise<{ data: T[] | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase client is not configured.' };
  }

  try {
    let query = client.from(table).update(updates);
    for (const [key, val] of Object.entries(match)) {
      query = query.eq(key, val);
    }
    const { data, error } = await query.select();
    if (error) throw error;
    return { data: data as T[], error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

/**
 * Helper: Delete records matching criteria
 */
export async function supabaseDelete(
  table: string,
  match: Record<string, unknown>
): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client is not configured.' };
  }

  try {
    let query = client.from(table).delete();
    for (const [key, val] of Object.entries(match)) {
      query = query.eq(key, val);
    }
    const { error } = await query;
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Helper: Execute stored procedures / RPCs
 */
export async function executeRpc<T = unknown>(
  fnName: string,
  params?: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase client is not configured.' };
  }

  try {
    const { data, error } = await client.rpc(fnName, params);
    if (error) throw error;
    return { data: data as T, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

/**
 * Test connectivity with Supabase backend and check table presence
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  tablesFound?: string[];
  missingTables?: string[];
  details?: Record<string, unknown>;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Supabase credentials missing. Enter your Project URL and Anon Key.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Failed to initialize Supabase client with current credentials.',
    };
  }

  const expectedTables = [
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
    'kpi_daily_logs',
  ];

  const tablesFound: string[] = [];
  const missingTables: string[] = [];
  const probeErrors: { table: string; message: string; code?: string }[] = [];

  await Promise.all(
    expectedTables.map(async (tbl) => {
      try {
        const { error } = await client.from(tbl).select('*', { count: 'exact', head: true });
        if (!error) {
          tablesFound.push(tbl);
        } else {
          missingTables.push(tbl);
          probeErrors.push({ table: tbl, message: error.message || 'Unknown error', code: error.code });
        }
      } catch (err: unknown) {
        missingTables.push(tbl);
        probeErrors.push({
          table: tbl,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    })
  );

  if (tablesFound.length === 0) {
    const firstErr = probeErrors[0];
    const errMsgLower = (firstErr?.message || '').toLowerCase();
    const errCode = String(firstErr?.code || '');
    const isTableMissingOnly =
      errCode === 'PGRST205' ||
      errCode === '42P01' ||
      errMsgLower.includes('could not find the table') ||
      (errMsgLower.includes('relation') && errMsgLower.includes('does not exist'));

    if (!isTableMissingOnly && firstErr) {
      return {
        connected: false,
        message: `Supabase connection failed: ${firstErr.message}. Please verify your Project URL, Anon Public Key, internet access, and that your Supabase project is active (not paused).`,
        tablesFound,
        missingTables,
        details: { error: firstErr.message, code: firstErr.code },
      };
    }

    return {
      connected: true,
      message:
        'Connected to Supabase project! However, no tables were found in the public schema. Please copy and run the Master SQL migration script in the SQL Editor.',
      tablesFound,
      missingTables,
    };
  }

  if (missingTables.length > 0) {
    return {
      connected: true,
      message: `Connected to Supabase. Found ${tablesFound.length} of ${expectedTables.length} tables. Run Patch 10 or the Master SQL script to create/update any remaining tables.`,
      tablesFound,
      missingTables,
    };
  }

  return {
    connected: true,
    message: `All ${expectedTables.length} tables are active and connected in Supabase! Supabase is your live primary database.`,
    tablesFound,
    missingTables: [],
  };
}

/**
 * Push all local seed & transaction records to Supabase
 */
export async function syncLocalToSupabase(localData: {
  branches: Array<any>;
  users: Array<any>;
  categories: string[];
  suppliers: Array<any>;
  products: Array<any>;
  customers: Array<any>;
  settings: any;
}): Promise<{ success: boolean; message: string; results?: Record<string, number> }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase client is not configured. Provide Project URL and Anon Key.' };
  }

  const results: Record<string, number> = {};

  try {
    // 1. Branches
    if (localData.branches.length > 0) {
      const branchRows = localData.branches.map(b => ({
        id: b.id,
        name: b.name,
        code: b.code,
        city: b.city || 'Ibadan',
        state: b.state || 'Oyo State',
        address: b.address,
        phone: b.phone,
        email: b.email,
        manager_name: b.managerName,
        is_headquarters: Boolean(b.isHeadquarters),
        is_active: b.isActive !== false,
      }));
      const { data, error } = await client.from('branches').upsert(branchRows).select();
      if (error) throw new Error(`Branches sync failed: ${error.message}`);
      results.branches = data?.length || 0;
    }

    // 2. Users / Staff
    if (localData.users.length > 0) {
      const userRows = localData.users.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username || String(u.email || '').split('@')[0],
        email: u.email,
        phone: u.phone,
        role: u.role,
        branch_id: u.branchId,
        branch_name: u.branchName,
        temporary_password: u.temporaryPassword,
        status: u.status || 'active',
        has_full_system_access: Boolean(u.hasFullSystemAccess),
        can_access_all_branches: Boolean(u.canAccessAllBranches),
      }));
      const { data, error } = await client.from('user_profiles').upsert(userRows).select();
      if (error) throw new Error(`User profiles sync failed: ${error.message}`);
      results.user_profiles = data?.length || 0;
    }

    // 3. Categories
    if (localData.categories.length > 0) {
      const catRows = localData.categories.map((c, i) => ({
        id: `cat_${i + 1}`,
        name: c,
        display_order: i + 1,
      }));
      const { data, error } = await client.from('categories').upsert(catRows).select();
      if (error) throw new Error(`Categories sync failed: ${error.message}`);
      results.categories = data?.length || 0;
    }

    // 4. Suppliers
    if (localData.suppliers.length > 0) {
      const supRows = localData.suppliers.map(s => ({
        id: s.id,
        company_name: s.companyName,
        contact_person: s.contactPerson,
        phone: s.phone,
        email: s.email,
        address: s.address,
        categories: s.categories,
        payment_terms: s.paymentTerms,
        outstanding_balance: s.outstandingBalance || 0,
        notes: s.notes,
      }));
      const { data, error } = await client.from('suppliers').upsert(supRows).select();
      if (error) throw new Error(`Suppliers sync failed: ${error.message}`);
      results.suppliers = data?.length || 0;
    }

    // 5. Products
    if (localData.products.length > 0) {
      const prodRows = localData.products.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand || 'Offnot Energy',
        category: p.category,
        model: p.model,
        description: p.description,
        unit: p.unit || 'Unit',
        purchase_cost: p.purchaseCost || 0,
        retail_price: p.retailPrice || 0,
        wholesale_price: p.wholesalePrice || 0,
        installer_price: p.installerPrice || 0,
        dealer_price: p.dealerPrice || 0,
        min_selling_price: p.minSellingPrice || 0,
        current_stock: p.currentStock || 0,
        reorder_level: p.reorderLevel || 5,
        warehouse_location: p.warehouseLocation,
        branch_id: p.branchId,
        branch_name: p.branchName,
        supplier_id: p.supplierId,
        supplier_name: p.supplierName,
        barcode: p.barcode,
        specs: p.specs || {},
        status: p.status || 'active',
      }));
      const { data, error } = await client.from('products').upsert(prodRows).select();
      if (error) throw new Error(`Products sync failed: ${error.message}`);
      results.products = data?.length || 0;
    }

    // 6. Settings
    if (localData.settings) {
      const baseSetRow = {
        id: 'cfg_offnot_main',
        company_name: localData.settings.companyName || 'Offnot Energy',
        slogan: localData.settings.slogan || 'Clean Energy, Stronger Tomorrow',
        location: localData.settings.location,
        phone: localData.settings.phone,
        email: localData.settings.email,
        currency_symbol: localData.settings.currencySymbol || '₦',
        currency_code: localData.settings.currencyCode || 'NGN',
        default_vat_rate: localData.settings.defaultVatRate ?? 7.5,
        enable_tax_by_default: Boolean(localData.settings.enableTaxByDefault),
        min_gross_margin_percent: localData.settings.minGrossMarginPercent ?? 12,
        receipt_footer_message: localData.settings.receiptFooterMessage,
      };
      const fullSetRow = {
        ...baseSetRow,
        head_office_address: localData.settings.headOfficeAddress || null,
        branch_office_address: localData.settings.branchOfficeAddress || null,
        dugbe_phone: localData.settings.dugbePhone || null,
        dalute_phone: localData.settings.dalutePhone || null,
        customer_service_phone: localData.settings.customerServicePhone || localData.settings.phone || null,
        facebook_handle: localData.settings.facebookHandle || null,
        instagram_handle: localData.settings.instagramHandle || null,
        tiktok_handle: localData.settings.tiktokHandle || null,
        warehouses: Array.isArray(localData.settings.warehouses) ? localData.settings.warehouses : [],
        role_permissions: localData.settings.rolePermissions || null,
      };
      const { error: setErr } = await client.from('company_settings').upsert(fullSetRow);
      if (setErr) {
        await client.from('company_settings').upsert(baseSetRow);
      }
      results.company_settings = 1;
    }

    return {
      success: true,
      message: `Successfully synchronized data to your Supabase tables (${Object.entries(results).map(([k, v]) => `${k}: ${v}`).join(', ')})!`,
      results,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Sync failed: ${message}`, results };
  }
}

