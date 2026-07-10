# Education Tab + Reading Journal — v0.1 (design note)

**Date:** 2026-07-09
**Status:** Decision captured; not yet built. Learner-facing surface.
**Decided by:** Europa (fleet meeting, 2026-07-09)
**Related:** True Play badge v0.2 (`agents/meetings/2026/07/2026-07-09-true-play-badge-design-v0.2.md`) — same anti-extraction wall, learner side.

---

## Decision

1. **A consolidated learner-facing Education tab (Option A)** — the learner's single **academic/mastery home**: their **core goals** (`kind: 'core'` — Khan, Lexia, Deep Book, Civ, Character Trait, Reading) plus their **Thresholds** (`kind: 'conditional'`, Launchpad rite-of-passage portfolio work, guide-reviewed) plus the reading journal, gathered in one place rather than scattered across the Compass (year) and Session tabs.
2. **A Reading Journal — NOT a book counter.** The load-bearing choice for the Reading core goal.

### What Option A implies (restructure, not add-on)

Core goals currently surface inside `year-view` (Compass tab) and `session-view` (Session tab). Consolidating means the goals live **once**, in the Education home, and the time-based tabs become **lenses** onto that same goal data:
- **Education tab** = the academic home — goals by category + thresholds + reading journal (the "what am I working on / what have I made" view).
- **Compass (year-view)** = the *this-year* lens onto those goals.
- **Session (session-view)** = the *this-session* lens onto those goals.

This avoids duplication (one goal model, multiple views) and is the clean form of A. Confirm this time-lens reading before build — it is the structural sub-decision A forces.

### The wall applies PER KIND (do not blanket-ban completion)

- **Thresholds** → portfolio / rite-of-passage surface. Real completion is **honest** (a learner earns and crosses it; a guide reviews it). Show *what they made and crossed* — never a behind/ahead bar against other learners.
- **Mastery cores** (Khan, Lexia, No Red Ink) → real completion is fine and non-comparative. **Soften streak/comparison language** — e.g. Khan's current *"track my streak in the dashboard"* (`studios.js:29`) is the overjustification pattern and should go (educator-gated).
- **Reading** → journal, no count. (decided)
- **Character Trait, Civ, Deep Book** → reflection/relationship-shaped, not tallied.

The wall is: *no comparison, no streak-for-its-own-sake, no shame, no count-of-reading* — **not** "no mastery completion." Blurring the two either gamifies reading or robs a learner of the honest pride of crossing a threshold they earned.

## Why the *counter* is out (grounded, not preference)

The 2026-07-09 deep-research pass (SDT / overjustification, primary-source verified) is unambiguous: a **tangible, expected, contingent count** undermines intrinsic motivation. Reading-for-count is the textbook case — the pizza-for-reading program that makes children read *less* for love once the counting starts. The current curriculum literally encodes the trap: *"Track 24 books finished by Session 7"* (`studios.js:73`), *"Finish 12 books... track them on my bookshelf"* (`studios.js:72`). A book counter would build the extraction machine into the education surface. Ruled out.

## What the Reading Journal IS

A **relationship-to-reading** surface, on the enhancing/safe side of the literature (informational, non-comparative, about the book not the tally):
- The book (title/author) the learner is reading or finished.
- Their own reflection: a line they loved, a question it left them, what it changed. (Ties to the Deep Book studio's existing "read and journal" / "short reflection" ask, `studios.js:46,74`.)
- Private to the learner by default. Shareable *by the learner's choice* (e.g., a favorite line to the Socratic group), never auto-surfaced.

## What it is NOT (the wall — bake in from day one)

- **No count toward a target.** No "18 of 24," no "books finished" number, no progress bar.
- **No streak, no completion state, no leaderboard, no cross-learner comparison.**
- **No guide/parent tracking dashboard** of how much a learner reads.
- If any count/streak/target ever appears here, it has drifted to the unsafe side and triggers review — same discipline as the parent-badge category wall.

## Curriculum tie-in + boundary

- The journal *fills an existing ask*: the curriculum already references a "bookshelf" and Deep Book journaling — so this is a safe home for something already required, not an invented need.
- **Separate, educator-gated:** the count-shaped goals (`studios.js:72–74`, "track 24 books finished") should be **softened away from the number** toward reading + reflection. That edits learner curriculum → needs Europa's guide eye + Jenna/educator sign-off. Not a fleet-solo change.

## Honest checkpoint (from the 2026-07-09 critical review)

The one live thread of the critical review that applies here: **no learner has been asked.** Unlike the parent badge, the reading journal has real curriculum grounding — but before it goes live, show it to one of the 44 learners. Build-on-grounding is defensible; ship-without-asking is the habit the review flagged.

## Open (assumptions to confirm)

- Education tab is **learner-facing** (books + learner pathway-goal home). The **parent** True Play badge stays in the parent surface (different role, single parent tab) — not consolidated here unless Europa wants otherwise.
- Reading journal storage: learner-private (RLS: learner read/write; no guide/parent read), matching the wall.
