# Discovery-wheel threshold table — review brief (RUN FIRST)

Date: 2026-07-17
For: **Jake Sisko** (developmental fit) · **Accord** (coverage frame) · **TCC** (data sovereignty)
Status: **Awaiting sign-off.** DATA / direction review only — does NOT enable code.
`MAPPING_RATIFIED` stays `false`, `CATEGORY_LIFE_AREA` stays empty, `useSlices` stays
guide-summer-only. The watch-with-a-real-learner gate governs exposure regardless.

**This is the FIRST of two sequenced build-gate reviews.** It settles the Discovery slice
placements on real data, and its output (the settled slice-lists) feeds the second review —
the weekly/daily interaction layer (`2026-07-17-weekly-daily-interaction-layer-review-brief.md`,
run after this one). Do not merge the two: this is a placement/data review; that one is an
interaction-mechanics review, at a different altitude with a different reviewer center.

Object under review: `docs/design/2026-07-17-discovery-wheel-threshold-mapping-v0.1.md`.
Read it first. Read second (for the shape it feeds): the per-goal-decomposition RE-REVIEW
minutes `agents/meetings/2026/07/2026-07-16-per-goal-decomposition-perslice-onboarding-rereview.md`.

---

## Why this review, and why now

The 2026-07-16 re-ratification moved the slice direction from the target (Adventure) wheel to
the learner's current (Discovery) wheel, and named the concrete Discovery threshold table as
owed before any code-fill — riding the same Accord + TCC gate as the mapping (Satis's lockstep
condition). The table now exists at v0.1. Unlike the interaction-layer review, this one runs on
**real data today** — the placements are decidable now.

It is also the concrete instance of the "list or load" question the RE-REVIEW reopened: under
the slice-as-list redesign, a pitcher's **Learning** slice renders as **six broken-out locked
goals** and **Heart** as **four**. Reviewing this table *is* the test of whether multi-goal-per-
slice reads as held or as load.

---

## The delta this table introduces

Discovery's wheel is `Movement · Learning · Heart · Family · Friends · Fun` — **no Emotions
slice, no Spirit slice** (both Adventure-only). So the Adventure table cannot carry over:

- Adventure **Mind** (6 academics) → Discovery **Learning** (6). One slice, no split.
- Adventure **Friends** (leadership x2) → Discovery **Friends** (2). Unchanged.
- Adventure **Emotions** (mindset/effort/soaring) + **Spirit** (courage_book) → **collapse into
  Discovery Heart** (4). This is the load-bearing change.
- Invitations (no threshold): **Movement, Family, Fun.**

---

## The specific sign-off questions

### For Jake (developmental fit) — the center of this review
- **Heart-with-4-carried-goals is the #1 question.** The Emotions+Spirit cluster (heroic
  mindset, excellent effort, soaring, read "Courage to Grow") all land in Heart. Your 7/16 call
  put Character → Heart precisely because Emotions reads a child's character as a regulation
  problem. So the *destination* honors your call — but does a **Heart slice showing four locked
  "carried" goals** read as *"who you're becoming"*, or as a self-improvement checklist pinned
  to an eight-year-old's character? If the latter, the table needs a rethink, not just a render.
- **`adv_effort` (excellent effort, focus, intentionality): Heart or Learning?** Drafted to
  Heart for consistency with mindset/soaring, but it straddles disposition and academic-effort.
  If Heart feels overloaded, effort is the most defensible move to Learning. Your call.
- **Learning-6-as-a-list:** a healthy stretch, or a load, for an eight-year-old pitcher — given
  it now renders as six locked goals, not one Mind box with items beneath?

### For Accord (coverage frame)
- Do the three invitation slices (**Movement, Family, Fun**) read as *held*, not as gaps —
  three empty slices out of six is a lot of visible white space?
- Does the **Emotions+Spirit → Heart collapse** survive the somatic test — does concentrating
  four "becoming" goals in one slice read as richness or as pressure on that one slice?
- Does "list" render as a **field, not a sequence** (A1 from the RE-REVIEW) at the Learning-6
  and Heart-4 grain specifically — no rank, no ordering number, empty=unfinished?

### For TCC (Satis / Tutela / Claritas — the three binding conditions)
- **Condition 1:** an empty Movement/Family/Fun slice must be a STORED open-by-choice state,
  never inferred-empty. Does the table preserve that at three empty slices?
- **Condition 2:** all 12 are locked carried goals — read-only to the system too. Nothing in the
  placement implies auto-complete or silent re-map.
- **Condition 3:** Learning-6 and Heart-4 must never acquire a denominator ("6 of 6", a fill
  bar, a red count). Stress-test the two loaded slices specifically.
- **Lockstep:** all six academics live in one slice (Learning), never split — confirm the
  per-threshold mapping doesn't contradict the academic majority.

---

## What a sign-off here means (and doesn't)
- **Means:** the Discovery placements are developmentally sound + honor the coverage frame +
  honor the three conditions, at the DATA level; `adv_effort` and the Heart-4 question are
  settled; the slice-lists are ready to feed the interaction-layer review.
- **Does NOT mean:** code is enabled. `MAPPING_RATIFIED` stays false; verification at build is
  against running code, not this doc; the watch-with-a-real-learner gate still governs exposure.
- Record sign-offs via the Fleet MCP channel (`mcp__fleet__update_memory` from an
  evoke-agents-backup session), not facilitator direct-write.
