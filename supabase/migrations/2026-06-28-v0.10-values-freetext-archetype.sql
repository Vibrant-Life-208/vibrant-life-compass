-- Hero's Compass - Migration: v0.10 typed values + archetype
-- Date: 2026-06-28
--
-- The values.institute assessment uses its own vocabulary (Peace, Intimacy, Awe…)
-- that doesn't match the app's curated values_lexicon. So older learners + adults
-- TYPE their results instead of picking from the grid:
--   * Adventure + Launch Pad learners, guides, and parents -> type top 3 + an
--     optional archetype (these columns).
--   * Sparks + Discovery learners -> still pick from values_lexicon (values_top_3).
--
-- Kept separate from values_top_3 on purpose: the aggregate insights count
-- values_top_3 (lexicon ids), so free-text typing here never pollutes those counts.
--
-- Self-only via the existing profiles_self RLS.

alter table profiles
  add column if not exists values_freetext text[] not null default '{}',
  add column if not exists values_archetype text not null default '';
