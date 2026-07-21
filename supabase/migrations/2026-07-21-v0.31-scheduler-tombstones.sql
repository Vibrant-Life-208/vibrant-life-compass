-- v0.31: auto-scheduler tombstones.
--
-- When a learner deletes an auto-scheduled task, the Session-1 scheduler must not
-- resurrect it on the next "sync from goals" (it plants by a stable planKey, so a
-- deleted-but-still-in-the-plan key otherwise looks "new" and gets re-created). This
-- column records the planKeys the learner has dismissed; the scheduler skips them
-- forever. Deleting a MANUAL task (no planKey) records nothing.
--
-- jsonb array of strings; default empty. Guide-update RLS from v0.27 already covers
-- writes to a learner's own row - but this field is learner-written (their own delete),
-- covered by the existing learners_write_self policy.

alter table learners add column if not exists dismissed_plan_keys jsonb not null default '[]'::jsonb;
