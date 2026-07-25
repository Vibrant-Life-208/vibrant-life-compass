# Cohort-Gated Current-Wheel Flag - Spec (Lux + Geordi)

**Status:** SPEC - mechanism is safe to build (defaults to today's behavior). **Enabling it for a real
learner is gated by the SSC safety-lock ruling (Salus).** Build ≠ enable.
**Date:** 2026-07-18
**Authors:** Lux (Technical Infrastructure Lead) + Geordi (Infrastructure Architecture Steward)
**Raised by:** Europa - "we have to test the learner build, and learners are not on local."

---

## The problem

`CURRENT_WHEEL_BUILD` is a single global boolean (`thresholds.js:128`). It has two states: dark for
**everyone** or live for **everyone**. Keeping it uncommitted (`true` locally, `false` in prod) only
ever permitted **local, adult** testing - it structurally cannot reach a real learner, because real
learners are on production. So the current-wheel build cannot be tested by the people it is for.

**36 references** across `modals.js`, `setup.js`, `year-view.js`, `goal-arc.js`, `weekly-answers.js`,
`thresholds.js`. Every read sits in a render/flow function that already has `learner` / `learnerId` /
`studio` in scope - so a per-learner gate is a threading change, not a rewrite.

## The design: per-learner allow-list (canary)

Replace the global boolean with a resolver keyed to the active learner.

### 1. Data (migration)

```sql
-- current_wheel_test: this learner sees the current-wheel build. Default false =
-- today's production behavior (everyone legacy). Set true ONLY for a supervised
-- test cohort, and ONLY after the SSC safety-lock ruling.
alter table learners add column if not exists current_wheel_test boolean not null default false;
```
Carry it in both adapters (`supabase-adapter.js` rowToLearner/learnerToRow, `local-store.js`).

### 2. Resolver (replaces the constant)

```js
// thresholds.js (or a small flags.js)
import { BACKEND_TYPE } from './backend/config.js';
// Local dev sees the full build for everyone (no real learners exist locally) - this
// REPLACES the old uncommitted `true` override. Production gates per-learner via the
// current_wheel_test allow-list. Committable and safe: prod default is false = today.
export function isCurrentWheelBuild(learner) {
  if (BACKEND_TYPE === 'local') return true;
  return Boolean(learner && learner.current_wheel_test);
}
```

**This eliminates the "keep thresholds.js uncommitted" problem entirely.** Local is always-on by
backend type; prod is cohort-gated by the DB flag. Nothing magic stays out of git.

### 3. Threading (the refactor)

At each flow entry point that has the learner, compute once and pass down:
```js
const currentWheel = isCurrentWheelBuild(learner);
```
- `modals.js` onboarding/setup flow: compute at the top of the onboarding modal init; replace the
  in-function `CURRENT_WHEEL_BUILD` reads with `currentWheel`.
- `setup.js`, `year-view.js`, `goal-arc.js`: same - compute from the learner in scope.
- `thresholds.js` `buildSlicePlan` / `thresholdLifeArea`: take `currentWheel` as a parameter (the
  caller has the learner); drop the module-level constant read.
- `c1-no-sorting.mjs` (static standing test) needs no learner - it asserts against the code with the
  build assumed on; unchanged.

## Safe-by-default (why building it exposes no one)

The migration defaults `current_wheel_test = false`. With every learner false and prod not local, the
resolver returns false for everyone - **byte-for-byte today's production behavior.** The build ships
inert. The only thing that exposes a learner is an explicit `update learners set
current_wheel_test = true where id = <test learner>` - and that is the gated action below.

## The governance gate (NOT ours to open)

Two of the intended cohort - **Kyra (first-year)** and **Jaxton (mover-up)** - are exactly the learners
the SSC safety lock protects. Enabling `current_wheel_test` for them is **Salus's ruling**, not an
infra decision. The sanctioned path is the **supervised watch** (an adult beside each learner, standing
in for the unbuilt newcomer floor) - but Salus (with PDC) must confirm that supervised per-cohort
exposure satisfies the lock before any flag is set true. Build in parallel; do not switch on until she
clears it.

## Verification (Lux: "what are we missing?")

Before declaring ready:
1. A learner with `current_wheel_test=false` gets the **legacy** flow, unchanged (no regression) -
   test on prod-shaped data.
2. A learner with `current_wheel_test=true` gets the **current-wheel** build end to end.
3. **Mixed-mode data safety:** a cohort learner's writes (weekly answers, goal decomposition, onboarding
   step) land in their own rows and do NOT corrupt or alter a legacy learner's data in shared tables.
4. Local dev still shows the full build for all local learners (BACKEND_TYPE gate).
5. The write-wall (C1 #2) still refuses threshold-id goal writes for cohort learners.

## Rollout

1. Build the mechanism (migration + resolver + threading + tests). Safe - exposes no one.
2. **Salus ruling** on supervised cohort exposure for Kyra/Jaxton (SSC safety lock).
3. On a clear ruling: `update learners set current_wheel_test = true` for the named cohort, for the
   supervised watch only. Toggle off after, or keep per the ruling.

---

*Mechanism: Lux + Geordi. Permission to enable: Salus + PDC. The two are deliberately separate.*
*"We evoke - we never extract."*
