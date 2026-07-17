# Build plan — current-wheel per-goal decomposition (staged, behind-the-flag)

Date: 2026-07-17
Status: **Ratified by the 8-agent build meeting (Lux, Satis, Accord, Jake, Geordi, Chekov,
La'an, Garak) — signed-with-conditions, zero dissent.** The actionable roadmap. Every stage is
built/merged **DARK** (`MAPPING_RATIFIED=false`, `CATEGORY_LIFE_AREA` empty, `useSlices`
guide-summer-only). **Stage V is the ONLY stage that ships / flips flags.**

Contract: `docs/design/2026-07-17-consolidated-build-conditions.md` (§1–§12). Each stage below
maps to the sections it must satisfy; C1 (§12) verifies against running code.
Decision log / minutes: evoke-agents-backup `agents/{decision-logs,meetings}/2026/07/2026-07-17-build-plan-current-wheel-per-goal-decomposition.md`.

## Progress
- **Stage P — COMPLETE (2026-07-17).** P1 (signed `discovery` key), P2 (`CURRENT_WHEEL_BUILD`
  flag + inverted `buildSlicePlan`, verified byte-identical while dark), P3 (`open_by_choice`
  v0.20 migration applied + wired through both adapters). All dark; production unchanged. Commits
  on `main`: discovery key + buildSlicePlan (5f515c4), migration file (9454175), adapter wiring (2296a08).
- **Stages O, M, R — BUILT, dark (2026-07-17).** O1 per-slice YEAR walk + O2 now+halfway reflect
  pass; M1–M3 per-goal arc + answerable weekly progressing question (Learning/Heart cadence split,
  `weeklyKindFor`) + daily tasks; R render/a11y conditions. New modules `js/goal-arc.js`,
  `js/weekly-answers.js`. All behind `CURRENT_WHEEL_BUILD` (still `false`); the legacy lumped grid
  is preserved when the flag is off (`renderSliceWalk()` vs `renderSlicePlanLegacy()`). Verified:
  flag dark, all JS parses, gating clean.
- **C1 verification — BUILT, all 3 PASS.** `scripts/c1.mjs` runner + c1-render-conditions /
  c1-read-only-to-system / c1-no-aggregation. Static halves done. **Owed at Stage V:** C1 #2's
  RUNTIME write-wall (La'an's binding assertion at `store.js` `saveGoal`).
- **Stage V — checklist drafted (`docs/design/2026-07-17-stage-v-flip-checklist.md`); NOT started.**
  The flag flip is gated on: the runtime write-wall, storage migrations (weekly answers off
  `localStorage`; goal-field projection), built-surface re-walk (Jake + Accord + Comes),
  live-browser walk (flag-on), and watch-with-a-real-learner. Flip waits for all of these.

## Two architectural rules that make the walls enforceable
- **Geordi's projection rule:** carried thresholds are **render-time projections, never
  persisted goal rows**; a learner's additions are **child records keyed to the threshold id**.
  This is what keeps §3 (read-only-to-system) true by construction and gives a clean migration
  for the 44 learners.
- **La'an's runtime write-wall (binding):** read-only-to-system is a **runtime assertion at the
  `store.js` write edge** — every goal-row write asserts the row is not carried/locked. "A wall
  you cannot enforce at runtime is not a wall." Not merely a build-time grep.

## Stages

### Stage P — Plumbing (data-dormant) — ✅ COMPLETE 2026-07-17
- **P1** add a signed `discovery` key to `THRESHOLD_LIFE_AREA` (Learning ×6, Heart ×4, Friends ×2),
  gated by the flag so `thresholdLifeArea()` still returns null.
- **P2** invert `buildSlicePlan` to plan on the current (Discovery) wheel; prefill via the `discovery` key.
- **P3** stored-open schema (`openByChoice` field, migration-safe for 44 learners); carried
  thresholds = render-time projections (never rows); learner additions = child records keyed to threshold id.
- `CATEGORY_LIFE_AREA` learner tiers stay EMPTY; `useSlices` unchanged. → satisfies §4, §2/§3 seam prep.

### Stage O — Onboarding per-slice walk (behind flag) — ✅ BUILT (dark) 2026-07-17
- Six Discovery pages: Movement → Learning → Heart → Family → Friends → Fun.
- year → now → write-halfway; carried thresholds broken out, read-only, **as a field**; authored
  "yours-to-fill" invitations (Family most careful); backward decompose **once** at halfway-goal setting.
- → satisfies §2, §4, §9.

### Stage M — Main-page per-goal arc (behind flag) — ✅ BUILT (dark) 2026-07-17
- FORWARD S1 → S2 → S3; weekly progressing question **pull-only, asked-live, this-week-only**;
  Learning = finish-shaped, Heart = presence register (invited); daily tasks under the week's answer;
  Session 4 renders identically regardless of on-time.
- → satisfies §1, §5, §6, §7, §8, §10, §11.

### Stage R — Render conditions (cross-cutting; gates O + M) — ✅ BUILT (dark) 2026-07-17
- Field-not-sequence (incl. a11y tree); no denominator/meter/red-zero; empty renders identically to
  unfinished at every zoom incl. a11y tree; no color-only; two doors 44×44.
- → satisfies §1, §2, a11y parity.

### Stage V — Verify + re-walk + flip (the ONLY stage that ships)
- Run the three C1 checks; runtime write-wall assertion live; built-surface re-walk
  (Jake + Accord + Comes) recorded as artifact; **watch-with-a-real-learner**; THEN flip
  `MAPPING_RATIFIED` / fill `CATEGORY_LIFE_AREA` / extend `useSlices`, each with a **signed audit entry**.
- → satisfies §12, §3 runtime, auditability.

## C1 verification — three standing tests (fail the build on regression)
1. **No-denominator:** CI grep over render modules (`" of "`, `N/M`, `%`, "left"/"remaining",
   fill-width bound to a count ratio, red-zero classes) **+** render-snapshot asserting no "N of M"
   text / no width bound to a count ratio (grep misses computed denominators); Chekov extends to the a11y tree.
2. **Read-only-to-system:** runtime assertion at the `store.js` write edge (La'an, binding) **+**
   static test that no threshold id is ever persisted as a goal row (Geordi's projection rule, testable).
3. **No-aggregation:** static + query test proving weekly answers and threshold-additions are discrete
   per-moment records with NO reduce/count/streak/trend/time-since query; absence proven by an explicit failing test.

## Action items (owners from the meeting)
- [ ] Stage P delta — P1 discovery key, P2 buildSlicePlan inversion, P3 schema + projection rule (Lux + Geordi)
- [ ] The three C1 standing tests (Garak + Satis)
- [ ] Runtime write-edge assertion at `store.js` (La'an + Lux)
- [ ] "Yours-to-fill" invitation copy, Family most careful, for re-walk review (Accord)
- [ ] a11y spec for Stage R — field-not-sequence in a11y tree, focus/landmarks, 44×44 (Chekov)
- [ ] Standing gate: built-surface re-walk before any flag flip (Jake + Accord + Comes)
- [ ] Audit-artifact template for the `MAPPING_RATIFIED` flip (Garak)

## Backward-lens nuance — RESOLVED
Execution FORWARD (locked). Backward honored without a new surface: decompose **once** at
halfway-goal setting; the finish-shaped weekly question is backward framing **expressed live,
this-week-only**. No surface renders the full backward ladder; no persisted plan beyond the
current week. Zoom (§8) + pull-only (§7) hold. Does not reopen the interaction-layer sign-off.
