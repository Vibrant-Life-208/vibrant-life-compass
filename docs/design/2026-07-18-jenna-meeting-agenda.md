# Jenna Meeting - Agenda (2026-07-18, 12:00)

**Purpose:** make the design decisions that unblock the build, confirm the school-owned pieces, and set
up today's learner walk (Jaxton 1:00 · Andie+Mason 2:00 · Kyra 3:00).
**Field sheet for the afternoon sessions:** `2026-07-18-walkthrough-watch-card.md` (per-learner card,
frame script, watch-for list). This agenda is the *decisions*; the watch card is the *walk*.

---

## A. Decisions that unblock the build (need your judgment)

**1. Which Adventure slices are "becomings"?**
Spirit + Emotions are confirmed becomings (presence register, not a finish line). **Open: Joy / Home /
Family - becomings or skills?**
*Recommendation:* confirm Spirit + Emotions today; decide the other three.
*Unblocks:* the full `isBecomingSlice` generalization. The code already fail-safes Spirit/Emotions to
the presence note; the rest wait on this.

**2. The Spark parent role - capability, not content.**
A parent supplies capability (read the prompt aloud, remind, celebrate); the child supplies content
(the goal, the choice, the pace). Driver-mode (parent authors + scores) should be structurally
impossible, not just discouraged.
*Recommendation:* the parent never gets a goal-TEXT box for a Spark; the content field is the child's
dictation, verbatim and attributed. (Backed by the research: autonomy support is the highest-leverage
parent behavior; monitoring reads as distrust.)
*Unblocks:* the `entered_by`/authorship field + the Spark-parent scaffold surface.

**3. Held-learner pitch.**
Andie and Mason cannot move up (age gap). Should the app ever raise the Launchpad/Adventure ladder to a
held learner at all?
*Recommendation:* suppress the pitch for a learner the guide marks as held/deepening. Age is timing,
never tier.
*Unblocks:* the first-year / held-status schema decision.

---

## B. Confirm with the school

**4. The Launchpad model.** Are Launchpad requirements **first-year priorities** (worked on once in),
not **entry gates**? If post-entry, we **delete** the pitch-gate path rather than fill it. Also: is the
crossing rite named, and what are the real requirements? (Terminology: "Threshold" means two things -
the generic readiness gate AND the Acton portfolio projects. Keep them distinct.)

**5. The family-view wall.** The four learners are siblings sharing a family view. "Family view is
values + strengths only, reflection-only, forever" should be an **enforced wall**, not a code comment,
before any progress field could turn four siblings into a within-family ladder.

**6. Home-academics boundary.** Some parents run academics at home. How do we let them reflect that into
the child's own Compass (whole life honored) **without** it becoming a report card or a second scorecard
the school evaluates? (No learner-private scope exists today.)

---

## C. Today - leadership + logistics

- **Consent posture (do first, before 1:00).** Real children's answers get stored today with no recorded
  assent. Decide the artifact: a spoken assent from each learner + a parent OK, noted. This is the one
  time-sensitive item.
- **Per-learner (see the watch card):** Jaxton = mover-up (pitch now suppressed - lands on the Launchpad
  wheel clean); Andie + Mason = held stayers (say the age-is-timing line by name); Kyra = first-year
  (the adult is her Arrive welcome; then the media conversation). **An adult sits with every learner.**

---

## D. What is already fixed (so you know the state)

All committed and pushed to `feat/stage-o-slice-walk` (not yet in production):
- Parent view no longer scores a child (no percentage, no "X of Y," no "In review" badge)
- Launchpad crossing shows no age-gate and no empty pitch ceremony
- Adventure Spirit/Emotions goals show the presence note, not a finish line
- Welcome reads just "Welcome."
- Adult + Launchpad wheels: long labels on leader lines (legible)
- P&T journey: stacked and reframed per Troi's amended Decision 4 (co-present, not a ladder)
- Password-reset gap for family logins: found, assessed (Riker + Worf), drafted fix held for TCC review

---

## E. For you to sit with

- **The parent + Spark prompt** (from the watch card): the most supportive role is capability, not
  content - whose goal, in whose words.
- **Two design tensions (not tasks):** path-blindness is a virtue at the mirror and a hazard at the gate;
  and "fixing" the empty Launchpad crossing is a trap if the fix clones the Adventure gate.

---

*"We evoke - we never extract."*
