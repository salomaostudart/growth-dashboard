/**
 * Supabase client singleton.
 * Reads SUPABASE_URL and SUPABASE_ANON_KEY from env.
 * Falls back to empty strings (auth features disabled when not configured).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env?.PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.PUBLIC_SUPABASE_ANON_KEY || '';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}
