# Discovery Climb - Wave-2 Young-Register Copy Work Order

**Version:** v0.1
**Date:** 2026-08-03
**Owner (copy):** Hoshi Sato · **Wiring:** Wesley + Lux · **Verifies:** Salus + Jake (walk)
**Refs:** `agents/meetings/2026/08/2026-08-03-discovery-mountain-climb-younger-register.md` · override decision log 2026-08-03 · commit `e5e71d0`

---

## Why this exists

The Discovery gate was lifted and shipped (captain override, 2026-08-03) - Discovery (~8-11) now walks
the **full CLIMB**. But only the five mountain Disc "why" lines were rewritten for the young register.
Every other CLIMB screen still renders its **12-18 copy** to Discovery learners in production right now.
This work order closes that gap: it says exactly which screens need an 8-11 rewrite, which are already
fine, and hands Hoshi the current source for each.

**Hoshi's standing discipline applies:** speak to a child without speaking down; keep the one true thing
each screen says; no bare numbers as sentence subjects; no clinical words on a witness surface; honor the
wince. Where a screen carries an honest anti-overclaim (the Creator "pinch"/mudita note, academics "not a
grade"), keep the honesty and lower only the register.

---

## Triage

**No action - already reads for 8-11** (leave as-is):
`breath` (W0) · `strengths` + `strengths_why` (already authored for 8yo, comment ~1936) ·
`values` + `values_why` (accessible, comment ~1962) · `curious_intro` (W11a) ·
`life_skills_woop` (W15) · `academics_math` (W16-17) · `academics_la` (W20-21) ·
`slice_plan` (W12, mostly neutral - one line to soften, below).

**Needs young rewrite** (8 screens, priority order below).

---

## The rewrites (priority order)

### P0 - every learner hits these, and they read worst

**1. `purpose` (W5-W7) - `renderPurpose`, modals.js ~2807**
Current (heaviest offender): *"What matters to you, and the direction you move because of it. The things
you hold as true, the work that pulls you in, the mark you want to leave for other people, and the long
story you are living as its hero. Not a place to arrive - a compass you already carry."* Box hint (Hero's
Journey): *"The long story you are the hero of - your Self, your North."*
**Issue:** "hold as true," "the long story you are living as its hero," "your North," "a compass you
already carry" - abstract stacked on abstract. A 9-year-old loses the thread by the second clause.
**Direction:** one idea per sentence; keep "the base you stand on" (concrete, works). Reframe "Hero's
Journey / North" in plain words (e.g. "the big story of your life, and you're the main character").

**2. `connection` (W9) - `renderConnection`, modals.js ~2837**
Current: *"...Feeling what they feel, telling the truth and truly listening, living awake to the people and
world around you, and belonging to something shared. The whole art of being with others, not around them."*
Solitude note: *"Chosen time alone counts here too - solitude you pick is its own kind of full, not a gap
in your life."*
**Issue:** "the whole art of being with others," "living awake to," the solitude/loneliness distinction -
sophisticated. (Jake/Salus care about the solitude line especially at this age.)
**Direction:** plain the sub-defs (Compassion/Communication/Conscious Living/Community); keep the solitude
clause but in kid words ("Time by yourself that YOU chose is good too - it's not being left out").

**3. `creator_intro` (W10) - `renderCreatorIntro`, modals.js ~2861**
Current: *"Your inner stance toward learning and toward yourself - a bit of the world you live in, a bit of
the maker you are becoming."* Pinch/mudita note: *"...noticing someone move ahead can pinch... Some people
find that pinch can loosen into being glad for them and glad for yourself..."*
**Issue:** "inner stance," "the maker you are becoming"; the mudita note is the most sophisticated
emotional-handling copy in the flow. **KEEP the honesty** (the pinch is allowed) - lower only the register.
**Direction:** "how you meet learning, and how you treat yourself when it's hard." Rewrite the pinch note
in kid words without dropping "and if you still feel the pinch, that's allowed too."

**4. `threshold` (W22) - `renderThreshold`, modals.js ~3011**
Current: kicker "The Threshold," heading "Look at what you built," mirror label "Your North," body *"This
is yours now, whatever you choose next. When you are ready, cross into your Compass..."* Exit: *"Not yet -
let me sit with this."*
**Issue:** "Threshold," "Your North," "cross into your Compass," "sit with this" - the emotional crossing
is written for a teen. **This is the last beat a child sees; getting it right matters most.**
**Direction:** keep the dignity and the "look at what you built" pride beat (Jake: the fill ritual is
load-bearing); plain the labels and the crossing language.

### P1 - hit by every learner, moderately abstract

**5. `life_skills` (W14) - `renderLifeSkills`, modals.js ~2894**
Current: heading *"The capacities you build for a life you run yourself,"* body ends *"Grown-up powers,
started now,"* label *"...at this stage of life..."*
**Issue:** "capacities," "a life you run yourself," "stage of life." ("Grown-up powers, started now" is
good - keep it.) Note: this is the sibling of the Life Skills mountain Disc, whose young line already
landed - match that register.

**6. `academics_intro` (W15t) - `renderAcademicsIntro`, modals.js ~2942**
Current: *"The tools you use to understand the world and shape your own thinking... Where you are standing
now, with plenty of country still ahead."* Note: *"This is a starting altitude, not a grade."*
**Issue:** "shape your own thinking," "plenty of country still ahead," "starting altitude" - metaphor
stacked high. **KEEP "not a grade"** (the anti-ranking honesty) - plain the altitude metaphor.

**7. `compass_intro` (W4b) - `renderCompassIntro`, modals.js ~2751**
Current: *"This is the mountain you'll build - five values, from the base you stand on to the peak. You'll
walk it one part at a time. Let's start at the base."*
**Issue:** mild - the mountain metaphor itself is fine and kid-friendly; "the base you stand on" is the
only slightly abstract bit. Lightest touch of the eight.

**8. `HORIZON_PROMPTS` (beyond_5yr / within_5yr / within_1yr / current_state / halfway) - modals.js ~1501**
Current headings/bodies are marked **"adult register"** in the code (comment ~1500). The 10-year *sparks*
already have a young variant; the core heading + body do not.
**Issue:** "what do you want to be true," "this is the mirror, not the dream," "how will you know you are
on your way" - reads up. **Note:** `curious_intro` (which precedes these) is already young and frames them
as imagination - so the horizon bodies need to match that warmth.
**Direction:** young headings/bodies for all five, keyed the same way the sparks already split.

### P2 - one-line softenings

- `slice_plan` (W12, ~2423): body *"held across the parts of your life"* -> plainer. Otherwise fine.

---

## Wiring note (Wesley + Lux)

The mountain used a clean data-array split (`whyYoung` on each Disc + `MOUNTAIN_YOUNG_STUDIOS`). These
waypoints are **render functions with inline copy**, not data - so the tidy pattern is a small per-screen
copy object keyed by register, selected by the same signal:

```js
const young = role === 'learner' && MOUNTAIN_YOUNG_STUDIOS.has(studio); // reuse the existing signal
```

Lux's call on shape (keep both registers visible together so they can't drift - same principle as the
Disc objects). Do NOT invent a second tier signal; extend the one that already exists.

---

## Two design flags (not copy - need a captain/fleet call)

1. **Academics baselines for 8-11.** `academics_math / reading / la` ask for program links + written
   baselines. For a 14-year-old that's self-serve; for an 8-year-old it's guide-mediated. Question: does
   Discovery walk these at all, do they route to the guide, or do they soften to "ask your guide to help
   you add this"? Copy can't resolve this alone.
2. **"Deep book" (academics_reading)** is used without definition. For 8-11 it needs a plain gloss or a
   different frame.

---

## Handoff

- **Copy:** Hoshi drafts the 8 young-register rewrites (P0 first), holding the honesty on Creator + Academics.
- **Wiring:** Wesley + Lux add the per-screen register selector (reuse `MOUNTAIN_YOUNG_STUDIOS`).
- **Verify:** folds into the Salus + Jake walk (now post-ship) - every screen, not just the summit.
- **Design flags:** route the two academics questions to Europa / the room before wiring those three screens.

---

*Drafted 2026-08-03 for the Evoke Passion fleet. Source extraction: verbatim from js/modals.js.*
*"A line can clear a mechanical gate and still make the person beside it lean back half an inch. Honor the wince." - Hoshi*
*"We evoke - we never extract."*
