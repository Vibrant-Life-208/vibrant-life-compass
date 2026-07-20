-- v0.26: profiles.foundations - the Session-1 foundational inventory (the "Ground / Posture /
-- Self" answers beyond strengths/values/vision). Design spec + copy:
--   docs/design/2026-07-20-session1-plan-foundational-inventory-spec.md   (Q-C: jsonb)
--   docs/design/2026-07-20-session1-foundational-inventory-COPY.md
--
-- ONE JSONB COLUMN, not one per answer: the inventory is heterogeneous and will keep evolving
-- as cohort variants are authored - jsonb absorbs new/reworded questions with no further
-- migration. Mirrors the decomposition (v0.22) + open_by_choice (v0.20) jsonb precedents. The
-- answers are NEVER queried per-field (spec invariant #7: not surveilled), so per-column
-- queryability would buy nothing.
--
-- All on profiles, so self-only BY CONSTRUCTION via the existing profiles_self RLS policy
-- (same as the horizon/vision columns) - the foundational answers surface on no dashboard.
--
-- Additive + safe for the existing 44 learners + adults: not-null jsonb with an empty-object
-- default, so every existing row gets '{}' and nothing needs backfilling. Safe to re-run.
--
-- DORMANT on apply: the adapter accessors (getProfileFoundations / setProfileFoundations) land
-- with this migration but are CALLED only once the Session-1 movement screens are built, behind
-- CURRENT_WHEEL_BUILD + the watch-with-a-real-learner gate. Applying this now corrupts nothing.

begin;

alter table profiles add column if not exists foundations jsonb not null default '{}'::jsonb;

commit;

-- VERIFY after apply:
--   * a self select of foundations on profiles returns 200 and '{}' for existing rows:
--       curl "$SUPABASE_URL/rest/v1/profiles?select=foundations&limit=1" \
--         -H "apikey: $ANON" -H "Authorization: Bearer $USER_JWT"
--   * existing rows are unaffected: foundations is '{}' on every prior row.
--   * no new RLS policy added (profiles_self still governs; self-only by construction).
