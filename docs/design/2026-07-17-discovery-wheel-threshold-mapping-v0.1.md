# Discovery-wheel threshold → slice mapping (v0.1, DRAFT — FOR REVIEW, not ratified)

Date: 2026-07-17
Status: **SIGNED-WITH-CONDITIONS 2026-07-17 — 5/5, no dissent** (Jake, Accord, Satis, Tutela,
Claritas). Placements ratified at DATA/direction level; `adv_effort` RESOLVED to Heart; "list
is HELD not load" conditional on render-as-field. DATA / direction only — does NOT enable code.
`MAPPING_RATIFIED` stays `false`; `CATEGORY_LIFE_AREA` stays empty; `useSlices` stays
guide-summer-only. No code-fill until a build meeting says otherwise, and the
watch-with-a-real-learner gate governs exposure regardless. Conditions consolidated in
`docs/design/2026-07-17-consolidated-build-conditions.md`.
Decision log: `evoke-agents-backup/agents/decision-logs/2026/07/2026-07-17-discovery-wheel-threshold-table-review.md`

Author: Claude (facilitator), drafting the lockstep artifact the 2026-07-16 re-ratification
named as owed. This is a companion to `2026-07-14-threshold-to-wheel-slice-mapping-v0.1.md`
(the **Adventure** table), re-homed onto the **Discovery** wheel after the 2026-07-16
direction change from target-wheel to current-wheel.

---

## Why this table is owed

On 2026-07-16 the fleet re-ratified the slice direction from the **target** (Adventure) wheel
to the learner's **current** (Discovery) wheel (Accord + TCC/Satis, superseding the 7/15
target-wheel sign-off). Satis recorded the lockstep condition explicitly: *the only concrete
threshold table today is the held Adventure one (`adv_*` → Mind, `MAPPING_RATIFIED=false`); a
concrete Discovery-wheel table (`adv_*` → Learning) must be authored before code-fill, riding
the same Accord + TCC gate.* This document is that table, at v0.1, for review.

It is also the **concrete instance** of the multi-goal-per-slice question reopened in the
2026-07-16 per-goal-decomposition RE-REVIEW: under the redesigned shape a slice is a **list**,
so a pitcher's **Learning** slice here renders as **six broken-out locked goals** and **Heart**
as **four**. "Does a pitcher's education slice (several locked goals) read as load or as held?"
stops being abstract at this table. The two reviews share a gate.

---

## The wheels, side by side

- **Adventure** (old target): `Movement · Mind · Spirit · Emotions · Family · Friends · Home · Joy`
- **Discovery** (current): `Movement · Learning · Heart · Family · Friends · Fun`

Source of truth: `WHEEL_TIERS` in `js/wheel.js` (verified 2026-07-17). The load-bearing
difference: **Discovery has no `Emotions` slice and no `Spirit` slice.** Adventure's `Mind`
becomes Discovery's **`Learning`**; Adventure's `Emotions` and `Spirit` clusters have no
one-to-one Discovery home and **collapse into `Heart`** — the becoming-slice, per the
2026-07-16 category placement call (Character → Heart on Discovery, NOT Emotions).

---

## Draft mapping — Discovery → Discovery (current-wheel pitch)

The threshold set is unchanged (`THRESHOLDS.adventure` in `js/thresholds.js` — same 12 pitch
thresholds). Only the destination wheel changed.

| Threshold (id) | Name | → Discovery slice | Rationale |
|---|---|---|---|
| `adv_khan` | Master Khan grade levels 2-5 | **Learning** | academic mastery |
| `adv_lexia` | Finish Lexia Core5 | **Learning** | reading skill |
| `adv_spelling` | Proficient spelling | **Learning** | literacy skill |
| `adv_handwriting` | Proficient handwriting | **Learning** | skill, not fine-motor (captain 7/15 ruled Mind-not-Movement; Learning is Discovery's Mind — see note 4) |
| `adv_jt` | Journey Tracker proficiency | **Learning** | tool / self-organization |
| `adv_typing` | Typing skills | **Learning** | tool skill |
| `adv_lead_launches` | Lead 2 morning Launches | **Friends** | leading peers / studio culture |
| `adv_leadership` | Leadership & culture building | **Friends** | community |
| `adv_mindset` | Heroic mindset: growth + creator | **Heart** | inner life / who I'm becoming (no Emotions slice on Discovery; Heart is the becoming-slice per 7/16 Character→Heart) |
| `adv_effort` | Excellent effort, focus & intentionality | **Heart** | disposition / self-regulation — **RESOLVED to Heart (2026-07-17 review):** moving to Learning would render effort as a *measured academic achievement* (performance-anxiety pattern); Heart overload is fixed by render, not relocation |
| `adv_soaring` | Soaring freedom for 2 consecutive weeks | **Heart** | self-governance / holding the contract = inner |
| `adv_courage_book` | Read "Courage to Grow" | **Heart** | meaning / becoming (no Spirit slice on Discovery; collapses to Heart) |

**Slices with no threshold (invitations): `Movement`, `Family`, `Fun`.**
Per the coverage frame, these are correct and intended — the child's to fill from their own
life. Do NOT invent placements to "balance" the table.

**Slice load:** Learning 6 · Heart 4 · Friends 2 · Movement/Family/Fun 0.

---

## What changed from the Adventure table — the four things the reviewers must weigh

1. **Emotions + Spirit collapse into Heart (the load-bearing change).** On Adventure, `mindset`
   / `effort` / `soaring` sat in **Emotions** and `courage_book` in **Spirit**. Discovery has
   neither slice, so all four land in **Heart** (4 carried goals). This is consistent with
   Jake's 2026-07-16 call — *Character → Heart, NOT Emotions, because Emotions reads a child's
   character as a regulation problem to be managed; Heart is the becoming-slice that passes the
   Exhale Test.* **The #1 review question for Jake:** under the slice-as-list redesign, does a
   **Heart slice showing four locked "carried" goals** (heroic mindset, excellent effort,
   soaring, read a book) read as *"who you're becoming"* — or as a self-improvement checklist
   pinned to an eight-year-old's character? If the latter, this table needs a rethink, not just
   the render.

2. **`adv_effort` — RESOLVED to Heart (2026-07-17 review).** Effort / focus / intentionality
   straddles disposition (**Heart**) and academic-effort (**Learning**). The room resolved it
   to **Heart**: moving it to Learning would render effort as a *measured academic achievement*
   — a performance-anxiety pattern, the same error as Character→Emotions refused 7/16. Heart
   stays at four; overload is addressed by **render, not relocation** (Heart-as-portrait, not
   inventory — see the build conditions). Reopened first only if Heart reads as an inventory.

3. **Learning carries six (sibling to Mind's six on Adventure).** The captain accepted the
   Adventure lopsidedness — *"this is the mind at work; it is education; the learner adds tasks
   to the other slices."* The same holds here, and Satis's lockstep is satisfied: **all six
   academics live in one slice** (Learning), never split — no `Calling+Mind`-style fracture of
   the same academic work.

4. **`Movement` exists on Discovery and is empty — the handwriting fine-motor candidate is live
   again but stays closed.** On Adventure the captain ruled `adv_handwriting` → Mind (skill),
   rejecting the Movement/fine-motor reading. Discovery's `Movement` slice is otherwise an
   invitation, which re-tempts the fine-motor placement. **Kept at Learning** to honor the
   captain's skill-not-motor call; noted, not reopened, absent a captain instruction.

---

## Coverage frame + the three binding conditions (for TCC)

This table is DATA. It advances no code and does not flip any flag. At code-fill, the three
binding build conditions from the 2026-07-16 re-review bind, verified against running code
(not this doc):

- **Condition 1 — open-by-choice is a STORED state, never inferred emptiness.** An empty
  `Movement` / `Family` / `Fun` slice must be *chosen-open*, not read as *missing-data*.
- **Condition 2 — read-only carried thresholds are read-only to the SYSTEM too.** A locked
  carried goal (all 12 here) may be read by the weekly/daily generation layer but never
  written to — no auto-complete, status mutation, or silent re-map.
- **Condition 3 — the count never gets a denominator.** Learning-6 and Heart-4 must render as
  fields, not "6 of 6" / "4 of 4"; empty and unfinished render identically; no fill-meter, no
  behind/ahead state, no red zero.

Consistency to hold (unchanged): a threshold and the category it belongs to render in the
**same** slice; the per-threshold mapping governs and the category fallback must not contradict
the academic majority (Learning).

---

## Structural / code-fill notes (NOT resolved here — for the build meeting)

- **The in-code `THRESHOLD_LIFE_AREA` is keyed by pitch-*target* studio (`adventure`).** The
  current-wheel direction re-homes the destination to the learner's *current* studio
  (`discovery`). Code-fill must decide: a new `discovery` key in `THRESHOLD_LIFE_AREA`, and/or
  inverting the `buildSlicePlan({ currentStudio, pitchTargetStudio })` logic so a pitcher plans
  by their current wheel. Data-table (this doc) is independent of that plumbing choice.
- **Slice-as-list vs one-goal-per-slice.** The 7/14 Adventure table kept *one goal box per
  slice* with carried thresholds riding beneath as "Carried from your pitch." The 2026-07-16
  redesign makes a slice a *list* of broken-out locked goals. If that redesign is what ships,
  the "one persisted goal box per threshold" alternative the 7/14 doc scoped as "a larger
  change" is now the intended shape — and carries the render conditions (A1: field not
  sequence) from the RE-REVIEW. Flagged as the seam between the two designs.

---

## Sign-off checklist (before any code-fill)

- [x] **Jake** (developmental fit): **SIGNED 2026-07-17.** Heart reads as *becoming* CONDITIONAL
      on Heart-as-portrait-not-checklist render; `adv_effort` → **Heart** (resolved); Learning-6
      held not load conditional on render-as-field.
- [x] **Accord** (coverage frame): **SIGNED 2026-07-17.** Invitation slices read *held* with an
      authored yours-to-fill invitation (Family most careful); collapse into Heart survives.
- [x] **TCC** (Satis/Tutela/Claritas): **SIGNED 2026-07-17.** Three binding conditions map onto
      Learning-6 / Heart-4; verify at code-fill against running code, not this doc.
- [ ] Captain: confirm the Emotions+Spirit→Heart collapse (the room pressure-tested it; your read
      as you wish). `adv_effort` placement is resolved by the room.

## References

- Adventure table (sibling): `docs/design/2026-07-14-threshold-to-wheel-slice-mapping-v0.1.md`
- Re-review that named this owed: `docs/design/2026-07-16-per-goal-decomposition-review-brief.md`
- Full design: `docs/design/2026-07-16-goal-decomposition-progression-architecture.md`
- Re-review minutes: `agents/meetings/2026/07/2026-07-16-per-goal-decomposition-perslice-onboarding-rereview.md` (evoke-agents-backup)
- Wheel source: `js/wheel.js` `WHEEL_TIERS`; threshold source: `js/thresholds.js` `THRESHOLDS.adventure`
