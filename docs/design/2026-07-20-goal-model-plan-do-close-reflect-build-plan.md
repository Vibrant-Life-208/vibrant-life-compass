# Build Plan — Plan/Do/Close/Reflect Session Model + Session-Window Zoom

**Date:** 2026-07-20
**Source:** Fleet working session — minutes in `evoke-agents-backup/agents/meetings/2026/07/2026-07-20-year-pivot-session-window-ssc-working-session.md`
**Status:** DRAFT — steps gated on open questions (OQ1-3) and the watch-with-a-real-learner gate. Nothing flips to real learners before the gate.

---

## The shape (agreed)

- **Sessions are sequential FUNCTIONS of the year**, not parts of a goal:
  - **S1 = PLAN / set up for success** (dense: foundational inventory + goal planning; plans out S2)
  - **S2 = DO** (open daily → look at the plan → do the plan / adjust)
  - **S3 = CLOSE** (tie loose ends, check off badge milestones, celebrate / re-adjust / catch up)
  - **S4 = REFLECT** (opens time-gated; reflection on S1-3)
- **View:** sessions 1-3 always visible; later sessions revealed **when their calendar start date arrives** (time-gated only). Year-end goal stays a soft reminder, not a ladder.
- **HARD INVARIANT:** the SMART/weekly/badge apparatus is **finish-shaped goals only**; becoming goals (Heart/Spirit/Emotions) keep presence — no SMART, no weekly cadence, no finish sequence, no check-off.

---

## Open questions — RESOLVED (Europa, 2026-07-20)

- **OQ1 — RESOLVED: it's a repeating CYCLE.** Plan/Do/Close/Reflect repeats ~3 times across the ~8-session year. The cycle *looks different* per cycle because weeks-per-session differ for sessions 5/6/7, and **Session 8 = the whole cycle compressed into one session** (summer). Consequence: the Year-Map reveal mechanic (near window + reveal-on-start, Step 1) generalizes unchanged; the *per-cycle phase→session mapping* (how plan/do/close/reflect lays onto 5/6/7 and collapses into 8) is Step 3 design detail, not a blocker for Step 1.
- **OQ2 — RESOLVED: confirmed.** Sessions are functions (Plan/Do/Close/Reflect); Session 1 carries all the planning.
- **OQ3 — RESOLVED: TED (The Empowerment Dynamic) + Alfie Kohn, "Punished by Rewards."** Kohn's framework maps to the session cycle:
  - **Session 1 (Plan) — the Three C's of Motivation:** *Content* (inherently interesting, relevant, challenging tasks — not gold stars for rote work), *Collaboration* (community-building over competition; work together, don't compete for prizes), *Choice* (autonomy over what/how/when — ownership of the outcome). Cultivate intrinsic curiosity and purpose; a caring environment, not bribery.
  - **Session 2 (Do) — Rely on Problem-Solving:** when an issue arises, collaborative dialogue to find root cause + a mutually agreeable solution — never an imposed reward or punishment.
  - **Session 3 (Close) — Give Feedback, Not Praise:** descriptive feedback on the effects of actions and the process, not generic "Good job!" praise that manipulates for repetition.
  - **CONVERGENCE (record it):** Kohn's anti-rewards pedagogy is the intellectual foundation of the already-ratified SSC conditions — human-authored badges (not gold stars), no denominators/leaderboards (collaboration over competition), "added however the learner wishes" (Choice), descriptive feedback (Jake's standing position). Europa's pedagogical source and the fleet's ethics are the same commitment. This *strengthens* the invariants; it does not add tension.

---

## Sequenced steps

### Step 1 — Session-window zoom in the Year Map  ✅ SHIPPED (commit 559267b)  *(fixes what Kyra saw)*
- File: `js/year-map.js` → `renderYearMap`.
- Change the `calendar.sessionWeeks.forEach(...)` loop to render only sessions where `sessionNumber <= Math.max(3, position.sessionIndex)`. Sessions past the window are omitted from the thread (not greyed — absent), so the whole year is no longer "staring at you."
- Session 4+ appears automatically once `computeYearPosition` places the learner in it (time-gated; `computeYearPosition` is already purely date-driven — no achievement input, satisfies D2).
- Past sessions stay visible as memory (Jake) — keep `is-past` styling, drop nothing already revealed.
- Helper copy: reframe "reveal the whole" language.
- **Blocked on OQ1** for behavior beyond S4 (does S5 exist / repeat?). The 1-3 + reveal-S4 core is safe to build first.
- Verify: local dev renders 1-3 before year start; simulate a Session-4 date → S4 appears; no full 1-8 ladder at any point.

### Step 2 — Walk the 1-year vision (journey-break fix)  *(Comes owns)*  ✅ SHIPPED (commit d2d1b19)
- **Root cause found:** `modals.js` `openOnboardingModal` dropped `within_1yr` + `current_state` + `halfway` whenever `currentWheel && hasSlicePlan` (every Discovery/Adventure learner since the global flip). A 2026-07-17 change treated the whole-life 1-year vision as redundant with the per-slice year question — conflating a goal TARGET with the whole-life PIVOT.
- **Fix shipped:** restore `within_1yr` (1-year vision) + `current_state` (the mirror) as the pivot before the slice plan; only per-goal `halfway` stays dropped (slice walk asks it per slice). Verified node --check + all 5 c1 guards; pushed to main → live for learners on next onboarding walk.
- **Follow-on (not yet done):** the pivot should also frame *choosing the top 3-4 goals* from the year vision (Setup section 3 currently stars top-3 after goals are set). Consider whether the vision→selection link needs tightening. Verify by walking the adventure path end-to-end in the browser.

### Step 2b — Annual vision refresh (across-the-board scope)  ✅ SHIPPED (commit 0d86e14)
- **Scope check found:** Step 2 fixed only NEW Discovery/Adventure learners. The cascade was one-time (gated on `onboarding_completed_at`), so RETURNING + LEVELING-UP learners were grandfathered past the vision, and it never re-walked per year. Guides/Owners/Sparks already had it; Parents are excluded.
- **Fix shipped:** cascade is now cycle-aware — re-opens each new year-cycle (Session 1), prefilled with last year's answers to edit or keep, **minus character strengths** (stable). Learners + guides + owners. No migration (compares existing `onboarding_completed_at` to `yearStartISO`). **Dormant this cycle**; first fires at the next cycle start (Aug 17). Verified node --check + 5 c1 guards.
- **Watch before Aug 17:** the refresh reuses the already-live cascade UI, but the *re-walk-prefilled* experience (esp. values re-pick + horizon edit) should get a browser walk-through before the new cycle so the "edit or keep" framing reads right.

### Step 3 — Reframe session semantics to Plan/Do/Close/Reflect; make S1 the planning artifact  📋 SPEC DRAFTED (awaiting Europa approval)
- **Architecture decided (Europa):** the Session-1 whole-learner foundational inventory EXTENDS the annual cascade (Step 2b), not a separate surface. Per-goal planning stays in `openGoalSetupModal`. Build spec-first → approve → incremental behind the flag, watch-gated.
- **Spec:** `docs/design/2026-07-20-session1-plan-foundational-inventory-spec.md` — question set (4 movements), Kohn/TED framing, cohort-scaling ladder, hard invariants (skippable/frightened-body/becoming-carve-out/no-denominator/not-surveilled), cascade integration, open authoring questions Q-A…Q-E.
- **Next:** Europa answers Q-A…Q-E → Comes/Accord/Jake author cohort copy → build behind flag.
- Original notes below still hold:
- Reframe `ARC_PHASES` copy (`js/goal-arc.js`) and `openGoalSetupModal` (`js/modals.js`) so Session 1 = planning (foundational inventory + SMART steps / challenges / setup), Session 2 = do, Session 3 = close, Session 4 = reflect.
- `openGoalSetupModal` already stores `setup`/`challenges`/`threshold` — consolidate these as the **Session-1 planning output**.
- **Cohort-scale + invitational/skippable (D7):** the Session-1 inventory must be paced per cohort and never gate Session 2. "SMART" labeled plainly for learners.
- **Blocked on OQ3** for the TED-mindset question copy.

### Step 4 — Item types as learner-built lists (badges / weekly goals / effort tasks)
- Fall out of the learner's own Session-1 lists; list-form; **added however the learner wishes**; no count/denominator.
- Badge check-off happens in Session 3 as a *chosen celebration*, not a system tally (D5).
- Data: badges human-authored (`author_id NOT NULL`, never system — morning D3). Reconcile against the existing `decomposition` jsonb + weeklySteps rather than inventing storage where possible.

### Step 5 — Retire the auto-seeded session sub-goals; gentle migration
- Remove the `targetSession: 6` + `seedSession(1/2/3)` auto-population (`js/year-view.js:229-255`) and the "End of Session N" card meta labels (`:193-195`) in favor of the Plan/Do/Close framing.
- **Gentle migration (morning Ezri ruling):** map the 44 existing learners' `eos1Point`/`quarterPoint`/`halfwayPoint` into the new framing with a visible "reorganized" marker — never silent overwrite, never delete.
- Respect `js/goal-write-wall.js` (no threshold-id goal rows) and the projection rule throughout.
- **Blocked on OQ1** (session count) + OQ2.

### Step 6 — Preserve the becoming carve-out end-to-end (INVARIANT — not a step so much as a gate on every step)
- `weeklyKindFor`/`isBecomingSlice` already route Heart/Spirit/Emotions to presence. Every change above must leave the becoming branch untouched: no SMART, no weekly cadence, no check-off, no finish sequence over a becoming goal.
- C1 render guard (`ARC_PHASES` never renders over a becoming goal) must still pass.

### Step 7 — Learner list + calendar views
- Two projections of one time-ordered timeline (`js/calendar-view.js` already exists — extend, don't rebuild). List = sequence; calendar = grid. Sequence-over-deadline for learners; no overdue-red.

### Gate — watch-with-a-real-learner + becoming presence-copy
- Comes + Accord author the becoming presence-line copy before any flip.
- No ship to real learners before the ratified watch gate.

---

## Invariants checklist (every PR must hold)
- [ ] Reveal is time-gated, never achievement-gated (D2)
- [ ] Becoming goals keep presence — no finish apparatus (D6)
- [ ] Session-1 inventory is cohort-scaled, invitational, skippable — not a gate (D7)
- [ ] No count / denominator / "X of Y" anywhere on learner surfaces (D5)
- [ ] Badges human-authored only (`author_id NOT NULL`)
- [ ] Existing 44 learners' data migrated gently, never overwritten/deleted
- [ ] `goal-write-wall` + projection rule respected
- [ ] Watch gate honored before flip
