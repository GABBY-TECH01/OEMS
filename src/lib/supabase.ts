/**
 * Supabase Client Initialization and Database Synchronization Helpers
 * Offnot Energy Management System
 * Location: Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys in localStorage
export const STORAGE_SUPABASE_URL_KEY = 'offnot_supabase_url';
export const STORAGE_SUPABASE_ANON_KEY = 'offnot_supabase_anon_key';

export function getSupabaseUrl(): string {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_SUPABASE_URL_KEY);
    if (local && local.trim().startsWith('http')) return local.trim();
  }
  const envVal = import.meta.env.VITE_SUPABASE_URL || '';
  return envVal.trim();
}

export function getSupabaseAnonKey(): string {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_SUPABASE_ANON_KEY);
    if (local && local.trim().length > 10) return local.trim();
  }
  const envVal = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return envVal.trim();
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    !url.includes('placeholder') &&
    !key.includes('placeholder')
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

export function saveSupabaseCredentials(url: string, anonKey: string): { success: boolean; error?: string } {
  try {
    const trimmedUrl = url.trim();
    const trimmedKey = anonKey.trim();

    if (!trimmedUrl.startsWith('http')) {
      return { success: false, error: 'Invalid URL. Project URL must start with https://' };
    }
    if (trimmedKey.length < 20) {
      return { success: false, error: 'Invalid anon public key provided.' };
    }

    localStorage.setItem(STORAGE_SUPABASE_URL_KEY, trimmedUrl);
    localStorage.setItem(STORAGE_SUPABASE_ANON_KEY, trimmedKey);

    // Refresh client
    cachedClient = null;
    getSupabaseClient();

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
  ];

  const tablesFound: string[] = [];
  const missingTables: string[] = [];

  for (const tbl of expectedTables) {
    try {
      const { error } = await client.from(tbl).select('*', { count: 'exact', head: true });
      if (!error) {
        tablesFound.push(tbl);
      } else {
        missingTables.push(tbl);
      }
    } catch {
      missingTables.push(tbl);
    }
  }

  if (tablesFound.length === 0) {
    return {
      connected: true,
      message:
        'Connected to Supabase project! However, no tables were found in the public schema. Please copy and run the SQL migration script in the SQL Editor.',
      tablesFound,
      missingTables,
    };
  }

  if (missingTables.length > 0) {
    return {
      connected: true,
      message: `Connected to Supabase. Found ${tablesFound.length} of ${expectedTables.length} tables. Run the migration script to create the remaining tables.`,
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
      const setRow = {
        id: 'cfg_offnot_main',
        company_name: localData.settings.companyName || 'Offnot Energy',
        slogan: localData.settings.slogan || 'Clean Energy, Stronger Tomorrow',
        location: localData.settings.location,
        phone: localData.settings.phone,
        email: localData.settings.email,
        currency_symbol: localData.settings.currencySymbol || '₦',
        currency_code: localData.settings.currencyCode || 'NGN',
        default_vat_rate: localData.settings.defaultVatRate || 7.5,
        enable_tax_by_default: Boolean(localData.settings.enableTaxByDefault),
        min_gross_margin_percent: localData.settings.minGrossMarginPercent || 12,
        receipt_footer_message: localData.settings.receiptFooterMessage,
      };
      await client.from('company_settings').upsert(setRow);
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

