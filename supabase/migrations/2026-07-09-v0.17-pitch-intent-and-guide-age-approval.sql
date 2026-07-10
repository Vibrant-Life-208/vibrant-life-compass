-- v0.17 - Pitch-readiness intent + guide age approval (Phase 0 of the pitch spec)
-- Refs: docs/design/2026-07-09-pitch-readiness-thresholds-spec-v0.1.md
--
-- PRIVACY (captain 2026-07-10): the system does NOT store a learner's birthdate.
-- A child self-reports a yes/no against a cutoff DATE ("will you have turned 11
-- by [date]?"); their GUIDE then approves or denies the age status. The learner's
-- actual age/birthdate never enters the system - the guide is the authority.
--
-- Columns (all on learners, learner-owned via existing RLS; guide review lands
-- through the guide-write path in a later phase):
--   pitch_target_studio    - the studio they want to pitch to (adventure/launchpad)
--   pitch_intent_at        - when they opted in
--   pitch_age_self_report  - the child's own yes/no to the cutoff-date question
--   pitch_age_status       - guide's ruling: pending / approved / denied
--   pitch_age_reviewed_by  - the guide who ruled
--   pitch_age_reviewed_at  - when

alter table learners
  add column if not exists pitch_target_studio text
    check (pitch_target_studio in ('adventure', 'launchpad')),
  add column if not exists pitch_intent_at timestamptz,
  add column if not exists pitch_age_self_report boolean,
  add column if not exists pitch_age_status text
    check (pitch_age_status in ('pending', 'approved', 'denied')),
  add column if not exists pitch_age_reviewed_by uuid references profiles(id),
  add column if not exists pitch_age_reviewed_at timestamptz;
