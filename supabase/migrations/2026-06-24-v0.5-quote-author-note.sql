-- Hero's Compass - Migration: v0.5 quote author + note
-- Date: 2026-06-24
-- Refs: agents/meetings/2026/06/2026-06-24-compass-onboarding-cant-reach-next-page.md
--
-- The quote anchor becomes a small guided flow (two teaching screens -> one
-- form) that captures three things: the quote, who said it, and what it means to
-- the person. quote_text + quote_cycle already exist (v0.4). This adds the other
-- two fields. All three render together at the top of the North page.
--
--   quote_author text  - "who said it" (attribution; may be empty / "unknown")
--   quote_note   text  - "what it means to you" (the person's own reflection)
--
-- PRIVACY: both live on profiles and inherit the existing profiles_self RLS
-- policy (auth.uid() = id). Self-only by construction, like the rest of the
-- anchor. No new policy needed.
--
-- Apply to the deployed Supabase project via the SQL editor BEFORE deploying the
-- v0.5 app code (the quote flow reads/writes both columns). schema.sql is updated
-- to match for fresh-project setup.

alter table profiles
  add column if not exists quote_author text not null default '',
  add column if not exists quote_note text not null default '';
