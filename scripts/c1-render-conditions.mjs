// C1 render-conditions standing test (build plan Stage R / C1 #1; Garak + Satis).
//
// Fails the build if any current-wheel dark render surface (Stage O onboarding walk,
// Stage M per-goal arc) introduces a coverage-frame violation:
//   * a denominator / meter: "N of M", "N/M", a percentage, a width bound to a count ratio
//   * a SEQUENCE where a FIELD is required: an <ol>, or aria-posinset / aria-setsize
//   * a red-zero / deficit / behind state class
//   * a progress-bar / meter / fill class
//
// Two layers, because grep alone misses computed denominators (Claritas' note):
//   1. SOURCE GREP over the dark render modules for structural give-aways.
//   2. RENDER SNAPSHOT of the actual dark surfaces (arc + slice walk), asserting the
//      produced HTML carries none of the above - including the a11y-tree markers.
//
// Deliberately NOT grepped: the English words "left" / "remaining" / "behind". The
// coverage-frame copy legitimately says "leave this open" and "never behind" - those are
// the reassurance, not the violation. The rendered-text denominator patterns below catch
// an actual meter without false-failing good copy. Run: node scripts/c1-render-conditions.mjs

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const jsDir = path.join(here, '..', 'js');
const read = (f) => fs.readFileSync(path.join(jsDir, f), 'utf8');

const failures = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);

// ── forbidden patterns ───────────────────────────────────────────────────────
// Structural markers (safe to grep in source).
const STRUCTURAL = [
  { re: /<ol[\s>]/, name: 'ordered list <ol> (a list with an order is a ladder — §2 field-not-sequence)' },
  { re: /aria-posinset|aria-setsize/, name: 'aria-posinset/aria-setsize (position-in-sequence in the a11y tree — §2)' },
  { re: /class="[^"]*\b(progress-bar|meter|fill-bar|-fill|is-behind|is-overdue|is-zero|zero-state|red-zero|deficit)\b[^"]*"/, name: 'meter/fill/red-zero/deficit class (§1 no denominator/meter/red-zero)' },
  { re: /style="[^"]*width:\s*\d+%/, name: 'inline width bound to a percentage (a fill-meter — §1)' },
];
// Rendered-text denominators (assert against produced HTML).
const RENDERED = [
  { re: /\b\d+\s+of\s+\d+\b/, name: '"N of M" denominator (§1)' },
  { re: /\b\d+\s*\/\s*\d+\b/, name: '"N/M" denominator (§1)' },
  { re: /\b\d+\s*%/, name: 'a percentage (§1)' },
  { re: /\b\d+\s+(?:done|complete|completed|finished|left|remaining)\b/i, name: 'a count of done/left items (§1 coverage-frame)' },
];

function grepSource(file, src) {
  for (const p of STRUCTURAL) if (p.re.test(src)) fail(`source ${file}`, p.name);
}
function checkRendered(label, html) {
  for (const p of STRUCTURAL) if (p.re.test(html)) fail(`render ${label}`, p.name);
  for (const p of RENDERED) if (p.re.test(html)) fail(`render ${label}`, p.name);
}

// ── 1. SOURCE GREP ───────────────────────────────────────────────────────────
const goalArcSrc = read('goal-arc.js');
const modalsSrc = read('modals.js');
grepSource('goal-arc.js', goalArcSrc);
// Only the slice-walk + arc-modal region of modals.js is a current-wheel dark surface.
const walkStart = modalsSrc.indexOf('function renderSliceWalk(');
const walkEnd = modalsSrc.indexOf('function render()', walkStart);
grepSource('modals.js (slice walk)', modalsSrc.slice(walkStart, walkEnd > 0 ? walkEnd : undefined));

// ── 2. RENDER SNAPSHOT — Stage M arc (pure import) ───────────────────────────
const arc = await import('../js/goal-arc.js');
const goal = { id: 'g1', text: 'Move up two Khan units', categoryId: 'slice_learning', lifeArea: 'Learning' };
for (const [label, pos, tasks] of [
  ['arc S1', { session: 1, week: 1 }, [{ id: 't1', text: 'x', status: 'open' }, { id: 't2', text: 'y', status: 'done' }]],
  ['arc S2', { session: 2, week: 3 }, []],
  ['arc S3', { session: 3, week: 1 }, []],
  ['arc grace S4', { session: 4, week: 2 }, []],
]) {
  checkRendered(label, arc.renderGoalArcHtml(goal, { lifeArea: 'Learning', position: pos, todayTasks: tasks, weeklyAnswer: 'a' }));
}
// Heart variant (presence cadence)
checkRendered('arc Heart', arc.renderGoalArcHtml({ id: 'g2', text: 'keep going', lifeArea: 'Heart' }, { lifeArea: 'Heart', position: { session: 2, week: 1 }, todayTasks: [] }));

// ── 2b. RENDER SNAPSHOT — Stage O slice walk (extract closures, feed a fake plan) ──
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
const NAMES = ['walkSliceListFor', 'walkSliceList', 'sliceWalkChrome', 'sliceCarriedField', 'sliceInvitationCopy', 'sliceMaxAdd', 'carriedGoalCard', 'personalGoalCard', 'terminalLabel', 'renderSliceYearPage', 'renderSliceReflectPage'];
const body = NAMES.map(extract).join('\n');
const escapeHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escapeAttr = (s) => escapeHtml(s).replace(/'/g, '&#39;');
const getStudioName = (s) => ({ discovery: 'Discovery', adventure: 'Adventure' }[s] || s);
const lifeWheelSvgFor = () => '<svg/>';
// Refinement (2026-07-21): terminalLabel() is EXTRACTED from source (added to NAMES) so the guard
// exercises the REAL helper, not an approximation that could drift. It depends on the ARRIVAL_LABEL
// constant, which is not a function (so extract() can't grab it) - stub the constant here.
const ARRIVAL_LABEL = 'Enter your Compass';
const state = {
  sliceWalk: { pass: 'year', idx: 0 }, sliceText: { slice_movement: 'run a 5k' }, sliceLabels: {},
  openByChoice: ['slice_family'], sliceNow: {}, sliceHalfway: {},
};
const mk = new Function('escapeHtml', 'escapeAttr', 'getStudioName', 'lifeWheelSvgFor', 'ARRIVAL_LABEL', 'state',
  `${body}\nreturn { renderSliceYearPage, renderSliceReflectPage };`);
const walk = mk(escapeHtml, escapeAttr, getStudioName, lifeWheelSvgFor, ARRIVAL_LABEL, state);
const carriedNames = (n) => Array.from({ length: n }, (_, i) => ({ name: `Threshold ${i + 1}` }));
const plan = {
  wheelStudio: 'discovery', pitching: true, pitchTargetStudio: 'adventure', ratified: true,
  areas: [
    { label: 'Movement', sliceId: 'slice_movement', prefill: [] },
    { label: 'Learning', sliceId: 'slice_learning', prefill: carriedNames(6) },
    { label: 'Heart', sliceId: 'slice_heart', prefill: carriedNames(4) },
    { label: 'Family', sliceId: 'slice_family', prefill: [] },
    { label: 'Friends', sliceId: 'slice_friends', prefill: carriedNames(2) },
    { label: 'Fun', sliceId: 'slice_fun', prefill: [] },
  ],
};
// COVERAGE SELF-CHECK (Option C, 2026-07-21): exercise the extracted renders once up front and
// classify a runtime throw as COVERAGE OFF - a sandbox/helper gap (e.g. a renamed modals.js helper
// not stubbed here) - distinctly from a real violation. A silent helper-rename must never again
// disable this wall and read as an ordinary red. On COVERAGE OFF: fix the sandbox, not the app.
try {
  state.sliceWalk = { pass: 'year', idx: 0 }; walk.renderSliceYearPage(plan);
  state.sliceWalk = { pass: 'reflect', idx: 0 }; walk.renderSliceReflectPage(plan);
} catch (err) {
  console.error(`C1 RENDER-CONDITIONS: COVERAGE OFF - the slice-render sandbox could not execute (${err.name}: ${err.message}). This is a guard/stub gap, NOT a violation. Add the missing helper to the sandbox; do not change the app.`);
  process.exit(2);
}
for (let i = 0; i < plan.areas.length; i++) { state.sliceWalk = { pass: 'year', idx: i }; checkRendered(`slice year[${plan.areas[i].label}]`, walk.renderSliceYearPage(plan)); }
const active = plan.areas.filter((s) => (state.sliceText[s.sliceId] || '').trim() || s.prefill.length);
for (let i = 0; i < active.length; i++) { state.sliceWalk = { pass: 'reflect', idx: i }; checkRendered(`slice reflect[${active[i].label}]`, walk.renderSliceReflectPage(plan)); }

// ── 3. NO ALARM-ON-EMPTY, NO COLOUR-ONLY STATE (Stage R a11y) ────────────────
// An empty/coverage-frame state must never alarm the a11y tree; and every state must be
// carried in TEXT, not by colour/class alone. Prove it at the render level.
const arcDone = arc.renderGoalArcHtml(goal, { lifeArea: 'Learning', position: { session: 1, week: 1 }, todayTasks: [{ id: 't1', text: 'x', status: 'done' }] });
const arcEmpty = arc.renderGoalArcHtml(goal, { lifeArea: 'Learning', position: { session: 1, week: 1 }, todayTasks: [] });
if (/role="alert"|aria-live="assertive"/.test(arcDone + arcEmpty)) fail('a11y', 'alarm role/assertive live region in the arc (empty must not alarm)');
if (!/>Done</.test(arcDone)) fail('a11y', 'done state not carried in text (colour-only risk) — expected a visible "Done"');
if (!/you are here/.test(arcDone)) fail('a11y', 'current-phase state not carried in text — expected "you are here"');
// Empty today must read as invitation (rest is real), not a deficit.
if (!/a small step, or rest/i.test(arcEmpty)) fail('a11y', 'empty today panel is not framed as invitation');

// ── 4. BECOMING GOALS: no finish-line spine (built-surface re-walk 2026-07-17, Decision 2) ──
// A Heart/becoming goal must NEVER render the forward finish-line phase spine or the "finish
// line" grace - you do not cross a finish line on becoming heroic (§11; Comes + Accord
// convergent). The refusal is scoped: a skill goal (Learning) still gets the forward spine.
const heartArc = arc.renderGoalArcHtml({ id: 'gH', text: 'lead a Launch with courage', lifeArea: 'Heart' }, { lifeArea: 'Heart', position: { session: 3, week: 1 }, todayTasks: [] });
const learningArc = arc.renderGoalArcHtml(goal, { lifeArea: 'Learning', position: { session: 3, week: 1 }, todayTasks: [] });
// Structural sentinel (2026-07-20): assert against the arc-phase-name span, not phase copy -
// the spine only renders that span in the finish branch, so this is robust to phase renames
// (Plan/Do/Close) and to short-substring false positives (e.g. "Do" inside "Done").
if (/arc-phase-name/.test(heartArc)) fail('becoming', 'Heart arc renders a finish-line phase (arc-phase-name span) - no finish-shaped sequence over a becoming');
if (/you are here/.test(heartArc)) fail('becoming', 'Heart arc renders a "you are here" phase marker (a becoming has no phase position)');
if (/finish line/i.test(heartArc)) fail('becoming', 'Heart arc contains "finish line" language (a becoming is not finished)');
if (!/notice|becoming/i.test(heartArc)) fail('becoming', 'Heart arc lost its presence/noticing framing');
// Scoped, not a blanket removal: a skill goal still gets the forward spine + its "you are here".
if (!heartArc.includes('goal-arc-becoming')) fail('becoming', 'Heart arc is not tagged goal-arc-becoming');
if (!/arc-phase-name/.test(learningArc)) fail('becoming', 'Learning (skill) arc lost the forward phase spine - the fix must be scoped to becoming');
if (!/you are here/.test(learningArc)) fail('becoming', 'Learning (skill) arc lost its "you are here" phase marker');

// ── 4b. BECOMING CARVE-OUT IN THE PLANNING MODAL (openGoalSetupModal) ───────────
// The per-goal PLANNING modal must also refuse the finish sequence (milestones -> challenges
// -> setup) over a becoming goal - it gets a single presence reflection instead. The modal is
// DOM-driven (not a pure render fn), so this is a SOURCE-level tripwire: assert the branch
// exists so it cannot be silently removed. (2026-07-20, Accord + Comes carve-out.)
{
  const src = read('modals.js');
  const start = src.indexOf('export async function openGoalSetupModal');
  const rest = start >= 0 ? src.slice(start + 1) : '';
  const nextExport = rest.indexOf('\nexport ');
  const setupModal = nextExport >= 0 ? rest.slice(0, nextExport) : rest;
  if (!/const becoming = weeklyKindFor\(/.test(setupModal)) fail('becoming', 'openGoalSetupModal lost its becoming detection (weeklyKindFor)');
  if (!/becoming \? \['now', 'presence'\]/.test(setupModal)) fail('becoming', 'openGoalSetupModal becoming steps are not presence-only - a finish sequence leaked into a becoming');
  if (!/if \(becoming\) \{/.test(setupModal)) fail('becoming', 'openGoalSetupModal persist() lost its becoming branch - finish arrays could save on a becoming goal');
}

// ── report ───────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error('C1 RENDER-CONDITIONS: FAIL\n' + failures.map((f) => '  ✗ ' + f).join('\n'));
  process.exit(1);
}
console.log('C1 RENDER-CONDITIONS: PASS (no denominator / meter / sequence / red-zero across the Stage O + M dark render)');
