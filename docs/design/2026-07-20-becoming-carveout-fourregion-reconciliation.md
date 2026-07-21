# Coordination note — becoming carve-out ↔ four-region Life/Grows migration

**Date:** 2026-07-20. **Status:** coordination handoff between two live sessions touching the same file. **Purpose:** migrate becoming-detection ONCE, not twice.
**Refs:** `2026-07-20-four-region-compass-mapping-v1.md` (change surface item 3), `2026-07-20-goal-model-plan-do-close-reflect-build-plan.md`, `evoke-agents-backup/.../CADENCE-UNIFICATION.md`. SSC invariant: goal-model becoming carve-out (Accord + Comes, 2026-07-17 Dec. 2).

---

## The collision (one file, two workstreams)

- **Wheel session** — change-surface item 3: *"`goal-arc.js` `BECOMING_SLICES` → becoming = the Grows/disposition side, not a region set."* Already shimmed `voice` into `BECOMING_SLICES` for backward-compat.
- **Goal-model session** (shipped today — `2c91dbc`, `810e06b`): the **becoming carve-out** detects becoming via `weeklyKindFor(lifeArea)` / `BECOMING_SLICES` in **three** places:
  - `js/goal-arc.js` — `renderGoalArcHtml` becoming branch (presence line vs Plan/Do/Close spine), `weeklyPrompt`.
  - `js/modals.js` — `openGoalSetupModal`: `const becoming = weeklyKindFor(lifeArea) === 'presence'` → the presence step + the persist branch (no finish arrays over a becoming).
  - `scripts/c1-render-conditions.mjs` — the tripwire guarding both.

Both sessions edit the same detection. If it moves to a per-goal Grows-flag on one side while the other stays area-based, they conflict **and the SSC carve-out silently breaks.**

## The target model (from the ratified mapping)

Becoming = the **Grows side** of any region, via a **per-goal flag** — not a fixed area set. Every region has a **Life** track (doing → Plan/Do/Close, finish-shaped) and a **Grows** track (witnessed → presence). **VOICE is entirely Grows.**

## Decisions the two sessions must agree BEFORE either edits detection again

1. **The flag — name + storage.** Proposal: `goal.track: 'life' | 'grows'` (or `goal.becoming: boolean`), riding the `decomposition` jsonb (add to `DECOMPOSITION_FIELDS`). VOICE-region goals force `grows` regardless of flag.
2. **The detection function.** Replace `weeklyKindFor(lifeArea)` with **`goalIsBecoming(goal)`** reading the per-goal track — with VOICE-region → always becoming, and a **legacy fallback**: a goal with no `track` falls back to the old area check (`Heart/Spirit/Emotions/Voice → grows`) until the v0.27 migration backfills. No regression for the 44 live learners.
3. **Who sets the track (new UX).** The setup flow (`openGoalSetupModal`) now needs to know Life-vs-Grows — either the learner picks the track, or it's derived from the doorway they entered (Life side vs Grows side of a region). This is a **new capture** in the setup flow, not just a detection swap.
4. **Ownership split (so it lands as ONE change).** Proposed:
   - **Wheel session** lands `BECOMING_SLICES → goalIsBecoming(goal)` in `js/goal-arc.js` (their change-surface item 3), with the legacy fallback.
   - **Goal-model session** updates `openGoalSetupModal` (track capture + detection) and the **c1 tripwire** to the new `goalIsBecoming(goal)`.
   - Done on the **same branch / same PR** so the carve-out never has two detection models live at once.

## The invariant that must survive (non-negotiable)

The becoming carve-out — **no finish apparatus (milestones / challenges / setup sequence) over a becoming goal; presence instead** — is a ratified SSC invariant. It must survive **unchanged in behavior**; only the *detection* changes (area → per-goal Grows). The **c1 tripwire is updated to assert the NEW detection, never deleted** — it is the regression guard for exactly this migration.

## Suggested sequence

1. Agree decisions 1-2 (flag + `goalIsBecoming(goal)` signature).
2. Wheel session: `goal-arc.js` detection → `goalIsBecoming(goal)` + legacy fallback.
3. Goal-model session: `openGoalSetupModal` track capture + detection; update the c1 tripwire — same change.
4. v0.27 data migration: backfill `track` (grows for legacy Heart/Spirit/Emotions/Voice goals).
5. Verify: all 5 c1 guards pass on the new detection; a Heart/Voice goal still gets presence; a Learning/Life goal still gets Plan/Do/Close.

## Files in scope

| File | Change |
|---|---|
| `js/goal-arc.js` | `weeklyKindFor`/`BECOMING_SLICES`/`isBecomingSlice` → `goalIsBecoming(goal)` (wheel session) |
| `js/modals.js` (`openGoalSetupModal`) | track capture + becoming detection (goal-model session) |
| `scripts/c1-render-conditions.mjs` | tripwire → new detection (goal-model session) |
| data | `goals.track` in `decomposition` jsonb + v0.27 backfill |

---

*The becoming carve-out and the four-region taxonomy are the same idea from two directions - "you don't finish becoming" = "the Grows side is witnessed, never finished." Migrate the detection once, keep the behavior, keep the guard. — reconciliation drafted for the two 2026-07-20 sessions.*
