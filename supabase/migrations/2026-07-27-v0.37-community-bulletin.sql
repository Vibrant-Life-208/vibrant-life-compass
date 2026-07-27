-- v0.37: community bulletin.
--
-- Learners submit community ideas ("start a chess club", "volunteer at the shelter").
-- A learner's post is reviewed by their GUIDE, then by the OWNER (two gates, per the
-- vision), and once posted it becomes the bulletin board every learner can see. A
-- guide may also deny with a note. Low-sensitivity content (community ideas), so the
-- status TRANSITIONS themselves are enforced in the app/adapter; RLS enforces WHO may
-- see and touch a row (learner = own + the posted board; guide = roster; owner = all).
--
-- learner_id -> learners(id): a learner's own auth.uid() equals their learner row id
-- (learners.id is FK'd 1:1 to profiles.id), so `learner_id = auth.uid()` is the learner
-- themselves. Reviewer ids are guides/owners (profiles), not learners.

create table if not exists community_posts (
  id uuid primary key default uuid_generate_v4(),
  learner_id uuid not null references learners(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  status text not null default 'pending_guide'
    check (status in ('pending_guide', 'pending_owner', 'posted', 'denied')),
  guide_note text,
  guide_reviewed_by uuid references profiles(id) on delete set null,
  guide_reviewed_at timestamptz,
  owner_reviewed_by uuid references profiles(id) on delete set null,
  owner_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_status_idx on community_posts (status);
create index if not exists community_posts_learner_idx on community_posts (learner_id);

alter table community_posts enable row level security;
grant select, insert, update on community_posts to authenticated;

-- Learner: submit own idea.
drop policy if exists "cp_insert_own" on community_posts;
create policy "cp_insert_own" on community_posts for insert
  with check (learner_id = auth.uid());

-- Read: your own submissions (any status), the posted board (everyone), plus what
-- staff may review (guide -> their roster; owner -> all).
drop policy if exists "cp_select" on community_posts;
create policy "cp_select" on community_posts for select
  using (
    learner_id = auth.uid()
    or status = 'posted'
    or learner_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_owner = true)
  );

-- Guide: review a roster learner's post (approve -> pending_owner, or deny with a note).
drop policy if exists "cp_update_guide" on community_posts;
create policy "cp_update_guide" on community_posts for update
  using (learner_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid()))
  with check (learner_id in (select learner_id from guide_learner_assignment where guide_id = auth.uid()));

-- Owner: the final gate (pending_owner -> posted), any learner.
drop policy if exists "cp_update_owner" on community_posts;
create policy "cp_update_owner" on community_posts for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_owner = true))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_owner = true));
