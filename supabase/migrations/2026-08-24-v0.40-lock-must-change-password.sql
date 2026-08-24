-- Hero's Compass - Migration: v0.40 lock must_change_password against client writes
-- Date: 2026-08-24
-- Status: DRAFT-FOR-TCC (Phase 2 guide password reset). Spec Component 2.
--
-- !!! ORDERING IS LOAD-BEARING !!!
-- Apply this ONLY AFTER the set-my-password Edge Function is deployed AND the client
-- has been switched to call it for the forced-change flow. If you apply this while
-- the client still clears the flag directly (js/backend/supabase-adapter.js:832),
-- first-time users get STUCK on the change-password screen with no way to clear the
-- flag. Deploy functions -> switch client -> THEN apply this. (See functions/README.md.)
--
-- WHY: must_change_password was deliberately left client-writable (v0.11 line 130)
-- so a user could clear their own forced reset. But the app clears it as a separate
-- client PATCH, uncoupled from the actual password change - so a user holding an
-- admin-issued temp password can PATCH the flag off WITHOUT changing the password,
-- keeping a credential every staff member has seen. Verified 2026-08-23 (5-agent
-- guide-account review, Lux). The fix moves the clear into set-my-password (which
-- only clears AFTER setting a new password), then locks the column here so no client
-- can clear it directly. The service_role (Edge Functions) still writes it freely.
--
-- This re-defines protect_profile_identity_columns() to add must_change_password to
-- the guarded set. All other guarded columns (role/email/id/is_owner/tribes) are
-- unchanged from v0.14.

create or replace function protect_profile_identity_columns()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and (
       new.role                 is distinct from old.role
    or new.email                is distinct from old.email
    or new.id                   is distinct from old.id
    or new.is_owner             is distinct from old.is_owner
    or new.tribes               is distinct from old.tribes
    or new.must_change_password is distinct from old.must_change_password
  ) then
    raise exception 'profiles.role/email/id/is_owner/tribes/must_change_password are not user-writable (TCC v0.40)';
  end if;
  return new;
end;
$$;

-- The trigger binding itself is unchanged (created in v0.11, body swapped in v0.14);
-- re-create defensively so this migration is self-contained if run standalone.
drop trigger if exists trg_protect_profile_identity on profiles;
create trigger trg_protect_profile_identity
  before update on profiles
  for each row execute function protect_profile_identity_columns();

-- Verify after applying (run against a live project, paste output into a verification log):
--   as any user JWT holding a temp password:
--     update profiles set must_change_password = false where id = auth.uid();  -> RAISES (bypass closed)
--   via set-my-password Edge Function (sets a real new password first):
--     flag clears, temp password stops working, audit row 'self-change' written.  -> succeeds
