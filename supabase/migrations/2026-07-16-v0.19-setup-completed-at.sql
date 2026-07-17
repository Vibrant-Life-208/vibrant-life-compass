-- v0.19: persist Setup completion.
--
-- The app has always used learner.setupCompletedAt to gate the first-run Setup view
-- (js/app.js) and stamps it on completion (js/setup.js). local-store persists it, but
-- the supabase adapter never wrote or read it and no column existed - so on prod, Setup
-- completion never stuck and a learner (or, after the 2026-07-16 change, a guide/owner)
-- who finished Setup looped straight back to it, never reaching the main app.
--
-- Add the column so completion persists. Nullable; null = setup not finished (gates Setup).
alter table learners add column if not exists setup_completed_at timestamptz;
