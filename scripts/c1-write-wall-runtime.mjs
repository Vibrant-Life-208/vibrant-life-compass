// C1 #2 read-only-to-system — RUNTIME half (La'an's binding write-wall). The static test
// (c1-read-only-to-system.mjs) proves no dark code PATH persists a threshold id as a goal
// row. This test proves the WALL: it exercises the real store write edge — saveGoal in
// js/store.js — and shows a threshold-id goal write is refused there, while a legitimate
// slice_* goal write passes. "A wall you cannot enforce at runtime is not a wall."
//
// Together with the static half, this closes C1 #2 (static + runtime).
// Run: node scripts/c1-write-wall-runtime.mjs

// localStorage shim so store.js -> local-store.js runs headless (same shim the other C1
// runtime test uses). BACKEND_TYPE defaults to 'local', so saveGoal routes to local-store.
globalThis.localStorage = (() => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
})();

const store = await import('../js/store.js');
const wall = await import('../js/goal-write-wall.js');

const failures = [];
const fail = (m) => failures.push(m);

// A threshold id and a legitimate slice-goal id, drawn from the real namespaces.
const THRESHOLD_ID = 'adv_khan'; // THRESHOLDS.adventure.skills[].id
const SLICE_ID = 'slice_learning'; // a persisted slice goal is slice_*

// 0. Sanity: the wall recognises the two namespaces correctly.
if (!wall.isThresholdId(THRESHOLD_ID)) fail(`isThresholdId did not flag "${THRESHOLD_ID}"`);
if (wall.isThresholdId(SLICE_ID)) fail(`isThresholdId wrongly flagged "${SLICE_ID}"`);
if (wall.getWriteWallMode() !== 'report') fail(`shipped default mode is "${wall.getWriteWallMode()}", expected "report" (live-surface guard)`);

// 1. LIVE-SURFACE GUARD (report mode, the shipped default): a threshold-id write is logged
//    loudly but still PROCEEDS — a buggy assertion must never break goal saves for learners.
const warnings = [];
const origWarn = console.warn;
console.warn = (...a) => warnings.push(a.join(' '));
try {
  const row = await store.saveGoal({ learnerId: 'L', categoryId: THRESHOLD_ID, text: 'should be reported, not blocked' });
  if (!row) fail('report mode: saveGoal did not return a row (report must not block the live write)');
  if (!warnings.some((w) => /goal-write-wall/.test(w))) fail('report mode: no [goal-write-wall] warning was emitted at the write edge (wall not wired into saveGoal)');
} catch (e) {
  fail(`report mode: saveGoal threw instead of reporting (live surface not guarded): ${e.message}`);
} finally {
  console.warn = origWarn;
}

// 2. ENFORCEMENT (throw mode): promote the wall and prove the write edge REFUSES a
//    threshold-id goal write. This is the runtime wall the static test cannot assert.
wall.setWriteWallMode('throw');
let threw = false;
try {
  await store.saveGoal({ learnerId: 'L', categoryId: THRESHOLD_ID, text: 'must be refused' });
} catch (e) {
  threw = /goal-write-wall/.test(e.message);
}
if (!threw) fail(`throw mode: saveGoal did NOT refuse a threshold-id goal write (categoryId "${THRESHOLD_ID}")`);

// 2b. A threshold id smuggled in as the row's own id is refused too.
let threwId = false;
try {
  await store.saveGoal({ learnerId: 'L', id: THRESHOLD_ID, categoryId: SLICE_ID, text: 'threshold id as row id' });
} catch (e) {
  threwId = /goal-write-wall/.test(e.message);
}
if (!threwId) fail(`throw mode: saveGoal did NOT refuse a row whose id is a threshold id ("${THRESHOLD_ID}")`);

// 3. A LEGITIMATE slice goal still writes cleanly, even in throw mode — the wall blocks only
//    threshold rows, never real goals.
try {
  const row = await store.saveGoal({ learnerId: 'L', categoryId: SLICE_ID, text: 'a real slice goal' });
  if (!row || !row.id) fail('throw mode: a legitimate slice_* goal write was blocked (false positive)');
} catch (e) {
  fail(`throw mode: a legitimate slice_* goal write threw (false positive): ${e.message}`);
}

// Restore the shipped default so the module state is not left promoted.
wall.setWriteWallMode('report');

if (failures.length) {
  console.error('C1 READ-ONLY-TO-SYSTEM (runtime): FAIL\n' + failures.map((f) => '  ✗ ' + f).join('\n'));
  process.exit(1);
}
console.log('C1 READ-ONLY-TO-SYSTEM (runtime): PASS (saveGoal refuses a threshold-id goal row at the store write edge; slice_* goals write cleanly; live surface guarded in report mode)');
