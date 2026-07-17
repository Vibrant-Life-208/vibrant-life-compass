# Consolidated build conditions — current-wheel per-goal decomposition

Date: 2026-07-17
Status: **The single authoritative contract the build must satisfy.** Consolidates the three
sign-with-conditions stacks from the three DATA/direction reviews (all signed, zero dissent):
- Per-goal decomposition RE-REVIEW (2026-07-16) — Jake, Accord, Satis, Tutela, Claritas
- Discovery threshold table (2026-07-17) — Jake, Accord, Satis, Tutela, Claritas
- Weekly/daily interaction layer (2026-07-17) — Comes, Accord, Satis, Tutela

**None of these enable code.** They bind the build. Every condition is verified **against
running code at build time** (Claritas C1), not against any doc. `MAPPING_RATIFIED` stays
`false`, `CATEGORY_LIFE_AREA` stays empty, `useSlices` stays guide-summer-only until a build
meeting says otherwise; the **watch-with-a-real-learner** gate governs all exposure regardless.

Design substrate: `2026-07-16-goal-decomposition-progression-architecture.md`,
`2026-07-17-discovery-wheel-threshold-mapping-v0.1.md`,
`2026-07-16-per-goal-decomposition-review-brief.md`. Decision logs in evoke-agents-backup
`agents/decision-logs/2026/07/` (three review files, 2026-07-16 + 2026-07-17).

---

## 1. No denominator, no meter (the coverage-frame heart)
- [ ] Counts NEVER get a denominator: no "6 of 6", no fill-bar, no behind/ahead, no red zero —
      on ANY slice, stress-tested on the two loaded ones (**Learning-6, Heart-4**). *(re-review S3/C, table S-3/C-1)*
- [ ] The time-target ("reach halfway by Session 3") acquires **no** percentage / behind-ahead state. *(re-review S3)*
- [ ] **Session 4 renders identical regardless of on-time** — grace, not remediation; missing the
      halfway target is a **non-event** (same voice/layout whether crossed in Session 3 or 4). *(re-review J1/S4, table J-b)*
- [ ] The this-week/today **zoom announces no undone-count**. *(interaction Co)*
- [ ] **Empty renders identically to unfinished/unlived** at every zoom. *(table A-3, interaction Ac)*

## 2. List renders as a FIELD, not a sequence
- [ ] No rank, no ordering number — a list with an order is a ladder. Applies at the Learning-6
      and Heart-4 grain specifically. *(re-review A1, table A-3)*

## 3. Read-only carried thresholds — read-only to the SYSTEM too
- [ ] The weekly/daily **generation layer reads locked goals, never writes** — no auto-complete,
      status mutation, or silent re-map. *(re-review S2)*
- [ ] The **completion affordance never attaches to a locked carried-threshold row** — "a lock is
      a permission, not a pixel"; no write-edge from the generation layer to any threshold row. *(interaction Sa/Co)*
- [ ] **Preserve the existing separation:** `session-view.js` mark-complete writes *session goals*;
      `thresholds.js` renders thresholds *read-only*. The slice-as-list redesign must keep these
      two data types separable in code. *(interaction, code-grounded)*

## 4. Open-by-choice is a STORED state, never inferred emptiness
- [ ] Empty **Movement / Family / Fun** is *chosen-open*, not *missing-data*; stored-open is
      distinguishable from inferred-empty in the record. *(re-review S1, table S-1)*
- [ ] Each empty slice carries an authored **"yours-to-fill" invitation**; **Family** handled most
      carefully. *(table A-2)*

## 5. No aggregation of the weekly answers
- [ ] Weekly answers are **never** rolled into trend / streak / consistency — twelve answers is not
      a dataset; each week is its own moment. Refusal authored into the spec. *(re-review A2, interaction Ac)*
- [ ] **Refuse platform-conventional patterns:** no "you last answered 3 days ago" (time-since), no
      "resume where you left off" surfacing the most-deferred, no streak-adjacent affordance. State
      transitions fire on **invitation, not calendar**. *(interaction Co)*

## 6. Privacy grain — witnessing only at the session crossing
- [ ] **No partner / parent / guide-visible artifact at the weekly or daily grain.** The daily list
      is self-only. Sharing stays at the **finished-session-goal** grain. *(re-review T1, interaction Tu-1)*
- [ ] **Heart-4 is learner-private** — never a parent-visible character report. *(table S-2/T-1, interaction Tu-1)*

## 7. Cadence split by goal type (the compound-question resolution)
- [ ] **Learning** skill-goals get the **finish-shaped** weekly progressing question. *(interaction Ac-1)*
- [ ] **Heart** becoming-goals get a **presence register** (noticing, not finishing),
      **learner-invited, never pushed** — a finish-shaped question on character is a category error. *(interaction)*
- [ ] The question surfaces on **PULL** (entering a goal), **never a per-goal push-strip**. *(interaction Co)*

## 8. The zoom holds
- [ ] Only **this-week + today** is ever on screen. No affordance — back button, "see all weeks",
      progress strip, swipe — exposes the whole ladder and re-creates the overwhelm. *(interaction Co)*

## 9. Severed framings
- [ ] The halfway **deadline** and the **"one step more" gift** stay severed in the built flow
      ("one step more" is offered *after* done, never a gate). *(re-review A3)*

## 10. Step grain
- [ ] **"Up to 1 step / week, floor 1."** "Exactly 1 / week" is forbidden (it manufactures a
      "3 of 4 weeks planned" denominator). *(re-review J2)*

## 11. Heart as portrait, not inventory
- [ ] **Heart-4 reads as portrait / becoming**, not a self-improvement checklist. If it reads as an
      inventory, **`adv_effort` → Learning is reopened FIRST** (before other remedies). *(table J-a/J-c)*

## 12. Verification + re-walk (non-negotiable, overriding)
- [ ] **Every condition verified against RUNNING CODE at build** — no-denominator grep;
      read-only-to-system write-path check; no-aggregation query check. *(Claritas C1, all three reviews)*
- [ ] **Built-surface re-walk owed at build:** Comes' walk-as-user + Accord's developmental grain +
      Jake's standing gate — regardless of the DATA-level sign-offs. *(interaction Co-5, table J-b)*
- [ ] **Watch-with-a-real-learner governs all exposure.** Flip `MAPPING_RATIFIED` / fill
      `CATEGORY_LIFE_AREA` / extend `useSlices` only AFTER the re-walk + the watch. *(all)*
- [ ] **Re-walk on schema change** — no CI test catches human-facing-framing drift; whoever owns
      the built surface owes a re-walk when the schema changes. *(Claritas, table)*

---

## Order of work — RESOLVED forward (captain, 2026-07-17)
- **Execution order: FORWARD** — Session 1 (set up your space) → Session 2 (challenge) →
  Session 3 (cross the finish line), in lived chronological order. Jake's preference (lower
  load) confirmed by the captain.
- **Open nuance (see design doc):** the captain floated **backward** *framing* for the weekly
  progressing questions — decompose from the finish, execute forward. Reconciliation with the
  signed "asked-live / zoom-holds" conditions is being pinned before capture; must NOT become
  plan-all-weeks-upfront (that would reopen the interaction-layer sign-off).

## Plumbing notes (from the Discovery table — decide at build, independent of the conditions)
- `THRESHOLD_LIFE_AREA` is keyed by pitch-*target* studio (`adventure`); current-wheel direction
  re-homes the destination to the learner's *current* studio (`discovery`). Build must add a
  `discovery` key and/or invert `buildSlicePlan({ currentStudio, pitchTargetStudio })` so a
  pitcher plans on their current wheel.
- The slice-as-list redesign replaces the 7/14 "one goal box per slice" shape; carried thresholds
  render as broken-out locked goals under the render conditions above (field, not sequence).
