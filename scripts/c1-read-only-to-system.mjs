// C1 #2 read-only-to-system — STATIC half (build plan Stage V / C1 #2; Geordi's
// projection rule, testable). La'an's binding RUNTIME write-wall at the store.js write
// edge is a separate piece (c1-write-wall-runtime.mjs + js/goal-write-wall.js); it ships in
// log-and-report mode to guard the live store, and its promotion to throw is captain-gated
// (Stage V). This test proves the static invariant that makes the wall true by construction:
//
//   A carried threshold is a render-time PROJECTION, never a persisted goal row.
//   No goal row is ever written whose category is a threshold id.
//
// If a future edit tried to persist a carried threshold (auto-complete it, snapshot it,
// "save the pitch goals"), the id namespaces would collide and this test would fail.
// Run: node scripts/c1-read-only-to-system.mjs

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { THRESHOLDS } from '../js/thresholds.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const jsDir = path.join(here, '..', 'js');
const read = (f) => fs.readFileSync(path.join(jsDir, f), 'utf8');

const failures = [];
const fail = (m) => failures.push(m);

// Every threshold id across every studio.
const thresholdIds = Object.values(THRESHOLDS).flatMap((t) => [...(t.skills || []), ...(t.character || [])].map((it) => it.id));

// 1. NAMESPACE DISJOINT: threshold ids and slice ids can never collide. Persisted rows in
//    the dark build are keyed by slice id (slice_*); thresholds are adv_*. Disjoint by
//    construction, so a threshold id can never masquerade as a persisted slice goal.
if (!thresholdIds.length) fail('no threshold ids found — test cannot run');
for (const id of thresholdIds) {
  if (/^slice_/.test(id)) fail(`threshold id "${id}" collides with the slice_* namespace`);
}

// Extract a function body from a source string by brace matching.
function extract(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) return null;
  let depth = 0, began = false;
  for (let j = src.indexOf('{', start); j < src.length; j++) {
    if (src[j] === '{') { depth++; began = true; }
    else if (src[j] === '}') { depth--; if (began && depth === 0) return src.slice(start, j + 1); }
  }
  return null;
}

const modals = read('modals.js');
const goalArc = read('goal-arc.js');

// 2. PERSISTENCE IS SLICE-KEYED: the two dark write paths must key goal rows by the slice
//    id, never by a threshold id or a carried-threshold item id.
for (const fn of ['upsertYearGoals', 'persistHalfwayGoals', 'persistSliceGoals']) {
  const body = extract(modals, fn);
  if (!body) { fail(`could not find ${fn} in modals.js`); continue; }
  if (!/categoryId:\s*sliceId\b/.test(body)) fail(`${fn}: a persisted goal row is not keyed by sliceId (categoryId: sliceId expected)`);
  // No threshold id literal, and no carried-item id (t.id / item.id / prefill) reaches a write.
  for (const id of thresholdIds) if (body.includes(id)) fail(`${fn}: references threshold id "${id}" in a write path`);
  if (/\b(?:t|item)\.id\b|\.prefill\b/.test(body)) fail(`${fn}: a carried-threshold item id / prefill flows into a write path`);
}

// 3. THE CARRIED FIELD IS RENDER-ONLY: the projection helper never persists anything.
const carried = extract(modals, 'sliceCarriedField');
if (!carried) fail('could not find sliceCarriedField in modals.js');
else if (/\bsave(Goal|Task|Learner)\s*\(/.test(carried)) fail('sliceCarriedField persists (must be render-only projection)');

// 4. goal-arc.js is a pure render module — it must not write goal rows itself (persistence
//    lives in openGoalArcModal via the store, and only for tasks + weekly answers).
if (/\bsaveGoal\s*\(/.test(goalArc)) fail('goal-arc.js calls saveGoal (must be render-only; no goal-row writes)');

// 5. The carried thresholds render from slice.prefill (projections). Confirm the prefill
//    items are consumed for DISPLAY only (name), never handed to a save in the walk region.
const walk = modals.slice(modals.indexOf('function renderSliceWalk('), modals.indexOf('function render()', modals.indexOf('function renderSliceWalk(')));
if (/\.prefill\b[^;]*save(Goal|Task)/.test(walk)) fail('a carried projection (prefill) flows into a save in the slice walk');

if (failures.length) {
  console.error('C1 READ-ONLY-TO-SYSTEM (static): FAIL\n' + failures.map((f) => '  ✗ ' + f).join('\n'));
  process.exit(1);
}
console.log(`C1 READ-ONLY-TO-SYSTEM (static): PASS (${thresholdIds.length} threshold ids; none persisted as a goal row; carried field is a render-only projection)`);
