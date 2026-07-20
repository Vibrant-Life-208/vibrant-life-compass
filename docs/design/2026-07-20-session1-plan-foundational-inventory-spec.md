# Design Spec — Session 1 (PLAN): the Foundational Inventory, extended into the annual cascade

**Date:** 2026-07-20
**Status:** DRAFT SPEC — for Europa's approval before any build. Nothing ships to real learners before the watch-with-a-real-learner gate.
**Authors (room):** Comes (Journey), Accord (Human Development), Jake Sisko (Developmental/SSC), with Bareil (container) + Ezri (continuity)
**Source:** fleet SSC working session 2026-07-20; Europa design. Sits inside build plan `2026-07-20-goal-model-plan-do-close-reflect-build-plan.md` as Step 3.
**Architecture decision (Europa):** the whole-learner foundational inventory **extends the annual cascade** (Step 2b, commit 0d86e14) — it is NOT a separate surface. Per-goal planning stays in `openGoalSetupModal`.
**Build approach (Europa):** spec → approve → build incrementally behind `CURRENT_WHEEL_BUILD`, watch-gated.

---

## 1. What Session 1 (PLAN) is

Session 1 is the **start-of-year planning walk** — done once at the top of each year-cycle, re-walked annually (prefilled, edit-or-keep). It has two altitudes:

- **A. Whole-learner foundational inventory** (this spec) — who I am, what environment I need, what mindset I bring, what I want. Lives in the **annual cascade**.
- **B. Per-goal planning** (already built — `openGoalSetupModal`) — SMART steps, challenges, setup, per goal. Unchanged by this spec except framing.

Session 1 plans out Session 2 (DO). Sessions 3 (CLOSE) and 4 (REFLECT) are separate surfaces (later steps).

---

## 2. The foundational inventory — question set

Grouped into four movements. **Bold = already in the cascade today; the rest are new.** Kohn's *Punished by Rewards* frames the whole: Content (meaningful, not gold-star), Collaboration (community over competition), Choice (autonomy — every item skippable).

### Movement 1 — The Ground (Kohn: Collaboration; the caring environment)
1. Do I have a reliable space to learn?
2. What does it take to be a good accountability buddy?
3. What is a real open forum? (what makes a space safe to speak in)

### Movement 2 — The Posture (TED + Kohn: the empowerment mindset)
4. Am I aware of the power of the **TED mindset**? (The Empowerment Dynamic — Creator / Challenger / Coach, vs Victim / Persecutor / Rescuer)
5. What does it mean to be vulnerable? *(highest-exposure item — see §4)*

### Movement 3 — The Self (Kohn: Content — intrinsic motivation, not bribery)
6. **Do I know my character strengths?** *(already in cascade — VIA)*
7. **Do I know my values?** *(already in cascade — 44-value lexicon)*
8. What do I really want? *(vision-adjacent — pairs with the 1-year telescope)*
9. Are my goals passionate? (do they come from me, or from what's expected)
10. What problems in this world would keep me up at night if I really thought about it? *(highest-exposure item — see §4)*

### Movement 4 — The Goal Plan (per-goal; already in `openGoalSetupModal`)
11. What are the SMART steps for my goals? *(labeled plainly for learners — Ezri)*
12. What would the challenges be in achieving this?
13. What have been challenges in the past that kept me from achieving goals?
14. What can I do differently?

---

## 3. Kohn / TED framing across the session cycle (record)

The pedagogy threads all four sessions — this spec covers Session 1; noted here so the through-line is authored consistently:

- **Session 1 (PLAN) — the Three C's:** *Content* (meaningful, inherently interesting goals — Movement 3), *Collaboration* (community-building — Movement 1), *Choice* (autonomy; every question skippable — the whole inventory). Cultivate curiosity and purpose, not gold stars.
- **Session 2 (DO) — Problem-Solving:** when an issue arises, collaborative dialogue on root cause + a mutually agreeable solution, never reward/punishment.
- **Session 3 (CLOSE) — Feedback, not Praise:** descriptive feedback on effects and process, not "Good job!" that manipulates for repetition.

**Convergence (record):** Kohn's anti-rewards pedagogy IS the foundation of the ratified SSC conditions — human-authored badges (not gold stars), no denominators/leaderboards, "added however the learner wishes," descriptive feedback. Europa's source and the fleet's ethics are the same commitment.

---

## 4. HARD INVARIANTS (non-negotiable — every build PR holds these)

1. **Invitational, skippable, never a gate.** No foundational question blocks Session 2. Every item can be skipped or left blank. This is Kohn's Choice made structural. *(Accord + Jake)*
2. **Cohort-scaled depth.** Same movement, radically different container thickness per cohort (§5). "SMART" labeled in plain language for learners. *(Ezri)*
3. **Design for the most frightened body.** The two highest-exposure items — **"what does it mean to be vulnerable"** and **"what world-problems keep you up at night"** — are (a) absent or gentlest for the youngest, (b) always skippable, (c) framed as invitation not interrogation, (d) never surfaced to anyone but the learner. If in doubt, soften or cut for a cohort. *(Accord: "can the body exhale after reading this?")*
4. **Becoming carve-out preserved.** This inventory is whole-learner (goal-agnostic), so the becoming-vs-finish line lives at the per-goal layer (Movement 4): SMART steps apply to finish-shaped goals only; becoming goals (Heart/Spirit/Emotions) keep presence. Nothing in Movements 1-3 imposes a finish frame. *(Comes + Accord)*
5. **No denominator / no completion meter.** No "8 of 14 answered," no progress bar over the inventory. *(SSC standing condition)*
6. **Prefilled, edit-or-keep on the annual re-walk.** Returning learners see last year's answers and choose to keep or change — never re-forced from scratch. *(reuses Step 2b prefill)*
7. **Not surveilled.** Foundational answers are the learner's; they inform the learner's own planning, never a guide/owner dashboard, ranking, or export. *(Accord: unconditional regard)*

---

## 5. Cohort-scaling (the depth ladder)

Same four movements; the *thickness of the container* changes. Full per-cohort copy is the next authoring pass — this sets the principle + the two sensitive anchors.

| Cohort | Movement 1 (Ground) | Movement 2 (Posture) | Movement 3 (Self) | Depth of the two sensitive items |
|---|---|---|---|---|
| **Discovery** (young) | "getting ready" — my space, my buddy | TED as "I can be a Creator" (simple); vulnerability GENTLE or absent | strengths/values (have); "what do I want" concrete | vulnerability = "hard feelings are okay to share"; world-problems = **omitted or "what do you care about?"** |
| **Adventure** (older) | fuller — what makes a good buddy/forum | TED named; vulnerability as courage | passion + "what I really want" | vulnerability = real but held; world-problems = "what do you care about changing?" |
| **Launch Pad** (oldest learners) | near-adult | full TED framework | full — passion, world-problems | both at near-adult depth, skippable |
| **Guides / Owners** (adults) | full | full TED | full | **FULL Launch Pad version** — both at full depth, skippable |
| **Parents** (adults) | trimmed | trimmed | trimmed | **TRIMMED version** — needs a new parent entry point (parents currently excluded from the cascade); follow-on |

*(Jake: "a year is six different questions across these cohorts. Meet each where they are; never front-load overwhelm.")*

---

## 6. Cascade integration (how it extends Step 2b)

Current cascade order (`CASCADE_FULL`, modals.js): `breath → strengths → (strengths_why) → (values_why) → values → beyond_5yr → within_5yr → within_1yr → current_state → halfway → [pitch] → slice_plan`.

**Proposed insertion** (Movements 1-3, minus what's already present):
- `breath` → **Movement 1 (Ground)** → `strengths` → `values` → **Movement 2 (Posture)** → `beyond_5yr → within_5yr → within_1yr → current_state` (the telescope = part of Movement 3) → **Movement 3 remainder (what-I-want / passion / world-problems)** → `slice_plan` (per-goal planning, Movement 4).
- Exact step keys, resume-enum membership, and whether each new step is one screen or grouped: authoring + engineering pass.
- **Annual re-walk:** all new steps prefill from stored answers (like values/horizons already do); strengths still dropped on refresh (stable).

---

## 7. Already-covered vs net-new (build sizing)

- **Already built:** strengths, values, the 10/5/1 telescope + mirror (Movements 3 partial), per-goal SMART/challenges/setup (Movement 4), annual re-walk + prefill (Step 2b).
- **Net-new to build:** Movement 1 (Ground: space, buddy, open forum), Movement 2 (Posture: TED, vulnerability), Movement 3 remainder (what-I-want, passion, world-problems), plus Kohn framing copy and cohort-scaled variants. Storage: new profile fields (or a `foundations` jsonb, mirroring the horizons pattern) — additive, no destructive migration.

---

## 8. Open authoring questions — RESOLVED (Europa 2026-07-20)

- **Q-A. TED for young learners — RESOLVED:** Jake authors the age-appropriate version — the plainest true form of Creator/Challenger/Coach (vs Victim/Persecutor/Rescuer). Youngest get a simple "I can be a Creator" framing; full framework for Launch Pad + adults.
- **Q-B. World-problems for the youngest — RESOLVED: OMIT for Discovery** (or soften to "what do you care about?"). Full form for Adventure+/adults, always skippable.
- **Q-C. Storage — RESOLVED: one additive `foundations` jsonb** (`NOT NULL DEFAULT '{}'`), packed/unpacked by the adapter like `decomposition`. Rationale: the set will keep evolving (no migration per question); never queried per-field (invariant #7, not surveilled); mirrors the v0.22 `decomposition` + v0.20 `open_by_choice` jsonb precedents; safe for the 44 existing rows.
- **Q-D. Pacing — RESOLVED: one breathing screen per MOVEMENT** (not per question). Fewer, calmer screens (Bareil).
- **Q-E. Adult depth — RESOLVED:** **Guides + Owners get the FULL Launch Pad version** (the fullest inventory). **Parents get a TRIMMED version.** NOTE: parents are currently EXCLUDED from the cascade (skippable mini-North only) — a trimmed parent inventory needs a NEW parent entry point (small architecture add; follow-on).

---

## 9. Build sequencing (after approval)

1. Storage: additive `foundations` jsonb (or fields) + adapter wiring (mirror horizons/decomposition).
2. Movement 1 + 2 + 3-remainder as cascade steps, behind `CURRENT_WHEEL_BUILD`, cohort-scaled, skippable.
3. Kohn/TED framing copy — Comes + Accord author; cohort passes with Jake.
4. Reframe `ARC_PHASES` + `openGoalSetupModal` copy to Plan/Do/Close/Reflect (the working-view side of Step 3).
5. Verify: node --check + all 5 c1 guards + a browser walk per cohort.
6. Watch-with-a-real-learner gate before any flip.

**Invariant checklist (every PR):** skippable/not-a-gate · cohort-scaled · frightened-body test on the two sensitive items · becoming carve-out · no denominator · prefilled edit-or-keep · not surveilled.
