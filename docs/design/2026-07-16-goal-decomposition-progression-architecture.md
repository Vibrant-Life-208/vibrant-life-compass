# Goal-decomposition & progression architecture (v0.1, DRAFT — prototype exploration)

Date: 2026-07-16
Status: **DRAFT / prototype exploration. NOT ratified for build. The live onboarding
flow, Setup, and backend are untouched.** This doc captures the design thinking from
the 2026-07-16 fleet meeting (8 agents) plus five prototype iterations. Nothing here
has shipped or changed production. Prototype lives at
`prototypes/halfway-slice-concept.html` (open via a local static server; it is NOT
committed to main / not deployed).

**Design-direction re-ratification (2026-07-16):** the current-wheel (Discovery)
direction — read-only green carried thresholds in "Learning," finer child-written
per-goal breakdown, plant/cultivate split — was **re-ratified by Accord (coverage
frame) + TCC/Satis (data sovereignty)**, superseding their 2026-07-15 target-wheel
sign-off. Conditional re-sign; three convergent build conditions bind (see below). This
is a **direction** re-ratification only — the direction remains prototype-only, so
nothing is enabled in code today. Live-state decision (re-ratification): leave the 7/15
target-wheel `MAPPING_RATIFIED=true` live under a tripwire — hold before any
real-learner watch/onboarding that predates the current-wheel ship.
**TRIPWIRE FIRED 2026-07-16 (captain): `MAPPING_RATIFIED` set to `false`.** Guides log
in Aug 2, Session 1 Aug 17 (first real-learner exposure), current-wheel direction not
shipping by then → the hold-the-flag path was chosen. Held = pitchers get blank
invitational slice boxes (coverage frame intact; verified against running code); the
interim year-view visibility fix still surfaces whatever they write. The next
activation is the current-wheel Discovery mapping, which needs its own Accord + TCC/Satis
review first — do NOT re-enable by flipping back to true. The
watch-with-a-real-learner gate remains open and governs actual exposure regardless.
Refs: `docs/design/2026-07-16-current-wheel-build-scope.md` (hold branch).
Refs: `agents/meetings/2026/07/2026-07-16-compass-threshold-wheel-slice-reratification.md`.

**Binding build conditions from the re-ratification (all three are conditions, not hopes):**
1. **Open-by-choice is a first-class STORED state, never inferred emptiness.** (Convergent
   — Accord: inferred-empty is classification-without-consent; Satis: inferred-empty is a
   steering vector.) The record must distinguish "child chose to leave this open" from
   "data missing."
2. **Read-only green carried thresholds are read-only to the SYSTEM too** — a commitment
   shown, not silently re-mapped, rewritten, or auto-completed after declaration (Satis,
   activation-gates at the display layer).
3. **The "N things — that's it" count stays a ceiling-as-relief and never acquires a
   denominator** — the moment it reads "3 of 7" / "3 left" / red, coverage frame breaks
   and Accord's sign-off is void.

## The north star (captain, 2026-07-16)

Hero's Compass is a **tool of education in self-efficacy**, not only a goal tracker.
It teaches the transferable pattern **dream → decompose → daily act → master → repeat**
so a learner internalizes a method they can point at *any* dream for life. Breaking big
goals into bite-sized daily tasks is the pedagogy, not chrome: it "makes an elephant
seem eatable." The deeper aim is to equip learners with the tools to act **even when
motivation is absent** — because motivation is a feeling, and the plan carries you when
the feeling doesn't. Empower at all ages. Measure of success: **graduation, not
engagement** — the child eventually needs the tool *less* (we evoke, we never extract).

## Core principle: onboarding plants, the Compass cultivates

Two homes, two jobs — this is how we "have both" without overloading the one-time walk:

- **Onboarding (one-time, light):** sets *direction*. The merged halfway step shows the
  1-year card + the "right now" mirror card, then the learner's **current** wheel, then
  a one-line aim per slice. Carried pitch thresholds appear read-only. No decomposition
  here. The onboarding cascade we built stays intact.

  **REFINEMENT — captain-confirmed 2026-07-16 (during test-discovery walkthrough):** the
  slice aims are **not a lumped grid**. Retire the box-style slice_plan (8 blank "By next
  year, in ___" boxes on one page — "a wall," captain). Replace with a **per-slice walk**:
  one focused page **per slice**, walked one at a time ("A year from now, in *Movement*…"),
  on the learner's **current** (Discovery, 6-slice) wheel — Movement → Learning → Heart →
  Family → Friends → Fun. This is **chunking, not adding depth**: still light, still
  direction-only, still 1-year-per-slice, no decomposition. Rationale: one slice per page is
  gentler than eight at once — "it helps break them down for the learner" (captain). **Scope
  held lean:** 1-year-per-slice first (6 pages, replaces the grid); the whole-life *mirror*
  and *halfway* stay as-is for now. Per-slice *now* + *halfway* (captain's fuller vision,
  ~18 pages) is a later iteration only if per-slice 1-year alone doesn't fix the wall.
  **Still bound by:** the three re-ratification build conditions (empty slice = stored
  open-by-choice invitation, no denominator, read-only carried thresholds) and the
  watch-with-a-real-learner gate. This is part of the gated current-wheel build — it does
  NOT ship to a child before that watch. Note: this refines "the onboarding cascade stays
  intact" — the *cascade* stays, the slice_plan *step's presentation* changes from lumped
  to paged.
- **The Compass (living, recurring):** *cultivates*. This is where each goal breaks into
  bite-sized daily tasks, if-then intentions, week milestones, and where the session
  re-look ritual lives. The elephant gets eaten here, over sessions.

Same wheel, same words, two zoom levels — never two different apps.

## Captain's full decomposition model (2026-07-16 walkthrough download)

Captured live while walking test-discovery through the current main-app year-goal modal.
The captain's core objection: the current modal asks the learner to plan **the full year**
from a standing start ("A year from now, what's different…"). **Too overwhelming.** The fix
is to telescope to the **halfway point** and never make the learner hold the whole year at
once. The linchpin insight: **halfway = end of Session 3**, and **the halfway goal *is* the
Session 3 goal.**

### Onboarding — the per-slice walk produces the halfway goals

Builds on the per-slice walk above. Do the **year by slices first**, then narrow to now,
then to halfway — walked one slice per page:

1. **Year goals, per slice.** In each slice, the learner's carried **threshold goals appear
   broken out as individual goals** (NOT one lump) — each its own goal. First text is
   **locked**: the learner can **add to** a goal but **cannot delete or edit** the original
   threshold text (satisfies build condition 2, read-only carried thresholds). The learner
   **adds their own goals** in the slice too — multiple "tasks" that are really year-end
   goals. So a slice holds a **list of goals**, not a single box. (This is the change that
   reopens the ratified one-box-per-slice — see caveat below.)
2. **Now, per slice.** For each goal the learner made, they write **where they are now**,
   paired to the year goal with an arrow: `Slice: [ now text box ] → { year goal }`.
3. **Halfway, per slice (each slice its own page).** Show `{ Now } → { year goal }`, and
   below, an **open box to create the halfway goal** for that item. Walk every slice
   separately.
4. **Once all halfway points exist → they become the Session 3 goals.** The onboarding's
   job ends at the halfway goal. The full-year detail is never demanded up front.

### Main app — clicking into a goal starts at the halfway, not the year

5. Clicking a goal opens on **just the first 3 (or 4) sessions — do NOT re-show the year
   goal.** The year vision lives on the Compass; the working view starts at the halfway.
6. The goal is shown in **3 steps: Set up → Challenge → Crossing the finish line**
   (= Sessions 1, 2, 3). **Session 4 = reflection / tying loose ends / catch-up** — it
   **opens up later**, not shown at the start.
7. Encourage the learner to **break the halfway goal into those 3 steps**, then break each
   step into the **weeks** that session offers (calendar-driven; see sessionWeeks).
8. **Target: reach the halfway goal by end of Session 3.** Session 4 is a **catch-up
   buffer** — empower the learner to land it in three, with the fourth as grace.

### Goal count + weekly-step count (captain-decided 2026-07-16)

- **Soft ceiling on goals: 2–3 learner-added per slice, counted across the whole year**
  (not per session). On top of the locked carried-threshold goals. Framed as
  **ceiling-as-relief** ("that's plenty"), never a limit-you-failed-to-reach. Empty slice
  still an invitation.
- **Weekly steps within each of the 3 phases: "up to 1 per week" — floor 1, ceiling = that
  session's week count** (calendar-driven from sessionWeeks). Never more than one step in a
  week (that is the overwhelm being fought); fewer is fine (a step may span two weeks). The
  captain's "±1 by weeks" collapses to "up to": resist exceeding the week count, the under
  side is already covered.
  - Set up = S1 (4 wks) → 1–4 steps · Challenge = S2 (5 wks) → 1–5 · Cross = S3 (3 wks) → 1–3.
  - **Framed as room, never a meter.** "Exactly 1 per week" is forbidden — it manufactures a
    "3 of 4 weeks planned" denominator (violates build condition 3). Consistent with the
    goals soft-ceiling: a generous ceiling framed as relief.

### The three session phases — reflective spine (captain + refinement, 2026-07-16)

Walked **per goal** (each halfway goal moves through its own setup/challenge/cross).

- **Session 1 — Set up (clear the runway).** Not achieving yet; making *starting*
  frictionless. (a) Practical: clear space, materials, tools. (b) Relational: tell the
  accountability buddy, let the guide know. (c) Make it real (kid-voiced "SMART"): "say it
  so you'd know when it's done — what exactly, and how you'll see it working" + "the first
  small step this week." Rationale: an easy first week is a **mastery experience** (early
  win → self-efficacy) — the antidote to the overwhelm.
- **Session 2 — The Challenge (hard middle).** Name the hardest part; break it into the
  weeks available; lean on the **character strengths + values the learner chose** (onboarding
  payoff). **SOFTENING (ratified):** motivation-independence is a **floor, not a whip** —
  "on a day you don't feel like it, what's the *smallest* step you can still take?" NOT
  "push through no matter what." Guards Jake's self-abandonment shadow.
- **Session 3 — Cross the finish line (recognize + savor).** "How will you *know* you got
  there — what would your guide/buddy see?"; "what does it feel like to finish?"; "how do
  you know you did your *best* work?" **SOFTENING (ratified):** "one step more than you
  want" is a **gift offered AFTER done, never a gate** — "you did it; want to add one more,
  just because you can?" Done is done first.
- **Session 4** opens as reflection / tying loose ends / catch-up — the grace buffer, not
  shown until reached.

### The full decomposition ladder (captain, 2026-07-16 — completes the model)

**Year vision (Compass) → Halfway goal (= Session 3 target) → Session phase → Week → Day.**
The elephant made eatable, top to bottom. Per goal.

**WHERE (captain-confirmed 2026-07-16):** the phase → week → day walk happens **per goal on
the MAIN PAGE** (Compass = cultivate), reached by **clicking into a goal** — NOT in
onboarding. Onboarding (plant) stops at the **halfway goal**. This is the clean plant/
cultivate line: onboarding produces the halfway goals per slice; the main page is where a
learner clicks a goal and works its 3-phase arc, weekly questions, and daily tasks over
time.

- **Weekly progressing question — phase-aware AND asked live, week by week.** Each week the
  app surfaces *that* week's question, carrying the phase's spirit (set-up week: "what will
  you get ready / first step?"; challenge week: "what's the hard piece this week?"; cross
  week: "what will you finish this week?"). The learner answers it in the moment.
- **Daily tasks under the weekly answer.** The learner fills **a few** daily tasks (existing
  number-rules) to reach that week's answer.
- **Asked live, not planned upfront.** Onboarding only sets the halfway goal + the phase
  shape; the weeks reveal themselves in rhythm. This is deliberate: 12 weekly questions at
  the start would re-create the overwhelm. **The weekly progressing question IS the
  "checking and re-looking" cadence** the fleet meeting asked us to design.
- **The surface only ever shows THIS week + today** (the prototype's zoom). The full ladder
  lives in the structure, never all on the page — that is what keeps it from overwhelming.
- **Reconciles with "up to 1 per week":** the question appears for the week being *lived*,
  not forced onto every empty week. No "3 of 4 weeks planned" meter; no "2 of 5 tasks done"
  shame — relief framing throughout (build condition 3).

### The Learning/Heart cadence split (interaction-layer review, 2026-07-17 — RESOLVED)

The 2026-07-17 interaction-layer review resolved the "compound question" (does a weekly
question pressing on 4 locked Heart goals become oppressive?). The answer is a **cadence
split by goal type**:

- **Learning skill-goals** get the **finish-shaped** weekly progressing question ("what will
  you finish this week?") — you *do* finish a skill.
- **Heart "becoming" goals** carry a **presence register** — *noticing*, not finishing
  ("what did you notice this week?") — **learner-invited, never pushed.** Rationale: *"you
  don't finish becoming heroic; a finish-shaped weekly question on character is a category
  error."*
- **The question surfaces on PULL** (entering a goal), **never as a per-goal push-strip.**
  Ten pushed prompts is the load; one pulled prompt is presence. This is what severs
  count × cadence.
- **Condition 2, code-grounded:** the completion affordance **never attaches to a locked
  carried-threshold row** ("a lock is a permission, not a pixel"); no write-edge from the
  weekly/daily generation layer to any threshold row. Code fact to preserve in the redesign:
  `session-view.js` mark-complete writes *session goals*; `thresholds.js` renders thresholds
  *read-only* — the two are separable today and must stay separable.

### Open question (captain, undecided — carry to the build meeting)

- **Order of work:** does the learner work **backwards from the halfway point**, or
  **forward from Session 1** (set up your space) → Challenge → finish? Not settled.

### RE-REVIEW OUTCOME (2026-07-16): signed-with-conditions, 5/5, no dissent

Jake + Accord + TCC (Satis, Tutela, Claritas) re-ratified this shape at the DATA/direction
level. A **binding 11-item build-condition stack** (J1–J2, A1–A3, S1–S4, T1, C1) now governs
the build — full list in `docs/design/2026-07-16-per-goal-decomposition-review-brief.md`
(OUTCOME section). The build MUST honor all eleven and verify them against running code (C1).
Still gated: `MAPPING_RATIFIED` false, `CATEGORY_LIFE_AREA` empty, `useSlices` guide-summer-only,
Discovery-wheel threshold table owed, Comes owed on the weekly/daily layer, and the
watch-with-a-real-learner gate governs exposure.

### What this reopens (must re-check before build) — RESOLVED above; kept for context

- **Multi-goal per slice + broken-out threshold goals** changes the 2026-07-15/16 ratified
  **one-aim-per-slice** shape that Accord + TCC signed under the coverage frame. A slice is
  now a *list*, and a pitcher's education slice (Learning) carries **several** locked green
  goals. Empty-slice-as-invitation still holds, but the **multiplicity** and the
  **"reach halfway by Session 3" time-target** sit close to the pressure the coverage frame
  guards against. **This needs an Accord + Jake + TCC (+ Comes) re-check before build** —
  same gate as the mapping. Specifically: does a list of locked goals + a session deadline
  read as a checklist/load to an 8-year-old? Condition 3 (no denominator) must be tested
  against "reach halfway by Session 3."
- Still bound by the three re-ratification build conditions and the **watch-with-a-real-
  learner** gate. Nothing here ships to a child before that watch.
- Also folds in the concrete fix already made: **studio is read-only in Setup** (learner
  can't reassign it; guide sets it at account creation).

## The four zoom levels (see prototype)

1. **Onboarding plants (light):** year + mirror context, current wheel, one line per
   slice, read-only green carried thresholds in the academic slice.
2. **The Compass cultivates (deep):** open a slice; **each carried threshold is its own
   goal** (not lumped); each breaks into bite-sized daily steps with **if-then** timing
   ("On [when], I'll [what]"); an **editable** input for the learner's *own* goals; the
   "who you're becoming" banner (character strengths + chosen values) as the think-big
   anchor; **no counters/meters** (empty and unfinished render identically); the **two
   doors** (one small step / rest today).
3. **The session arc (first half):** Sessions 1–4, each with a job — **Set up →
   The challenge → Cross the finish line → Clean up & prep**. Reaching the halfway point
   = "half the elephant, eaten." The ladder: daily task → weekly step → session goal →
   half-year. The learner only holds the small end.
4. **The week & the day (smallest end):** a session breaks into its weeks; a week breaks
   into a few daily tasks; **today** is a calm, cross-goal list.

## The number rules (daily tasks)

- **Not a fixed 5–7. Age-scaled and small, a soft ceiling — never a quota.**
  Matches the app's existing per-studio `dailyTaskThreshold`:
  **Sparks ~2 · Discovery ~3 · Adventure ~5 · Launch Pad ~7.**
- Over the number → a gentle "that's a lot for today — move one to tomorrow?" The child,
  with their guide, decides.
- **Cross-goal, not per-goal:** today draws a few tasks from *across* the wheel, so no
  single goal floods the day.
- Rationale: working memory scales with age; **fewer-finished beats many-abandoned** —
  three done builds "I can"; seven half-done teaches "I can't keep up."

## The accountability layer — grain-matched witnessing

Accountability scales with the size of the commitment. The daily list stays private; the
big crossings get witnessed. Never the other way around.

| Grain | Who holds it |
|---|---|
| Daily tasks | **Self only** (+ the two doors). A partner watching an undone daily list is surveillance — forbidden by the coverage frame. |
| Session crossings (finish line, halfway) | **Accountability partner** — witnesses & celebrates ("someone saw me do the big thing"). |
| Year goals / pitch | **Partner confirms + guide signs** (the existing check-off flow, at the right grain). |
| Shared wins | **Parents** (opt-in — the existing "share this win"). |
| **Sparks (4–7)** | **The parent holds all of it.** No account, no peer partner. Parent sets aims, companions the ~2 daily things, celebrates. The whole surface is the *parent's* view. |

The partner moment lands at the **session boundary** — the same moment as the self
re-look ritual. Self re-looks; partner witnesses; guide supports; parent celebrates.
None of it is surveillance.

## Motivation-independence tooling

- **Implementation intentions** ("On [when/where], I'll [what]") — the strongest
  behavioral-science lever for closing the intention-action gap. First-class, not buried.
- **The two doors, every hard day:** "one small step" AND "rest today." Motivation-
  independence that can also say *rest* — sometimes not-feeling-it is information
  (tired/overwhelmed/unsafe), and a tool that only says "push through" teaches
  self-abandonment. Rest is a first-class choice, never a miss.
- **Identity, not points:** each done task is a deposit in "I'm someone who does hard
  things." Intrinsic scaffolding — NO streaks, points, or broken-chains (extraction
  wearing motivation's face; also fails the SDT wall the captain set).

## Guardrails (must hold)

- **Coverage frame:** empty = invitation, never deficit; no fill-meters, counts, or red
  zeros; empty and unfinished look the same.
- **Graduation, not engagement:** success = the learner needing the tool less over time.
- **Rest is a real choice:** the "act when unmotivated" edge always paired with rest.
- **Developmental fit:** current wheel, age-scaled daily counts, child-written breakdowns.
- **Re-look models staying, not scolding:** undone tasks meet "what's the one small
  step?" — the return asks "what did you notice?" before "what's undone."

## Open design decisions (NOT settled — carry into any future build)

1. **Current (Discovery) wheel vs target (Adventure) wheel.** ~~The room + captain favor
   the **current** wheel ... Must return to TCC before any production change. Provisional
   only.~~ **RESOLVED 2026-07-16:** current-wheel direction **re-ratified by Accord +
   TCC/Satis** (superseding the 7/15 target-wheel sign-off). Both signers found the
   current wheel a *stronger* surface — developmentally right (Jake), closes the display
   gap (`slice_learning` renders in year-view; Lux), and the read-only-green /
   editable-own severing is more honest than the target-wheel's lumped Mind box.
   Conditional re-sign; three build conditions above bind. Direction cleared; **learner
   exposure still gated** by the watch-with-a-real-learner requirement.
2. **Merge the halfway + slice_plan steps** into one surface; **retire the Setup academic
   grid** so there is one year-goal home (kills double-entry). Provisional.
3. **Mandatory vs invitational split:** the vision reflection is mandatory (captain's
   2026-07-15 call); the *goal decomposition* stays invitational (coverage frame). Never
   let one screen be both.
4. **Second-half arc (Sessions 5–8) undesigned** — should it mirror the four-session
   shape or look different once the learner has "proven they can"?

## Calendar findings (verified 2026-07-16)

- **The calendar is correct and internally consistent.** `getYearCalendar()` in
  `js/studios.js`: `sessionWeeks: [4,5,3,3,6,6,7,11]` (34 school weeks + 11 summer). Every
  session starts Monday and ends on the Friday the code comments claim; gaps between
  sessions are real breaks. `year-map.js` already reads `sessionWeeks`.
- **Two build-time to-dos (not done — main untouched):**
  1. The weekly-step setter (`modals.js`) covers only Sessions 1–3 and **hardcodes**
     the counts ("4 weeks / 5 weeks / 3 weeks"). To realize the arc (weekly steps for
     every session), drive it off `calendar.sessionWeeks[i]` and extend past Session 3.
  2. `session-view.js:29` shows a generic "~5 weeks" (`WEEKS_PER_SESSION_DEFAULT`),
     wrong for S1/S3/S4/S5/S6/S7 — one-line fix to show the session's actual week count.
- Cosmetic: S7's code comment says "May 27" but the 7-week math gives Fri May 28
  (1-day comment typo; the count is right and used consistently).

## What is deliberately NOT touched

The live onboarding cascade, the Setup view, and the backend. This is a design
exploration held in a local prototype. Nothing ships without: the captain's decision to
migrate, TCC re-ratification of the wheel choice, and the standing
watch-with-a-real-learner gate (no child has touched any of this — the biggest open risk,
named by Vedek in the meeting).

## References

- Fleet meeting: `agents/meetings/2026/07/2026-07-16-compass-goal-decomposition-progression-architecture.md` (evoke-agents-backup)
- Prior ratification (reopened here): `docs/design/2026-07-14-threshold-to-wheel-slice-mapping-v0.1.md`
- Prototype: `prototypes/halfway-slice-concept.html`
