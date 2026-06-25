-- Hero's Compass - Migration: v0.7 strength ranking (top 8 / bottom 8)
-- Date: 2026-06-24
--
-- Captures more of the VIA ranking than the single top-3, so guides can see both
-- the most-developed (signature) AND least-developed strengths across the tribe
-- and school. Per the 2026-06-24 captain decision: store top 8 + bottom 8 only
-- (data minimization - not the full 24). Imported from the VIA PDF entirely on
-- the device; the PDF is never uploaded or stored, only these ids are saved.
--
-- via_strengths_top_3 is kept in sync (first 3 of top_8) so North + the existing
-- aggregate keep working unchanged.
--
-- PRIVACY: both columns live on profiles and inherit profiles_self RLS (self-only).
-- Guides only ever see anonymized, suppressed aggregates via anchor_aggregates().

alter table profiles
  add column if not exists via_strengths_top_8 text[] not null default '{}',
  add column if not exists via_strengths_bottom_8 text[] not null default '{}';
