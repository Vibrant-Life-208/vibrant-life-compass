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
- **The Compass (living, recurring):** *cultivates*. This is where each goal breaks into
  bite-sized daily tasks, if-then intentions, week milestones, and where the session
  re-look ritual lives. The elephant gets eaten here, over sessions.

Same wheel, same words, two zoom levels — never two different apps.

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
