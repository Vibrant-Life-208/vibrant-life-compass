# Community Board (cork + poster) - Salus/Jake Review Brief

**Date:** 2026-09-14
**Surface:** Vibrant Life Compass - Connection pillar - Community Board
**Status:** BUILT, shipped DARK behind `?commboard=on` (default off). Nothing reaches a real
learner until this review clears and the flag is flipped to default-on.
**Reviewers:** Jake Sisko (developmental) + Salus (trauma-informed safety / refusability)
**Author of build:** Claude (Opus 4.8) with Europa, 2026-09-12
**Refs:** commit 4ac1b44 (main); `js/community-board.js`, `js/pillars/connection.js`,
`js/flags.js` (`isCommunityRich`), migration `supabase/migrations/2026-09-12-v0.39-community-bulletin-rich.sql`;
sibling pattern: `docs/design/2026-08-10-life-skills-courses-ssc-pre-review-salus-jake.md`.

---

## What changed

The community bulletin was a single text box ("Your idea...") plus a plain list of approved
ideas, moderated by a two-gate review: learner submits -> **guide** approves -> **owner**
approves -> posted to the board everyone sees. That review flow is unchanged and remains the
moderation wall.

Three additions, all dark:

1. **Cork-board look** - the posted board renders as an old-school corkboard: pinned paper notes
   at natural angles, category chips, poster images. Visual only.
2. **Extended submission form** - title (required), category (Club / Volunteer / Event / Other),
   description (required), when/where (optional), who-to-contact (optional), poster (optional).
3. **Poster upload** - a learner may attach a PDF. Its first page is rendered to a downscaled
   JPEG **entirely on-device** (vendored pdf.js, which rasterizes pixels and does not execute a
   PDF's embedded scripts); that image is stored as a data URL. The PDF bytes are never uploaded
   or retained. Source capped at 10MB; output bounded to the DB column cap.

**Audience:** the board is shown to ALL learners - Discovery (~8-11), Adventure (11-15), Launch
Pad (16-18) - and staff. Per the captain's 2026-09-12 decision, **all learners including Discovery
can attach a poster**. That decision is exactly why this brief exists.

## What did NOT change

- The two-gate guide -> owner review. A learner's post (fields + poster) is visible only to the
  learner, their guide, the owner, and - once posted - everyone (RLS enforced, v0.37).
- No counts, no scoring, no streaks. The board is a place to see and offer, not a leaderboard.
- No new network egress: the poster never leaves the device as a file; only the rendered image
  is stored, and only after the two human gates approve does it become public.

---

## For Jake (developmental)

The open developmental questions on a poster-upload surface reaching an 8-11 child:

1. **Is "upload a PDF poster" a coherent ask for a concrete-operational child?** An 8-year-old
   may not have a PDF or the means to make one. Is the *optional* framing enough, or does the
   presence of the field read as an expectation the young child can't meet (the "you're behind"
   pattern you have refused before)? Proposed mitigation if needed: hide or soften the poster
   field for the Discovery register.
2. **Does the richer, multi-field form raise the floor too high for the young tier?** The old
   form was one sentence. Six fields (two optional) is more scaffolding to hold. Is a Discovery
   learner served by a simpler variant (title + description only), the way Life Skills got its
   own Discovery course rather than a lowered floor?
3. **Exploration before commitment / authenticity over achievement** - does anything here push a
   child to perform an idea rather than offer one? The copy is invitational ("Have an idea... send
   it to your guide"); confirm it lands that way for the young reader.
4. **Your binding real-learner walk gate.** Per your standing position (recorded 2026-07 through
   2026-08-10), no learner-facing surface clears until you watch a real learner meet the built
   thing. This brief is the design read; it does not discharge that gate.

## For Salus (safety / refusability)

1. **Child file-upload safety.** A minor selects a file from their device. The rendered image is
   private to the learner + reviewers until posted, and the guide+owner gate catches inappropriate
   content before it is public. Is that gate sufficient, and is there any exposure in the *interim*
   (the learner's own view, the reviewer's view) that needs a guardrail?
2. **Imagery moderation.** A poster is an image a child chose. The reviewing adult (guide) sees it
   first. Is anything needed beyond "an adult reviews every poster before it posts" - e.g., a
   report/remove path once posted, a size/one-poster limit (currently one), guidance to guides on
   what to decline?
3. **Refusability / exit.** The form is fully skippable except title + description; the poster is
   optional; a learner can leave without submitting. Confirm there is no coercive shape.
4. **Contact field.** "Who can people talk to?" is free text a learner fills in. On a board every
   learner sees, is surfacing a name (theirs or another's) a safety concern worth a guardrail or
   guide-review note?

---

## Go / no-go asks

- **Jake:** developmental read on the poster field + multi-field form for the **Discovery**
  register specifically - keep as-is for all, or build a simpler Discovery variant / gate the
  poster to older tiers? Plus your standing real-learner walk before flag-on.
- **Salus:** is the existing two-gate review a sufficient moderation wall for child-uploaded
  imagery, or do you require an added guardrail (report/remove, guide guidance, contact-field
  handling) before flag-on?

Turning the feature on is a one-line flag flip (`isCommunityRich` -> default-on, mirroring the
Life Skills lift). It should not flip until both seats clear and migration v0.39 is applied.

*The story belongs to the person living it; we do not clear a surface for a child until we have
watched a child meet it.*

---

## Walk script & observation checklist (added 2026-09-14, walk scheduled the week of 2026-09-15)

**Status at walk time:** all review conditions BUILT and deployed dark (compass main, sw v174);
migrations v0.39 + v0.40 applied. Discovery gets the simpler form; poster accepts a PDF or a
drawing (image); contact field steers to "ask a guide"; owner can take a posted note down.

**Access (stays dark for everyone else):**
- On the studio device, load `https://vibrant-life-compass.vercel.app/?commboard=on` once (flag
  sticks in that browser). Log in as the learner -> Connection pillar -> Community.
- Guide reviews from their dashboard; owner approves / takes down at Owner -> Community Board.
- After the walk, load `?commboard=off` on that device to switch it back off.

**Protocol (Salus):** guardian consent; framed as *testing the tool*, not real sharing; witnessed;
the child can stop anytime; debrief asks **"how did that feel?"**, not "did it work?".

**Watch points — Jake (developmental):**
- Does the Discovery child understand "what's your idea / tell us more"? Does it feel like
  *offering*, not a test ("am I doing it right?")?
- Is the **drawing** option inviting and reachable, or does the poster still read as a bar?
- Older tiers: do they finish the six fields, or is it too much?

**Watch points — Salus (safety):**
- The **contact field** - does the child take the "ask a guide" steer, or put their own name?
  Watch for personal contact surfacing.
- Do they understand a **guide sees it before it is public**? Any confusion about who is watching?
- Is "leave it / not now" genuinely available and non-punishing? Any pressure or wince?

**After the walk:** record what surfaced (copy that confused a child, a field to cut, a safety
wince) here or route to Europa; changes iterate fast on the dark board, then re-walk if a change
touches the young register, before the flag flips.

### Appendix - optional board seed for the walk

So the board is not empty when the learner arrives, seed the real Pumpkin Farm event as an
already-posted note. It needs an author (schema requires `learner_id`); attribute it to a Test
Learner so it does not appear under a real child's "Your ideas". Run in the Supabase SQL editor:

```sql
-- A learner's name lives on the joined profiles row (learners.id is 1:1 with profiles.id).
-- To see your options first: select l.id, p.name, l.studio from learners l join profiles p on p.id = l.id;
insert into community_posts
  (learner_id, title, category, body, when_where, status, guide_reviewed_at, owner_reviewed_at)
select l.id, 'Pumpkin Farm', 'event',
       'A trip to the pumpkin farm - more details to come.',
       'October 21 - Cherry Hill Farms',
       'posted', now(), now()
from learners l
join profiles p on p.id = l.id
where p.name ilike '%test%'   -- adjust to your Test Learner (or replace this SELECT with a literal learner_id)
limit 1;
```

Remove it afterward with the owner "Take down" button, or `delete from community_posts where title = 'Pumpkin Farm';`.
(Seed is a text note; attach the poster PDF through the flow if you want the image on it.)

---

## Second surface in this walk: Responsibilities v1 (added 2026-09-14)

The same sitting can also walk **Responsibilities** (Creator Mindset), built dark behind `?resp=on`
(compass main, sw v175). Full design + rationale: `docs/design/2026-09-14-responsibilities-v1-design-note.md`.

**Access:** load `?resp=on` on the studio device, then Creator Mindset -> Responsibilities; give one
a cadence (Daily / Weekdays / Weekly) and check the Calendar for the soft leaf. `?resp=off` to switch
it back off.

**Watch points — Jake (developmental):**
- Does the **cadence** land for a Discovery (~8-11) child, or is Weekdays/Weekly too abstract (simpler
  young cut needed)?
- Does it feel like **ownership** ("mine to carry") or tip into **obligation** ("what I'm supposed to
  do")?
- Is the tend/leaf loop quietly satisfying without becoming a thing they chase?

**Watch points — Salus (safety):**
- Does "tended today?" ever read as a **test** they can fail? Watch for a wince on a day they did not
  tend - it is designed as a non-event; verify that lands.
- Does "Off" feel like a genuine, unpunished choice?
- Confirm no count/streak/scoreboard leak anywhere (the Clabough non-negotiable).

*Same gate as the board: conditions built, but neither seat clears it for a real child until the walk
is watched. Both flags stay dark until then.*

---

## Third surface in this walk: Life Skills growth elevations (added 2026-09-14)

From the 8-agent "setting learners up for success" review (Guinan/Jake/Troi/Salus/Naomi/Ezri/Kirk/
Boothby). Built dark behind `?lsgrow=on` (compass main, sw v179). Minutes:
`agents/meetings/2026/09/2026-09-14-life-skills-setting-learners-up-for-success.md`. Four elevations:

1. **Return loop** ("How it's going") on the skill goal - "what have you done so far?" (real-world
   doing) + "what are you noticing about yourself?" (reflection). Living, optional, **no count / no
   streak / no nudge / nothing due**.
2. **Doing-story** - folded into the return loop.
3. **Vision tether** - the learner's 1-year (or 10-year) horizon beside the goal ("A step toward...").
4. **Guide present-state window** - on each learner's guide card, their CURRENT chosen skill + goal
   as a conversation-starter. Never a dashboard; no switch-history, no metrics. Read-scope is clean:
   a guide can already open a learner's compass, so this surfaces nothing new.

**Access:** learner side - `?lsgrow=on`, Life Skills pillar (needs a skill chosen + a goal to show
the loop/tether). Guide side - load `?lsgrow=on` as the guide, "My learners", the window sits on each
learner's card. `?lsgrow=off` to switch off.

**Watch points - Jake (developmental):** does the return loop help a learner cross the *dip* (come
back and keep going), or does it read as one more task? Does the vision tether make the skill feel
connected to who they're becoming?

**Watch points - Salus (safety):** does "How it's going" ever read as "did you do your practice?" -
watch for any wince on a return with nothing filled in. It is designed as a door, not a bell; verify
that lands. No count/streak/scoreboard anywhere (Naomi's Living-Seed drift-watch: the day it gains a
count or a nudge, that is the 13%).

**Watch points - Boothby (guide side):** does the window actually start a *conversation* ("how's the
chess club going?"), or does a guide read it as a status to check? If it reads as a dashboard, it has
drifted.

*Same gate: conditions built, flags stay dark until the walk is watched. The guide window is
guide-facing, but it is about a learner's data, so it belongs in the same consented walk.*
