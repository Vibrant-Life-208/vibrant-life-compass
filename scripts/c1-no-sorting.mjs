// C1 no-sorting standing test (build plan Stage R / C1 #5; Garak + Satis).
//
// Fails the build if any current-wheel DARK render surface (Stage O onboarding slice walk,
// Stage M per-goal arc, the per-goal milestone/goal-setup flow) SORTS a learner - in either
// direction. Enforces the three circle-review principles (see
// docs/design/2026-07-17-discovery-flow-design-principles.md):
//   PDC  no sorting - every path whole; age = timing, never tier ("not yet" != "not enough")
//   SSC  the app never scores - no verdict, no rank, no pass/fail state in the app
//   MAC  belonging not achievement - and the belonging-myth must not rank ITSELF above
//        achievement (the anti-ladder catch): sort in NEITHER direction. The copy must not
//        "know there was a ladder" - no consolation flinch, no "at least you", no "even though
//        you didn't move up".
//
// Two layers, like c1-render-conditions:
//   1. SOURCE GREP over the dark render regions (goal-arc.js; the openGoalSetupModal region and
//      the slice-walk region of modals.js) for the forbidden phrases.
//   2. RENDER SNAPSHOT of the actual dark surfaces (arc + slice walk), for BOTH a pitching plan
//      and a stayer plan, asserting neither renders a sorting phrase AND the stayer is handed a
//      whole invitation, never a void.
//
// SCOPING is deliberate and load-bearing: we scan only current-wheel dark regions. The legacy
// Adventure surfaces (e.g. year-view's "Approved" badge, the 9-stage year-goal modal) are NOT in
// scope - they are the pre-existing flow the current wheel is replacing, and the SSC's
// approval->witness conversion is a separate design task, not this guard's to fail the build on.
//
// Patterns are NARROW on purpose: bare "at least" ("set at least 5 goals") and bare "more than"
// ("helps more than the impressive one") are legitimate; only the consolation/ranking SHAPES fail
// ("at least you", "more than those who"). A self-test at the end proves the checker is not
// vacuous. Run: node scripts/c1-no-sorting.mjs

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const jsDir = path.join(here, '..', 'js');
const read = (f) => fs.readFileSync(path.join(jsDir, f), 'utf8');

const failures = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);

// ── forbidden SORTING patterns (narrow shapes, not bare words) ────────────────
const SORTING = [
  // Between-paths ranking - one path framed as the real / better / braver / deeper one.
  { re: /\bthe real (path|one|journey|goal|version|year)\b/i, name: 'ranks a path as "the real one" (§PDC no-sorting)' },
  { re: /\b(braver|bravest|deeper|deepest|better|best|higher|realer|truer|wiser) (choice|path|journey|road|way|kind|version)\b/i, name: 'ranks one path above another - incl. the anti-ladder direction (§MAC sort-in-neither-direction)' },
  { re: /\bthose who (stay|stayed|move|moved|pitch|pitched|climb|climbed|didn)/i, name: 'compares to "those who ..." (§PDC no-sorting)' },
  { re: /\bunlike (the|those|other)\b/i, name: 'sets this learner against "unlike the others" (§PDC no-sorting)' },
  { re: /\bmore than (the|those|other) (who|kids|learners|ones|others)\b/i, name: 'ranks "more than those who ..." (§PDC no-sorting)' },
  // Consolation flinch - the copy must not "know there was a ladder".
  { re: /\bat least you\b/i, name: 'consolation "at least you ..." (§MAC the copy must not know there was a ladder)' },
  { re: /\beven (if|though) you (didn|don|can|aren|couldn|weren)/i, name: 'consolation "even though you didn\'t ..." (§MAC consolation flinch)' },
  { re: /\binstead of (moving|pitching|climbing|going up|leveling up)\b/i, name: 'frames the year as "instead of moving up" (§MAC consolation flinch)' },
  { re: /\bsince you'?re (staying|not moving)\b/i, name: 'frames content as contingent on "since you\'re staying" (§MAC consolation flinch)' },
  // Verdict / score / pass-fail - the app never scores, the pitch is never staged in-app.
  { re: /\byou (passed|failed)\b/i, name: 'renders a pass/fail verdict (§SSC app-never-scores)' },
  { re: /\b(didn'?t|did not) (make it|move up|get in|make the cut)\b/i, name: 'renders a "didn\'t make it" outcome (§SSC app-never-scores)' },
  { re: /\bfell short\b/i, name: 'renders a "fell short" state (§SSC app-never-scores)' },
  { re: /\byour (score|rank|ranking|grade|standing)\b/i, name: 'renders a score/rank (§SSC app-never-scores)' },
  // Age = timing, never tier.
  { re: /\bnot (good )?enough\b/i, name: '"not (good) enough" - readiness framed as worth (§PDC age = timing not tier)' },
  { re: /\bnot old enough\b/i, name: '"not old enough" - age as a gate on worth (§PDC timing not tier)' },
  { re: /\btoo young\b/i, name: '"too young" - age as deficit (§PDC timing not tier)' },
];

function check(where, text) {
  for (const p of SORTING) if (p.re.test(text)) fail(where, p.name);
}

// ── 1. SOURCE GREP over the dark current-wheel regions ───────────────────────
const goalArcSrc = read('goal-arc.js');
check('source goal-arc.js', goalArcSrc);

const modalsSrc = read('modals.js');
// openGoalSetupModal region: from its export to the next top-level export.
const gsStart = modalsSrc.indexOf('export async function openGoalSetupModal');
const gsEnd = modalsSrc.indexOf('\nexport ', gsStart + 1);
check('source modals.js (openGoalSetupModal)', modalsSrc.slice(gsStart, gsEnd > 0 ? gsEnd : undefined));
// slice-walk region: from renderSliceWalk to the next render() (same bound render-conditions uses).
const walkStart = modalsSrc.indexOf('function renderSliceWalk(');
const walkEnd = modalsSrc.indexOf('function render()', walkStart);
check('source modals.js (slice walk)', modalsSrc.slice(walkStart, walkEnd > 0 ? walkEnd : undefined));

// ── 2. RENDER SNAPSHOT — Stage M arc (pure import), skill + becoming ──────────
const arc = await import('../js/goal-arc.js');
const skillGoal = { id: 'g1', text: 'Move up two Khan units', categoryId: 'slice_learning', lifeArea: 'Learning' };
for (const [label, pos, tasks] of [
  ['arc S1', { session: 1, week: 1 }, [{ id: 't1', text: 'x', status: 'open' }, { id: 't2', text: 'y', status: 'done' }]],
  ['arc S3', { session: 3, week: 1 }, []],
  ['arc grace S4', { session: 4, week: 2 }, []],
]) {
  check(`render ${label}`, arc.renderGoalArcHtml(skillGoal, { lifeArea: 'Learning', position: pos, todayTasks: tasks, weeklyAnswer: 'a' }));
}
check('render arc Heart', arc.renderGoalArcHtml({ id: 'g2', text: 'lead a Launch with courage', lifeArea: 'Heart' }, { lifeArea: 'Heart', position: { session: 2, week: 1 }, todayTasks: [] }));

// ── 2b. RENDER SNAPSHOT — slice walk, BOTH a pitching plan AND a stayer plan ──
function extract(name) {
  const start = modalsSrc.indexOf(`function ${name}(`);
  if (start < 0) throw new Error('not found in modals.js: ' + name);
  let depth = 0, began = false;
  for (let j = modalsSrc.indexOf('{', start); j < modalsSrc.length; j++) {
    if (modalsSrc[j] === '{') { depth++; began = true; }
    else if (modalsSrc[j] === '}') { depth--; if (began && depth === 0) return modalsSrc.slice(start, j + 1); }
  }
  throw new Error('unbalanced: ' + name);
}
const NAMES = ['walkSliceListFor', 'walkSliceList', 'sliceWalkChrome', 'sliceCarriedField', 'sliceInvitationCopy', 'sliceMaxAdd', 'carriedGoalCard', 'personalGoalCard', 'renderSliceYearPage', 'renderSliceReflectPage'];
const body = NAMES.map(extract).join('\n');
const escapeHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escapeAttr = (s) => escapeHtml(s).replace(/'/g, '&#39;');
const getStudioName = (s) => ({ discovery: 'Discovery', adventure: 'Adventure' }[s] || s);
const lifeWheelSvgFor = () => '<svg/>';
const state = { sliceWalk: { pass: 'year', idx: 0 }, sliceText: {}, sliceLabels: {}, openByChoice: [], sliceNow: {}, sliceHalfway: {} };
const mk = new Function('escapeHtml', 'escapeAttr', 'getStudioName', 'lifeWheelSvgFor', 'state',
  `${body}\nreturn { renderSliceYearPage, renderSliceReflectPage, sliceInvitationCopy };`);
const walk = mk(escapeHtml, escapeAttr, getStudioName, lifeWheelSvgFor, state);
const carriedNames = (n) => Array.from({ length: n }, (_, i) => ({ name: `Threshold ${i + 1}` }));

const pitchingPlan = {
  wheelStudio: 'discovery', pitching: true, pitchTargetStudio: 'adventure', ratified: true,
  areas: [
    { label: 'Movement', sliceId: 'slice_movement', prefill: [] },
    { label: 'Learning', sliceId: 'slice_learning', prefill: carriedNames(6) },
    { label: 'Heart', sliceId: 'slice_heart', prefill: carriedNames(4) },
    { label: 'Friends', sliceId: 'slice_friends', prefill: carriedNames(2) },
  ],
};
// The stayer: no carried thresholds, not pitching - the path the flow most easily shortchanges.
const stayerPlan = {
  wheelStudio: 'discovery', pitching: false, pitchTargetStudio: null, ratified: true,
  areas: [
    { label: 'Movement', sliceId: 'slice_movement', prefill: [] },
    { label: 'Learning', sliceId: 'slice_learning', prefill: [] },
    { label: 'Heart', sliceId: 'slice_heart', prefill: [] },
    { label: 'Friends', sliceId: 'slice_friends', prefill: [] },
  ],
};
for (const [planLabel, plan] of [['pitching', pitchingPlan], ['stayer', stayerPlan]]) {
  for (let i = 0; i < plan.areas.length; i++) {
    state.sliceWalk = { pass: 'year', idx: i };
    check(`render slice year[${planLabel}/${plan.areas[i].label}]`, walk.renderSliceYearPage(plan));
  }
}

// ── 3. NO-SORTING POSITIVE: the stayer is handed a whole invitation, not a void ──
// A blank slice for a stayer must render real invitational content (§PDC: blank = invitation,
// not void). Prove the stayer's year page is non-trivial and carries the invitation copy.
state.sliceWalk = { pass: 'year', idx: 0 };
const stayerPage = walk.renderSliceYearPage(stayerPlan);
const invite = walk.sliceInvitationCopy('Movement');
if (!invite || String(invite).trim().length < 8) fail('no-sorting positive', 'sliceInvitationCopy returned empty/trivial - a blank slice would be a void, not an invitation');
if (stayerPage.replace(/<[^>]+>/g, '').trim().length < 20) fail('no-sorting positive', 'stayer year page renders near-empty - the stayer is being handed a void, not a whole year');

// ── 4. SELF-TEST: prove the checker is not vacuous ───────────────────────────
// Feed a known-bad string through the same checker into a throwaway sink; it MUST trip.
const sink = [];
const sinkPush = (w, m) => sink.push(`${w}: ${m}`);
for (const p of SORTING) if (p.re.test('even though you didn\'t make it, at least you tried the braver path')) sinkPush('selftest', p.name);
if (sink.length === 0) fail('selftest', 'the no-sorting checker matched nothing on a deliberately-sorting string - patterns are broken/vacuous');

// ── report ───────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error('C1 NO-SORTING: FAIL\n' + failures.map((f) => '  ✗ ' + f).join('\n'));
  process.exit(1);
}
console.log('C1 NO-SORTING: PASS (no sorting in either direction across the Stage O + M dark render; stayer handed a whole invitation; checker self-test tripped)');
