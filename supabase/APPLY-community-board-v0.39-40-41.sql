-- =============================================================================
-- APPLY: Community Board migrations v0.39 + v0.40 + v0.41 (paste into Supabase SQL Editor).
-- Built 2026-09-15. All three are idempotent (IF [NOT] EXISTS / drop-if-exists), so this is
-- safe to run even if v0.39/v0.40 were already applied. Run as ONE block, in this order.
-- After running, the community board's rich fields, 'removed' takedown status, and the
-- community_post_reports table + RLS all exist. The board stays DARK behind ?commboard=on
-- until the go-live checklist (docs/design/community-board-go-live-checklist.md) clears.
-- =============================================================================

begin;

-- ---------- v0.39 : rich bulletin columns ----------
-- v0.39: richer community bulletin (cork-board form + poster).
--
-- Extends v0.37's community_posts with the fields the extended submission form collects,
-- plus a rendered poster image. Poster handling is client-side: the learner uploads a PDF,
-- the app renders its first page to a downscaled JPEG on-device and stores that image as a
-- data URL here (no Supabase Storage bucket, no original PDF retained - see connection.js /
-- community-board.js). This keeps the file off any server and the board self-contained.
--
-- All new columns are NULLABLE so existing rows and the legacy (flag-off) single-field
-- insert path stay valid. The app enforces which fields are required on the rich form.
-- RLS is unchanged: v0.37's row-level policies already govern who may see/insert/update a
-- row, and they cover these columns without change.

alter table community_posts add column if not exists title text
  check (title is null or char_length(title) between 1 and 120);
alter table community_posts add column if not exists category text
  check (category is null or category in ('club', 'volunteer', 'event', 'other'));
alter table community_posts add column if not exists when_where text
  check (when_where is null or char_length(when_where) <= 200);
alter table community_posts add column if not exists contact text
  check (contact is null or char_length(contact) <= 120);
-- Rendered poster: a downscaled JPEG data URL (data:image/jpeg;base64,...). Capped well
-- above a ~700px-wide q0.7 first-page render (~40-150KB) but bounded so a row can't grow
-- without limit; the app also caps the source PDF and the output dimensions before store.
alter table community_posts add column if not exists poster_image text
  check (poster_image is null or char_length(poster_image) <= 600000);

-- ---------- v0.40 : 'removed' takedown status ----------
-- v0.40: add a 'removed' status so a posted note can be taken down (Salus condition).
--
-- The v0.37 status check allowed pending_guide / pending_owner / posted / denied. A take-down
-- needs a distinct terminal state so a note leaves the public board (getPostedBoard filters
-- status = 'posted') without reading to the learner as "denied / not this time". The owner review
-- surface (owner.js) sets 'removed'; RLS is unchanged (the owner update policy already permits it).

alter table community_posts drop constraint if exists community_posts_status_check;
alter table community_posts add constraint community_posts_status_check
  check (status in ('pending_guide', 'pending_owner', 'posted', 'denied', 'removed'));

-- ---------- v0.41 : community_post_reports table + RLS ----------
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

commit;
