/**
 * Permanent Supabase Project Configuration
 * Offnot Energy Management System
 * Location: Inside Tipper Garage, Dalute Road, Ibadan, Oyo State, Nigeria
 * 
 * This configuration ensures every device (laptop, Android phone, tablet, etc.)
 * and every deployment (Vercel, GitHub, AI Studio) connects to the EXACT same
 * live Supabase PostgreSQL database without requiring manual key entry on each device.
 */

export interface SupabaseProjectConfig {
  url: string;
  anonKey: string;
  projectName: string;
}

// Project OEMS Supabase Configuration
// Default fallback values used when environment variables are not set in Vercel
export const DEFAULT_SUPABASE_CONFIG: SupabaseProjectConfig = {
  // Checks Vercel environment variables first, falls back to permanent project URL
  url: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
  anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
  projectName: 'OEMS (Offnot Energy Management System)',
};

/**
 * Storage keys used for local browser overrides (optional per-device testing)
 */
export const SUPABASE_STORAGE_KEYS = {
  URL: 'offnot_supabase_url',
  ANON_KEY: 'offnot_supabase_anon_key',
  LAST_SYNC: 'offnot_supabase_last_sync_timestamp',
};
