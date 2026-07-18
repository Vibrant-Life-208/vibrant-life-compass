# Build spec - main-page per-goal decomposition (milestone flow)

Date: 2026-07-17
Status: **Ratified by the 8-agent design review 2026-07-17** (Jake, Accord, Comes, Lux, Geordi,
La'an, Satis, Garak - no dissent; convergent binding condition recorded). Dark behind
CURRENT_WHEEL_BUILD. DATA/direction ratified; this doc is the implementable spec.
Minutes/decision log: evoke-agents-backup `agents/{meetings,decision-logs}/2026/07/2026-07-17-per-goal-decomposition-main-page-flow.md`.

Replaces the heavy 9-stage `openYearGoalModal` for setting a goal's milestone (captain: "this
should not be here"). The now/halfway walkthrough that was pulled OFF the onboarding slice pages
lands here, per goal, on the main Compass page.

## The flow (Decision 1 - signed verbatim)
Tap a goal that has no milestone yet ->
1. **"Where are you now in this goal?"** -> `baseline`.
2. Page shows the **year goal AND the now** together -> **"What's your halfway milestone?"** ->
   saved as `halfwayPoint` and seeds the **Session-3 goal** (reuse `seedSession`, year-view.js:222).
3. **"Imagine yourself achieving this goal - what would have to be true?"** -> the learner names
   a FEW near-steps -> stored as tasks (`saveTask`, `plannedFor`) for the near term.
Then -> flows into the existing **goal arc** (this-week work). A goal that already HAS a milestone
taps straight to the arc.

## Binding conditions (from the review)
- **Decision 2 (CONVERGENT / BINDING): do NOT front-load or persist-and-measure the full
  multi-week ladder.** The `5x(weeks-1)` / `4x(weeks-1)` counts are NOT tasks the learner authors
  up front. This HONORS (does not revise) the ratified backward-once / this-week-only /
  no-full-ladder conditions. Backward-decompose is a **lens at setup**; the learner authors the
  milestone + a few near steps; the rest scaffolds/emerges; **Sessions 4 & 7 refocus** re-open the
  decomposition. Author a FEW (ceiling-as-relief), never ~15/session.
- **Decision 3: store the structure; surface only this week; never a scoreboard.** Tasks in the
  backend (`tasks` + `plannedFor`); the learner-facing surface queries THIS WEEK only, into the
  arc. The stored plan is NEVER rendered as a completion ledger or "N of M."
- **Decision 4: data model holds.** Milestone = `halfwayPoint` / Session-3 goal (reuse
  `seedSession`); subject/personal goals = category/`slice_*` rows; carried thresholds = child
  records (`thresholdAdditions`), never goal rows (La'an's write-wall intact).
- **Decision 5: C1 extends.** A backend per-session task count is permitted; a learner-facing task
  denominator is a violation (Garak's guard).
- **Keep verbatim (banked as good):** the milestone question ("imagine achieving it - what would
  have to be true?") and the year-goal-plus-now mirror page.

## Sessions are backend-only
Session / week structure is task storage; the learner never sees "Session N" or a week count.
They experience one continuous flow at setup, then this-week's tasks in the arc.

## Standing gate (updated by the 3 circle reviews, 2026-07-17)
Built-surface re-walk (Jake + Accord + Comes) before any flag flip; then watch-with-a-real-learner.
Nothing ships to learners. Additions from the circle-by-circle reviews (see
`2026-07-17-discovery-flow-design-principles.md`):
- **Watch (PDC):** watch-with-a-real-learner must include a *staying* learner AND a *first-year*
  learner - not only a pitcher.
- **Safety lock (SSC):** the flag does not flip for any cohort that could contain a pitch-and-fall
  or a first-year learner until the third-learner soft landing AND the newcomer floor exist and are
  walked. Salus's CONTRAINDICATED rating is a lock on exposure, not a note.

## Build increments
1. **Milestone setup flow** (this doc's core): the 3-step spine + a few near-steps -> tasks;
   seedSession(3) for the milestone; gated to goals with no `halfwayPoint`, behind the flag.
2. **This-week surfacing** into the arc (largely exists: goal-arc.js + openGoalArcModal).
3. **Sessions 4 & 7 refocus** re-decompose points (later).
4. **C1 guard**: no learner-facing task denominator (Garak).
