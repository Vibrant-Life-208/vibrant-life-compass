-- v0.36 — LEGACY_TO_REGION provenance (Gate L step E-2). Promoted from
-- COMPASS-LEGACY-REGION-MIGRATION-DRAFT.sql after E-1 (2026-07-23) reconciled the mapping.
-- Authored 2026-07-23 (Compass rebuild). ADDITIVE + idempotent + reversible.
-- DO NOT run without captain review + a backup (scripts/backup.sh).
--
-- WHY. E-3 will overwrite each goal's legacy identity (slice_emotions -> slice_self,
-- 'Emotions' -> 'Self'). The shelved Launch Pad "slices of life" feature may want the
-- ORIGINAL slice back, so snapshot the pre-overwrite value into a preservation column
-- FIRST. These columns ARE the preserved slices-of-life record — they stay in place after
-- E-5 (do NOT drop them as part of the shim delete). They also back the E-3 rollback.
--
-- APPLY-ORDER NOTE. This is E-2, which the plan lists BEFORE E-2.5. But E-2.5 shipped
-- first and took v0.35, so numerically v0.35 (becoming flag) sorts before v0.36 (this).
-- That inversion is SAFE: both are pre-E-3 and independent — v0.35 READS the current
-- label to set is_becoming, v0.36 READS the current label into provenance columns;
-- neither writes the other's source. Run them in EITHER order in the same window; E-3
-- (a later migration) must come after BOTH.
--
-- E-1 measured: 4 legacy goal rows (each dual-backed), ZERO legacy task rows. The tasks
-- updates below therefore touch 0 rows today — the columns are still created for schema
-- symmetry and so E-3's task backfill + the rollback have a place to read from.

begin;

alter table goals add column if not exists legacy_slice_id  text;
alter table goals add column if not exists legacy_life_area  text;
alter table tasks add column if not exists legacy_slice_id  text;
alter table tasks add column if not exists legacy_life_area  text;

-- Snapshot the legacy slice_<x> category_id (positive-list; only known legacy slices).
update goals set legacy_slice_id = category_id
  where legacy_slice_id is null
    and category_id like 'slice_%'
    and lower(substring(category_id from 7)) in
      ('movement','heart','emotions','joy','play','fun','time','family','friends',
       'home','partner','money','finances','career','calling','mind','learning','spirit');
update tasks set legacy_slice_id = category_id
  where legacy_slice_id is null
    and category_id like 'slice_%'
    and lower(substring(category_id from 7)) in
      ('movement','heart','emotions','joy','play','fun','time','family','friends',
       'home','partner','money','finances','career','calling','mind','learning','spirit');

-- Snapshot the bare legacy life_area label (positive-list; only known legacy labels).
update goals set legacy_life_area = life_area
  where legacy_life_area is null
    and lower(life_area) in
      ('movement','heart','emotions','joy','play','fun','time','family','friends',
       'home','partner','money','finances','career','calling','mind','learning','spirit');
update tasks set legacy_life_area = life_area
  where legacy_life_area is null
    and lower(life_area) in
      ('movement','heart','emotions','joy','play','fun','time','family','friends',
       'home','partner','money','finances','career','calling','mind','learning','spirit');

commit;

-- VERIFY (E-1 measured 4 legacy goals, 0 legacy tasks — expect goals=4, tasks=0):
--   select count(*) filter (where legacy_slice_id  is not null) as goals_slice_captured,
--          count(*) filter (where legacy_life_area is not null) as goals_area_captured
--     from goals;
--   select count(*) filter (where legacy_slice_id  is not null) as tasks_slice_captured,
--          count(*) filter (where legacy_life_area is not null) as tasks_area_captured
--     from tasks;
--
-- ROLLBACK (only before E-3 has consumed them; these columns are the preserved record):
--   alter table goals drop column if exists legacy_slice_id;
--   alter table goals drop column if exists legacy_life_area;
--   alter table tasks drop column if exists legacy_slice_id;
--   alter table tasks drop column if exists legacy_life_area;
