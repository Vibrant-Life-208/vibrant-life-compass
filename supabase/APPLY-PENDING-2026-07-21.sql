-- ============================================================================
-- Pending migrations to apply to prod, IN ORDER (captain step, 2026-07-21).
-- Run this whole file once in Supabase Dashboard -> SQL Editor -> Run.
-- Every statement is idempotent (if-not-exists / drop-policy-if-exists), so
-- re-running is safe. v0.30 may already be applied (book tracker) - harmless to
-- re-run. Apply this BEFORE deploying the feat/compass-4slice-migration branch;
-- it is additive + backward-compatible, so it will NOT break the current prod code.
-- ============================================================================


-- ###########################################################################
-- 2026-07-21-v0.27-leaders-and-guide-assigned-partners.sql
-- ###########################################################################
-- v0.27: guide-marked tribe leaders + guide-assigned accountability partners.
--
-- Two capabilities land together (captain 2026-07-21):
--
-- 1. Leaders. A guide marks certain learners as tribe "leaders" from the new Tribe
--    tab. The flag drives a roster indicator and the group-randomizer's leader options
--    (exclude leaders / one leader per group / leader-anchored draws). Add the column
--    and let a guide update it for learners on THEIR roster.
--
-- 2. Guide-assigned partners. The learner self-pick for accountability partners is
--    retired; guides now pair learners (by randomizer or by hand). A guide writes an
--    'accepted' partner_links row directly. Add read/insert/update policies scoped to
--    the guide's own roster, and a provenance column so a guide-made pairing is
--    distinguishable from a learner-proposed one.
--
-- NB (side benefit): the guide-update policy on learners also unblocks the in-progress
-- newToTribe flag, which writes to learners via the same saveLearner path and was
-- previously blocked by the self-only write policy.

-- ── 1. Leaders ───────────────────────────────────────────────────────────────

-- 1a. Leader flag. Not-null default false so existing rows are non-leaders.
alter table learners add column if not exists is_leader boolean not null default false;

-- 1b. Let a guide update learners on their OWN roster. Writes were previously self-only
--     (learners_write_self), so guide-set flags could never persist. Scoped to
--     guide_learner_assignment - a parent's read-visibility does NOT grant write.
drop policy if exists "learners_update_by_guide" on learners;
create policy "learners_update_by_guide" on learners
  for update
  using (id in (select learner_id from guide_learner_assignment where guide_id = auth.uid()))
  with check (id in (select learner_id from guide_learner_assignment where guide_id = auth.uid()));

-- ── 2. Guide-assigned partners ───────────────────────────────────────────────

-- 2a. Provenance flag: true when a guide made the pairing (vs a learner proposal).
alter table partner_links add column if not exists assigned_by_guide boolean not null default false;

-- 2b. Let a guide READ partner links involving their roster, so getActivePartnerOf and
--     the Tribe-tab assignment view work (the base read policy only covers the two
--     parties, and the guide is neither).
drop policy if exists "partner_links_read_by_guide" on partner_links;
create policy "partner_links_read_by_guide" on partner_links
  for select using (
    proposer_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
    or partner_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
  );

-- 2c. Let a guide INSERT a partnership for two learners who are BOTH on their roster.
--     The existing partner_links_insert policy (proposer_id = auth.uid()) is left in
--     place; this adds the guide path, since the guide is neither party.
drop policy if exists "partner_links_insert_by_guide" on partner_links;
create policy "partner_links_insert_by_guide" on partner_links
  for insert
  with check (
    proposer_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
    and partner_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
  );

-- 2d. Let a guide UPDATE (dissolve / reassign) links between two of their learners, so
--     re-pairing from the Tribe tab works.
drop policy if exists "partner_links_update_by_guide" on partner_links;
create policy "partner_links_update_by_guide" on partner_links
  for update
  using (
    proposer_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
    and partner_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
  )
  with check (
    proposer_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
    and partner_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
  );

-- ###########################################################################
-- 2026-07-21-v0.28-task-bands-region-week-pool.sql
-- ###########################################################################
-- v0.28: task bands + region colour + the week pool.
--
-- Three things the app now keeps on a task, which local-store already persists by
-- spread but the synced backend dropped:
--   band       - 'recurring' | 'weekly' | 'milestone' (drives the wheel-colour shade)
--   region     - which compass region the task serves (the colour hue)
--   shape      - 'once' | 'rhythm' (a rhythm has no check-off; pre-existing local field)
--   timerMinutes - optional rhythm timer
--   weekOf     - the Monday a task belongs to when it sits in the "week pool"
--
-- Packed into a single meta jsonb, mirroring the goals.decomposition pattern (one
-- column, forward-compatible, no per-field migration). rowToTask spreads it back to
-- the top level; saveTask packs it.
--
-- Also: a "pool" task belongs to a week but has no day yet, so planned_for must be
-- nullable. getTasksForRange filters by planned_for (a null never matches a range),
-- so pool tasks are naturally excluded from day queries and surface only via getTasks.

alter table tasks alter column planned_for drop not null;
alter table tasks add column if not exists meta jsonb;

-- ###########################################################################
-- 2026-07-21-v0.29-scheduling-mode.sql
-- ###########################################################################
-- v0.29: per-learner auto-scheduler placement override.
--
-- The Session-1 auto-scheduler lays a learner's year plan across the calendar in one of
-- three placement modes, defaulting by studio tier (research-grounded scaffolding that
-- fades with age):
--   auto       - everything onto days          (Sparks / Discovery, ages ~8-11)
--   pool-steps - milestones on days, steps pool (Adventure, the planner-owning pivot)
--   draft      - everything onto days as draft  (Launch Pad + / adults)
--
-- The tier sets the default; a guide can bump an individual up or down (the band is a
-- default, not a cage). This column stores that per-learner override; NULL = use the
-- studio-tier default. The guide-update-own-roster RLS from v0.27 already permits the
-- write, so no new policy is needed.

alter table learners add column if not exists scheduling_mode text
  check (scheduling_mode in ('auto', 'pool-steps', 'draft'));

-- ###########################################################################
-- 2026-07-21-v0.30-book-tracker-and-new-to-tribe-fields.sql
-- ###########################################################################
-- v0.30: book tracker + new-to-tribe + first-task-demo learner fields.
--
-- These three learner fields persist in local-store by spread, but the synced backend
-- dropped them. Each gets an explicit column, matching the recent learners-table pattern
-- (v0.27 is_leader, v0.29 scheduling_mode).
--
--   books                - the "Currently reading" shelf (up to 3 books, each
--                          { id, title, bookmark, createdAt }). jsonb array, default [].
--   new_to_tribe         - guide-set: this learner is new to their tribe this year, so
--                          they get the hand-holding path (the make-a-task demo + scaffolding).
--   first_task_demo_seen - the make-a-task demo is shown once, then fades; this remembers it.
--
-- NOTE (version number): v0.27-v0.29 were all authored 2026-07-21 by a parallel session.
-- If that session also claims v0.30, reconcile the number - the content here is additive
-- and order-independent (all `add column if not exists`).

alter table learners add column if not exists books jsonb not null default '[]'::jsonb;
alter table learners add column if not exists new_to_tribe boolean not null default false;
alter table learners add column if not exists first_task_demo_seen boolean not null default false;

-- ─────────────────────────────────────────────────────────────────────────────
-- QUEUED ADAPTER WIRING (not done here - supabase-adapter.js / local-store.js are
-- co-edited by the parallel session; do this once their tree settles):
--
--   1. learners adapter (rowToLearner / learnerToRow in supabase-adapter.js):
--        map  books <-> books                         (jsonb, pass through)
--             newToTribe <-> new_to_tribe             (camelCase <-> snake_case)
--             firstTaskDemoSeen <-> first_task_demo_seen
--
--   2. tasks adapter: add 'bookId' to the meta pack/unpack (rowToTask spreads meta back,
--      saveTask packs it). NO schema change needed - the tasks.meta jsonb from v0.28
--      already carries band/region/shape/timerMinutes; bookId just joins that list.
--
-- Until the wiring lands, these fields work in dev (local-store keeps everything) but do
-- not round-trip through the synced backend.
-- ─────────────────────────────────────────────────────────────────────────────

-- ###########################################################################
-- 2026-07-21-v0.31-scheduler-tombstones.sql
-- ###########################################################################
-- v0.31: auto-scheduler tombstones.
--
-- When a learner deletes an auto-scheduled task, the Session-1 scheduler must not
-- resurrect it on the next "sync from goals" (it plants by a stable planKey, so a
-- deleted-but-still-in-the-plan key otherwise looks "new" and gets re-created). This
-- column records the planKeys the learner has dismissed; the scheduler skips them
-- forever. Deleting a MANUAL task (no planKey) records nothing.
--
-- jsonb array of strings; default empty. Guide-update RLS from v0.27 already covers
-- writes to a learner's own row - but this field is learner-written (their own delete),
-- covered by the existing learners_write_self policy.

alter table learners add column if not exists dismissed_plan_keys jsonb not null default '[]'::jsonb;

-- ###########################################################################
-- 2026-07-21-v0.32-guide-year-plan-signoff.sql
-- ###########################################################################
-- v0.32: the guide signs off the year plan (not a peer partner).
--
-- Year-plan sign-off moves from the accountability partner to the learner's guide
-- (captain 2026-07-21: Rose signs off Discovery, Ben signs off Adventure; every learner
-- has a guide, so sign-off is never gated on having a partner). Two schema changes:
--
-- 1. approver_id referenced learners(id) - fine when the approver was a peer partner (a
--    learner), but a guide is a profile, not a learner row. Broaden the FK to profiles so
--    a guide id is a valid approver.
-- 2. The year_plans update policy allowed the learner or their accepted partner. Add a
--    policy so a guide can approve / return a plan for a learner on their roster. (The
--    read policy already covers guides via my_visible_learners.)

-- 1. Broaden the approver FK to any profile (guide / partner / learner).
alter table year_plans drop constraint if exists year_plans_approver_id_fkey;
alter table year_plans add constraint year_plans_approver_id_fkey
  foreign key (approver_id) references profiles(id) on delete set null;

-- 2. Let a guide update (sign off / send back) a roster learner's year plan.
drop policy if exists "year_plans_update_by_guide" on year_plans;
create policy "year_plans_update_by_guide" on year_plans for update
  using (learner_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid()))
  with check (learner_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid()));

-- ============================================================================
-- VERIFY (run after; each SELECT should return the noted result):
-- ============================================================================
-- v0.27 leader flag + guide partner policies:
select count(*) as v027_is_leader from information_schema.columns where table_name='learners' and column_name='is_leader';  -- expect 1
select count(*) as v027_policies from pg_policies where tablename in ('learners','partner_links') and policyname like '%by_guide%';  -- expect 4
-- v0.28 nullable planned_for + task meta:
select is_nullable as v028_plannedfor_nullable from information_schema.columns where table_name='tasks' and column_name='planned_for';  -- expect YES
select count(*) as v028_task_meta from information_schema.columns where table_name='tasks' and column_name='meta';  -- expect 1
-- v0.29 scheduling_mode / v0.31 dismissed_plan_keys:
select count(*) as v029_v031 from information_schema.columns where table_name='learners' and column_name in ('scheduling_mode','dismissed_plan_keys');  -- expect 2
-- v0.32 approver FK now points at profiles + guide sign-off policy:
select confrelid::regclass::text as v032_approver_fk from pg_constraint where conname='year_plans_approver_id_fkey';  -- expect profiles
select count(*) as v032_policy from pg_policies where tablename='year_plans' and policyname='year_plans_update_by_guide';  -- expect 1
