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
