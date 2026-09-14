# Responsibilities v1 - Design Note (for Jake + Salus)

**Date:** 2026-09-14
**Surface:** Vibrant Life Compass - Creator Mindset pillar - Responsibilities
**Status:** BUILT, dark behind `?resp=on`. Deployed to prod (compass main, sw v175). No DB
migration (data lives in `foundations.climb.responsibilities`, jsonb).
**For review:** Jake Sisko (developmental) + Salus (trauma-informed safety) - fold into the same
consented real-learner walk as the community board (week of 2026-09-15).
**Refs:** `js/responsibilities.js` (model), `js/pillars/creator.js` (UI), `js/calendar-view.js`
(calendar marker), `js/flags.js` (`isResponsibilities`).

---

## What it is, and the frame that shaped it

Responsibilities are a self-owned list under **Creator Mindset** - the disc that reads "carrying
what is yours to carry." That placement is the design thesis: a responsibility is an **ownership /
agency** thing, not a chore you get scored on. So the build deliberately refuses the chore-chart
pattern (checkboxes, streaks, points, "you missed 2 days") that most apps reach for - the exact
pattern the fleet keeps refusing (Kohn's *Punished by Rewards*; Salus/Jake's "notice, never
score"). A responsibility turned into a streak stops being *yours to carry* and becomes *a thing
you'll be graded on*.

## What v1 does (all off by default until `?resp=on`)

- **Cadence, not a due date.** Each responsibility can carry a rhythm: Off / Daily / Weekdays /
  Weekly. "Off" = carried, but not on the calendar.
- **Soft calendar presence.** On its days it shows as a faint **leaf** on the Calendar - "this is
  yours today", not "due today". No deadline framing.
- **Private tending, uncounted.** A "tended today" tap, self-only. **No number, no streak**, and a
  missed day simply passes - no red, no guilt. The leaf fills once tended; that is the only signal.
- **Guide/parent sees what they carry, never a meter.** (Guide surface not built in v1; the list is
  the learner's on the Creator pillar.)

## What v1 deliberately does NOT do

- No count of tended days, anywhere. No streak. No "completion %". No comparison between learners.
- No notification / nag. No "you forgot." Missing is a non-event by design.
- No score that a guide or parent can read as compliance.

## What we want your eyes on (the walk)

**Jake (developmental):**
- Does the **cadence** concept land for a young (Discovery ~8-11) child, or is "Weekdays/Weekly"
  too abstract? Is a simpler young cut needed (e.g. just "on my calendar" yes/no)?
- Does "Responsibilities" feel like **ownership** ("this is mine to carry") or does it tip into
  **obligation** ("things I'm supposed to do") for the child? The copy is "what's yours to look
  after" - watch how it is received.
- Is the **leaf/tended** loop intrinsically satisfying (I tended it, I know it) without becoming a
  thing they chase?

**Salus (safety):**
- Does "tended today?" ever read as a **test** the child can fail? Watch for any wince on a day
  they did not tend - the design intends a non-event; verify it lands that way.
- Any pressure to add a cadence, or does "Off" feel like a genuine, unpunished choice?
- Confirm there is **no count/streak leak** anywhere the child (or later a guide) could read as a
  scoreboard - my Clabough non-negotiable: the moment it is counted, it has drifted.

**Access for the walk:** load `?resp=on` on the studio device, then Creator Mindset ->
Responsibilities; give one a cadence and check the Calendar for the leaf.

*Notice, never score. A responsibility is a thing you carry, not a thing you are graded on.*
