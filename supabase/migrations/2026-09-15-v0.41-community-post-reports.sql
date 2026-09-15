-- v0.41: community post reports (blocker #3 - "report / remove with a path back", Winona).
--
-- A posted note can clear both human gates and still turn out to harm someone. This adds a
-- learner-facing REPORT path: any learner who can see the board may flag a POSTED note for staff
-- to look at. Reports are INSERT-ONLY for learners into their own rows (reporter_id = auth.uid()),
-- and readable only by staff (guide -> their roster's posts; owner -> all). Reporting does NOT
-- change the post's status or hide it - it only surfaces the note to the owner, who decides whether
-- to take it down (community_posts status 'removed', v0.40). This is deliberately not a cross-row
-- update to community_posts (no learner can touch another learner's post row); a report is its own
-- row, which keeps the RLS clean.
--
-- NOTE (Tutela wall-walk): this introduces new RLS. It must be walked in the running system before
-- the board lifts - part of the owed RLS-on-the-board perimeter check.

create table if not exists community_post_reports (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references community_posts(id) on delete cascade,
  reporter_id uuid not null default auth.uid() references profiles(id) on delete cascade,
  reason text check (reason is null or char_length(reason) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists cpr_post_idx on community_post_reports (post_id);

alter table community_post_reports enable row level security;
grant select, insert on community_post_reports to authenticated;
grant delete on community_post_reports to authenticated; -- owner-only dismiss, gated by policy below

-- Learner: report a POSTED note (their own report row). Can only file against a post that is live.
drop policy if exists "cpr_insert_own" on community_post_reports;
create policy "cpr_insert_own" on community_post_reports for insert
  with check (
    reporter_id = auth.uid()
    and exists (select 1 from community_posts cp where cp.id = post_id and cp.status = 'posted')
  );

-- Read: staff only (a reporter does not need to read reports back; learners never see them).
-- Guide -> reports on their roster's posts; owner -> all.
drop policy if exists "cpr_select_staff" on community_post_reports;
create policy "cpr_select_staff" on community_post_reports for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.is_owner = true)
    or exists (
      select 1 from community_posts cp
      join guide_learner_assignment gla on gla.learner_id = cp.learner_id
      where cp.id = post_id and gla.guide_id = auth.uid()
    )
  );

-- Owner: dismiss a report (delete the row) once handled.
drop policy if exists "cpr_delete_owner" on community_post_reports;
create policy "cpr_delete_owner" on community_post_reports for delete
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_owner = true));
