-- Hero's Compass - Migration: v0.2 onboarding flow (Phase 1, adult tier)
-- Date: 2026-06-17
-- Refs: agents/meetings/2026/06/2026-06-16-compass-welcome-gating-underage-via-safeguard.md
--       Decisions 1, 2, 3, 7
--
-- This migration ships the adult tier of the v0.2 onboarding capture:
--   1. Move the year-level anchor (quote + vision + traits) from the
--      learner-keyed tables (year_quotes, year_traits) to profiles so guides,
--      parents, and learners can all hold their own anchor. Existing learner
--      data is preserved by copying it into the new columns on profiles.
--   2. Add values_top_3 + via_strengths_top_3 columns on profiles for the new
--      values + character strengths capture flow.
--   3. Create the VIA character strengths reference table seeded with the
--      canonical VIA 24 organized into 6 virtue categories.
--   4. Create the values_lexicon reference table (seed pending captain
--      confirmation of source vocabulary).
--   5. Update the gating expression in app code (separate commit) so the
--      welcome shows until values_top_3 AND via_strengths_top_3 are populated.
--
-- Phase 2 (separate migration) will add:
--   - values_entered_by + via_strengths_entered_by columns
--   - Check constraint requiring entered_by != id for under-13 learners
--   - Age-tier display label columns on the reference tables (CSI-EC, CSI-C)
--   - notifications table for parent notification on guide-administered entry
--   - Retirement of legacy year_quotes / year_traits tables once code is migrated
--
-- Apply this migration to the deployed Supabase project via the SQL editor.
-- Schema.sql is updated to reflect the same end state for fresh-project setup.

-- ============================================================================
-- 1. New anchor columns on profiles
-- ============================================================================

alter table profiles
  add column if not exists quote_text text not null default '',
  add column if not exists quote_vision text not null default '',
  add column if not exists quote_locked_until_session int default 7,
  add column if not exists values_top_3 text[] not null default '{}',
  add column if not exists via_strengths_top_3 text[] not null default '{}';

-- ============================================================================
-- 2. Migrate existing learner anchor data to profiles
-- ============================================================================

-- Copy year_quotes (text, vision, locked_until_session) into profile columns
-- for learners that have an existing row.
update profiles p
  set quote_text = y.text,
      quote_vision = y.vision,
      quote_locked_until_session = y.locked_until_session
  from year_quotes y
  where p.id = y.learner_id;

-- Legacy year_traits are intentionally NOT migrated. The 5-traits free-text
-- field is replaced by VIA character strengths (selection from controlled
-- vocabulary) per Decision 1 + 7 of the 2026-06-16 meeting. Learners will
-- complete the new strengths selection in the v0.2 onboarding flow. The
-- year_traits table is retained as legacy and will be dropped in Phase 2 once
-- all callers have been migrated to via_strengths_top_3.

-- ============================================================================
-- 3. VIA character strengths reference table
-- ============================================================================

-- Canonical 24 character strengths from the VIA Institute on Character,
-- organized into 6 virtue categories. Source: viacharacter.org/character-strengths.
-- display_label_adult is the canonical name used in the Adult VIA Survey.
-- Phase 2 will add display_label_csi_c (ages 7-12) and display_label_csi_ec
-- (ages 3-6) for age-tier rendering.
create table if not exists via_character_strengths (
  id text primary key,
  virtue_category text not null,
  display_label_adult text not null,
  sort_order int not null
);

insert into via_character_strengths (id, virtue_category, display_label_adult, sort_order) values
  ('creativity',             'Wisdom & Knowledge', 'Creativity',                            1),
  ('curiosity',              'Wisdom & Knowledge', 'Curiosity',                             2),
  ('judgment',               'Wisdom & Knowledge', 'Judgment',                              3),
  ('love_of_learning',       'Wisdom & Knowledge', 'Love of Learning',                      4),
  ('perspective',            'Wisdom & Knowledge', 'Perspective',                           5),
  ('bravery',                'Courage',            'Bravery',                               6),
  ('perseverance',           'Courage',            'Perseverance',                          7),
  ('honesty',                'Courage',            'Honesty',                               8),
  ('zest',                   'Courage',            'Zest',                                  9),
  ('love',                   'Humanity',           'Love',                                 10),
  ('kindness',               'Humanity',           'Kindness',                             11),
  ('social_intelligence',    'Humanity',           'Social Intelligence',                  12),
  ('teamwork',               'Justice',            'Teamwork',                             13),
  ('fairness',               'Justice',            'Fairness',                             14),
  ('leadership',             'Justice',            'Leadership',                           15),
  ('forgiveness',            'Temperance',         'Forgiveness',                          16),
  ('humility',               'Temperance',         'Humility',                             17),
  ('prudence',               'Temperance',         'Prudence',                             18),
  ('self_regulation',        'Temperance',         'Self-Regulation',                      19),
  ('appreciation_of_beauty', 'Transcendence',      'Appreciation of Beauty & Excellence',  20),
  ('gratitude',              'Transcendence',      'Gratitude',                            21),
  ('hope',                   'Transcendence',      'Hope',                                 22),
  ('humor',                  'Transcendence',      'Humor',                                23),
  ('spirituality',           'Transcendence',      'Spirituality',                         24)
on conflict (id) do nothing;

-- ============================================================================
-- 4. Values lexicon reference table (seed pending captain confirmation)
-- ============================================================================

create table if not exists values_lexicon (
  id text primary key,
  display_label_adult text not null,
  sort_order int not null
);

-- Seed: 36 values from the captain's "Virtues: The Gifts of Character" card
-- (52 items) minus 16 items that overlap with VIA character strengths:
--   * 7 direct word overlaps: Creativity, Forgiveness, Honesty, Humility,
--     Kindness, Love, Perseverance.
--   * 5 obvious conceptual overlaps: Courage (Bravery), Justice (Fairness),
--     Self-Discipline (Self-Regulation), Excellence (Appreciation of Beauty &
--     Excellence), Thankfulness (Gratitude).
--   * 4 strong synonyms: Truthfulness (Honesty), Modesty (Humility),
--     Enthusiasm (Zest), Determination (Perseverance).
insert into values_lexicon (id, display_label_adult, sort_order) values
  ('assertiveness',    'Assertiveness',     1),
  ('caring',           'Caring',            2),
  ('cleanliness',      'Cleanliness',       3),
  ('commitment',       'Commitment',        4),
  ('compassion',       'Compassion',        5),
  ('confidence',       'Confidence',        6),
  ('consideration',    'Consideration',     7),
  ('cooperation',      'Cooperation',       8),
  ('courtesy',         'Courtesy',          9),
  ('detachment',       'Detachment',       10),
  ('diligence',        'Diligence',        11),
  ('flexibility',      'Flexibility',      12),
  ('friendliness',     'Friendliness',     13),
  ('generosity',       'Generosity',       14),
  ('gentleness',       'Gentleness',       15),
  ('helpfulness',      'Helpfulness',      16),
  ('honor',            'Honor',            17),
  ('idealism',         'Idealism',         18),
  ('integrity',        'Integrity',        19),
  ('joyfulness',       'Joyfulness',       20),
  ('loyalty',          'Loyalty',          21),
  ('moderation',       'Moderation',       22),
  ('orderliness',      'Orderliness',      23),
  ('patience',         'Patience',         24),
  ('peacefulness',     'Peacefulness',     25),
  ('purposefulness',   'Purposefulness',   26),
  ('reliability',      'Reliability',      27),
  ('respect',          'Respect',          28),
  ('responsibility',   'Responsibility',   29),
  ('service',          'Service',          30),
  ('tact',             'Tact',             31),
  ('tolerance',        'Tolerance',        32),
  ('trust',            'Trust',            33),
  ('trustworthiness',  'Trustworthiness',  34),
  ('understanding',    'Understanding',    35),
  ('unity',            'Unity',            36)
on conflict (id) do nothing;

-- ============================================================================
-- 5. RLS for reference tables
-- ============================================================================

-- Reference tables are world-readable to any authenticated user (they are
-- canonical lookup data, not user-owned). No write policies — seeded once via
-- migration, edited only by future migrations.
alter table via_character_strengths enable row level security;
alter table values_lexicon enable row level security;

drop policy if exists "via_strengths_readable_authenticated" on via_character_strengths;
create policy "via_strengths_readable_authenticated" on via_character_strengths
  for select using (auth.role() = 'authenticated');

drop policy if exists "values_lexicon_readable_authenticated" on values_lexicon;
create policy "values_lexicon_readable_authenticated" on values_lexicon
  for select using (auth.role() = 'authenticated');
