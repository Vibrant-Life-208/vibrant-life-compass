// dead-watch.js — Phase 0 "dark period" instrumentation + kill-switches for deletion candidates.
//
// Purpose: leave a trace whenever a RETIREMENT CANDIDATE actually runs in production, so we can
// PROVE it is dead (or confirm it is live) before deleting anything. Default = ON (no behavior change).
//
// Kill-switch (turn a candidate OFF without deleting it) via any of:
//   - window.__HC_RUNTIME_CONFIG__.deadWatch[key] === false
//   - localStorage 'hc_dead_off' = comma-separated keys  (e.g. "patterns")
//   - ?deadoff=<key>   (also persisted to localStorage so it survives offline reloads)
// Coarse keys: 'patterns', 'profileFoundations', 'legacyToRegion'.
//
// WARNING: legacyToRegion is DATA-BACKED. Its kill-switch must NEVER be flipped before the
// expand-contract migration completes; callers hard-guard it to a safe pass-through regardless.

const seen = new Set();
if (typeof window !== 'undefined' && !window.__HC_DEAD_WATCH) {
  window.__HC_DEAD_WATCH = { hits: {} };
}

function offSet() {
  const s = new Set();
  try {
    const cfg = window.__HC_RUNTIME_CONFIG__ && window.__HC_RUNTIME_CONFIG__.deadWatch;
    if (cfg) for (const k in cfg) if (cfg[k] === false) s.add(k);
  } catch (_) {}
  try {
    const q = new URLSearchParams(location.search).get('deadoff');
    if (q) localStorage.setItem('hc_dead_off', q);
  } catch (_) {}
  try {
    const ls = localStorage.getItem('hc_dead_off');
    if (ls) ls.split(',').forEach((k) => s.add(k.trim()));
  } catch (_) {}
  return s;
}

// true = candidate is live (default). false = killed via a switch above.
export function deadEnabled(key) {
  return !offSet().has(key);
}

// leave a trace when a candidate runs; once per tag per page load + a running counter.
export function deadWatch(tag) {
  try {
    const w = window.__HC_DEAD_WATCH;
    w.hits[tag] = (w.hits[tag] || 0) + 1;
    if (!seen.has(tag)) {
      seen.add(tag);
      console.info(`[dead-watch:${tag}] fired (candidate ran in production)`);
    }
  } catch (_) {}
}
