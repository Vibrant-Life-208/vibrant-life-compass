# Task ontology: Life Compass regions -> Mountain pillars (v0.2 DRAFT)

- Date: 2026-08-03 (v0.1); revised 2026-08-04 (v0.2 - decisions locked with Europa)
- Status: DRAFT - decisions locked; open for the Accord / Jake / Salus / TCC / Lux review
- Author: Europa (walkthrough-driven), drafted with Claude
- Supersedes the task-categorisation axis in: `docs/design/2026-07-20-four-region-compass-mapping-v1.md`

## Why

The app's organising metaphor has become the Mountain (the five CLIMB pillars): it
is the onboarding, the main nav (pillar-coloured tabs), and the learner's whole
frame. But task categorisation still uses the older Life Compass **regions**
(Self / Others / Making / World / Voice) - a different axis answering "which area
of life?" rather than "which value / discipline?". Two ontologies for one product
is confusing. This doc scopes retiring the region axis for tasks and making the
**pillar** the way a task (and eventually a goal) is categorised, coloured, and
broken down in its Pillar tab.

## The two axes are genuinely different

- **Regions** = area of life. Self, Others, Making, World, Voice.
- **Pillars** = value / discipline. Purpose, Connection, Creator Mindset, Life Skills, Academics.

A task can sit differently on each: "call grandma" is *Others* (region) but
*Connection* (pillar); "practice piano" is *Making* (region) but *Creator Mindset*
or *Academics* (pillar). So this is not a label rename - it is an axis change, and
any migration of existing data is a judgment call, not a mechanical map.

## Decisions locked (Europa, 2026-08-03/04)

- Tasks map to **all five pillars**: Purpose, Connection, Creator Mindset, Life
  Skills, Academics. (Connection is IN - not four.)
- **Replace, not coexist.** Pillars fully replace the wheel regions as the task
  axis. One lens, matching the nav and onboarding.
- **Tasks-first phasing** (see below). Goals migrate in Phase 2.
- **"None" stays, and is honored** - anti-treadmill principle. See below.
- **The Growth Mindset goal is the first goal this touches.** The CLIMB Growth
  Mindset commitment (2026-08-04) captures ONE year goal to foundations (Path A);
  formalising it as a real trackable goal *with a pillar category* is part of this
  work's Phase 2 (goals-by-pillar) + the main-page breakdown handoff.

## "None" stays, honored (anti-treadmill)

The wheel's **Self** region held rest / play / joy / just-being - territory the
mountain (a climb of five *values / disciplines*) has no clean home for. Replacing
regions with pillars must not turn every task into something that has to serve a
value. So **"None" remains a first-class, respected choice**: *this is just life, it
does not have to climb anything.* This keeps the reframe from becoming an
achievement machine for children (Protect-the-Psyche / Build-for-Human-Development).
Flagged for Accord / Jake / Salus as the substance of the review, not a formality.
Open sub-question (Europa to weigh): keep "None" as the release valve, or add an
explicit sixth "base camp" bucket for rest/play/being.

## Phasing

1. **Replace vs coexist.** LOCKED: replace (see above).
2. **Scope / phasing.** LOCKED: phase it.
   - **Phase 1 (tasks):** the "Which part of life?" picker becomes a pillar picker;
     colour comes from the pillar (`--pillar-*`) shaded by band; tasks group under
     their pillar inside each Pillar tab ("broken down in the tab").
   - **Phase 2 (goals):** goals are also region-keyed and tangled with the
     `LEGACY_TO_REGION` shim / Gate L / the E-2.5 becoming-flag. Migrate goals only
     after Phase 1 ships and the becoming-flag care is honoured. Do NOT backfill or
     delete region keys without that gate (per the standing Gate L caution).

## Proposed region -> pillar migration map (for existing tasks/goals)

Best-guess default so nothing orphans. Lossy - flagged for Accord / Jake / TCC review.
Derived from the existing `LEGACY_TO_REGION` groupings in `js/wheel.js`.

| Old region | Old region holds (legacy labels)                 | -> Pillar        | Rationale |
|------------|--------------------------------------------------|------------------|-----------|
| Voice      | spirit, sovereignty, hero's journey, the North   | **Purpose**      | Voice is the sovereign centre / North -> Purpose (the base you stand on) |
| Others     | family, friends, home, partner                   | **Connection**   | Relationships -> Connection (direct) |
| Self       | movement, heart, emotions, joy, play, fun, time  | **Creator Mindset** | Inner stance, emotional regulation, growth -> Creator Mindset |
| Making     | money, finances, career, calling                 | **Life Skills**  | Money / entrepreneurship / making it real -> Life Skills |
| World      | mind, learning                                   | **Academics**    | Understanding the world, learning -> Academics |

Notes:
- This is a clean 5->5, but "Self -> Creator Mindset" and the wellness slice of Self
  (which also reads as Life Skills / Wellness) are the soft joints - review those.
- **Migration (LOCKED): default-value + normal edit.** Current stakes are low -
  essentially no production task data (test learners only), so this is choosing the
  right *pattern*, not a data rescue. The region->pillar map is just the **default
  value** a task carries; because a task's pillar is editable anyway (it is the same
  "which part of life" picker, now "which pillar"), re-picking is ordinary editing -
  no migration wizard, no ceremony, nothing silently locked. The map keeps old tasks
  from orphaning; the edit affordance keeps the learner sovereign over it.
  Rejected: hard-remap (silently overwrites a learner's meaning) and leave-alone
  (mixed ontology; the pillar tabs cannot show old region-keyed tasks).

## Data model / migration (Lux)

- Tasks currently store a `region` (see `taskRegion` / `REGION_COLORS`). Phase 1
  either repurposes that column to hold a pillar key or adds a `pillar` column;
  decide with Lux to keep it reversible.
- Colour today = region hue + band shade. Phase 1: pillar `--pillar-*` colour +
  the same three band shades (recurring = tint, weekly = colour, milestone = dark).
- Keep a shim (like `LEGACY_TO_REGION`) mapping any stored region -> pillar so no
  in-flight task orphans during rollout.

## Tab breakdown ("broken down in the tab")

Each Pillar tab (Purpose / Connection / Creator Mindset / Life Skills / Academics)
shows that pillar's tasks grouped/broken down within it - so a learner opens
Creator Mindset and sees the Creator work (goal + its tasks), not a flat list.
Design detail TBD once Phase 1 model lands.

## Governance touchpoints

- **Accord / Jake / TCC** ratified the four-region model (2026-07-20). Retiring the
  region axis for tasks should get their pass - especially the Self mapping and the
  becoming-flag interaction.
- **Lux** owns the DB migration + reversibility.
- Log the decision in `agents/decision-logs/2026/08/` once approved.

## Not in this doc

- The CLIMB onboarding flow (already interleaved + shipped this session).
- The wheel as a *reflection* surface, if it stays anywhere - this doc is only the
  task/goal categorisation axis.
