-- v0.35 — goals.is_becoming (Gate L step E-2.5, the regression blocker before E-3)
-- Authored 2026-07-23 (Compass rebuild, LEGACY_TO_REGION removal). ADDITIVE + reversible.
-- DO NOT run without captain review + a backup (scripts/backup.sh).
--
-- WHY THIS MUST LAND BEFORE E-3. The cadence split (js/goal-arc.js weeklyKindFor)
-- keys off the RAW slice label: a goal whose life_area is a BECOMING slice
-- (heart / spirit / emotions / voice) registers PRESENCE, everything else FINISH.
-- The E-3 backfill collapses those labels to regions (emotions -> Self, heart -> Self).
-- Self is NOT a becoming slice, so a naive collapse silently flips a becoming goal
-- from presence to finish. year-view.js:366 documents that reliance. E-1 (2026-07-23)
-- measured the live stake: exactly ONE goal — an `emotions` goal — is affected.
--
-- The fix: freeze each goal's CURRENT becoming disposition into a stored flag BEFORE
-- the labels move, and teach weeklyKindFor to read the flag first (slice-test only as
-- fallback). Then the E-3 collapse cannot change any existing goal's cadence.
--
-- SCOPE: goals only. Traced: `tasks` carry no cadence (weeklyKindFor has two callers,
-- both goal-arc, keyed by goalId). tasks.life_area is presentation-only — the safe half.
-- The flag's CONTENT for NEW goals under the region mapping is a Comes/Accord values
-- call (2026-07-20 Grows/disposition mapping) and is deliberately NOT decided here —
-- new goals leave the flag NULL and fall back to the slice test, unchanged behavior.

begin;

-- 1. The column. NULL = "not captured" -> weeklyKindFor falls back to the slice test.
alter table goals
  add column if not exists is_becoming boolean;

-- 2. Backfill from the CURRENT legacy label, BEFORE E-3 collapses it. Mirrors
--    js/goal-arc.js BECOMING_SLICES = {heart, spirit, emotions, voice} exactly.
--    Set TRUE only where the becoming test passes on the goal's present life_area OR
--    its legacy `slice_<x>` category_id (the two columns E-3 will mutate). Every other
--    goal is left NULL — the fallback slice test reproduces its current cadence, so no
--    row's behavior changes. Idempotent: only fills where not already captured.
update goals
   set is_becoming = true
 where is_becoming is null
   and (
     lower(coalesce(life_area, '')) in ('heart', 'spirit', 'emotions', 'voice')
     or (category_id like 'slice_%'
         and lower(substring(category_id from 7)) in ('heart', 'spirit', 'emotions', 'voice'))
   );

commit;

-- VERIFY (E-1 measured exactly one becoming legacy goal — an `emotions` goal — so
-- expect count = 1 here on current prod; re-check after any new data lands):
--   select is_becoming, count(*) from goals group by is_becoming order by is_becoming;
--   -- the one row with is_becoming = true should be the emotions goal from E-1.
--
-- ROLLBACK (reversible; the flag is derived, not source data):
--   alter table goals drop column if exists is_becoming;
