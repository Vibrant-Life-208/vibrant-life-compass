-- v0.17 - Learner birthdate + pitch-readiness intent (Phase 0 of the pitch spec)
-- Refs: docs/design/2026-07-09-pitch-readiness-thresholds-spec-v0.1.md
--
-- birth_month + birth_year: a durable birthdate for the pitch age-gate. A learner
-- can apply to pitch up if they turn the next studio's entry age within 4 months
-- of the next school year's start. Stored as month+year so it never needs to be
-- re-entered as the child ages.
--
-- pitch_target_studio + pitch_intent_at: set when a learner opts in during
-- onboarding to work toward pitching up. Null = not pitching.
--
-- All four are learner-owned through the existing learners RLS (a learner reads/
-- writes their own row via the my_visible_learners self-branch); no new policy.

alter table learners
  add column if not exists birth_month smallint
    check (birth_month between 1 and 12),
  add column if not exists birth_year smallint
    check (birth_year between 2000 and 2030),
  add column if not exists pitch_target_studio text
    check (pitch_target_studio in ('adventure', 'launchpad')),
  add column if not exists pitch_intent_at timestamptz;
