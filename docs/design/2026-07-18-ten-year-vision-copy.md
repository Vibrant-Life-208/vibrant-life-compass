# 10-Year Vision Prompt - Copy (approved, pending apply)

**Status:** APPROVED copy (Europa, 2026-07-18). Apply AFTER the cohort-flag + calendar tab
build (the "1-2-3") commits, to avoid a collision in modals.js / year-view.js. Sequential = safe.
**Applies to:** the `beyond_5yr` step of the onboarding cascade, for ALL users.

## Where it lands
- `js/modals.js` - `CASCADE_META.beyond_5yr` (heading / body / placeholder), ~L1233-1235.
- `js/year-view.js` - the `beyond_5yr` horizon prompt, ~L19.
- NEW: a tier-aware "sparks" line rendered below the body in the cascade step.

## The copy

**Heading:** See your life in 10 years.

**Body:**
> Ten years from now - picture it, really picture it. Where do you live, and who's with you?
> What's your home like, and what have you filled it with? What do your days look like - the work
> you do, the things you make, the people around you? Where do you go? What do you do just for the
> joy of it? And underneath all of it: what do you really want out of your life? Let yourself
> imagine. There's no wrong answer.

**Placeholder:** In ten years, I...

## Tier-aware sparks (Option 2)

Shown below the body. Which set depends on the user's tier - reuse the mature-tier helper the
cohort-flag build establishes (mature = launchpad learners + guides/parents/owners; young =
discovery/adventure/sparks). Do NOT key the sparks off `isCurrentWheelBuild` (that would also fire
for a cohort-flagged young learner); use a distinct mature-vs-young signal.

**Mature tier** (launchpad+ / guides / parents / owners):
> Let these spark you: What kind of home, and where - a place in the city, by the water? A car, a
> boat, a garden? How do you earn, and how much do you work - or how little? Where do you travel?
> Pets? What excites you, and how often do you make room for it?

**Young learners** (discovery / adventure):
> Let these spark you: Who's with you? What are you really good at? Where would you go? What pets,
> what adventures? What do you do that makes you lose track of time?

## Notes
- Money is framed as freedom ("how much do you work - or how little"), not a figure - deliberate, per
  the "we evoke, we never extract" grain. Captain approved.
- Sparks are gentle example prompts, never required fields.

---
*"We evoke - we never extract."*
