# North page: daily tasks, over-scheduling grace, and the reflection reviewer

**Status:** ROADMAP (captain vision, 2026-07-18). Not built yet. Depends on the 3-phase
goal build landing first (that build is itself gated on the v0.24 adapter commit).
**Source:** Europa, live session 2026-07-18.

## The shape

The three-phase goal build gives every skill-goal up to **9 bigger action items**:
- **3 set-up actions** (Session 1)
- **3 challenges** (Session 2)
- **3 threshold / halfway markers** (Session 3)

On the **North page**, the learner can add **as many daily tasks as they want** toward
each of those 9 action items. Daily tasks are the learner's own words, their own pace -
never assigned, never scored.

## Gentle over-scheduling notice (grace, not a wall)

Each action item lives in a session, and each session has a known number of weeks. If a
learner stacks **more daily tasks against one action item than the weeks in that session
comfortably allow**, the app gives a **gentle notice** - a soft "that's a lot for the time
this session holds - want to spread it out?" It never blocks. The learner stays sovereign;
the app only offers a mirror. (Same grain as the "a FEW, never the full ladder" ceiling
already in the goal modal.)

## The reflection action reviewer

A learner's completed / attempted daily tasks flow into a **reflection action reviewer** -
their own record of what they did. Over time it holds honest, non-judgmental signals:
- **planned and missed** - set a task, didn't get to it
- **succeeded** - did what they set out to do
- **breezed through** - finished fast, maybe under-challenged

This is descriptive, not a grade. No points, no ranking, no comparison to other learners.

## Session 4: the learner reviews their own patterns

By **Session 4** (the grace / review session), the learner can look back at their own work
patterns in the reviewer - "I plan big and finish half," "I breeze through set-up but stall
at challenges." The learner owns this reading first. It is a tool for **self-knowledge**,
which is the whole point of a self-directed studio.

A **guide** then gets **an eye on how to best support** that learner - where to offer more
challenge, where to lighten the load, where to sit alongside. Support, not surveillance.

## GOVERNANCE FLAG - read before building the guide-facing view

The guide-facing "work patterns" view is the one piece here that sits **close to the line
the app holds**: *never scores, never sorts.* The intent is aligned - "how to best support
them" is capability-not-scorekeeping, exactly the whose-goal-whose-words grain. But the same
data, framed as a dashboard of who's-behind, would drift into the scoreboard the Prime
Directive forbids. The difference is entirely in the framing and the affordances.

So before the guide-facing surface is built, it goes to **Accord (human development) + Salus
(safety) + the no-sorting guard (c1)**, the same panel that ratified the guide-practice
privacy wall. Design questions for them:
- Does the learner see their own patterns **first and fully**, before any guide does?
- Is the guide view **support-shaped** (where to sit alongside) rather than
  **rank-shaped** (who's ahead / behind)?
- Is "planned and missed" rendered as **information for care**, never as a deficit mark?
- What does the learner **consent** to a guide seeing, and can they hold some of it private
  (mirrors the guide_crossings self-only wall from v0.24)?

The learner-facing self-review (Session 4, own eyes) is low-risk and aligned. The
guide-facing view is the part that must be designed *with* the SSC/PDC panel, not shipped
ahead of it.

## Build order (when unblocked)

1. 3-phase goal build (modal + `decomposition` save) - gated on v0.24 adapter commit.
2. North daily-tasks against the 9 action items + the gentle over-scheduling notice.
3. Reflection action reviewer (learner-owned record of plan / miss / succeed / breeze).
4. Session-4 self-review (learner's own eyes) - low risk, build alongside 3.
5. Guide-facing support view - **only after** Accord + Salus + c1 panel review.

---
*"We evoke - we never extract." The reviewer is a mirror the learner holds, not a scope a guide points.*
