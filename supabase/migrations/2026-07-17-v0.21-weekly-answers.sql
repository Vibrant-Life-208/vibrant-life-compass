-- v0.21: weekly_answers - synced storage for the Stage M2 weekly progressing answers.
-- (build plan Stage V / flip-checklist §3; migrates off the localStorage 'hc_weekly_answers_v0'
-- device-local key so a real learner does not lose this week's answer across devices.)
--
-- One discrete record per (learner, goal, session, week): the learner's answer to THIS
-- week's progressing question. Twelve answers is not a dataset - each week is its own moment
-- (consolidated build conditions §5). The store above this table exposes ONLY get-one and
-- save-one; there is no list / count / streak / trend / "last answered" reader anywhere.
--
-- §5 IS ENFORCED IN THE SCHEMA, not just in the app: this table deliberately has NO
-- created_at / updated_at. With no timestamp stored, "you last answered N days ago" is not
-- even computable at the database layer - there is nothing to aggregate over time. A weekly
-- answer is a presence, not a metric. (Interaction review 2026-07-17. The localStorage store
-- stored no timestamp either; this migration preserves that property in synced storage.)
--
-- Additive + dormant: the current-wheel build stays behind CURRENT_WHEEL_BUILD (false), so no
-- learner writes this table until Stage O/M ships. The unique (learner, goal, session, week)
-- key makes save-one an upsert and guarantees one-record-per-moment. Safe to re-run.

begin;

create table if not exists weekly_answers (
  id uuid primary key default uuid_generate_v4(),
  learner_id uuid not null references learners(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  session int not null check (session between 1 and 7),
  week int not null check (week between 1 and 6),
  kind text not null default 'finish',   -- 'finish' | 'presence' (cadence split; record only, never summed)
  text text not null,
  unique (learner_id, goal_id, session, week)
);
create index if not exists idx_weekly_answers_lookup
  on weekly_answers(learner_id, goal_id, session, week);

alter table weekly_answers enable row level security;

-- Row-level: read for anyone who can see the learner; write only for the learner themselves.
-- Mirrors goals_read / goals_write (schema.sql), reusing the my_visible_learners view.
-- CREATE POLICY is not idempotent (no "if not exists"), so drop-then-create makes this whole
-- migration safe to re-run even if a prior attempt committed before the SQL client crashed.
drop policy if exists "weekly_answers_read" on weekly_answers;
create policy "weekly_answers_read" on weekly_answers for select
  using (learner_id in (select learner_id from my_visible_learners));
drop policy if exists "weekly_answers_write" on weekly_answers;
create policy "weekly_answers_write" on weekly_answers for all
  using (learner_id = auth.uid()) with check (learner_id = auth.uid());

commit;

-- VERIFY after apply:
--   * the table exists and has NO timestamp column (§5 is schema-enforced):
--       select column_name from information_schema.columns
--         where table_name = 'weekly_answers' order by column_name;
--     -> expect: goal_id, id, kind, learner_id, session, text, week  (no created_at/updated_at)
--   * anon curl probe returns 200 for a select (RLS lets a session read its own):
--       curl "$SUPABASE_URL/rest/v1/weekly_answers?select=text&limit=1" \
--         -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
--   * THEN wire the supabase adapter (js/backend/supabase-adapter.js getWeeklyAnswer /
--     saveWeeklyAnswer already target this table; they are dormant until CURRENT_WHEEL_BUILD flips).
