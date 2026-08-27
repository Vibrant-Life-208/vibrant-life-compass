-- Hero's Compass - Migration: v0.39 password_resets audit table
-- Date: 2026-08-24
-- Status: DRAFT-FOR-TCC (Phase 2 guide password reset). Additive only - safe to
-- apply ahead of the Edge Functions, but only USEFUL once Components 1 & 2 write
-- to it. Spec: docs/phase2-guide-password-reset-spec.md (Component 3).
--
-- WHY: today a password reset on the Supabase backend runs through
-- scripts/bulk-import.mjs --reset holding the service_role key in a shell, and it
-- leaves NO app-layer record of who reset whom. For a school of minor accounts,
-- "which adult changed this child's credential, and when" must be answerable in
-- the app, not only from shell history / Supabase Auth logs. (Salus, 2026-08-23
-- guide-account review: flat, unlogged reset power is a safeguarding gap.)
--
-- This table is the accountability record. It NEVER stores a password, temp or
-- otherwise - only the actor, the subject, the action, and the time.

create table if not exists password_resets (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id) on delete set null,   -- who performed it
  subject_id  uuid references profiles(id) on delete set null,   -- whose password
  action      text not null check (action in ('reset', 'self-change')),
  -- which path authorized it (TCC F7, 2026-08-26): 'roster' = a guide reset a learner on
  -- their roster; 'owner' = an owner cross-roster reset (a whole-school capability - must be
  -- distinguishable for oversight); 'self' = a self-change. Nullable for forward-compat.
  via         text check (via in ('roster', 'owner', 'self')),
  created_at  timestamptz not null default now()
  -- NO secret column, ever. If a future migration wants to add one, it is wrong.
);

-- Durability over referential tidiness: actor_id / subject_id are nullable with
-- ON DELETE SET NULL (not cascade) so a later account deletion can never DESTROY
-- the audit row - the event (an action happened at a time) outlives the identities.
-- This refines the spec's "not null references" toward audit-log durability.

create index if not exists password_resets_subject_idx on password_resets (subject_id, created_at desc);
create index if not exists password_resets_actor_idx   on password_resets (actor_id, created_at desc);

alter table password_resets enable row level security;

-- READ: the subject may see their own reset history; an owner may see all (audit
-- oversight). Owner = role='guide' + is_owner=true (v0.14). A non-owner guide may
-- NOT read another subject's rows - scoped, per Salus.
drop policy if exists "password_resets_read" on password_resets;
create policy "password_resets_read" on password_resets for select
  using (
    subject_id = auth.uid()
    or exists (
      select 1 from profiles
      where id = auth.uid() and role = 'guide' and is_owner = true
    )
  );

-- WRITE: none from clients. No insert / update / delete policy exists, so with RLS
-- enabled the only writer is the service_role (the Edge Functions of Components 1
-- & 2), which bypasses RLS. Append-only by construction: nothing, not even an
-- owner, may edit or delete an audit row through the API.

-- Lock the table down to authenticated readers only; anon gets nothing.
revoke all on table password_resets from anon;
grant select on table password_resets to authenticated;

-- Verify after applying (run against a live project, paste output into a verification log):
--   as an owner JWT:      select count(*) from password_resets;                 -> succeeds
--   as a non-owner guide: select * from password_resets where subject_id <> auth.uid(); -> [] (0 rows)
--   as any authed JWT:    insert into password_resets(actor_id,subject_id,action)
--                           values (auth.uid(), auth.uid(), 'reset');           -> denied (no insert policy)
--   as anon:              select * from password_resets;                        -> denied
