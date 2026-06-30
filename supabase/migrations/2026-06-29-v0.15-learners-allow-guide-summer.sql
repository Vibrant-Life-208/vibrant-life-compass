-- Hero's Compass - Migration: v0.15 allow guide-summer studio
-- Date: 2026-06-29
--
-- Guides get a learners row with studio 'guide-summer' so they can walk their own
-- Compass (the year view + Wheel read learner.studio === 'guide-summer'). The
-- original learners_studio_check predates that journey and rejected it, so guide
-- seeding failed (23514 check_violation). Widen the constraint to include it.
-- (Tots are not learners rows - they have no studio - so 'tot' is intentionally
-- not added here.)

alter table learners drop constraint if exists learners_studio_check;
alter table learners add constraint learners_studio_check
  check (studio in ('sparks', 'discovery', 'adventure', 'launchpad', 'guide-summer'));
