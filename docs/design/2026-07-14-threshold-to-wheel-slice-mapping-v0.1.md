# Threshold -> wheel-slice mapping (v0.1, DRAFT - not ratified)

Date: 2026-07-14
Status: **RATIFIED (Accord + TCC coverage-frame sign-off, 2026-07-15).**
`MAPPING_RATIFIED = true` in `js/thresholds.js` as of the 2026-07-15 fleet review.
Jake's separate pedagogy read stays open (captain gathers it herself); the
watch-with-a-real-learner gate also remains before any child is exposed. The flag
flip is a code-enable, not learner exposure. (Prior draft status: BLANK boxes for
every learner until the flag flipped - no unratified placement reached a child.)

This is the last piece of the onboarding redesign: the 1-year goal plan, organized
by wheel slice instead of the academic-category grid. This doc holds the one part
that is pedagogy, not plumbing - which life area (wheel slice) each pitch threshold
belongs to - so it can be reviewed as data before any learner sees it.

## The decision it implements (captain, 2026-07-14)

- The 1-year plan is organized by wheel slice (Movement, Mind, Spirit, ...), each slice
  a goal box the learner fills.
- Two entry states out of onboarding:
  - **Pitched + accepted** (age-gate yes -> opted into the pitch): the slice boxes
    come pre-inserted with the learner's thresholds, mapped into the slice they
    belong to. The learner refines them.
  - **Not pitching** (age-gate no, or no pitch target): the same slice boxes, blank.
- **Which wheel a pitcher plans by** (captain call, 2026-07-14): the studio they are
  growing INTO, not their current one. A Discovery learner pitching to Adventure
  plans by the Adventure wheel (`Movement, Mind, Spirit, Emotions, Family, Friends,
  Home, Joy`). This is why the slice labels below are the target studio's labels.

## Coverage frame, not completeness

Same guardrail as the v0.18 `life_area` migration: a slice with no threshold is an
**invitation the learner fills**, never a deficit, never a fill-meter. Do not
"balance" the table by inventing placements to cover every slice. In the draft
below, `Movement`, `Family`, `Home`, and `Joy` carry no threshold - that is correct and
intended. Those are the child's to fill from their own life.

## Draft mapping - Discovery -> Adventure

The only threshold set that exists today is the Adventure pitch (see
`THRESHOLDS.adventure` in `js/thresholds.js`). Target wheel:
`getWheelAreas('adventure')` = Movement, Mind, Spirit, Emotions, Family, Friends, Home, Joy.

| Threshold (id) | Name | -> Slice | Rationale |
|---|---|---|---|
| `adv_khan` | Master Khan grade levels 2-5 | **Mind** | academic mastery |
| `adv_lexia` | Finish Lexia Core5 | **Mind** | reading skill |
| `adv_spelling` | Proficient spelling | **Mind** | literacy skill |
| `adv_handwriting` | Proficient handwriting | **Mind** | (candidate: Movement - fine motor) |
| `adv_jt` | Journey Tracker proficiency | **Mind** | tool / self-organization |
| `adv_typing` | Typing skills | **Mind** | tool skill |
| `adv_lead_launches` | Lead 2 morning Launches | **Friends** | leading peers / studio culture |
| `adv_mindset` | Heroic mindset: growth + creator | **Emotions** | inner life / self-concept |
| `adv_effort` | Excellent effort, focus & intentionality | **Emotions** | self-regulation |
| `adv_soaring` | Soaring freedom for 2 weeks | **Emotions** | self-governance (contract + Core goals) |
| `adv_leadership` | Leadership & culture building | **Friends** | community |
| `adv_courage_book` | Read "Courage to Grow" | **Spirit** | meaning / who I'm becoming |

Slices with no threshold (invitations): **Movement, Family, Home, Joy.**

### Open placement questions for the reviewers - RESOLVED (captain, 2026-07-15)

1. **`adv_handwriting`**: Mind (skill) or Movement (fine motor)? -> **Mind.** (Captain.)
2. **Mind carries six thresholds.** -> **Accepted; lopsided by design, not a defect.**
   Captain: "this is the mind at work - it is education; the learner adds tasks to the
   other slices." Pitch readiness is mostly academic, so Mind legitimately carries the
   load. Do NOT split Mind or rebalance to fill other slices - the empty slices are the
   learner's to fill (this IS the coverage frame). Structural adaptation confirmed:
   the six surface as "carried" decompose-to-North items under one Mind slice goal.
3. **`adv_courage_book` -> Spirit vs Mind.** -> **Spirit.** (Captain.)
4. **`adv_lead_launches` / `adv_leadership` -> Friends.** -> **Friends.** (Captain.)
   The Adventure wheel has no Character/Leadership slice; Friends (community/culture)
   is the home. Noted for a future wheel revision, not a blocker here.

## Structural adaptation (needs a look)

The data model stores **one year goal per category** (year-view and the setup grid
both group by `categoryId`, one goal per category). A wheel slice IS a category
(`slice_mind`, etc.), so the slice plan keeps **one goal box per slice**.

The captain's brief imagined "thresholds as goal/task boxes." Rather than relax the
one-goal-per-category assumption across the app (risky, out of scope for v0.1), the
slice step keeps one goal box per slice and surfaces the mapped thresholds beneath
it as **"Carried from your pitch"** items - each decomposable into weekly North tasks
via the existing `addThresholdStepsToNorth` path. So a slice like Mind reads:

> **Mind** [ the learner's 1-year Mind goal ]
> Carried from your pitch: Master Khan 2-5 · Finish Lexia · ... (each -> weekly steps -> North)

If the reviewers want one persisted goal box PER threshold instead, that is a larger
change (year-view grouping, setup grid, priorities) and should be its own decision.

## Where this is consumed (the plumbing, already built)

- `js/thresholds.js`: `THRESHOLD_LIFE_AREA`, `MAPPING_RATIFIED`, `thresholdLifeArea()`,
  `buildSlicePlan({ currentStudio, pitchTargetStudio })`.
- `js/studios.js`: `sliceIdForLabel()` (shared slug so slice goals use the same
  `categoryId` as the setup grid and year view).
- `js/modals.js`: `slice_plan` cascade step (learners only, not Sparks), added after
  the telescope. Renders the wheel + slice boxes; pre-fills from the mapping only
  when ratified AND the learner opted into the pitch. Saves non-empty boxes as year
  goals (`scope: year`, `categoryId: slice_*`, `lifeArea: <label>`). Empty boxes are
  never wiped.
- `js/app.js`: passes `learnerId` into the cascade so slice goals persist correctly.

## Sign-off checklist (before flipping `MAPPING_RATIFIED = true`)

- [x] Captain: the placements above, and the which-wheel decision, are right. (2026-07-15)
- [x] Resolve the four open placement questions. (Captain, 2026-07-15 - see above.)
- [x] Confirm the one-goal-per-slice structural adaptation, or scope the
      goal-box-per-threshold alternative. (Captain accepted one-goal-per-slice with
      carried threshold items, 2026-07-15 - "this is the mind at work.")
- [x] Accord: coverage-frame review - empty slices read as invitation, no slice is
      a fill-meter, no placement pathologizes. **Signed 2026-07-15**, verified against
      the actual `renderSlicePlan` in `modals.js` (not just the model): empty slices
      render an empty textarea under "an empty slice is fine - it is an invitation,
      not a gap"; no counts/meters/progress bars; carried thresholds ride as
      "Carried from your pitch" work, not labels on a child. Noted: the flag flip is
      a code-enable; the real learner-exposure gates (watch-with-a-real-learner;
      Jake's read) remain open.
- [ ] Jake: separate pedagogy read - captain gathers it herself; checkbox stays
      open until she confirms. (Not covered by the 2026-07-15 meeting.)
- [x] TCC review (per the v0.18 gated-mapping convention in `studios.js`).
      **Signed 2026-07-15** (voiced through Satis, Data Sovereignty). Gate verified:
      `thresholdLifeArea` returns null until ratified; `buildSlicePlan` prefills only
      when pitching AND ratified; empty boxes never wiped; saves only non-empty -
      activation-gates-before-activation honored. Pre-fill is opening-not-closing
      (refine/leave/skippable). Sign-off was conditional on correcting the "Body" ->
      "Movement" record mismatch above; correction applied same session.

## Remaining coordination (NOT in this commit)

Placement chosen was **new cascade step** (not "reorganize Setup's grid"). Two items
remain, both touching `setup.js` / the sign-in flow, which another session is
actively editing:

1. **Flow ordering.** Today `app.js` gates the Setup view BEFORE the cascade (a new
   learner does Setup, then the telescope on next sign-in). So the slice-plan step
   currently runs AFTER Setup's academic goal grid, not instead of it. For the slice
   plan to be the learner's true 1-year surface ("land in the slice grid after
   within_1yr"), the flow needs the cascade before Setup, or Setup's goal gate moved.
2. **Setup academic-grid demotion.** Once (1) lands, Setup's academic 1-year grid
   (section 2, the `MIN_GOALS` gate) should be demoted/retired so the two surfaces
   don't duplicate - the captain's "replacing the academic-category grid" intent.

Both are left as coordinated follow-up to avoid colliding with the concurrent
`setup.js` work and because they change the gate the partner-approval flow depends on.

## Known integration gap - a pitcher's target-wheel goals don't display yet

This follows directly from the "pitchers plan by the target wheel" decision meeting
the app's current gated state, and it is NOT a bug in the slice step - it is the same
Decision-4 wall showing up on the display side.

- A pitching Discovery learner sets goals against **Adventure** slice categories
  (`slice_mind`, `slice_spirit`, ...). Their own studio's category set
  (`getCategoriesForStudio('discovery')`) does not contain those ids.
- `year-view.js` renders only goals whose `categoryId` is in the learner's
  current-studio category set, AND for learner studios it uses the FLAT list, not
  slices (`useSlices = learner.studio === 'guide-summer'`; the explicit scope wall,
  Decision 4). So a pitcher's `slice_mind` goal is **captured and persisted but not
  shown in year-view** until the learner-slice view ships.
- What DOES surface for a pitcher today: the slice_plan step re-shows their goals on
  resume (it preloads `slice_*` year goals), and any "carried threshold ->
  weekly steps" produces dated **North tasks that display normally**. So the step
  delivers value now; only the year-view rendering of a pitcher's target-wheel slice
  goals waits on the same rollout this mapping is gated behind.
- The **non-pitcher path is fully coherent end-to-end**: a Discovery learner's own
  slices (`slice_learning`, etc.) are in their category set (kind `personal`) and
  render in year-view's flat list and setup's priority list today.

Decision needed alongside ratification: when the learner-slice year-view ships, does a
pitcher see the target wheel across the whole app, or only inside the slice-plan step?
