# Weeding — count/streak language in `studios.js` seed-packets (v0.2, reconciled)

**Date:** 2026-07-10
**Status:** **APPROVED by Europa (authority confirmed) — applied & committed 2026-07-10.**
**Supersedes:** v0.1 (which stripped all numbers — over-corrected; see reconciliation).

## The reconciliation (why v0.1 was too broad)

Captain's push: *numbers support SMART goals — removing them makes goals less clear.* Correct, and the research agrees. The 2026-07-09 SDT/overjustification finding was **not** "numbers undermine motivation." It was that rewards which are *contingent, controlling, and create expectancy* undermine it, while measurement that is *informational — a learner's own progress toward their own chosen aim — enhances it*.

So the line is not the digit. It is the **machinery around the digit**:
- A **self-set SMART aim** ("aim for 12 books this year") is a *trellis* — clear, informational, autonomy-supportive. **Keep it.**
- A **streak, leaderboard, reward-for-count, or cross-learner comparison** is a *cage* — controlling, the overjustification trap. **This is what the wall forbids.**

**The wall moves off the goal text and onto the app.** Numbers may stand in the goals; the Education tab and reading journal must **never** add a streak, leaderboard, "you're behind," reward-for-count, or cross-learner comparison.

## Changes applied to `studios.js` (three; Launchpad reverted)

### 1. Khan Academy — Launchpad (`studios.js:29`) — pull the streak only
- **Before:** `...Set my own weekly pace; track my streak in the dashboard.`
- **After:** `...Set my own weekly pace; move on when I can teach it back.`
- SMART target `by Session 6` kept. Only the **streak** pulled — a streak rewards continuity, not mastery ("don't break the chain" = engagement machinery). Re-rooted into a mastery signal ("teach it back", echoing the Khan support hint at `studios.js:308`).

### 2. Reading — Discovery (`studios.js:72`) — number restored as an aim + reflection
- **Before:** `Read for 15 minutes every school day. Finish 12 books by the end of the year - track them on my bookshelf.`
- **After:** `Read for 15 minutes every school day. Aim for 12 books this year, and keep a shelf of the ones I loved with a line from each I want to remember.`
- SMART (15 min/day + 12/year) kept as the learner's **aim**. "track" → "aim for"; bookshelf re-rooted into the reading journal (loved books + a line to remember).

### 3. Reading — Adventure (`studios.js:73`) — number restored as an aim + journal
- **Before:** `Read for 20 minutes every school day. Track 24 books finished by Session 7.`
- **After:** `Read for 20 minutes every school day. Aim for 24 books by Session 7, and when a book stays with me, write down why in my reading journal.`
- SMART (20 min/day + 24 by Session 7) kept as the learner's **aim**; reflection added so reading isn't only a tally.

### 4. Reading — Launchpad (`studios.js:74`) — NO CHANGE
- `Read 20 books across genres I have not tried before. Pair each with a short reflection.` — already balanced (aim + breadth + reflection). Reverted; left verbatim.

## Left alone (mastery completion is honest)
Lexia levels, No Red Ink units, Civ scope, Deep Book cadence + critique, Pathway/Quest/Thresholds, Khan cadence lines. Untouched.

## Carried forward
- **Offer, don't impose** on any learner who already set a count in *their own* goal — numbers are fine, so this is now light, but a child's own words are still theirs.
- **The wall now lives in the build:** when the Education tab + reading journal are built, they carry a hard constraint — no streak, leaderboard, reward-for-count, or cross-learner comparison. Recorded in `2026-07-09-education-tab-reading-journal-v0.1.md`.
- **Adjacent (your call, separate):** guide reading example `studios.js:220`; parallel language in the Launch Pad curriculum doc.
