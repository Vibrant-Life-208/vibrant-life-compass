-- v0.33 — UI variant flag (Phase 0 strangler-fig rollout)
-- Authored 2026-07-22 (Compass rebuild, Phase 0 Task C). ADDITIVE + no-op enrollment:
-- every existing row defaults to 'legacy', so applying this enrolls NO ONE.
-- DO NOT run without captain review. Self-only via the existing profiles_self RLS.

begin;

alter table profiles
  add column if not exists ui_variant text not null default 'legacy';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_ui_variant_check'
  ) then
    alter table profiles
      add constraint profiles_ui_variant_check
      check (ui_variant in ('legacy','observatory','auto'));
  end if;
end $$;

commit;

-- VERIFY (expect every row 'legacy'):
--   select ui_variant, count(*) from profiles group by ui_variant;
--
-- ROLLBACK:
--   alter table profiles drop constraint if exists profiles_ui_variant_check;
--   alter table profiles drop column if exists ui_variant;
