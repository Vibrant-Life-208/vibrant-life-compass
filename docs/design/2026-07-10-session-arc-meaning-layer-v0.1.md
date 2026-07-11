# Session Arc — the meaning/character layer (v0.1)

**Date:** 2026-07-10
**Status:** Captured from Europa (guide's lived knowledge). Sessions 1–4 given; 5–8 pending. Not yet built.
**Note:** The app currently has **no** per-session meaning layer — sessions are numbered indices with dates only (`SESSIONS_PER_YEAR = 8`, `sessionWeeks: [4,5,3,3,6,6,7,11]`). This is new substrate.

## Why this matters (the insight)

The 2026-07-09 review flagged that "Session N of 7" can make a learner feel *behind* — a ladder. **A session-character layer is the antidote.** If each session has its own *purpose*, the year becomes a **rhythm / a journey** (Fabula's Hero's Journey), not a ranking. You don't feel "behind" in a rhythm; you feel *where you are in the arc*. This is how you keep the honest structure without the shame.

## The arc (Europa's framing, verbatim-faithful)

### Session 1 — Set yourself up for success
Setting your study space up · connecting with your accountability buddy · knocking out quick wins · connecting with others who hold the same values or character strengths as you · tying loose ends · **closing out summer freedom and transitioning into meaningful work and learning.**
*(The Departure. Onboarding, belonging, momentum.)*

### Session 2 — Get to work
Harder, core work · **tying SMART goals into life goals** · learning how to learn.
*(The Initiation. Depth, method, the SMART→life-goal bridge.)*

### Session 3 — Reach the midway; cross finish lines
Tying up loose ends · reaching big midway goals · crossing finish lines · checking in with accountability partners · **celebrating big wins.**
*(The Reward. Maps to the existing "End of Session 3 · locked halfway commitment anchor" in `year-view.js:158` — the halfway milestone is reached here.)*

### Session 4 — Reflect and recalibrate (the midpoint)
Celebration · clean up · catch up · **re-assessment of goals · reflection.** The questions:
- Where are you now?
- What worked? What didn't?
- Do the year-end goals look within reach?
- Do you need to hunker down?
- Do you want *more challenging* goals?
- Have you been a good accountability buddy?
*(The mid-year turn. Honest look-back + recalibrate forward. The true midpoint of an 8-session year.)*

### The back half BRANCHES on the pitch

The pitch (applying into the next studio) happens **after Session 7 (~April 30)**. That deadline forks the whole back half: **applying** learners route their late-year energy into application/pitch prep; **not-applying** learners do their reflection earlier and use Session 7 to plan forward. (Connects to the pitch-readiness work already in the repo — recent commits "Pitch readiness Phase 0 / age-approval / pitch-intent persistence.")

### Session 5 — long session (~6 wks), split in two
- **Weeks 1–3:** set up + quick wins *(a mini-Departure inside the back half)*
- **Weeks 4–6:** hard work *(the deep push)*

### Session 6 — long session (~6 wks), **branches**
**If applying to the next studio:**
- **Weeks 1–3:** tie up loose ends · reach big midway goals · cross finish lines · check in with accountability partners · celebrate big wins
- **Weeks 4–6:** **application review** · clean up · catch up · re-assess **life goals** · big-picture thinking

**If NOT applying:**
- **Weeks 1–3:** (same) tie up loose ends · reach big midway goals · cross finish lines · check in · celebrate big wins
- **Weeks 4–6:** celebration · clean up · catch up · re-assess goals · reflection — *Where are you now? What worked? What didn't?*

### Session 7 — the session before pitching (~April 30), **branches**
**If applying:** celebration · reflection — *Where are you now? What worked? What didn't? Have you been a good accountability buddy? What does summer look like?* *(this reflection feeds the pitch)*
**If NOT applying:** *Do you need to hunker down? Do you want more challenging goals? Have you been a good accountability buddy? What does summer look like?* *(forward-planning, not pitch-prep)*

### Pitch — after Session 7 (~early May)
### Session 8 — summer (the 11-week tail). "What does summer look like?" is the hand-off into it.

---

## The Looking-Back Page — design concept (Europa "open to ideas"; keepers folded 2026-07-10)

A retrospective that **highlights the learner's work and showcases their unique, individual Hero's Journey.** It is the **Return** of the journey — a mirror that shows a learner the shape of what they walked. Not a report card, not analytics dressed up: a scrapbook / a filled-in map.

### Components (built almost entirely from data the app already holds)
1. **Starting line vs. now** — pull each goal's `baseline` ("Starting line", `year-view.js:155`). *"In September you started here. Look where you are."* A learner never sees how far they came because they lived it one day at a time. This is the heart of the page — the single most powerful element.
2. **Finish lines crossed** — completed goals, thresholds crossed, wins shared with parents — rendered as *moments*, not a checklist. "You said you'd cross this. You did."
3. **The books you loved** — the reading-journal shelf, in the learner's own kept lines. This is *why* reading is a journal, not a counter: here the reading year becomes a memory.
4. **Who walked with you** — the accountability partner(s), the Session-1 values/strengths connections. Answers Session 7's own question, *"have you been a good accountability buddy?"*
5. **The learner's own caption** — one place for the learner to name their own year in a line. The hero tells the story; the map just holds the moments (Fabula: the best narrative is invisible — the learner should feel they authored it).

### Form
- **Reuse the Compass year-map** — the horizontal thread of the whole year, *filled in*: the path they actually walked, moments pinned along it. Not a new metaphor; the one the app already lives in, completed.
- **It ends** (Ludus: the good goodbye). Warm, complete, a close you can walk away from — "this chapter was yours, it was good, now go have a summer." A scrapbook, not a spreadsheet. No "next year already."

### Serves both branches
- **Applying** learner: a highlights reel of their own journey *is* pitch material — build it so it can **feed the pitch**; they walk in holding their story.
- **Not-applying** learner: the celebratory Return and the rest.

### The wall (Polaris)
Their *own* before/after — baseline to now — is autonomy-supportive and belongs. **Never** comparison to another learner, no ranking, no score. *Unique individual* means measured only against where *they* started.

### Build discipline (Keiko)
Capture now; **build with a real learner in the room.** The place this could drift is looking like analytics instead of a story — a learner will show us that faster than we can reason it.

## How it composes with what's built

- The **goal waypoints** (`baseline` = today, `eos1Point`/`quarterPoint`/`halfwayPoint`) already give the *quantitative* path. This session-arc gives the *qualitative* meaning around it — the "why this part of the year feels like this."
- Session 3's "reach big midway goals / celebrate" aligns with the locked halfway anchor; Session 4's "reassess" is the reflection *on* that anchor.
- **Consistency thread:** reading goals say "Session 6/7" while `SESSIONS_PER_YEAR = 8`. Reconcile later (school sessions vs. summer tail?).

## Discipline (carried)
This is the guide's real knowledge — the right kind of substrate. But turning it into learner-facing copy/features is where "watch a real learner first" (Keiko, 2026-07-09) re-applies. Capture now; build with a learner in the room.
