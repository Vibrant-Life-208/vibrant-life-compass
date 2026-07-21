# Compass Slice Pages - scope (v0.2)

**Date:** 2026-07-21. **Status:** Decision-4 review COMPLETE — CLEARED WITH CONDITIONS
(Jake + Accord + Tutela, all CLEAR WITH CONDITIONS). Phase A (adults) build+enable OK.
Phase B (learners) BUILD-behind-flag OK; ENABLE gated on the conditions in §8 + reviewer
re-walk with a real learner. Q1 answered: one goal per region. Not yet built.
**Author:** facilitated build session (Europa + Claude); review voiced by Jake, Accord, Tutela.
**Ask (Europa):** the compass shows all four regions + Voice; then **each goal-setting
page is a single-slice breakdown** - one region at a time, broken into its Life/Grows sides.
**Depends on:** `2026-07-20-four-region-compass-mapping-v1.md` (ratified taxonomy),
`js/wheel.js` compass v5 (shipped `f397d7e`).

---

## 1. Where we are now

- Goal-setting lives in `js/setup.js` → `renderGoalsGrid` (`:278`). It renders **category
  cards grouped by KIND** - `Core` / `Slices of Life` / `Pathway` / `Practice` / `When assigned`.
- Target is already region-shaped: `MIN_GOALS = 5` = "one goal per compass region" (`setup.js:17`).
- Each category resolves to a region via `CATEGORY_LIFE_AREA` → `lifeAreaForCategory` →
  `regionForLabel` (`studios.js:319-358`).
- Tapping a card opens the per-goal setup flow (`openGoalSetupModal`, now → milestone → steps).

**Gap:** the surface is organized by *kind of category*, not by *compass region*, and there is
no per-region breakdown page (Life side / Grows side / sub-areas) at all.

## 2. What "slice page" means (proposed)

One page per region, reached by tapping that slice on the compass (or walked in sequence
during setup). Each page shows:

- **Region header** - icon, colour, direction, and the region question
  (e.g. SELF: "How do I know and steady myself?").
- **The Life side** (the *doing*) - label + its sub-areas, from the v1 taxonomy.
  SELF → Health: body & movement · rest & energy · mood & feelings · joy & play.
- **The Grows side** (the *becoming*) - witnessed, never finished (presence cadence).
  SELF → Mindset: reflection · grit · self-knowledge.
- **Goal entry** for that region (see open question Q1 on granularity).

`VOICE` is a special case: **entirely becoming**, no Life side - its page holds
self-authorship / values / purpose as presence, not a doing-goal (v1 doc §VOICE).

## 3. New data needed (captain-authored, reviewable - NOT inferred)

A per-region breakdown structure (the Life/Grows labels + sub-areas). Source is the v1
design doc, but it is **not yet in code as data**. Per the `CATEGORY_LIFE_AREA` precedent
(`studios.js:300-305`), this placement is a values judgment and must live as visible,
reviewable data, never buried in a render. Proposed home: a `REGION_BREAKDOWN` map in
`js/wheel.js` (beside `COMPASS_REGIONS`) or a small `js/compass-regions.js`.

## 4. Change surface (smallest-first)

1. **Data:** `REGION_BREAKDOWN` (region → {question, life:{label,areas[]}, grows:{label,areas[]}, icon}).
2. **Render:** a `renderSlicePage(region, learner)` in `setup.js` (or a new `slice-view.js`).
3. **Nav:** make the compass slices clickable (each wedge → its region page); a back path to the compass.
4. **Setup flow:** offer the region-by-region walk as the goal-setting path (5 pages), keeping
   the existing kind-grouped grid as a fallback/edit view, or replacing it - see Q2.
5. **Goal model:** goals already carry `categoryId` → region; confirm one-goal-per-region vs
   per-sub-area (Q1). The `regionIdForCategory` shim already resolves legacy ids, so no orphans.

## 5. Governance gates (binding, from v1 doc + code)

- **Decision 4 (GATED):** learner-tier category→region mapping is deliberately empty
  (`studios.js:313-318`) and requires **Jake + Accord + TCC** sign-off before any learner sees
  a sliced year. So learner slice pages are **build-behind-flag, do-not-enable** until cleared.
- **Decision 3 (ungated):** guide-summer / adult maps 1:1 already - **slice pages can ship for
  adults first** without the Decision-4 gate.
- **Accord:** no completeness signal on the pages - an empty region is a direction not faced
  this season, never a deficit. No "3 of 5 set", no coverage meter.
- **Jake:** World's tribe-crossing must allow **exploration before commitment** - a learner can
  open a region page and look without a goal locking.
- **Tutela/TCC:** no goal orphaned; the page cannot express "behind."

## 6. Open questions for Europa (decisions I can't make)

- **Q1 - granularity:** one goal per region (today's `MIN_GOALS=5` model), or a goal per
  Life/Grows sub-area inside a region? This shapes the whole page.
- **Q2 - flow:** does the region-by-region walk **replace** the kind-grouped grid, or sit
  alongside it (compass = browse, grid = edit)?
- **Q3 - Voice page:** confirm Voice gets its own (all-becoming) page and what it holds
  (values already exist in onboarding - does the Voice slice surface them?).
- **Q4 - cohort order:** adults/guides first (ungated), learners later behind the Decision-4
  gate? (Recommended.)
- **Q5 - copy review:** is the v1 doc's sub-area wording final for the pages, or does it need
  Jenna / guide review before it's learner-facing?

## 7. Recommended phasing

1. **Phase A (ungated, buildable now):** `REGION_BREAKDOWN` data + `renderSlicePage` + clickable
   compass, wired for **guide-summer/adult** only. Ship behind the same per-learner gate that
   already exists so learners are untouched.
2. **Phase B (gated):** learner-tier category→region authorship + Jake/Accord/TCC review, then
   enable slice pages per cohort under the existing safety lock.

---

## 8. Decision-4 Review Ruling (2026-07-21) - CLEARED WITH CONDITIONS

Reviewers: **Jake Sisko** (SSC), **Accord** (human development), **Tutela** (TCC). All three:
**CLEAR WITH CONDITIONS.** No HOLD, no refusal. Scoped to **one goal per region** (Q1); if
granularity changes to per-sub-area, clearance does NOT extend - re-review Accord C1 + Tutela C1.

- **Phase A (adults/guides, Decision-3, ungated):** cleared to **build AND enable**.
- **Phase B (learner slice pages):** cleared to **BUILD behind the per-learner flag**; **NOT
  cleared to ENABLE** for any learner until §8 conditions hold in code AND the standing gate below.

**Convergent signal (3 agents / 3 circles):** no completeness signal. Jake ("no count, ever"),
Accord (C1), Tutela (C1/R1). Verified code fact: the hard `${filledGoals.length} of ${MIN_GOALS}`
count (setup.js:179-181) renders only on the LEGACY path; the current-wheel path already softens
to "Ready when you are" / blank. Slice pages inherit the softened path and must go further.

### Binding conditions (must hold before any learner-facing enable)

**A. No deficit / no completeness (Jake J3; Accord C1,C2,C5,C6; Tutela C1)**
- No count, denominator, fraction, "N of M", progress ring, or coverage meter - compass OR region
  level - in **code and the a11y/screen-reader tree**. Grep the render for any `${filled}/${total}`
  shape and any per-region done/complete/set boolean surfaced to the learner.
- An empty region renders **identically** to an unfilled one, visually and semantically. Screen-reader
  labels must not say "empty / incomplete / not set / 0 goals".
- No fixed rank/ordering that reads as a sequence. Compass tap-entry is the primary path; the linear
  5-page "walk", if kept, is un-numbered and enterable at any point, never the forced path.
- **Voice** center is presence-only: no doing-goal slot, no finish/completion state.

**B. Reveal gating (Accord C3; Jake J5)**
- Region reveal is **time-gated or learner-chosen, NEVER achievement-gated**. No region unlocks by
  "completing" another. Resolve "gates staged" to time/free-choice in the actual gating code.
- "Look / skip" is a real, loud, exitable default for young learners - a destination, not an evasion.

**C. Exploration before commitment (Jake J2,J4; Tutela)**
- Opening any region - World's tribe-crossing especially - **locks nothing** and persists **no partial
  state**. "Look" is a real exitable state. No auto-lock of core goals on crossing (separate review if
  ever proposed).
- **Sparks stay un-sliced.** Slicing grows with the child as the wheel does; "learner" is not one
  uniform tier at flag-flip.

**D. Data integrity (Tutela C2,C3,C4; Accord C7)**
- Schema **structurally cannot express "behind"** - no target/expected-count/completeness field or
  derived query per learner.
- **Orphan fixture test:** seed a goal for every `LEGACY_TO_REGION` id (movement, heart, emotions,
  joy, play, fun, time, family, friends, home, partner, money, finances, career, calling, mind,
  learning, spirit) + one unknown `slice_xxx`; assert each renders on its region page or the
  pass-through, zero dropped.
- **Read-path gate:** `renderSlicePage(region, learner)` must **refuse** (return the legacy surface /
  nothing) for a gated learner-tier with the Decision-4 flag unset. The empty learner
  `CATEGORY_LIFE_AREA` (studios.js:313-318) is a data-authorship gate; a render that reads *regions*
  bypasses it, so add an explicit read-path guard. Prove mixed-mode isolation: legacy learner rows are
  never mutated by the new page (read-only vs un-migrated data until the v0.27+ migration, TCC-gated).

**E. Authorship / copy (Jake J6; Accord C4,C8; Tutela)**
- `REGION_BREAKDOWN` (Life/Grows sub-area labels) lives as **visible, reviewable data** per the
  `CATEGORY_LIFE_AREA` precedent - never buried in a render.
- Empty-region invitation is **authored** copy (Others/family-adjacent the most careful), read at
  Accord's re-walk.
- The v1 sub-area wording gets a **Jenna/guide learner-facing pass** before Phase B.
- Learner-tier `CATEGORY_LIFE_AREA` mapping stays **unauthored/empty** until separately ratified
  (Jake: MAPPING_RATIFIED stays false at the learner tier).

### Standing gate (non-negotiable, all three) - blocks ENABLE, not BUILD
- **Jake J1 + Accord C9:** Jake + Accord **re-walk the BUILT learner surface**, and a **real learner is
  watched**, before the per-learner flag is enabled for any learner. No data sign-off substitutes.
- **Tutela R2:** refusal-right retained against any learner enable before the read-path gate (D) is
  demonstrated in code and the Decision-4 gate closes.

### Reservations recorded (non-blocking)
- Accord: "gates staged" must resolve to C3; if a build lands where region N opens on completing N-1,
  support reverts to HOLD.
- Jake: signing the *look* in World, not any auto-lock of core goals on tribe-crossing.
- Tutela: R1 - the pre-existing legacy "N of 5" is Accord's to adjudicate; Tutela will not co-sign a
  "no completeness signal" claim while it exists unnamed (now named here, and confirmed legacy-path only).

---

*v0.2 - Decision-4 cleared with conditions 2026-07-21. Phase A buildable now; Phase B builds behind the
flag and enables only after §8 + the standing re-walk. Full decision: fleet log 2026-07-21.*
*"We evoke - we never extract."*
