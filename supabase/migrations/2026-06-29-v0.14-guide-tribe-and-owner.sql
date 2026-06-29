-- Hero's Compass - Migration: v0.14 guide tribe + owner flag
-- Date: 2026-06-29
--
-- The four-login model (captain 2026-06-29): a GUIDE sees their own tribe (the
-- studio they run) + whole-school insights; the OWNER (Jenna) sees whole school +
-- every tribe + her family. Two attributes carry that:
--   tribe    - the studio a guide runs (sparks|discovery|adventure|launchpad|tot)
--   is_owner - true only for the school owner; widens insight scope to all tribes
--
-- SECURITY (TCC v0.14, Worf): is_owner is an authorization attribute - if a guide
-- (or anyone) could set it on their own profile via the self-write policy, they
-- would self-grant whole-school visibility. So is_owner AND tribe join role/email/
-- id as service-role-only columns, enforced by extending the v0.11 identity trigger.

alter table profiles
  add column if not exists tribe text,
  add column if not exists is_owner boolean not null default false;

-- Replace the v0.11 trigger function to also protect is_owner + tribe. The trigger
-- binding (trg_protect_profile_identity) from v0.11 stays; only the body changes.
create or replace function protect_profile_identity_columns()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and (
       new.role     is distinct from old.role
    or new.email    is distinct from old.email
    or new.id       is distinct from old.id
    or new.is_owner is distinct from old.is_owner
    or new.tribe    is distinct from old.tribe
  ) then
    raise exception 'profiles.role/email/id/is_owner/tribe are not user-writable (TCC v0.14)';
  end if;
  return new;
end;
$$;

-- Verify after applying (anon probe should 200; column exists):
--   curl -s "$SUPABASE_URL/rest/v1/profiles?select=tribe,is_owner&limit=1" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $ANON"  -> 200
