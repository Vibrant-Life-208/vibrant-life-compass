-- v0.28: task bands + region colour + the week pool.
--
-- Three things the app now keeps on a task, which local-store already persists by
-- spread but the synced backend dropped:
--   band       - 'recurring' | 'weekly' | 'milestone' (drives the wheel-colour shade)
--   region     - which compass region the task serves (the colour hue)
--   shape      - 'once' | 'rhythm' (a rhythm has no check-off; pre-existing local field)
--   timerMinutes - optional rhythm timer
--   weekOf     - the Monday a task belongs to when it sits in the "week pool"
--
-- Packed into a single meta jsonb, mirroring the goals.decomposition pattern (one
-- column, forward-compatible, no per-field migration). rowToTask spreads it back to
-- the top level; saveTask packs it.
--
-- Also: a "pool" task belongs to a week but has no day yet, so planned_for must be
-- nullable. getTasksForRange filters by planned_for (a null never matches a range),
-- so pool tasks are naturally excluded from day queries and surface only via getTasks.

alter table tasks alter column planned_for drop not null;
alter table tasks add column if not exists meta jsonb;
