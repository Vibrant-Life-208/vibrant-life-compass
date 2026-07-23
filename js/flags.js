// flags.js — Phase 0 strangler-fig feature flag (homegrown, deterministic).
//
// Read order:  ?ui= query override  >  server profiles.ui_variant  >  deterministic bucket.
// ROLLOUT_PCT = 0 means NO ONE is bucketed into 'observatory' — pure no-op until raised.
// A given user is stable across sessions/devices because the bucket hashes their profile id.
// Authored 2026-07-22 (Compass rebuild, Phase 0 Task C). No behavior change while empty.

const ROLLOUT_PCT = 0;                 // canary dial: raise later; 0 = everyone legacy
const LS_KEY = 'vlc_ui_override';

// small stable string hash (FNV-1a) -> 0..99, device-independent
function bucketOf(id) {
  let h = 2166136261;
  const s = String(id || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100;
}

// ?ui=observatory|legacy is remembered in localStorage so it survives PWA/offline reloads
function queryOverride() {
  try {
    const p = new URLSearchParams(location.search).get('ui');
    if (p === 'observatory' || p === 'legacy') {
      localStorage.setItem(LS_KEY, p);
      return p;
    }
  } catch (_) {}
  try { return localStorage.getItem(LS_KEY) || null; } catch (_) { return null; }
}

// `session` is the caller's own profile row (already carries ui_variant once the column exists)
export function resolveVariant(session) {
  const override = queryOverride();
  if (override) return override;
  const server = session && session.ui_variant;
  if (server === 'observatory' || server === 'legacy') return server;
  // 'auto', undefined (column not yet migrated), or null -> deterministic bucket
  return bucketOf(session && session.id) < ROLLOUT_PCT ? 'observatory' : 'legacy';
}

export function isEnrolled(session) {
  return resolveVariant(session) === 'observatory';
}
