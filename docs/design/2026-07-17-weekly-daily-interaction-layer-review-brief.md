# Weekly/daily interaction layer — review brief (RUN SECOND, after the Discovery table)

Date: 2026-07-17
For: **Comes** (interaction layer — lead) · **Accord** (the no-aggregation refusal + the
compound question) · **Satis + Tutela** (condition 2 + the privacy grain)
Status: **Awaiting sign-off. Sequenced — run only after the Discovery-table review lands.**
DATA / direction review only — does NOT enable code. `MAPPING_RATIFIED` stays `false`. The
watch-with-a-real-learner gate governs exposure regardless.

**This is the SECOND of two sequenced build-gate reviews.** It runs *after*
`2026-07-17-discovery-table-review-brief.md` has settled the slice-lists (Learning-6, Heart-4),
because the compound question below needs those lists decided. Do not run the two together — see
"Why sequenced, not combined."

Object under review: the **weekly progressing question + daily tasks** interaction layer, as
described in `docs/design/2026-07-16-goal-decomposition-progression-architecture.md` (the
"weekly progressing question — phase-aware AND asked live" and "daily tasks under the weekly
answer" sections). Also read: the RE-REVIEW minutes
`agents/meetings/2026/07/2026-07-16-per-goal-decomposition-perslice-onboarding-rereview.md`.

---

## Read this before you start: what kind of review this is

There is **no built weekly-question surface yet** — it is design intention, not running code.
Comes, Accord, and every reviewer on this brief hold the same discipline: *principles without
code are suggestions; I re-walk the built surface before it reaches a learner.* So this is a
**design-intention pass**, and a **built-surface re-walk is owed at build regardless of the
outcome here.** State that in the sign-off. The value of running it now is to catch structural
seams while the interaction is still cheap to change — not to certify a surface that does not
yet exist.

## Why sequenced, not combined (with the table review)

The table review is placement/data (which slice); this is interaction-mechanics (write-back,
zoom, aggregation). Different altitude, different reviewer center — Comes is not a slice-
placement voice; Jake is not an interaction-seam voice. Combining them would let the concrete
table crowd out the subtler interaction seams. Sequencing captures the one thing a combined
room would catch — the *compound* effect of count × cadence — better, by making it an explicit
agenda item *after* the counts are settled (see below).

---

## The specific sign-off questions

### For Comes (interaction layer — lead)
- **The write-back seam (this is the condition-2 test at the interaction layer).** When a
  learner answers the weekly progressing question, or checks off a daily task, does any path
  write back to a **locked carried goal** — mark it done, mutate its status, advance it? A
  locked goal the interaction can silently complete is read-only with a back door. Trace it the
  way you traced "the fold is invisible to open" on the not-yet container.
- **Does the this-week-and-today zoom hold?** The design says only this-week + today is ever on
  screen. Is there any affordance — a back button, a "see all weeks", a progress strip, a swipe
  — that exposes the whole ladder and re-creates the overwhelm the zoom exists to prevent?
- **Interaction-seam sweep (your unique catch):** where does this surface tempt a
  platform-conventional pattern that betrays the design — a "you last answered 3 days ago"
  nudge, a "resume where you left off" that surfaces the most-deferred, a streak-adjacent
  affordance? Name the seams that would drift within a year if not refused in the spec.

### For Accord (the refusal + the compound question)
- **Is the no-aggregation refusal honored in the interaction, not just the data model?** The
  RE-REVIEW condition (A2) is: never roll the weekly answers into a trend, streak, or
  consistency reflection — twelve answers is not a dataset. Does the *interaction* anywhere
  show the learner their own answer history as a pattern, or is each week genuinely its own
  moment?
- **THE COMPOUND QUESTION (the reason this review is sequenced after the table):** given the
  Discovery table's settled lists — **Learning-6 and Heart-4** — does the weekly cadence turn
  those fields into load? Four locked Heart goals may read fine as a static field but feel
  oppressive once a weekly question starts pressing on each in turn. Review the *combination*:
  count of locked goals × weekly pressure on them. This is the seam neither review catches
  alone.

### For Satis + Tutela (condition 2 + the privacy grain)
- **Satis (condition 2):** confirm there is no write-path from the weekly/daily generation
  layer to the threshold rows — reads to produce prompts, yes; writes, never. Verifiable at
  build as a query; name it here as the spec refusal.
- **Tutela (T1, the privacy grain):** does the weekly answer or the daily task list generate
  any partner-, parent-, or guide-visible artifact at the weekly or daily grain? Witnessing
  lives only at the session crossing the learner chose to reach; the daily list is self-only. A
  "share this week" surface below the session grain breaches the wall.

---

## What a sign-off here means (and doesn't)
- **Means:** the interaction-layer *design intention* honors condition 2, the no-aggregation
  refusal, the privacy grain, and the zoom — and the compound (count × cadence) effect has been
  weighed against the settled slice-lists.
- **Does NOT mean:** the built surface is certified. A built-surface re-walk (Comes + Accord +
  Jake's standing gate) is owed at build; `MAPPING_RATIFIED` stays false; the watch-with-a-real-
  learner gate still governs exposure.
- Record sign-offs via the Fleet MCP channel (`mcp__fleet__update_memory` from an
  evoke-agents-backup session), not facilitator direct-write.
