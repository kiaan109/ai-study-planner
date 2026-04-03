import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('your-project');

export function createClient() {
  return createBrowserClient(
    isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
    isSupabaseConfigured ? SUPABASE_KEY : 'placeholder-key'
  );
}
