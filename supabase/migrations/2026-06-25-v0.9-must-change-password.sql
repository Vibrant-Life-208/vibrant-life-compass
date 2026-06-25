-- Hero's Compass - Migration: v0.9 forced password change on first sign-in
-- Date: 2026-06-25
--
-- Accounts created by the bulk import (or reset by a guide) get a random temp
-- password and must_change_password = true. On first sign-in the app stops the
-- user at a "set your own password" screen before the app loads; once they set
-- it, the flag clears and the temp password no longer works.
--
-- Self-managed: a person updates their own password (auth.updateUser) and clears
-- their own flag under the existing profiles_self RLS (auth.uid() = id).

alter table profiles
  add column if not exists must_change_password boolean not null default false;
