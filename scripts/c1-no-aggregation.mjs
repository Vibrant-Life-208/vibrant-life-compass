// C1 #3 no-aggregation (build plan Stage V / C1 #3). Proves that the per-moment records
// the current-wheel build writes — the weekly progressing answers — are DISCRETE moments,
// never a dataset. Twelve answers is not a trend. The absence is proven, not assumed:
//
//   * the store exposes ONLY get-one and save-one for a specific (goal, session, week);
//   * there is NO list / all / count / streak / trend / recent / "last answered" reader;
//   * the source contains no reduce / count / streak / trend / aggregate / sum;
//   * NO timestamp is stored, so "you last answered N days ago" is not even computable;
//   * reading one week never returns another (no carry-over that could be summed).
//
// (Threshold-additions — the other per-moment record the projection rule anticipates — do
// not exist in the build yet; when learner-per-threshold additions land, extend this test.)
// Run: node scripts/c1-no-aggregation.mjs

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const rawSrc = fs.readFileSync(path.join(here, '..', 'js', 'weekly-answers.js'), 'utf8');
// Grep CODE, not comments: the module's own doc-comment names what it refuses to do
// ("no streak, trend, timestamp..."), so strip comments before scanning for primitives.
const src = rawSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const failures = [];
const fail = (m) => failures.push(m);

// localStorage shim so the module runs headless.
globalThis.localStorage = (() => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
})();
const wa = await import('../js/weekly-answers.js');

// 1. SURFACE: exactly get-one + save-one. No aggregation reader of any name.
const exportNames = Object.keys(wa).sort();
if (exportNames.join(',') !== 'getWeeklyAnswer,saveWeeklyAnswer') fail(`unexpected exports: [${exportNames}] (expected getWeeklyAnswer, saveWeeklyAnswer only)`);
for (const n of exportNames) {
  if (/list|all|count|streak|trend|history|recent|last|aggregate|sum|tally|series|stats/i.test(n)) fail(`export "${n}" smells like an aggregation reader`);
}
// Common aggregation reader names must be undefined.
for (const n of ['listWeeklyAnswers', 'getAllWeeklyAnswers', 'getWeeklyAnswers', 'countWeeklyAnswers', 'getStreak', 'getTrend', 'getRecent']) {
  if (typeof wa[n] !== 'undefined') fail(`aggregation reader "${n}" exists`);
}

// 2. SOURCE: no aggregation primitives, and no timestamp (so no time-since is computable).
for (const [re, why] of [
  [/\.reduce\s*\(/, 'reduce() — aggregation'],
  [/\bstreak\b/i, 'streak'],
  [/\btrend\b/i, 'trend'],
  [/\.length\b(?![^\n]*JSON)/, 'a .length read (a count) — none expected in this store'],
  [/\bcreatedAt\b|\bupdatedAt\b|\btimestamp\b|getTime\s*\(|Date\.now\s*\(|new Date\b/, 'a timestamp — enables "last answered N days ago"'],
  [/\bconsistency\b|\baverage\b|\bstats\b/i, 'consistency/average/stats'],
]) {
  if (re.test(src)) fail(`weekly-answers.js source contains ${why}`);
}

// 3. FUNCTIONAL: discrete moments. Saving many weeks never yields an aggregate; each read
//    returns only its own week; no timestamp is stored on the record.
const L = 'L', G = 'G';
wa.saveWeeklyAnswer(L, { goalId: G, session: 1, week: 1, kind: 'finish', text: 'w1' });
wa.saveWeeklyAnswer(L, { goalId: G, session: 1, week: 2, kind: 'finish', text: 'w2' });
wa.saveWeeklyAnswer(L, { goalId: G, session: 2, week: 1, kind: 'presence', text: 's2w1' });
if (wa.getWeeklyAnswer(L, G, 1, 1) !== 'w1') fail('week (1,1) did not read back its own answer');
if (wa.getWeeklyAnswer(L, G, 1, 3) !== '') fail('an unanswered week returned non-empty (carry-over)');
// Inspect raw storage: records carry ONLY {text, kind, session, week} — no time key.
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
console.log('C1 NO-AGGREGATION: PASS (weekly answers are discrete per-moment records; no aggregation reader, no timestamp, no trend/streak path)');
