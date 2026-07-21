# Goal detail-step, book tracker, and the "make a task" demo - build note

**Date:** 2026-07-21. **Status:** design/build note. Builds on `2026-07-20-how-to-break-down-a-goal-guidance-v1.md` + the tribe-readiness discussion. **NOT built.**
**Coordination:** do NOT touch the wheel session's in-flight `COMPASS_V2` files. Commit local, don't push (parallel-commit hazard).

---

## Code grounding (as-is, verified 2026-07-21)

- **Goal setup** (`openGoalSetupModal`, `modals.js:1029`): steps are
  - doing: `['yeargoal', 'now', 'threshold', 'challenges', 'setup']`
  - becoming: `['yeargoal', 'now', 'presence']`
  - `now` = **the mirror** ("Where are you starting from... the mirror, not the dream", `:1095`).
  - `threshold` = milestones (halfway retained), `challenges`, `setup` = the 3-phase Plan decomposition.
- **Task modal** (`openTaskModal`, `modals.js:604`): **minimal** - text + date only. No task shapes, no practice-timer, no recurring, no book link. The practice-timer / standing-practice / book-tracker are **designed but UNBUILT**. This is real net-new build.

---

## 1. Tribe-readiness = one seeded goal *(decided)*

"Move up into [tribe]" is **one goal**, not five region-goals and not a flat checklist. The threshold tasks are its **seeded breakdown**, grouped by region for display:

> **Move up into Adventure** - *what it takes, across your whole compass:*
> World: Lexia · Khan · spelling · handwriting · JT · typing · | Making: lead 2 Launches · | Others: build culture · | Self: heroic mindset · | Voice: read *Courage to Grow*

- **Slice home - SUPERSEDED by the one-crossing-object model** *(2026-07-21 meeting, Decision 1)*: the earlier "Discovery = World slice / Adventure+LP = center crossing" cohort fork is **retired**. "Moving up" is **one crossing object** in all cohorts - a threshold between two whole-compass states. What shifts by cohort is the **center-of-gravity of its breakdown** (World-heavy at Discovery -> whole-compass by Adventure), not the object's identity or home. Age-gated (hard floor) but not age-dependent; readiness witnessed, never computed.
  - **The gate dissolved** *(Decision 2)*: the system says **nothing** about readiness. The learner's story speaks; a guide names the crossing. The schema is **incapable** of representing "behind."
  - **Object note (load-bearing):** a *crossing* is NOT a becoming goal. Becoming **refuses** tasks (no ladder); a crossing **keeps** its doing-tasks (the region-grouped threshold breakdown) and is witnessed/human-named at the end. Distinct third object type. Building it as "becoming" would strip the task-list that makes it work.
  - **Build wiring (2026-07-21):** leveling-up state = the existing **pitch** system - `pitchTargetStudio` set (self-declared) AND `pitchAgeStatus !== 'denied'` (guide's age yes/no, not a birthday). The crossing surface is `openThresholdsModal`. A denied pitch = "returning," not leveling-up.
- **Guardrails:** suggested-not-locked (learner adapts/adds; protects authorship / inclusive autonomy); milestones-not-a-gate-score (no "4 of 6", no readiness meter); the Voice *task* stays becoming (no completion apparatus); the crossing is **human-named**, never auto-minted.

## 2. The "what will it take" detail step *(decided: add; open: sequencing)*

- Add a **"what will it take - get as detailed as possible"** prompt, positioned **before the `now` mirror**. Rationale: name the climb, then the mirror asks *"of all this, where are you now?"* - the detail gives the mirror something to reflect against.
- **DOING GOALS ONLY.** Becoming goals keep the presence step - the detail question **is** the ladder, which the becoming carve-out refuses (c1-guarded). For becoming, the same slot stays "what would it feel like to be living this?"
- For the tribe-readiness goal, this step is **pre-seeded** with the region-grouped threshold tasks.
- **DECIDED - (a)** *(captain 2026-07-21)*: the detail step is a **wide brainstorm that funnels into** the existing three phases (`threshold`/`challenges`/`setup`). Richest option; accepted cost is **six text steps** for a doing goal.
  - New doing flow: `yeargoal -> detail -> now (mirror) -> threshold -> challenges -> setup`.
  - Becoming flow **unchanged**: `yeargoal -> now -> presence` (no detail step; the ladder is refused, c1-guarded).
  - **Developmental-load mitigation (build-quality, not a re-decision):** six steps is heavy for a young Discovery learner. Keep the brainstorm **light and low-friction** - a single open box, freely **skippable**, that *seeds* the three phases rather than gating them, so a learner can move straight through. The richness is available, never mandatory. (Reconciles (a) with the earlier cohort instinct: same flow, gentler on the young.)

## 3. Book tracker *(decided)*

- **Up to 3 "currently reading"** books - ceiling-not-floor; a *shelf*, not a lifetime count.
- Each book: **learner-started practice-timer** for reading sessions + a **learner-set bookmark** (page/chapter) - the reading-specific version of the timer's evolving "where are you now?" handoff.
- *Courage to Grow* = one of the 3 (no special case).
- **"Automatic" = PRE-WIRED, not SCHEDULED** *(captain-confirmed)*: the timer + where-am-I handoff are already set up (zero setup friction), the learner still starts it. **No** system-generated daily task, **no** streak, **no** pace, **no** "behind."
- **Guardrails:** bookmark = "where you are," never a due-date or pace. No books-read leaderboard. Track the **reading** (doing); never the **becoming** (no "% self-authored").

## 4. Reading task = addable daily task + canonical example *(decided)*

- The book-reading practice is a **standing-practice** task addable to a day **from the task list** (daily-layer shape (b)).
- It is the **canonical worked example** for teaching task-creation.
- Requires extending `openTaskModal` beyond text+date: **task shape** (one-off vs standing practice), optional **timer duration**, optional **book link**.

## 5. "Make your first task" demo *(proposed - pending shape confirmation)*

A guided first-run walkthrough that teaches the task-creation mechanic by making a **real, kept** task (reading), not a throwaway. Scaffold-and-fade (research cycle 2): scaffolding for the skill, then it disappears.

- **Proposed steps:** pick what (a book from your shelf) -> choose the shape (finish-once vs a rhythm you return to) -> set the timer (how long today) -> add it to a day -> *"you made a task. you can make one for anything now."*
- **Guardrails:** **skippable** ("I'll do it myself"); produces the learner's **own real task** (real content, not lorem); **no** tutorial-badge / reward / streak for finishing it.
- **Open:** trigger (first empty task list? offered from the goal after breakdown?); learner-facing is primary, optional guide-facing "help a learner make their first task" companion.

---

## Build sequence *(behind the wheel session)*

**Status (2026-07-21, local commits, unpushed):**
- ✅ #1 detail step (`220c0a8`)
- ✅ #2 entry fork via pitch state (`7e15236`) - leveling-up leads with the crossing; else leads with own goals
- ✅ #3 Three C's setup step, age-reworded (option b) + new-to-tribe roster (`4884431`)
- ✅ Guide new-to-tribe toggle - retires the roster stopgap (`33bce2a`)
- ✅ Book tracker **sub-step 1** - "Currently reading" shelf on North, free-text bookmark (`d61423c`)
- ⏸️ **HELD** - book tracker sub-steps **2-3** (task-shapes in `openTaskModal`/`modals.js`, the timer, the task-link) + the **make-a-task demo**. Reason: a parallel session has uncommitted work in `modals.js`/`store.js`/`local-store.js`/`supabase-adapter.js`/`partner.js` (+ `v0.27-leaders-and-guide-assigned-partners` migration). Resume once that lands and the tree clears - sub-step 2 edits `openTaskModal` in the same `modals.js`.
- 🔀 **#4 crossing region-grouped render** - deferred to the wheel session's `thresholds.js` step 3 (`THRESHOLD_LIFE_AREA` → four-region remap + retire `CURRENT_WHEEL_GLOBAL_FLIP`) plus the meeting's Q1/Q2 re-mappings (`adv_lead_launches`→Making, `adv_courage_book`→Voice). Not buildable here until then.
- ⚠️ **c1 is RED from the other session**, not this work: their in-progress `renderSliceYearPage` references `terminalLabel` outside the guard's eval scope. Flag to that session before any push. This work's files are not read by that guard; parse-checks pass.
- Cohort matrix wiring (Discovery new/returning · Adventure new/returning · Parents · Owners) still to come.


1. *(wheel session lands four-region + thresholds first)*
2. Extend `openTaskModal` - task shapes + timer + book link.
3. Book tracker - 3-shelf, bookmark, practice-timer.
4. Goal detail-step - after the §2 sequencing decision.
5. The demo.
6. Seed the tribe-readiness goal breakdowns.

## Guards to respect

- Becoming carve-out (c1) - detail step is doing-only.
- Category Wall - no streak / score / pace / leaderboard anywhere in the book tracker or demo.
- Don't touch wheel-session in-flight files; commit local, don't push.

*"We evoke, we never extract."*
