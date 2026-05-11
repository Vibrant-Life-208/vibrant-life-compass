// Backend configuration.
// Flip BACKEND_TYPE to 'supabase' once Vibrant Life provides URL + anon key
// and the schema (supabase/schema.sql) has been applied.

export const BACKEND_TYPE = 'local'; // 'local' | 'supabase'

// Supabase configuration - filled in at deploy time, never committed.
// Pattern: keep these blank in source; Vibrant Life sets them in a local
// `config.local.js` that is gitignored, or via build-time env injection.
export const SUPABASE_CONFIG = {
  url: '',     // e.g. 'https://abcdef.supabase.co'
  anonKey: '', // public anon key from Supabase project settings
};

export function backendIsConfigured() {
  if (BACKEND_TYPE === 'local') return true;
  return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
}
