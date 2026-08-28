# Discovery Mountain - Consented-Young-Learner Walk Protocol

**Version:** v0.1 (DRAFT)
**Date:** 2026-08-03
**Owners:** Salus (safety lock) + Jake Sisko (developmental fit) - joint walk, one child, two lenses
**Clears:** the two binding gates on enabling THE MOUNTAIN for Discovery (~8-11)
**Refs:** `agents/meetings/2026/08/2026-08-03-discovery-mountain-climb-younger-register.md` · commit `7313980` (dark wiring)

---

## Why this walk exists

The younger-register mountain copy is built and wired, but **dark** - the cascade gate
(`studio !== 'discovery'`, `js/modals.js:1575`) still routes Discovery learners away from the
mountain. It stays dark until a real, consented Discovery child walks it under supervision and
both owners sign.

This is not a code review. It is watching one child meet five honest sentences about who they can
become, and asking: did the words land as invitation, or as a test? *Conditions before
interventions.* The copy is good. It is still ink until a child shows us it is safe.

**A walk is a sample of one.** A pass means "clear to proceed," not "proven for every Discovery
learner." If the first child is ambiguous, walk a second before signing.

---

## Before the walk (Salus - the room comes first)

- [ ] **Consent, two layers.** Guardian informed and agreeing; child gives their own assent in
      their own words. Tell the child plainly: *"We're looking at some new screens together. There
      are no right answers, nothing is graded, and you can stop any time you want."*
- [ ] **Environment.** Quiet, unhurried, an adult present the whole time. Not squeezed between
      other tests. The child sets the pace, not the clock.
- [ ] **A visible exit.** State aloud, before you begin, that stopping is always fine and costs
      nothing. *A gate that cannot be refused is a cage* - so make the refusal real, not nominal.
- [ ] **Preview build (local only).** In a local session, comment out `&& studio !== 'discovery'`
      at `js/modals.js:1575`, load with `?climb=on`, and log in as a **Discovery** learner. Confirm
      the mountain renders the **young** register (the `whyYoung` lines) before the child sits down.
      This flip is local-only - **nothing on production changes**, and the gate goes right back up
      after the walk.

---

## Refusability pre-check (Salus)

Before any content, confirm the frame holds for a young child:
- Every step is skippable; "not now" carries no penalty and no shame.
- Intimate steps are private by default; nothing the child says routes to a parent surface.
- The child understands they can skip. If they don't know it, they don't have it.

---

## The walk, station by station

Walk the full CLIMB sequence as a Discovery learner. Observe lightly - **never quiz.** Jake's rule:
*informational, never evaluative.* If you ask anything, ask it as curiosity, not comprehension-check:
*"What did that one say to you?"* - and let silence be an answer.

| Station | Watch for |
|---------|-----------|
| **breath** (W0) | Does the child settle, or brace? A body-first door should feel like permission, not instruction. |
| **strengths / values** | Do the picks feel like *theirs*? Any sign they're guessing what we want? |
| **compass_intro** (W4b - whole mountain, names only) | Does *"This is the mountain you'll build"* invite, or overwhelm? Five things at once can be a lot at eight. |
| **purpose** (W5-W7 - the base) | Their own values sit in the base. Do they notice them there? Does it feel like theirs? |

### The focus: THE MOUNTAIN (W8) - five Discs, one per page

For **each** Disc, hold four questions:

1. **Comprehension (Jake).** Can the child say back, in their own words, roughly what it means?
   Not verbatim - the *gist*. If it slides off them, the register is too high.
2. **The wince (Hoshi's test, Salus + Jake watching).** Does any line make them lean back half an
   inch? *The wince is information.* Note the exact phrase.
3. **Evaluative leak (Jake).** Does anything read as a test, a *should*, a grade, a way they're
   being measured? The mountain is a **reveal, not an inventory.** *Notice, never score.*
4. **Honesty landing (Salus).** Does the honest, anti-overclaim part land as *true and kind* -
   never as deflating?

**Per-Disc specifics:**

- **Purpose** (*"...start to feel like yours"*) - does *"like yours"* leave the verdict with the
  child? That phrase is load-bearing; confirm it reads as ownership, not assignment.
- **Connection** (*"People who studied happiness for a very long time..."*) - **open walk-question
  #2 lives here** (below). Also: does *"the people we love, and who love us back"* land warmly, or
  does it touch a child whose home is hard? Watch the face; have a soft place ready.
- **Creator Mindset** (*"...not by magic, and it doesn't happen alone"*) - the Greene firewall. Does
  the honest limit (*growth takes real teaching and help*) register as reassuring, or as *"so maybe
  I can't"*? This is the Disc most at risk of landing as self-judgment. If it deflates, that is a
  revise, not a maybe.
- **Life Skills** (*"...taking care of your money..."*) - **open walk-question #1 lives here** (below).
- **Academics** (*"Here's something cool a scientist who studies reading found..."*) - does *"here's
  something cool"* stay invitational? Does *"nobody just hands them to you - you build them, too"*
  feel empowering, or like a burden?

---

## The two open walk-questions (must be answered before sign-off)

These are the two the meeting could not resolve at the desk. They are **walk questions** - only a
real child answers them.

1. **"Taking care of your money"** (Life Skills `whyYoung`). Does it read to a 9-year-old as a
   *chore / grown-up obligation*, or as a real capability they'd want? Watch the face on that phrase;
   ask lightly what they think it means. If it lands as a chore, route to Hoshi for a re-word.
2. **"Studied happiness for a very long time"** (Connection `whyYoung`). Hoshi flagged this as a
   citation she dodged because a child can't hold the source. Does the vagueness read as
   *trustworthy* ("grown-ups looked into this") or as *hand-wavy* ("says who?")? Hoshi's standing
   position: *"I'd rather cut a true thing that lands wrong than keep one that's technically
   defensible."* If it reads as hand-wavy, cut or recast it.

---

## The two lenses, held throughout

**Salus - safety:**
- Refusability is *real*, not nominal - the child felt free to stop, and knew it.
- **No surveillance drift.** Nothing counted, nothing scored, no metric on the reveal. The moment
  anything is tallied, the surface has drifted from witness into product.
- **Somatic pacing** - the child sets the speed through the Discs; no rushing to the summit.
- **Private by default** - confirm nothing the child touches leaks to a parent-facing surface. (The
  mountain captures nothing by design; verify that holds.)
- **Shock absorber** - if any line lands as *"I'm not good at that,"* is there a soft place? A reveal
  that becomes self-judgment is a wound, not a tool.

**Jake - development (ages 8-11):**
- **Coverage, not completeness** - the child should feel *invited*, never *measured*.
- **The verdict stays with the child** - *"feel like yours,"* never *"I approve of you."* Praise that
  hooks dependency is a fail even when it's warm.
- **Age-fit** - concrete, warm, not babyish. Flag anything that reads *up* (12+ abstraction) or
  *down* (talking-down).
- **Don't foreclose** - exploration framing, not commitment. *Development isn't about becoming who
  others expect; it's about becoming who you actually are.*

---

## Pass / revise

**PASS** requires *both* signatures:
- **Salus:** refusability real; no surveillance or self-judgment drift; the child could stop and felt
  free to.
- **Jake:** register lands at 8-11; nothing evaluative; the verdict stays with the child; both open
  walk-questions resolved acceptably.

**REVISE** (hold the wall up):
- Any wince that traces to a specific line - route the copy to Hoshi, re-walk.
- Any evaluative or surveillance leak - fix before re-walk.
- Either open walk-question answered badly - recast the phrase, re-walk.

No ship on a partial pass. Holding the wall is not delay; it is the condition.

---

## On PASS

- [ ] Remove `&& studio !== 'discovery'` from `js/modals.js:1575` (the real gate lift).
- [ ] Correct the now-inverted comments that frame the legacy compass/wheel as Discovery's home /
      *"kept for Launch Pad next year"* (`js/modals.js` cascade comment block + `js/flags.js:52`) -
      **Polaris verifies the language** before it lands.
- [ ] Move the `whyYoung` strings from DRAFT to final (fold in any walk edits).
- [ ] Log the decision; update Salus + Jake memory with the walk outcome.

## On REVISE

- [ ] Gate stays up. Copy fixes to Hoshi. Re-walk from the affected station. No ship until a full pass.

---

## Sign-off

| Owner | Verdict | Date | Notes |
|-------|---------|------|-------|
| Salus (safety) | ☑ revise (structural floor SAFE; exposure sign-off WITHHELD) | 2026-08-11 | Post-ship run. Code-verifiable safety floor holds (mark-a-day, deep-reading, mountain reveal). REVISE: year-note reaches Discovery with no young register → Hoshi. Binding gate — a supervised consented child (the wince) — still owed; overridden 2026-08-03, not met; not to be simulated. |
| Jake Sisko (developmental) | ☑ revise (direction SUPPORTIVE; exposure gate open) | 2026-08-11 | Register lands at 8-11 (whyYoung, deep-reading tiering real). REVISE: year-note young variant → Hoshi. Two mountain walk-questions ("money", "studied happiness") unresolvable without a real child; still owed. Adventure (12-18) reads standard register — age-fit, out of young-scope. |

> **Post-ship note (2026-08-11):** This walk was run after the 2026-08-03 captain override shipped the mountain to Discovery. Salus's + Jake's lanes that do not require a live child were completed and are recorded above. The **sample-of-one live-child observation** (comprehension + the wince) was **not** gathered this session and was not fabricated; it remains owed and must be gathered from the real Y2 cohort under two-layer consent. No clean PASS is recorded because none is honest yet.

---

*Drafted 2026-08-03 by Salus + Jake for the Evoke Passion fleet.*
*"Conditions before interventions." - "Development isn't about becoming who others expect you to be. It's about becoming who you actually are."*
*"We evoke - we never extract."*
