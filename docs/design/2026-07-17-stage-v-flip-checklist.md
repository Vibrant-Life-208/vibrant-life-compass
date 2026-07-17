# Stage V - verify, re-walk, and flip (the only stage that ships)

Date: 2026-07-17
Status: **Checklist for the re-walk group (Jake + Accord + Comes) and the captain.** Stages
O, M, and R are built DARK behind `CURRENT_WHEEL_BUILD` (still `false`) on branch
`feat/stage-o-slice-walk` (7 commits, not pushed). This document is the exact sequence that
turns them on. Nothing here is autonomous: every step is captain-gated or human-signed,
because this is the first stage that reaches the 44 live learners.

Contract: `2026-07-17-consolidated-build-conditions.md` (§1-§12). Plan: `2026-07-17-build-plan.md`.

---

## 0. The flags, precisely (know what you are flipping)

| Flag | Location | Now | Gates |
|---|---|---|---|
| `CURRENT_WHEEL_BUILD` | `js/thresholds.js:128` | `false` | The current-wheel build: `buildSlicePlan` inversion to the Discovery wheel + prefill, `thresholdLifeArea('discovery', ...)`, the Stage O onboarding walk, the Stage M arc entry. **This is the flag the current-wheel ship flips.** |
| `MAPPING_RATIFIED` | `js/thresholds.js:119` | `false` | The LEGACY target-wheel (Adventure) placement only. **Leave it `false`. Do NOT flip it.** The 2026-07-16 tripwire and the in-code note at `thresholds.js:107-127` are explicit: the next activation is the current-wheel path via `CURRENT_WHEEL_BUILD`, not a re-enable of the old target-wheel flag. |
| `useSlices` | `js/year-view.js:352` | `learner.studio === 'guide-summer'` | Whether the learner Compass renders as a wheel-slice grouping (vs the flat category list). Extending it to Discovery re-homes the year view - see Step 4. |
| `CATEGORY_LIFE_AREA` (learner tiers) | `js/studios.js` | empty | The sibling category->slice placement for the slice-grouped Compass. Fill for Discovery when `useSlices` extends (Step 4). |

**The build plan's older "flip MAPPING_RATIFIED" wording predates the P2 flag split.** The
current-wheel gate is `CURRENT_WHEEL_BUILD`. Correct target below.

---

## 1. Preconditions - ALL must be true and signed before ANY flip

- [ ] **C1 - all three standing tests green.** `node scripts/c1.mjs` exits 0
      (render-conditions, read-only-to-system static, no-aggregation). Re-run on the exact
      commit being shipped.
- [ ] **C1 #2 runtime half BUILT and green** - La'an's binding write-wall (Section 2). This
      is the one remaining piece of code, and it touches the live store, so it is captain-gated.
- [ ] **Projection-rule migration landed** (Geordi) - the 44 existing learners carry the
      extended goal fields + weekly answers in synced storage (Section 3). No learner loses data.
- [ ] **Built-surface re-walk signed** - Jake (developer-grain / self-abandonment shadow),
      Accord (developmental grain / coverage frame), Comes (walk-as-user). This overrides the
      DATA-level sign-offs; a green test is not a walked surface.
- [ ] **Live-browser walk done** - the flag-on O walk (six Discovery slices, year + reflect)
      AND the M arc (open a goal, weekly answer, add/toggle a daily task, rest) clicked through
      in a real browser with a seeded Discovery learner. O/M/R were verified node-level only;
      the DOM wiring is verified by construction, not by a running app.
- [ ] **Watch-with-a-real-learner completed** - the standing gate on all exposure. A learner,
      watched, not a demo.
- [ ] **§11 check** - Heart-4 reads as portrait/becoming, not an inventory. If it reads as an
      inventory, `adv_effort` -> Learning is reopened FIRST (table J-a/J-c), before any flip.

If any box is unchecked, stop. The flip is the last thing, not the first.

---

## 2. La'an's runtime write-wall (build FIRST, before any flip)

The static half (C1 #2, `scripts/c1-read-only-to-system.mjs`) proves no dark code path
persists a threshold id as a goal row. The runtime half makes it a wall you cannot cross:

- [ ] Add an assertion at the **single store write edge** - `saveGoal` in `js/store.js:40`
      (dispatches to both adapters, so one assertion covers local + supabase). On every goal-row
      write, assert the row's `categoryId` is **not** a threshold id and the row is not a
      carried/locked projection. Throw on violation - "a wall you cannot enforce at runtime is
      not a wall."
- [ ] The predicate: a threshold id is any id in `THRESHOLDS.*.skills[].id` /
      `.character[].id` (all `adv_*`); a persisted slice goal is `slice_*`. They are
      namespace-disjoint (the static test proves it), so the runtime check is a cheap prefix
      assertion plus a carried/locked flag check.
- [ ] **Guard the live surface:** ship the assertion in a mode that logs-and-reports before it
      throws, verify zero violations against the 44 learners' real writes for one full session,
      THEN promote to throw. A buggy throwing assertion on the live write edge breaks goal
      saves for everyone - this is why it is captain-gated, not autonomous.
- [ ] Extend `scripts/c1.mjs` to exercise the runtime assertion (a unit call to `saveGoal`
      with a threshold-id categoryId must throw) so C1 #2 becomes static + runtime.

---

## 3. Storage migration (land before real learners generate data)

Today the extended goal fields (`weeklySteps`, `halfwayPoint`, `baseline`, ...) and the M2
weekly answers persist LOCAL-ONLY - supabase `goalToRow` drops the extended fields, and
`js/weekly-answers.js` writes a device-local `localStorage` key. That is fine while dark; it
is NOT fine once a real learner depends on cross-device continuity.

- [ ] Migration for the extended goal fields (Geordi's projection rule): learner additions are
      child records keyed to the threshold id; carried thresholds are never rows. Design the
      goals extended-field persistence (or a sibling table) to match.
- [ ] Migrate the weekly answers off `localStorage` (`hc_weekly_answers_v0`) into synced
      storage - a `weekly_answers` table or the goals extended-field store. **Preserve §5
      structurally:** the migrated store must still expose only get-one/save-one, no
      aggregation reader, no timestamp. Re-run `scripts/c1-no-aggregation.mjs` against the new
      store (extend it to point at the migrated path).
- [ ] The M3 daily tasks already use the real `tasks` table (`saveTask`/`toggleTaskDone`) - no
      migration needed there.

---

## 4. The flip sequence (each step = its own signed audit entry)

Order matters because the flags interact. Do them one at a time; verify between each.

### Step A - `CURRENT_WHEEL_BUILD` -> `true` (`js/thresholds.js:128`)
Activates: the Stage O onboarding walk, `buildSlicePlan` inversion + Discovery prefill,
`thresholdLifeArea('discovery')`, and the Stage M arc entry on the year-view slice cards
(`renderPitchSliceGoals`, which renders in the `!useSlices` branch - so at this step the arc
is reachable without touching `useSlices`).
- [ ] `node scripts/c1.mjs` green on the post-flip tree.
- [ ] Live walk: a Discovery pitcher onboards through the six-slice walk; the halfway goals
      land as Session-3 goals; opening a slice card opens the arc.
- [ ] Sign the audit entry (template below).

### Step B - extend `useSlices` to Discovery (`js/year-view.js:352`) + fill `CATEGORY_LIFE_AREA`
Re-homes the learner Compass from the flat list to the wheel-slice grouping. **Re-home the arc
entry:** the Stage M click handler currently lives in `renderPitchSliceGoals` (the `!useSlices`
branch, `year-view.js:458`); when `useSlices` includes Discovery, that branch no longer runs
for a Discovery learner, so move the flag-on arc-open handler onto the slice-grouped cards
(`buildCategoryCard` / the wheel-slice section). Fill `CATEGORY_LIFE_AREA` Discovery tiers per
the ratified 2026-07-16 category->slice placements (Character->Heart, Quest->Friends, etc.).
- [ ] Arc entry verified from the slice-grouped Compass (not just `renderPitchSliceGoals`).
- [ ] `node scripts/c1.mjs` green.
- [ ] Sign the audit entry.

### Step C - confirm `MAPPING_RATIFIED` stays `false`
- [ ] Verify it was NOT flipped. The legacy target-wheel path stays dead. Record the
      confirmation in the audit trail (a no-op is still a decision).

### Step D - remove the interim scaffolding (optional, post-stabilization)
The interim "From your pitch" orphan-slice section (`renderPitchSliceGoals`) and the year-view
visibility fix were bridges for the held state. Once Step B is stable and watched, retire them
so there is one Compass home. Own a re-walk on this change (schema/framing drift).

---

## 5. Audit-entry template (one per flip in Step 4)

```
## Stage V flip - <flag name> -> <new value>
Date: <YYYY-MM-DD>
Commit: <sha>            (the exact tree shipped)
Flipped by: <captain>
Signed present at flip: <re-walk names> + <captain>

Preconditions verified at flip time:
  - C1 (node scripts/c1.mjs): PASS at <sha>
  - Runtime write-wall: live, zero violations over <session>
  - Storage migration: landed, 44 learners intact (spot-checked <ids>)
  - Built-surface re-walk: signed <date> by Jake / Accord / Comes
  - Live-browser walk: done <date>, <who>
  - Watch-with-a-real-learner: <learner-context>, <date>, <who watched>

What this flip turns on: <one sentence>
Rollback point: <prior sha / one-line revert of this flag>
Coverage-frame spot check (§1): no denominator/meter observed on <surfaces walked>
Dissent / conditions carried: <none | ...>
```

File each entry to the fleet repo: `agents/decision-logs/YYYY/MM/YYYY-MM-DD-stage-v-flip-<flag>.md`
(use `agents/scripts/new-decision-log.sh`). Route any agent self-record updates through the
sanctioned Fleet MCP channel.

---

## 6. Rollback

Each flag is a one-line revert, and every stage was built to fail safe:
- [ ] **Instant:** set the flipped flag back to `false` (or `useSlices` back to guide-summer-only).
      Flag-off is byte-identical to pre-Stage-O (proven: `renderSlicePlanLegacy` diff, C1 tests,
      the O/M/R verification). The 44 learners return to exactly today's surface.
- [ ] Data written while flag-on (halfway Session-3 goals, weekly answers, daily tasks) persists
      and is harmless when the flag is off (it is just goal/task rows); no cleanup required to roll
      back the UI.
- [ ] If the runtime write-wall itself misfires, revert the assertion first (it is the only
      change that can break a flag-off learner), then investigate.

---

## 7. What "done" looks like

A Discovery learner, watched, onboards through the six-slice walk, sets a halfway goal per
active slice, opens a goal to a calm this-week/today arc, answers one weekly question, takes one
small step or rests - and at no point sees a denominator, a meter, a streak, or a slice that
reads as a deficit. The tool teaches the pattern and, over sessions, the learner needs it less.
Graduation, not engagement. We evoke, we never extract.
