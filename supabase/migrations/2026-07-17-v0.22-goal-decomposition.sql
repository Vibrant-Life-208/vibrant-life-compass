-- v0.22: goals.decomposition - synced storage for the extended goal-decomposition fields.
-- (build plan Stage V / flip-checklist §3.)
--
-- The 1-year decomposition modal (year-view.js -> openYearGoalModal) already writes extended
-- fields on every year goal - baseline, halfwayPoint (the locked End-of-Session-3 anchor),
-- quarterPoint, eos1Point, weeklySteps, targetSession. The supabase adapter's goalToRow
-- currently DROPS all of them (only category_id / scope / text / life_area / status survive),
-- so on the synced backend a learner loses their decomposition detail across devices. This
-- column closes that gap before real learners depend on cross-device continuity.
--
-- ONE JSONB COLUMN, not one column per field: the extended set is heterogeneous (strings plus
-- a nested weeklySteps object keyed by session) and grows with the decomposition design.
-- Mirrors the open_by_choice jsonb precedent (v0.20). rowToGoal spreads it back to top-level
-- fields; goalToRow packs the known extended keys into it. (Adapter wiring lands AFTER this
-- column exists - see the note at the foot of this file.)
--
-- PROJECTION RULE HOLDS (Geordi): a carried threshold is never a goal row, so nothing about a
-- threshold is stored here; this column carries only the learner's own decomposition of their
-- OWN slice / year goal. La'an's runtime write-wall (js/goal-write-wall.js) still refuses any
-- threshold-id goal write at the store edge regardless of this column.
--
-- Additive + safe for the 44 existing learners: not-null jsonb with an empty-object default,
-- so existing rows get '{}' and nothing needs backfilling. Existing goals RLS (row-level
-- learner_id) covers the new column automatically. Safe to re-run.

begin;

alter table goals add column if not exists decomposition jsonb not null default '{}'::jsonb;

commit;

-- VERIFY after apply:
--   * anon curl probe returns 200 for a select of decomposition on goals (column exists):
--       curl "$SUPABASE_URL/rest/v1/goals?select=decomposition&limit=1" \
--         -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
--   * existing goals are unaffected: decomposition is '{}' on every prior row.
--   * no new RLS policy was added (row-level learner_id policies still govern).
--
-- THEN (and only then) wire the adapter - this is the "sequence wiring after the column
-- exists" step, mirroring v0.19/v0.20. In js/backend/supabase-adapter.js:
--   * goalToRow: add
--       decomposition: {
--         baseline: goal.baseline, halfwayPoint: goal.halfwayPoint,
--         quarterPoint: goal.quarterPoint, eos1Point: goal.eos1Point,
--         weeklySteps: goal.weeklySteps, targetSession: goal.targetSession,
--       }  (drop undefined keys)
--   * rowToGoal: spread row.decomposition back to the top level
--       ...(row.decomposition || {})
-- Landing that write path BEFORE the column exists would break every live year-goal save
-- (year-view.js:206 is not behind the flag), which is why it is sequenced here.
