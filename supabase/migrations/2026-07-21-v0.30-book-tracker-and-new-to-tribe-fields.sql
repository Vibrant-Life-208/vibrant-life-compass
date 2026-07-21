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
