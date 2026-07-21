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
