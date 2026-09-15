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

## Ship-blockers from the fresh 8-agent review (2026-09-14)

A second, deliberately fresh panel (Tutela, La'an, Riles O'Berk, Pervius, Tasha, Neelix, Kes, Winona -
none of them prior board reviewers) reviewed this surface and returned a clear read: **NOT YET set up
for success on the upload + contact surfaces.** The cork look and the richer form for older tiers are
strong; the child-upload path is not. Three ship-blockers must clear before ANY lift - these are the
hard-to-reverse pieces that make this board different from the surfaces lifted live on 2026-09-14.
Minutes: `agents/meetings/2026/09/2026-09-14-community-board-upload-safety-fresh-review.md`.

1. **Upload hardening, verified** (La'an + Riles + Tutela - convergent signal). **BUILT + VERIFIED
   2026-09-15 (sw v200).** The poster pipeline was extracted to `js/poster.js` (no store/backend deps,
   so it verifies in isolation) and hardened: SVG refused outright in every disguise; strict raster
   allowlist; every accepted image re-encoded through canvas to JPEG (strips **EXIF/GPS** + active
   content - the stored value is always inert pixels); canvas dimension-capped to <=700x1000
   (memory-DoS guard); pdf.js load+render under an 8s time budget (device-hang guard); and a
   `safePosterSrc()` sink guard so only `data:image/(jpeg|png|webp)` values reach the DOM at all three
   `<img>` sinks (a poisoned `javascript:` / `data:text/html` / `data:image/svg+xml` value can never
   render). **Verification** (`scripts/verify-poster-upload.html` + Node): SVG allowlist + sink guard
   ALL-PASS (executed, deterministic Node run); dimension-cap / never-upscale math ALL-PASS (Node);
   EXIF/GPS strip guaranteed by construction (canvas re-encode emits only pixels) with a committed
   browser harness that runs the live GPS-photo test for a human/CI. *Still owed on this blocker: the
   RLS-on-the-poster-column walk at every interim state (Tutela's "walk the wall") - the pipeline is
   hardened; the storage-layer perimeter check is separate.*
2. **Contact-field restructure** (Tasha + Neelix). The free-text "who can people talk to?" box
   publishes a child's phone / address / another child's name to a board every family sees. Do not
   delete it - default it to **"Ask your guide"** so the safe path is the default path; discourage raw
   PII; give guides explicit review guidance (strip phone, address, other kids' names). Keep the
   warmth, route the connection through a grown-up.
3. **Report/remove-with-a-path-back** (Winona). A poster can clear both human gates and still turn out
   to harm someone once public. Build a take-down path - and it cannot be an exile button: a child
   whose poster comes down needs a **non-shaming route back** into the community. Prevention (the guide
   gate) and repair (report/remove) travel together.

**Also owed** (carried / elevations): Jake's consented real-learner walk (the design read does NOT
discharge it); the a11y pass + a visually *quiet* poster field with the learner's caption as required
alt text (Pervius); the counsel question - does a minor publishing an image to an all-families board
need guardian consent? (Tutela, route to the age-verify counsel thread); and a scale-watch note (Kes) -
the human moderation wall holds at ~15 families and thins as it grows.

**RESOLVED (captain, 2026-09-14): posting to the board is COMPLETELY guide-gated.** Nothing a learner
submits - text, fields, or poster, at any tier including Discovery (8-11) - reaches the board without a
guide actively approving it. This settles the gate-vs-cut split in favour of Neelix's position (gate,
don't cut) and extends it to the whole surface: the guide is the wall for every post, not just young
posters. Kes's concern folds in as the scale-watch (the guide wall must not thin into a rubber stamp
as families grow) and the guide-review guidance in blocker 2 (guides actively read the poster + contact
field, not skim). The upload-hardening blocker (1) still stands regardless - a guide approving a poster
does not strip EXIF or neutralize an SVG; the machine wall and the human wall are both required.

Turning the feature on is a one-line flag flip (`isCommunityRich` -> default-on, mirroring the
Life Skills lift). It should not flip until the three ship-blockers clear, both seats plus the fresh
panel's conditions are met, the real-learner walk is watched, and migration v0.39 is applied.

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

> **STATUS CHANGE 2026-09-14: NOW LIVE FOR EVERYONE (sw v193), by captain override of this walk gate.**
> Responsibilities was built dark behind `?resp=on`; the captain lifted it live for all learners
> before the walk (same shape as the 2026-08-03 mountain override of the SSC+PDC gate). **The walk
> still runs next week - but as a review of a LIVE surface, not a ship gate.** It is now the safety
> net, not the door. If a real child reads the "tended today?" surface as a test or a chore-tracker
> rather than as care, the fast mitigation is `?resp=off` per-learner while we adjust. Decision logged
> 2026-09-14; Jake's and Salus's memories carry the override + their standing watch-conditions.

The same sitting can also walk **Responsibilities** (Creator Mindset). It is now **default-on** for
all learners (`?resp=off` to opt a browser out). Full design + rationale:
`docs/design/2026-09-14-responsibilities-v1-design-note.md`.

**Updated 2026-09-14 (post-build, from captain testing):**
- **Weekly now has a weekday PICKER** (S M T W T F S) - the learner chooses the day (e.g. "clean the
  litter box" every Friday) instead of it auto-anchoring to the day it was set.
- **The calendar marker is a yellow "responsibility tab"** (Creator Mindset colour #F5A623), not a
  green leaf - outline when it's yours that day, filled once tended.
- The new big **"This month" calendar** (live, sw v180) makes the tabs large and legible.
- **Add a responsibility right from the Calendar** - a "+ Add a responsibility" control on the
  calendar view opens a quick form (name + cadence + weekday) so a learner can create one without
  going to the Creator pillar; the yellow tab appears immediately. Tending + removing still live on
  Creator.

**Access:** two doors, both live for everyone now - (a) Creator Mindset -> Responsibilities, or
(b) the **Calendar**'s "+ Add a responsibility". Add one, choose a cadence (Daily / Weekdays /
Weekly-then-pick-a-day), and check the Calendar (the big "This month" at the top) for the yellow tab.
`?resp=off` to switch off for a browser.
Also worth watching: does the learner tell the **presence dot** (tap a day = "I showed up") apart from
the **yellow responsibility tab**? They are deliberately different marks.

**Watch points — Jake (developmental):**
- Does the **cadence + weekday picker** land for a Discovery (~8-11) child, or is Weekly/pick-a-day
  too abstract (simpler young cut needed)?
- Does it feel like **ownership** ("mine to carry") or tip into **obligation** ("what I'm supposed to
  do")?
- Is the tend loop quietly satisfying without becoming a thing they chase?

**Watch points — Salus (safety):**
- Does "tended today?" ever read as a **test** they can fail? Watch for a wince on a day they did not
  tend - it is designed as a non-event; verify that lands.
- Does "Off" feel like a genuine, unpunished choice?
- Confirm no count/streak/scoreboard leak anywhere (the Clabough non-negotiable). The yellow tab is a
  presence marker, never a tally.

*The board stays dark until its walk clears. Responsibilities does NOT - it is live now (captain
override); the walk becomes a live-surface review whose watch-points above are the safety net, and
`?resp=off` per-learner is the standing mitigation if it lands wrong for a real child.*

---

## Third surface in this walk: Life Skills growth elevations (added 2026-09-14)

> **STATUS CHANGE 2026-09-14: NOW LIVE FOR EVERYONE (sw v194), by captain call.** These are
> notice-never-score reflection surfaces with no upload/child-data path, so they lift ahead of the
> walk; the walk becomes a live-surface review, not a ship gate. Salus's watch-conditions and
> Naomi's Living-Seed drift-watch below carry forward as the safety net. `?lsgrow=off` per-browser
> is the standing mitigation. (The **community board** does NOT lift with them - it stays dark until
> its upload-safety walk, because child file upload is the one place "lift now, fix later" is hardest
> to reverse.) Decision logged 2026-09-14; Salus's and Naomi's memories carry it.

From the 8-agent "setting learners up for success" review (Guinan/Jake/Troi/Salus/Naomi/Ezri/Kirk/
Boothby). Now **default-on** for all learners (`?lsgrow=off` to opt out). Minutes:
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

*These elevations are LIVE now (captain call); the walk is their live-surface review, watch-points
above are the net, `?lsgrow=off` the mitigation. The guide window is guide-facing but about a
learner's data, so it still belongs in the same consented walk. The community board remains the one
surface still gated dark.*

---

## Fourth surface in this walk: Academics / goal-setting changes (added 2026-09-14)

**These shipped LIVE, not dark** (sw v191) - no flag needed. They are significant child-facing
changes to the goal-setting flow, so they are worth *watching* with the real learner in the same
sitting even though they are already on. What changed:

1. **Inline "Set a goal" / "Edit goal"** on Academics (per subject) and Creator (per maker goal) -
   opens the SAME rich year-goal flow the Compass wheel uses: a year goal broken in half (halfway =
   End of Session 3), quarter + Session-1 milestones, and weekly bite-size steps.
2. **Year tools with each subject** (not a top block) - each subject now carries its OWN program +
   baseline (to decide that subject's year-end target) and, for a learner leveling up
   (`pitchTargetStudio` set only), the next-studio requirement(s) that belong to that subject
   (Master Khan -> Math, Finish Lexia/spelling/typing -> Reading, etc.) - inline, right above that
   subject's goal + Set-a-goal button. The full cross-studio requirements list still lives on North.
3. **Requirement on Stage 1 of the goal modal - ALL categories, every surface** - for a leveling-up
   learner, the category's next-studio requirement appears inside the year-goal modal (Stage 1, a
   highlighted box above the vision: "To move up to Adventure: ..."), anchoring the goal as they write
   it. Now covers academic AND character/leadership categories, and fires from EVERY goal-setting door
   (Compass wheel, Academics, Creator) via a shared matcher (`requirementForCategory`). Only shows when
   `pitchTargetStudio` is set and the category has a matching requirement.
4. **Auto-schedule on goal save, starting from today** - the moment a goal is saved, its milestones +
   weekly steps become dated tasks on the **Calendar** and **task list** (idempotent; keeps any
   rearrangement/check-offs). A goal set MID-YEAR (Session 2+) only schedules **this week forward** -
   no steps dropped into weeks already past; existing past tasks are kept, never deleted.
5. **Task-list empty state fixed** - the old "Finish your Session-1 plan" message (read as locked to
   Session 1) now says tasks come from goals, that it can be done ANYTIME, and offers a "Bring in my
   goal steps" button. So a learner can build their plan naturally in Session 2 with no pre-seeding.
6. **Goal-setting starts from the CURRENT session, not always Session 1** (sw v198 weekly + v199
   milestones, 2026-09-15). The 9-stage year-goal modal was asking a learner to fill Session 1's
   weekly steps (Aug 17 - Sep 11) AND set an "End of Session 1" milestone even after those had passed.
   It now detects where today falls - by whether a session's *last week* has already ended, so the
   break between sessions is handled (Sep 15 is past Session 1's weeks even though Session 2 starts
   Sep 21) - and skips BOTH the weekly stage AND the end-of-session milestone for any session behind
   us, jumping straight to the current session's plan. **Jake + Salus ruling 2026-09-15** (minutes:
   `agents/meetings/2026/09/2026-09-15-goal-modal-past-milestones-jake-salus.md`): a passed checkpoint
   must never be presented as a target ("you missed it" / a notice-never-score wince). So End of
   Session 1 is skipped once Session 1 passed, End of Session 2 once Session 2 passed; always kept are
   the year goal, the **Baseline** ("where you are now" - carries the present honestly), and the
   locked End of Session 3. The review gates the same past rows; the first weekly stage's "starting
   from (prior session)" hint is hidden when that session was skipped; no copy says a learner
   "missed" a session. Summer/pre-start planning is unaffected (stays Session 1). *Deferred (its own
   future pass): an asset-reframe - "what have you already built this year?" - with a drift-guard so
   it never becomes a "catch up" prompt.*

**Access:** log in as the learner, Academics (or Creator), tap **Set a goal** on a subject; after
saving, check the **Calendar** (big "This month") and the **task list** for the dated steps +
milestones (this-week-forward). An empty task list has a "Bring in my goal steps" button.

**Watch points - Jake (developmental):** does the 9-stage goal breakdown (baseline -> halfway ->
milestones -> weekly steps) feel doable or overwhelming for this learner? Does the per-subject program
+ requirement *ground* that subject's year-end target (helpful), or does seeing "To move up:
[requirement]" on a subject feel like pressure? Does a suddenly-full calendar after saving one goal
energize or overwhelm? **NEW for this walk:** the walk happens in Session 2, so the modal now skips
BOTH the Session 1 weekly plan AND the "End of Session 1" milestone (Jake + Salus ruling 2026-09-15) -
it opens on the year goal → baseline → locked End of Session 3 → End of Session 2 → Session 2 weekly.
Confirm that reads as "start where you are" (right) and not as "you missed Session 1" (wrong), and that
the Baseline stage lands as the honest "where you are now."

**Watch points - Salus (safety):** for a leveling-up learner, do the next-studio requirements read as
an *invitation* or as a *bar they're failing*? Watch for any wince at the requirements list. The
auto-scheduled tasks must never read as "here is everything you owe" - watch the affect when the
calendar fills.

*Live, so no gate blocks it - but the walk is still the moment to catch whether the goal loop
motivates or overwhelms a real child.*

---

## Fifth surface in this walk: task colour speaks Pillars, not wheel regions (added 2026-09-14)

**Shipped LIVE** (sw v192) - a small, purely cosmetic change worth a glance during the walk.

The add-task modal's "Which part of life? (sets the colour)" picker used to show the five wheel
**regions** (Self / Others / Making / World / Voice). A learner navigates the app by the pyramid
**Pillars** (Purpose / Connection / Creator Mindset / Life Skills / Academics), so a task's colour
never matched the tab it lived under. The picker now shows the pillar names, in nav order, each in
its pillar colour, so a task painted "Life Skills teal" matches the Life Skills tab. "None" (no
colour) still available.

Under the hood nothing migrated: regions map 1:1 to pillars (Self=Creator Mindset, Others=Connection,
Making=Life Skills, World=Academics, Voice=Purpose), so every stored task, the calendar, North, and
the auto-scheduler keep working untouched - only the palette and the labels moved. The Plan-tab task
label now reads the pillar name too. (The Growth Record "compass" preview keeps the four-directions
wheel framing by design.)

**Access:** log in as the learner, add a task anywhere; the colour picker shows the five pillars +
None.

**Watch points - Jake:** do the pillar names + colours read as more legible than the old
Self/Others/Making labels for this learner, or does it not register either way? (Low stakes - this is
a consistency polish, not a new capacity.)
