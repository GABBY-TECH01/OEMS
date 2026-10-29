/**
 * Supabase Client Initialization and Database Operation Helpers
 * Offnot Energy Management System
 * 
 * Provides client connection using VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY,
 * safe fallback detection, and typed helper functions for SQL/table operations.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Singleton client instance or null if unconfigured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

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
  if (!supabase) {
    return { data: null, error: 'Supabase client is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
  }

  try {
    let query = supabase.from(table).select(options?.select || '*');

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
 * Helper: Insert record(s) into a Supabase table
 */
export async function supabaseInsert<T = Record<string, unknown>>(
  table: string,
  records: Record<string, unknown> | Record<string, unknown>[]
): Promise<{ data: T[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase client is not configured.' };
  }

  try {
    const payload = Array.isArray(records) ? records : [records];
    const { data, error } = await supabase.from(table).insert(payload).select();
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
  if (!supabase) {
    return { data: null, error: 'Supabase client is not configured.' };
  }

  try {
    let query = supabase.from(table).update(updates);
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
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured.' };
  }

  try {
    let query = supabase.from(table).delete();
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
 * Helper: Execute stored procedures / RPCs (e.g. fn_execute_sale, fn_receive_goods)
 */
export async function executeRpc<T = unknown>(
  fnName: string,
  params?: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase client is not configured.' };
  }

  try {
    const { data, error } = await supabase.rpc(fnName, params);
    if (error) throw error;
    return { data: data as T, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message };
  }
}

/**
 * Test connectivity with Supabase backend
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  details?: Record<string, unknown>;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Supabase credentials missing in environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY). Running in high-performance local ledger mode.',
    };
  }

  try {
    const { count, error } = await supabase!
      .from('branches')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return {
      connected: true,
      message: 'Successfully connected to remote Supabase PostgreSQL database.',
      details: { branchesCount: count ?? 0 },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Failed to connect to Supabase: ${message}`,
    };
  }
}
