// Backend configuration.
//
// Reads from `window.__HC_RUNTIME_CONFIG__` if present (production: Vercel
// build step generates `config.runtime.js` from env vars and index.html
// loads it before the app). Falls back to local-storage backend for dev.
//
// To run locally against a Supabase project, drop a `config.runtime.js`
// at the repo root containing:
//   window.__HC_RUNTIME_CONFIG__ = {
//     BACKEND_TYPE: 'supabase',
//     SUPABASE_URL: 'https://xxxxx.supabase.co',
//     SUPABASE_ANON_KEY: 'eyJ...',
//   };
// That file is gitignored. Never commit credentials.

const RUNTIME = (typeof window !== 'undefined' && window.__HC_RUNTIME_CONFIG__) || {};

export const BACKEND_TYPE = RUNTIME.BACKEND_TYPE || 'local'; // 'local' | 'supabase'

export const SUPABASE_CONFIG = {
  url: RUNTIME.SUPABASE_URL || '',
  anonKey: RUNTIME.SUPABASE_ANON_KEY || '',
};

export function backendIsConfigured() {
  if (BACKEND_TYPE === 'local') return true;
  return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
}
