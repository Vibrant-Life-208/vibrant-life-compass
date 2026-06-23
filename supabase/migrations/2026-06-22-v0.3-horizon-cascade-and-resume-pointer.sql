-- Hero's Compass - Migration: v0.3 horizon cascade + onboarding resume pointer
-- Date: 2026-06-22
-- Refs: agents/meetings/2026/06/2026-06-22-compass-onboarding-cascade-resumable-gate.md
--       agents/decision-logs/2026/06/2026-06-22-compass-onboarding-cascade-resumable-gate.md
--       Decisions 1-7
--
-- This migration adds the schema foundation for the first-run cascade decided
-- in the 2026-06-22 fleet meeting. It ships BEFORE the cascade UI on purpose:
-- the live v0.2 onboarding modal holds its state in memory and loses everything
-- on close (verified in-session). Lengthening that flow before a durable resume
-- pointer exists would just create more to lose on pause. So storage + resume
-- land first; the cascade pages (separate commits) write into these columns.
--
-- Two additions, both on profiles:
--
--   1. The telescoping horizon cascade (steps 3-7 of the flow):
--        beyond-5yr -> within-5yr -> within-1yr -> where-you-are-now -> halfway
--      Held on profiles (NOT on learners) so guides, parents, and learners each
--      hold their own vision, exactly as the v0.2 anchor does.
--
--   2. The onboarding resume pointer (Decision 3): a single durable record of
--      which step a person is on, which steps they said "not now" to, and
--      whether they have walked the cascade once. Written on every save; read on
--      every sign-in so the person lands "right where they left off."
--
-- PRIVACY (Decision 6): these columns inherit the existing `profiles_self` RLS
-- policy (for all using auth.uid() = id). That makes every person's vision
-- private to them BY CONSTRUCTION - a guide or parent cannot read another
-- person's profile row at all. No new policy is needed to make the intimate
-- steps default-private. Cross-role sharing, if ever built, must be a future
-- ADDITIVE and LEARNER-INITIATED mechanism (e.g. an explicit shares table),
-- never a default-visible read like the legacy year_quotes / year_traits tables
-- use. Default-private is the floor and stays the floor.
--
-- GATE SEMANTICS (Decisions 1 + 2): the gate is "walk the pages once," NOT
-- "answer every field." onboarding_completed_at is set when the person reaches
-- the end of the cascade EVEN IF some steps were skipped. Skips are recorded
-- positively in onboarding_skipped as "not now" - never as failure, never as a
-- blocker. The pointer tracks position, not obedience.
--
-- Apply this migration to the deployed Supabase project via the SQL editor.
-- schema.sql is updated to reflect the same end state for fresh-project setup.

-- ============================================================================
-- 1. Horizon cascade columns on profiles
-- ============================================================================

alter table profiles
  -- The telescoping life-vision steps. Free text; the cascade UI sizes the copy
  -- to the reader's age tier (Decision 5), but the storage is register-neutral.
  add column if not exists vision_beyond_5yr text not null default '',
  add column if not exists vision_within_5yr text not null default '',
  add column if not exists vision_within_1yr text not null default '',
  -- "Where you are now" and "the halfway point" at the PERSON level. Named to
  -- echo the per-goal baseline / halfway concepts in goals so a future reader
  -- sees the rhyme: the goal-level pair is "where am I on THIS goal", the
  -- person-level pair is "where am I in my life." Same idea, different altitude.
  -- Deliberately NOT overloaded onto the goal columns (Decision 4).
  add column if not exists current_state text not null default '',
  add column if not exists halfway_state text not null default '';

-- ============================================================================
-- 2. Onboarding resume pointer on profiles
-- ============================================================================

alter table profiles
  -- The step the person should land on next. The enum IS the canonical flow
  -- order, so the schema teaches the sequence (Lux: architecture should reveal
  -- itself). 'breath' is Salus's body-first door (Decision 7); 'complete' means
  -- the gate has receded (Decision 1).
  add column if not exists onboarding_step text not null default 'breath'
    check (onboarding_step in (
      'breath',         -- body-first regulation surface (one breath, no timer)
      'strengths',      -- (1) VIA Survey link-out -> enter measured top strengths
      'values',         -- (2) Values Institute link-out -> enter measured top values
      'beyond_5yr',     -- (3) vision beyond five years
      'within_5yr',     -- (4) vision within five years
      'within_1yr',     -- (5) vision within one year (this year)
      'current_state',  -- (6) where you are now
      'halfway',        -- (7) the halfway point
      'complete'        -- cascade walked once; gate recedes
    )),
  -- Steps the person chose "not now" on. Presence here = a positive, honored
  -- skip (Decision 2), distinguishable from a not-yet-reached blank step.
  add column if not exists onboarding_skipped text[] not null default '{}',
  -- Null until the person reaches the end of the cascade once. Set even if some
  -- steps were skipped. This is the gate-recede signal.
  add column if not exists onboarding_completed_at timestamptz,
  -- Bumped on every save so "right where you left off" is fresh, and so a future
  -- gentle-return surface can tell how long it has been since the last step.
  add column if not exists onboarding_updated_at timestamptz default now();

-- ============================================================================
-- 3. Backfill existing profiles
-- ============================================================================

-- People who already completed the v0.2 anchor (quote + 3 values + 3 strengths)
-- have effectively walked the 'strengths' and 'values' steps. Land them on the
-- first genuinely-new step ('beyond_5yr') rather than making them re-walk ground
-- they already covered (Comes: never re-walk what you already walked). Their
-- cascade is not complete, so onboarding_completed_at stays null.
update profiles
  set onboarding_step = 'beyond_5yr'
  where coalesce(trim(quote_text), '') <> ''
    and array_length(values_top_3, 1) = 3
    and array_length(via_strengths_top_3, 1) = 3
    and onboarding_completed_at is null;

-- Everyone else keeps the default 'breath' - they meet the body-first door first.

-- ============================================================================
-- 4. RLS
-- ============================================================================

-- No new policy. The existing `profiles_self` policy already restricts all
-- reads and writes on profiles to auth.uid() = id, so every column added above
-- is private-to-self by construction (Decision 6). Verified against schema.sql
-- profiles_self definition before authoring this migration.
