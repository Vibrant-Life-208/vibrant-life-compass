-- v0.16 - Move my_visible_learners into a private, non-API SECURITY DEFINER
-- function to clear the Supabase `security_definer_view` lint the RIGHT way.
--
-- STATUS: DRAFT - do NOT apply standalone. Apply WITH the v0.13 / learner
-- re-link batch, after reviewing on a prod-in-a-transaction dry run. It rewrites
-- 8 RLS read policies; if any table name or policy body has drifted from
-- schema.sql, reconcile before running.
--
-- WHY a function, not security_invoker: my_visible_learners is referenced inside
-- learners_read while itself reading `learners`. security_invoker=true would
-- recurse ("infinite recursion detected in policy for relation learners"). A
-- SECURITY DEFINER function reads the tables as the definer (RLS-bypassing, like
-- the view did) but self-filters on auth.uid(), so it can still only return the
-- caller's own learner_ids. Living in schema `private` keeps it off the
-- PostgREST API surface, which is what the lint actually wants. Mirrors the
-- existing public.anchor_aggregates() definer-function pattern.
--
-- NOTE: my_family_learners (used by the v0.11 family WRITE policies) is the same
-- shape and draws the same lint. Give it the identical treatment in this batch
-- (private.family_learner_ids()) - not done here to keep this draft reviewable.

begin;

create schema if not exists private;
-- private schema must not be exposed to PostgREST; do not grant usage to anon.
grant usage on schema private to authenticated;

-- The helper, now a function. STABLE (reads, no writes); search_path pinned so a
-- definer function can never be hijacked by a caller-set search_path.
create or replace function private.visible_learner_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from learners where id = auth.uid()
  union
  select learner_id from parent_learner_link where parent_id = auth.uid()
  union
  select learner_id from guide_learner_assignment where guide_id = auth.uid()
  union
  select profile_id from family_members
    where family_id = auth.uid() and kind = 'learner';
$$;

-- Only signed-in users may call it; anon (null auth.uid()) would get 0 rows
-- anyway, but revoke for defense in depth. Mirrors anchor_aggregates() grants.
revoke all on function private.visible_learner_ids() from public, anon;
grant execute on function private.visible_learner_ids() to authenticated;

-- ── Repoint the 8 read policies from the view to the function ────────────────
drop policy if exists "learners_read" on learners;
create policy "learners_read" on learners for select
  using (id in (select private.visible_learner_ids()));

drop policy if exists "year_quotes_read" on year_quotes;
create policy "year_quotes_read" on year_quotes for select
  using (learner_id in (select private.visible_learner_ids()));

drop policy if exists "year_traits_read" on year_traits;
create policy "year_traits_read" on year_traits for select
  using (learner_id in (select private.visible_learner_ids()));

drop policy if exists "goals_read" on goals;
create policy "goals_read" on goals for select
  using (learner_id in (select private.visible_learner_ids()));

drop policy if exists "tasks_read" on tasks;
create policy "tasks_read" on tasks for select
  using (learner_id in (select private.visible_learner_ids()));

drop policy if exists "check_ins_read" on check_ins;
create policy "check_ins_read" on check_ins for select
  using (learner_id in (select private.visible_learner_ids()));

drop policy if exists "logins_read" on logins;
create policy "logins_read" on logins for select
  using (learner_id in (select private.visible_learner_ids()));

-- year_plans_read keeps its extra partner-links branch; only the first clause moves.
drop policy if exists "year_plans_read" on year_plans;
create policy "year_plans_read" on year_plans for select
  using (
    learner_id in (select private.visible_learner_ids())
    or exists (
      select 1 from partner_links pl
      where pl.status = 'accepted'
        and (
          (pl.proposer_id = year_plans.learner_id and pl.partner_id = auth.uid())
          or (pl.partner_id = year_plans.learner_id and pl.proposer_id = auth.uid())
        )
    )
  );

-- Only after every referencing policy is repointed: retire the view.
drop view if exists my_visible_learners;

commit;

-- VERIFY after apply (as an authenticated learner, parent, guide, and family):
--   * learner sees own goals/tasks/check_ins; parent+guide see their learners;
--     family sees its learner members; nobody sees a stranger's rows.
--   * the security_definer_view lint no longer reports my_visible_learners.
