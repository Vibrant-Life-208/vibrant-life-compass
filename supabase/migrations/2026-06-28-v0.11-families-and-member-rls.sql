-- Hero's Compass - Migration: v0.11 family login + member access
-- Date: 2026-06-28
--
-- One shared login per family, then a "Who's exploring?" member picker. Each
-- member (parent or learner) is an ordinary profile; the family login just acts
-- as the chosen member. This means a family's auth.uid() must be able to read +
-- write the rows of its members - which the existing self-only RLS forbids
-- (every policy keys on auth.uid() = id). This migration adds the family tables
-- and the scoped policies that grant a family login access to EXACTLY its own
-- members and nothing else.
--
-- SECURITY NOTE (minors' data): the new write policies let a family login write
-- its members' profiles/goals/etc. That is the intended capability (a parent
-- operating the household login). Scope is bounded by family_members.family_id =
-- auth.uid(); no family can reach another family's rows. Recommend a TCC review
-- (Tutela/Worf) before applying to production.
--
-- Existing per-person logins are unaffected: every original policy still stands;
-- these are additional permissive policies that only widen access for a family's
-- own auth.uid().

-- ── Tables ────────────────────────────────────────────────────────────────
-- The family login IS an auth user; families.id is that user's id (mirrors how
-- profiles.id = the person's auth user id). Members never log in directly.
create table if not exists families (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  username text unique not null,
  created_at timestamptz default now()
);

create table if not exists family_members (
  family_id uuid not null references families(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('parent','learner')),
  display_name text not null,
  sort int not null default 0,
  primary key (family_id, profile_id)
);
create index if not exists family_members_profile_idx on family_members(profile_id);

alter table families enable row level security;
alter table family_members enable row level security;

-- A family reads its own row + its own membership list.
drop policy if exists "families_self_read" on families;
create policy "families_self_read" on families
  for select using (id = auth.uid());

drop policy if exists "family_members_self_read" on family_members;
create policy "family_members_self_read" on family_members
  for select using (family_id = auth.uid());

-- ── Extend learner visibility to a family's learner members ─────────────────
-- year_quotes / year_traits / goals / tasks / check_ins / logins / learners all
-- read through this view, so extending it grants the family READ access to its
-- learner members' data with no per-table change.
create or replace view my_visible_learners as
  select id as learner_id from learners where id = auth.uid()
  union
  select learner_id from parent_learner_link where parent_id = auth.uid()
  union
  select learner_id from guide_learner_assignment where guide_id = auth.uid()
  union
  select profile_id as learner_id from family_members
    where family_id = auth.uid() and kind = 'learner';

-- ── Profiles: family reads + writes its members' profiles ───────────────────
-- Member profiles (parents AND learners) hold values_freetext, via_strengths_*,
-- quote, etc. The family login records each member's values + character
-- strengths into their own profile row.
drop policy if exists "profiles_family_read" on profiles;
create policy "profiles_family_read" on profiles for select
  using (id in (select profile_id from family_members where family_id = auth.uid()));

drop policy if exists "profiles_family_write" on profiles;
create policy "profiles_family_write" on profiles for update
  using (id in (select profile_id from family_members where family_id = auth.uid()))
  with check (id in (select profile_id from family_members where family_id = auth.uid()));

-- ── Family writes for a learner member's owned tables ───────────────────────
-- Mirrors each table's existing *_write policy (learner_id = auth.uid()) but
-- scoped to the family's learner members. Parents have no rows in these tables
-- (their data lives on profiles), so 'learner' kind is sufficient.
create or replace view my_family_learners as
  select profile_id as learner_id from family_members
    where family_id = auth.uid() and kind = 'learner';

drop policy if exists "learners_family_write" on learners;
create policy "learners_family_write" on learners for update
  using (id in (select learner_id from my_family_learners))
  with check (id in (select learner_id from my_family_learners));

drop policy if exists "year_quotes_family_write" on year_quotes;
create policy "year_quotes_family_write" on year_quotes for all
  using (learner_id in (select learner_id from my_family_learners))
  with check (learner_id in (select learner_id from my_family_learners));

drop policy if exists "year_traits_family_write" on year_traits;
create policy "year_traits_family_write" on year_traits for all
  using (learner_id in (select learner_id from my_family_learners))
  with check (learner_id in (select learner_id from my_family_learners));

drop policy if exists "goals_family_write" on goals;
create policy "goals_family_write" on goals for all
  using (learner_id in (select learner_id from my_family_learners))
  with check (learner_id in (select learner_id from my_family_learners));

drop policy if exists "tasks_family_write" on tasks;
create policy "tasks_family_write" on tasks for all
  using (learner_id in (select learner_id from my_family_learners))
  with check (learner_id in (select learner_id from my_family_learners));

drop policy if exists "check_ins_family_write" on check_ins;
create policy "check_ins_family_write" on check_ins for all
  using (learner_id in (select learner_id from my_family_learners))
  with check (learner_id in (select learner_id from my_family_learners));

drop policy if exists "logins_family_write" on logins;
create policy "logins_family_write" on logins for all
  using (learner_id in (select learner_id from my_family_learners))
  with check (learner_id in (select learner_id from my_family_learners));

-- ── Identity-column protection (TCC review 2026-06-28: Worf + Tutela) ────────
-- profiles_family_write (and the pre-existing profiles_self) are row-scoped, not
-- column-scoped: they would let a family login - or a learner on themselves -
-- rewrite role / email / id. Tending a member's values is allowed; redefining
-- who a member IS is not. This trigger makes role/email/id immutable to any
-- non-service write (self OR family), while the service_role seed path can still
-- set them at INSERT. must_change_password stays writable (a person clears their
-- own forced reset). Closes the family escalation surface AND the pre-existing
-- self-escalation hole. (Worf's binding condition for v0.11.)
create or replace function protect_profile_identity_columns()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and (
       new.role  is distinct from old.role
    or new.email is distinct from old.email
    or new.id    is distinct from old.id
  ) then
    raise exception 'profiles.role/email/id are not user-writable (TCC v0.11)';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_identity on profiles;
create trigger trg_protect_profile_identity
  before update on profiles
  for each row execute function protect_profile_identity_columns();

-- Verify after applying (anon probe should 200 once columns/tables exist):
--   curl -s "$SUPABASE_URL/rest/v1/families?select=id&limit=1" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $ANON"  -> 200 (RLS yields [])
--   curl -s "$SUPABASE_URL/rest/v1/family_members?select=family_id&limit=1" ... -> 200
