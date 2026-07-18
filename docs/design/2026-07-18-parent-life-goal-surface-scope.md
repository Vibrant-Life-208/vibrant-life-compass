# Parent Life-Goal Surface - Scope

**Status:** RULED (PDC + SSC, 2026-07-18) - conditionally greenlit. Parents MAY own private
life goals; mechanism is B1; Path A rejected; Path C is the fallback. Build may proceed ONLY
in the order below: the structural no-aggregation wall (RLS + Tutela/Worf audit) ships BEFORE
any parent UI, and enabling a real parent is a separate SSC-gated step (build != enable).
See the ruling section at the end and the minutes at
`evoke-agents-backup/agents/meetings/2026/07/2026-07-18-parent-life-goal-surface-pdc-ssc.md`.
**Date:** 2026-07-18
**Author:** Lux (Technical Infrastructure Lead), scoping at Europa's request
**Raised by:** Europa - "do parents, guides and owners have the same 3-session goal cadence
for their life goals?" (They do not; parents have no life-goal surface at all.)

---

## The question

The per-goal working cadence - the 3-session spine **Set up -> The challenge -> Cross the
finish line** (`js/goal-arc.js` `ARC_PHASES`), gated behind the current-wheel build via
`isCurrentWheelBuild(learner)` - renders on the Compass (`year-view.js`). Today:

- **Guides / owners** reach it as their own protagonist (on local dev only - see the crux below).
- **Parents** never reach it. Their only tab is "My learner" (`TABS_BY_ROLE.parent`,
  `parent-view.js`), which shows their child's session goals + recap. Parents have no
  Compass, no life goals, and no goal-setting path (`goalSettingProfileId` excludes them,
  `app.js:265-268`).

Europa asked to scope giving parents their own life-goal surface, in the same 3-session style.

## The crux (why this is not a frontend task)

Every goal-owning table hard-references `learners(id)`, and `learners.studio` has a CHECK
that permits only the four child studios:

```sql
-- supabase/schema.sql
goals.learner_id       uuid not null references learners(id)   -- :138
tasks.learner_id       uuid not null references learners(id)   -- :153
check_ins / year_plans / weekly_answers / logins -> same FK    -- :168, :231, v0.21:24
learners.studio  text not null check (studio in
  ('sparks','discovery','adventure','launchpad'))              -- :138 table def
```

On production:
- `adminCreateAccount` inserts a `learners` row **only** `if (role === 'learner')`
  (`supabase-adapter.js`). Guides, parents, and owners get a `profiles` row and **no**
  `learners` row.
- `getLearner` (supabase adapter) has **no** guide/parent fallback; it returns `null` for them.

Therefore:
1. **Parents cannot own goals/tasks on prod today** - there is no `learners` row to key against,
   and the CHECK would reject any adult studio value even if we tried to insert one.
2. **The guide-as-protagonist path is local-only.** It lives entirely in
   `local-store.js:87-97` (synthetic `studio:'guide-summer'`). Mirroring "how guides work"
   does not get us to prod, because the guide path is not wired for prod persistence either.
   Any real fix for parents also closes this guide/owner gap.

What already works for parents: the **year anchor** (quote, VIA strengths, values, horizons)
lives on the `profiles` row keyed to `session.parentId`, and parents **already receive** that
onboarding cascade (`app.js` onboarding gate includes parents via `ownIdentity`). Only the
**goal/task** layer is blocked.

## The governance gate (NOT eng's to open)

Three standing positions cut against - or shape the tone of - a parent goal surface:

1. **Captain 2026-05-11** - parents see session goals + end-of-session recap only. No year
   goals, no daily tasks. The parent surface was deliberately kept narrow.
2. **Polaris ruling 2026-07-08** - the Parents & Tots recognition arc must NEVER count, score,
   streak, or scoreboard per parent. Parent-facing structure must not become measurement.
3. **Prime Directive #2 (Protect the Psyche)** - a tracked personal-goal surface risks turning
   a parent's own growth, or their parenting, into a performance that is watched and graded.

So the first gate is a product/ethics decision, not an infra flip - the same separation we
held for the cohort flag (build != enable; enabling a real learner was Salus + PDC's ruling,
not infra's). **This scope routes the question to PDC + SSC before any migration or code.**

The question for the circles:

> Should parents have their own tracked life goals inside Executive Chef, and if so, in what
> form does that honor "we evoke, we never extract" and the no-scoreboard principle - a
> full self-owned Compass, a lighter non-goal cadence, or not at all?

## Architecture options (if greenlit)

| Path | What changes | Cost | Risk |
|------|--------------|------|------|
| **A. Repoint ownership to `profiles`** | Change goals/tasks/check_ins/year_plans/weekly_answers FK from `learners(id)` to `profiles(id)`; derive wheel/studio separately | High - RLS rewrite, data migration, every adapter query | High - touches the child data path |
| **B1. Adult protagonist rows (recommended)** | Widen `learners.studio` CHECK to add an adult value (`'parent-adult'`); create a `learners` row for the parent's own id; add a parent fallback to `getLearner` in BOTH adapters; unify `resolveLearnerId` | Medium | Contained - child path untouched; parent becomes just another protagonist |
| **C. No parent goals; cadence via a parent-appropriate surface** | Keep parents as observers; deliver the 3-session rhythm through the existing non-scored Parents & Tots arc | Low | Lowest - honors standing decisions, but no "real" goals |

**Recommendation: B1** if the circles rule parents may own goals. It is the minimal change
that makes adults first-class protagonists without disturbing the child data model or learner
RLS, and it fixes the guide/owner prod gap as a byproduct. **If the circles prioritize the
standing no-scoreboard / keep-parents-light positions, Path C is the aligned answer** - the
cadence reaches parents without making their growth a tracked object.

## Phased plan for B1 (build only after a clear PDC + SSC ruling)

1. **Migration `v0.24`** (additive, safe): widen the CHECK to include `'parent-adult'`.
   No existing row changes; no backfill.
2. **Mature flag**: add `'parent-adult'` to `MATURE_STUDIOS` in `thresholds.js` so the
   current-wheel arc turns on for parent protagonists. Inert-by-default preserved: no parent
   has a `learners` row until they onboard, so nothing renders until opt-in.
3. **Protagonist resolution**: add a parent branch to `resolveLearnerId` (`app.js`) returning
   `session.parentId`; add a parent fallback to `getLearner` in BOTH `local-store.js` and
   `supabase-adapter.js` (`studio:'parent-adult'`, implicit `setupCompletedAt`).
4. **Row creation**: create the parent's own `learners` row on first goal-setting (or at
   account creation), studio `'parent-adult'`.
5. **Onboarding gate**: add parent to `goalSettingProfileId` (`app.js:265-268`) so they reach
   the Setup view + slice plan. The anchor cascade already runs for them.
6. **Tabs**: extend `TABS_BY_ROLE.parent` with North / Compass / Session, keeping "My learner"
   as tab 1 so the child-observer view is never displaced. Revisit whether the new Calendar tab
   (2026-07-18) extends to parents once they are protagonists.
7. **Wheel**: `'parent-adult'` falls through to `ADULT_AREAS` already (`wheel.js:23-25`); no
   change required, or author a distinct parent wheel if the circles want one.
8. **RLS** (security pass - Tutela / Worf): add self-owner policies so a parent can read/write
   their OWN goals/tasks; verify the existing parent->child policies are not widened.

## Invariants to hold

- **Child-observer view must not regress** - "My learner" stays the parent's default tab; a
  parent's own goals never appear in the child's data, and the child's never in the parent's
  (separate `learner_id`).
- **Inert-by-default** - no parent gets a goal surface until they have a `parent-adult`
  `learners` row; every existing parent is byte-for-byte unchanged until they opt in.
- **No scoreboard (Polaris)** - a parent goal surface is self-owned and private: no
  aggregation, no guide-visible parent metrics, no streaks.

## Open questions for the gate

1. Should parents have their OWN life goals, or only accompany the child's? (product / ethics)
2. Distinct parent wheel, or reuse the adult 12-area wheel?
3. Fix guide/owner prod persistence in the same stroke? (B1 naturally does.)
4. Does the just-shipped Calendar tab extend to parents once they are protagonists?

## Governance ruling (PDC + SSC joint, 2026-07-18)

The circles ruled. Full minutes:
`evoke-agents-backup/agents/meetings/2026/07/2026-07-18-parent-life-goal-surface-pdc-ssc.md`.

1. **Parents may own their own private life goals in principle.** A self-owned developmental
   surface is sovereignty, not extraction; withholding the guide tool is paternalism. This does
   not overturn the 2026-05-11 narrow-surface decision (which protected parents from carrying the
   child's tracking, not a ban on self-sovereignty).
2. **Mechanism is B1.** Path A rejected (repoints the children's data path). Path C is the named
   fallback if the wall below cannot be made structural.
3. **BINDING PRECONDITION - the no-aggregation wall must be structural, and ships FIRST.** RLS
   self-owner policies; no parent goal/metric ever visible to guide, owner, or institution; no
   scores/streaks/completion. Built and passed a Tutela/Worf security audit BEFORE any parent UI.
   Odo's dissent stands as a tripwire: if anyone proposes shipping the parent UI with the wall
   deferred, the decision reverts to Path C.
4. **Two walls, adult voice.** Parent and child surfaces strictly separated; genuine adult
   12-area wheel (not a child mirror); invitation-based, no "behind," graceful exit; child-observer
   view stays the parent's default tab; inert-by-default.
5. **Build != enable.** Building the walled, inert mechanism exposes no one and may proceed once
   the wall lands. Enabling any real parent requires an SSC tone-review of the built surface plus
   a supervised watch with one real parent first.

**Build order (revised by the ruling):** wall + audit (step 8 of the B1 plan) moves to FIRST,
before steps 1-7. Then migration/resolver/threading. Then SSC tone-review. Then a supervised
enable. This inverts the phased list above; follow the ruling's order where they differ.

---

*Mechanism scoped by Lux. Ruling: PDC + SSC, 2026-07-18. The two are deliberately separate -*
*sibling-shape to the cohort-gated current-wheel flag (build != enable).*
*"We evoke - we never extract."*
