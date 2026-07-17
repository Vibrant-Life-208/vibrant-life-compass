// C1 #3 no-aggregation (build plan Stage V / C1 #3). Proves that the per-moment records
// the current-wheel build writes — the weekly progressing answers — are DISCRETE moments,
// never a dataset. Twelve answers is not a trend. The absence is proven, not assumed:
//
//   * the store exposes ONLY get-one and save-one for a specific (goal, session, week);
//   * there is NO list / all / count / streak / trend / recent / "last answered" reader;
//   * the source (facade + both backend adapters) contains no reduce / count / streak / trend;
//   * NO timestamp is stored, so "you last answered N days ago" is not even computable;
//   * reading one week never returns another (no carry-over that could be summed).
//
// MIGRATED PATH (flip-checklist §3): weekly answers now route through the store facade into
// SYNCED storage (local-store 'hc_weekly_answers_v0' for parity, or the supabase weekly_answers
// table, migration v0.21). This test points at that path: it scans the weekly-answers functions
// in BOTH adapters plus the facade, and exercises the real (local-backed) store end to end.
//
// (Threshold-additions — the other per-moment record the projection rule anticipates — do
// not exist in the build yet; when learner-per-threshold additions land, extend this test.)
// Run: node scripts/c1-no-aggregation.mjs

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const jsDir = path.join(here, '..', 'js');
const strip = (raw) => raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const failures = [];
const fail = (m) => failures.push(m);

// Extract a function body (export async function NAME(...) {...}) by brace matching.
function extractFn(src, name) {
  const sig = `function ${name}(`;
  const start = src.indexOf(sig);
  if (start < 0) return null;
  let depth = 0, began = false;
  for (let j = src.indexOf('{', start); j < src.length; j++) {
    if (src[j] === '{') { depth++; began = true; }
    else if (src[j] === '}') { depth--; if (began && depth === 0) return src.slice(start, j + 1); }
  }
  return null;
}

// The weekly-answers surface across the facade + both adapters. Scan only these functions,
// so timestamps that legitimately live on OTHER records in the adapters don't false-fail.
const facade = strip(fs.readFileSync(path.join(jsDir, 'weekly-answers.js'), 'utf8'));
const localSrc = fs.readFileSync(path.join(jsDir, 'backend', 'local-store.js'), 'utf8');
const supaSrc = fs.readFileSync(path.join(jsDir, 'backend', 'supabase-adapter.js'), 'utf8');

const weeklyFns = [];
for (const [label, src] of [['local-store', localSrc], ['supabase-adapter', supaSrc]]) {
  for (const name of ['getWeeklyAnswer', 'saveWeeklyAnswer']) {
    const body = extractFn(src, name);
    if (!body) { fail(`could not find ${name} in ${label}.js`); continue; }
    weeklyFns.push([`${label}.${name}`, strip(body)]);
  }
}
weeklyFns.push(['weekly-answers.js', facade]);

// 1. SOURCE: no aggregation primitives, and no timestamp (so no time-since is computable) in
//    any weekly-answers function, at any layer.
for (const [where, body] of weeklyFns) {
  for (const [re, why] of [
    [/\.reduce\s*\(/, 'reduce() — aggregation'],
    [/\bstreak\b/i, 'streak'],
    [/\btrend\b/i, 'trend'],
    [/\.length\b/, 'a .length read (a count)'],
    [/\bcreatedAt\b|\bupdatedAt\b|\bcreated_at\b|\bupdated_at\b|\btimestamp\b|getTime\s*\(|Date\.now\s*\(|new Date\b/, 'a timestamp — enables "last answered N days ago"'],
    [/\bconsistency\b|\baverage\b|\bstats\b/i, 'consistency/average/stats'],
    [/\.(?:select|from)\([^)]*\ball\b/i, 'a bulk/all read'],
  ]) {
    if (re.test(body)) fail(`${where} contains ${why}`);
  }
}

// 2. FACADE SURFACE: exactly get-one + save-one. No aggregation reader of any name.
globalThis.localStorage = (() => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
})();
const wa = await import('../js/weekly-answers.js');
const store = await import('../js/store.js');

const exportNames = Object.keys(wa).sort();
if (exportNames.join(',') !== 'getWeeklyAnswer,saveWeeklyAnswer') fail(`weekly-answers.js unexpected exports: [${exportNames}] (expected getWeeklyAnswer, saveWeeklyAnswer only)`);
// No aggregation reader for weekly answers exists on the store facade either.
for (const n of ['listWeeklyAnswers', 'getAllWeeklyAnswers', 'getWeeklyAnswers', 'countWeeklyAnswers', 'getWeeklyStreak', 'getWeeklyTrend', 'getRecentWeeklyAnswers']) {
  if (typeof store[n] !== 'undefined' || typeof wa[n] !== 'undefined') fail(`aggregation reader "${n}" exists`);
}

// 3. FUNCTIONAL (through the real store, local backend): discrete moments. Saving many weeks
//    never yields an aggregate; each read returns only its own week; a blank withdraws; no
//    timestamp is stored on the record.
await wa.saveWeeklyAnswer('L', { goalId: 'G', session: 1, week: 1, kind: 'finish', text: 'w1' });
await wa.saveWeeklyAnswer('L', { goalId: 'G', session: 1, week: 2, kind: 'finish', text: 'w2' });
await wa.saveWeeklyAnswer('L', { goalId: 'G', session: 2, week: 1, kind: 'presence', text: 's2w1' });
if (await wa.getWeeklyAnswer('L', 'G', 1, 1) !== 'w1') fail('week (1,1) did not read back its own answer');
if (await wa.getWeeklyAnswer('L', 'G', 1, 3) !== '') fail('an unanswered week returned non-empty (carry-over)');
await wa.saveWeeklyAnswer('L', { goalId: 'G', session: 1, week: 1, kind: 'finish', text: '' }); // blank withdraws
if (await wa.getWeeklyAnswer('L', 'G', 1, 1) !== '') fail('a withdrawn (blank) answer did not clear');
// Inspect raw synced storage: records carry ONLY {text, kind, session, week} — no time key.
const raw = JSON.parse(globalThis.localStorage.getItem('hc_weekly_answers_v0') || '{}');
for (const [k, rec] of Object.entries(raw)) {
  const keys = Object.keys(rec).sort().join(',');
  if (keys !== 'kind,session,text,week') fail(`record ${k} has unexpected keys "${keys}" (a stray timestamp/count would enable aggregation)`);
}
// The only way to get many answers is many single reads — there is no bulk path. Prove it.
if (typeof wa.getWeeklyAnswer !== 'function' || wa.getWeeklyAnswer.length < 3) fail('getWeeklyAnswer is not a per-(goal,session,week) single reader');

if (failures.length) {
  console.error('C1 NO-AGGREGATION: FAIL\n' + failures.map((f) => '  ✗ ' + f).join('\n'));
  process.exit(1);
}
console.log('C1 NO-AGGREGATION: PASS (weekly answers are discrete per-moment records across the synced store; no aggregation reader, no timestamp, no trend/streak path)');
