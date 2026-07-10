# Pitch Readiness / Thresholds to Thrive - Design Spec v0.1

**Date:** 2026-07-09
**Status:** DRAFT for captain review. No code written yet.
**Author:** Claude Code, on Europa's design direction

---

## 1. What this is

An opt-in path for a learner who is **age-eligible to move up to the next studio**
to start working, during their year, toward that studio's **Thresholds to Thrive** -
the Acton readiness criteria a learner meets (and pitches) before being accepted up.

Two surfaces:

- **Onboarding** plants the intention (a warm age-gate + opt-in), right before the
  1-year goal.
- A **dedicated "Pitch to [Next Studio]" page** holds the actual thresholds - a
  year-round reference + light progress tracker they return to, mirroring the
  paper form.

Captain decisions (2026-07-09): thresholds live on a **dedicated page**, not
crammed into the onboarding cascade; **spec before code**.

---

## 2. The onboarding branch (learners only, before the 1-year goal)

Inserted into the horizon cascade for a **learner** whose age clears the next
studio's gate:

1. **Age-gate (soft):** "You're old enough to think about pitching up to
   **[Next Studio]** next year. Want to hear about it?"
   - Gate = learner's age >= next studio's entry age (see 5, Age gate).
   - Not a hard determination - readiness is thresholds + guide acceptance. This
     is only "are you thinking about it?"
2. If **yes:** "Would you like to start getting ready to pitch this year?"
   - **Yes** -> set the pitch-intent flag; the "Pitch to [Next Studio]" page turns
     on; a one-line "you're working toward [Next Studio]" appears; continue the
     cascade (1-year goal, etc.).
   - **No** -> continue the cascade unchanged. (Ask again next year.)
3. If age-gate is **no** (too young): the branch never appears.

**Why here:** it frames the year's goal-setting ("what am I working toward?")
without turning onboarding into a checklist. The thresholds themselves are never
shown inline - only the invitation.

---

## 3. The dedicated "Pitch to [Next Studio]" page

Turns on once a learner opts in. A year-round working page that mirrors the paper
form. Structure (Discovery -> Adventure as the worked example):

### Header
- "Your pitch to Adventure Studio" + the framing paragraph (Acton readiness vs.
  age-based promotion; greater responsibility + freedom).
- Deadline banner (e.g. "Turned in to Ms Rose by April 30").

### Threshold checklist (the core)
Grouped **Skills** and **Character**. Each item:
- name + one-line explanation (expandable to the full "what this means")
- **status** the learner can set (Not started / Working on it / Done)
- **planned date** + **date accomplished** (learner-entered)
- **who signs / how it's measured** label (see on/off-app boundary, 6)
- **"if I'm struggling"** support path (the doc already gives one per item)

### Opportunities-after (locked until thresholds met, shown as the reward)
- Curiosity Quest (Session 7 / May)
- Discovery Reflection + Adventure Pitch
- Sign the Commitment Statement

### Tone
Aspiration, not obligation. This is a privilege they are reaching for, framed as
the next step on the Hero's Journey - never a pass/fail gate the app enforces.

---

## 4. Data model

### 4.0 BLOCKER - birthdate is not persisted (Phase 0)
Setup captures `learner.age` but it lives only in the local skeleton; the Supabase
`learners` table has **no age/birth column** and the adapter never saves it.

**Decision (captain 2026-07-09): store birth month + year, not a bare age.** The
gate is a cutoff computation (see 5), so it needs a birthdate, and birth-month/year
means it never has to be re-entered yearly.

- Migration: `alter table learners add column if not exists birth_month smallint check (birth_month between 1 and 12), add column if not exists birth_year smallint;`
- Adapter: `saveLearner`/`getLearner` read+write both.
- Setup UI: replace the "How old are you?" number with birth month + year selects.

### 4.1 Pitch intent
On profiles or learners:
- `pitch_target_studio text null` - the studio they're pitching to (or null)
- `pitch_intent_at timestamptz null` - when they opted in

### 4.2 Threshold progress
A row per (learner, threshold_item):
- `learner_id`, `threshold_key` (stable id, e.g. `adv_lead_launches`)
- `status` ('not_started' | 'working' | 'done')
- `planned_date date null`, `accomplished_date date null`
- `self_score smallint null` + `smart_goal text null` (character items - the
  learner captures their own 1-5 and a SMART goal in-app; see 6)

**Visibility (decision, captain 2026-07-09):** learner-private by default, then
**shared to their guide + accountability partner at the halfway point** (End of
Session 3). Rationale + RLS shape in 6.a.

### 4.3 Threshold content (static, in code - not user data)
A structured table of transitions -> items. See 7. Authored content, not schema.

---

## 5. Studio order + age gate

Order: `sparks -> discovery -> adventure -> launchpad`. Add a `nextStudio(studio)`
helper (returns null for launchpad).

Entry ages: adventure 11, launchpad 15. (discovery 8 is moot - see below.)

**Gate rule (captain 2026-07-09):** a learner can apply if they will have turned
the next studio's entry age **within 4 months after the next school year's start**.
i.e. `birthdate <= (nextYearStart + 4 months)` mapped to the entry-age year.

Concretely: cutoff = `getYearCalendar().yearStartISO` for the coming year, plus 4
months. If the learner reaches `entryAge` on or before that cutoff, the invitation
appears. Generalizes the Adventure doc's "turned 11 by end of August" into a rule
that reads the calendar rather than a hardcoded date. Soft only - surfaces the
invitation, never blocks or forces.

**No Sparks in Compass (captain 2026-07-09):** Sparks (4-7) learners do **not**
use Compass - only their parents do. So the only in-app transitions are
**Discovery -> Adventure** and **Adventure -> Launch Pad**. Sparks -> Discovery is
dropped. (Side note: the `sparks` wheel tier shipped 2026-07-09 is therefore
currently unused by any learner - harmless, leave for now.)

---

## 6. On-app vs off-app boundary (important)

Most of the paper process is **in-person / paper** and must NOT pretend to be
app-enforced. The app **displays and lets the learner self-track**; it does not
adjudicate.

| Threshold element | On-app | Off-app (marked as "with your guide") |
|---|---|---|
| Task list + explanations | shown | - |
| Learner status + planned/accomplished dates | learner-entered | - |
| Ms Rose signatures | shown as a line item | signed off in person |
| Committee 1-5 (handwriting/spelling) | shows the result if entered | evaluated by committee |
| Self + 5-tribemate character scaling (1-5) | **captures** self-score + SMART goal (decision) | peer 1-5 scaling happens in studio |
| Soaring freedom (V-bucks, core goals) | shown as a criterion | tracked in studio system |
| Named tools (Khan, Lexia, TypingClub, Courage to Grow) | **name-only** (decision) | opened from the saved-passwords page |
| Curiosity Quest / Pitch / Commitment | shown as opportunities | happen in studio |

Principle: the app is the learner's **mirror and planner**, not the **judge**.
No score the app computes decides acceptance.

**Named tools (decision, captain 2026-07-09):** thresholds name the tool, they do
NOT link out inline. Instead the existing **saved-passwords page** (which already
holds the learner's Khan / Lexia / Google logins) gets an option to **open a tool
in another tab and remember it** - so the launch point lives with the login, not
scattered through the checklist. Ties the pitch work to a surface the learner
already uses.

### 6.a Visibility at the halfway point (recommendation on the captain's question)
Captain: *"guides + accountability partner can see it - make it visible at the
halfway point?"* **Recommend yes, and here is why it fits:**

- **Learner-private first.** They own the working document; no passive early
  surveillance (fleet sovereignty principle).
- **Auto-shared to guide + accountability partner at End of Session 3** - which is
  already the app's built-in mid-year accountability moment (the goal cascade's
  partner commitment sign-off happens exactly there). So the pitch progress rides
  the same natural checkpoint instead of inventing a new one.
- After halfway, guide + partner see status + dates (not the private SMART-goal
  reflection unless the learner shares it - keep the intimate layer opt-in).
- RLS: threshold-progress rows readable by the learner always; by their guide +
  active accountability partner **once `computeYearPosition()` is at/after Session
  3**. (Mirrors the existing partner-visibility pattern.)

---

## 7. Threshold content - transitions

Authored content (not schema). Provided vs. owed:

### Discovery -> Adventure (PROVIDED, captain 2026-07-09)
- **Age gate:** turned 11 by end of August.
- **Skills:** Lead 2 morning Launches; Finish Lexia Core5; Master Khan grades 2-5
  (90%+ course challenges); Proficient spelling; Proficient handwriting; JT
  (attend all 3 seminars); Typing (TypingClub - place past Home Row / lessons 1-26,
  else complete that section).
- **Character (Heroic Mindset):** Growth mindset + Creator-not-victim; Excellent
  effort/focus/intentionality; Leadership / Culture builder; Soaring freedom 2
  consecutive weeks; Read *Courage to Grow*.
- **Measurement:** self 1-5 + 5 random tribemates 1-5 -> SMART goals for lowest,
  re-evaluate in April, note progress in Pitch; committee 1-5 for
  handwriting/spelling; Ms Rose signatures; deadline April 30.
- **Opportunities after:** Curiosity Quest (Session 7 / May); Discovery Reflection
  + Adventure Pitch; Sign Commitment Statement.
- (Full per-item explanations + "if struggling" paths are in the source paste;
  fold verbatim into the content file.)

### Adventure -> Launch Pad (OWED - captain/school to author)
- Nuance already noted: a Launch Pad candidate **does not have to have completed
  high-school education** - they can keep working on it in their first Launch Pad
  year. So the LP thresholds are **continuable into year one**, not hard pre-reqs.

### Sparks -> Discovery (DROPPED)
Sparks learners do not use Compass (only their parents do), so there is no in-app
Sparks -> Discovery pitch. Removed from scope.

---

## 8. Phasing

- **Phase 0** - Age persistence: migration + adapter (`learners.age`). Unblocks
  the gate. Small.
- **Phase 1** - Onboarding branch: `nextStudio` helper + age-gate + opt-in +
  pitch-intent flag. No thresholds shown yet.
- **Phase 2** - Dedicated "Pitch to [Next Studio]" page: Adventure content as a
  reference (read-only).
- **Phase 3** - Threshold progress tracking (status + dates), learner-owned.
- **Phase 4** - Adventure -> Launch Pad content; Sparks -> Discovery content.

---

## 9. Open questions

**Resolved 2026-07-09:**
1. Age source -> **birth month + year** (durable; gate is a cutoff computation).
2. Visibility -> **guide + accountability partner, shared at the halfway point**
   (End of Session 3); learner-private before that. See 6.a.
3. Character scaling -> **capture** the learner's self-score + SMART goal in-app.
4. Named tools -> **name-only**; launch point lives on the saved-passwords page
   (open in another tab + remember). See 6.
5. Sparks -> Discovery -> **dropped** (no Sparks learners in Compass).

**Resolved 2026-07-09 (cont.):**
6. **Deadline:** keep the **fixed date (April 30)** - content, not per-cohort config.
7. **Accountability partner:** the learner's **existing self-chosen accountability
   partner**. The app already has this (`partner.js`: "Choose your accountability
   partner"; learners propose/accept via `proposePartner`). Reuse it, no new role.
   That partner + the guide get halfway visibility (6.a).

**Nothing open. Spec is ready to build.**

---

*Draft for review, updated with captain decisions 2026-07-09. Nothing ships until
the shape is confirmed.*
