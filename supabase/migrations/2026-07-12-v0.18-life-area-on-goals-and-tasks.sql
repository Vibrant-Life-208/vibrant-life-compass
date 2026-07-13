-- v0.18 - Add a nullable `life_area` (wheel slice) to goals and tasks.
--
-- WHY: the 1-year horizon is being reorganized *by wheel slice* (life area:
-- Body / Mind / Spirit / ...). A goal or task can now declare which life-area it
-- belongs to. NULL is a first-class value and means "not placed" - it is never a
-- deficit. (Fleet meeting 2026-07-12, Decision 3.)
--
-- COVERAGE FRAME, NOT COMPLETENESS FRAME (meeting guardrail, 4 agents / 3
-- circles): a life-area with no goal is an *invitation*, never a failing count.
-- Nothing in this column may ever be rendered as a fill-meter or progress ring.
-- The DB just stores an optional label; the "quiet slice reads as room to grow"
-- rule lives in the render (year-view.js) - the column is deliberately dumb.
--
-- NO CHECK CONSTRAINT ON PURPOSE: the wheel's area set is code-defined and
-- *grows with the child* (Sparks 4 areas -> adult 12; see js/wheel.js
-- WHEEL_TIERS). A DB CHECK would couple the schema to a taxonomy that changes
-- per studio and over time, and would fight the "safe to re-run" rule. Validity
-- of a label against a studio's ring is an app-layer concern, not a DB one.
--
-- SCOPE: adult/guide proving ground only right now. The *learner* mapping
-- (curriculum core-task -> proper slice) is GATED (meeting Decision 4): it needs
-- the mapping authored as data by the captain, Jake + Accord sign-off on the
-- coverage frame, grow-with-child slicing, and TCC review before any learner
-- task is seeded with a life_area. This migration only opens the column; it
-- seeds nothing.
--
-- Additive + idempotent: `add column if not exists`, no data change, no policy
-- change. Existing goals_* / tasks_* RLS is row-level (learner_id) and covers the
-- new column automatically. Safe to re-run.

begin;

alter table goals add column if not exists life_area text;
alter table tasks add column if not exists life_area text;

commit;

-- VERIFY after apply:
--   * anon curl probe returns 200 for a select of life_area on goals and tasks
--     (column exists):
--       curl "$SUPABASE_URL/rest/v1/goals?select=life_area&limit=1" \
--         -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
--   * existing goals/tasks are unaffected: life_area is NULL on every prior row.
--   * no new RLS policy was added (row-level learner_id policies still govern).
