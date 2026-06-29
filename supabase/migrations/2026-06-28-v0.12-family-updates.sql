-- Hero's Compass - Migration: v0.12 family updates (learner -> family sharing)
-- Date: 2026-06-28
--
-- Learner-initiated sharing, so parents get a calm window without helicoptering.
-- A learner shares either a goal celebration or a periodic note; it lands in the
-- family's updates feed, which the parent surface shows alongside the family
-- values/strengths view. Receive-only by design: parents do not reply or react
-- in-app (captain decision 2026-06-28). Nothing about streaks, reminders, or
-- incomplete work is ever written here - only what the learner chose to share.
--
-- NOTE (honest scope, for TCC): the family login is a single shared credential,
-- so RLS cannot cryptographically separate "parent" from "learner" intent. The
-- receive-only-for-parents rule is a UI contract on the parent surface, not an
-- RLS boundary. RLS here bounds the data to the family (no cross-family reach)
-- and to the family's own learner members as authors.

create table if not exists family_updates (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references families(id) on delete cascade,
  learner_id uuid not null references profiles(id) on delete cascade, -- the learner who shared
  kind text not null check (kind in ('goal', 'note')),
  body text not null check (char_length(body) between 1 and 500), -- bounded (TCC v0.12, Worf)
  created_at timestamptz default now()
);
create index if not exists family_updates_family_idx on family_updates(family_id, created_at desc);

alter table family_updates enable row level security;

-- The family reads its own updates feed.
drop policy if exists "family_updates_read" on family_updates;
create policy "family_updates_read" on family_updates for select
  using (family_id = auth.uid());

-- A learner (acting through the family login) shares their own update. Bounded to
-- the family's own learner members via the v0.11 my_family_learners view.
drop policy if exists "family_updates_insert" on family_updates;
create policy "family_updates_insert" on family_updates for insert
  with check (family_id = auth.uid()
    and learner_id in (select learner_id from my_family_learners));

-- A learner can retract something they shared (the parent UI offers no delete).
drop policy if exists "family_updates_delete" on family_updates;
create policy "family_updates_delete" on family_updates for delete
  using (family_id = auth.uid()
    and learner_id in (select learner_id from my_family_learners));

-- No UPDATE policy: a shared update is immutable; a learner can only retract it.

-- Verify after applying (anon probe should 200 once the table exists):
--   curl -s "$SUPABASE_URL/rest/v1/family_updates?select=id&limit=1" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $ANON"  -> 200 (RLS yields [])
