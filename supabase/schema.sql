-- Hero's Compass - Supabase schema
-- Per Decision 5 of the 2026-05-11 fleet meeting (Geordi + Lux).
-- Run this in Supabase SQL editor once on a fresh project.
--
-- Privacy scope per the meeting: each learner's data is visible to:
--   - the learner themselves
--   - their linked parents
--   - their assigned guides
-- Peer learners do not see each other's goals, journals, or passwords.
-- The everyone_posts table is the only shared surface.

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "uuid-ossp";

-- ============================================================================
-- Roles & profiles
-- ============================================================================

-- Profile linked to auth.users. Each authenticated person (learner, parent,
-- guide) has one profile row. The 'role' column determines their permissions.
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('learner', 'parent', 'guide')),
  name text,
  email text,
  created_at timestamptz default now()
);

-- Learners are profiles where role='learner', plus extra learner-only fields.
create table learners (
  id uuid primary key references profiles(id) on delete cascade,
  studio text not null check (studio in ('sparks', 'discovery', 'adventure', 'launchpad')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Parent <-> learner association. Many-to-many supports shared custody and
-- multi-child families.
create table parent_learner_link (
  parent_id uuid references profiles(id) on delete cascade,
  learner_id uuid references learners(id) on delete cascade,
  primary key (parent_id, learner_id),
  created_at timestamptz default now()
);

-- Guide <-> learner assignment. Many-to-many supports learners with multiple
-- guides (Core guide + Pathway guide, for example).
create table guide_learner_assignment (
  guide_id uuid references profiles(id) on delete cascade,
  learner_id uuid references learners(id) on delete cascade,
  primary key (guide_id, learner_id),
  created_at timestamptz default now()
);

-- ============================================================================
-- Learner content
-- ============================================================================

-- Year-level motivational quote, anchor for the year (Decision: lock until S7)
create table year_quotes (
  learner_id uuid primary key references learners(id) on delete cascade,
  text text not null,
  locked_until_session int default 7,
  updated_at timestamptz default now()
);

-- Year-level character traits (3-5 traits anchoring the learner's year)
create table year_traits (
  learner_id uuid primary key references learners(id) on delete cascade,
  traits text[] not null default '{}',
  updated_at timestamptz default now()
);

-- Goals. Scope is either 'year' (one per category for the year) or
-- 'session' (one per category per session 1-7).
create table goals (
  id uuid primary key default uuid_generate_v4(),
  learner_id uuid not null references learners(id) on delete cascade,
  category_id text not null,  -- 'khan', 'lexia', 'civ', etc.
  scope text not null check (scope in ('year', 'session')),
  session_index int check (session_index between 1 and 7),
  text text not null,
  status text not null default 'active' check (status in ('active', 'done', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_goals_learner on goals(learner_id);
create index idx_goals_scope on goals(learner_id, scope, session_index);

-- Tasks. Per-day journal entries with movable plannedFor dates.
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  learner_id uuid not null references learners(id) on delete cascade,
  goal_id uuid references goals(id) on delete set null,
  category_id text,
  text text not null,
  planned_for date not null,
  status text not null default 'open' check (status in ('open', 'done')),
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_tasks_learner_date on tasks(learner_id, planned_for);

-- Check-ins. Per-goal observation records, future use.
create table check_ins (
  id uuid primary key default uuid_generate_v4(),
  learner_id uuid not null references learners(id) on delete cascade,
  goal_id uuid references goals(id) on delete cascade,
  session_index int,
  mark text,
  note text,
  created_at timestamptz default now()
);
create index idx_check_ins_learner on check_ins(learner_id);

-- Logins (external service credentials). Password is encrypted client-side
-- with the learner's local key. Server only stores ciphertext + IV.
-- Per Decision 4: server never receives plaintext.
create table logins (
  id uuid primary key default uuid_generate_v4(),
  learner_id uuid not null references learners(id) on delete cascade,
  kind text not null default 'core' check (kind in ('core', 'passion', 'other')),
  service text not null,
  username text,
  password_ct text,  -- base64 ciphertext (AES-GCM 256)
  password_iv text,  -- base64 IV
  url text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_logins_learner on logins(learner_id);

-- Everyone Page posts. The only learner-visible-to-other-learners surface.
-- Per Decision: guides post directly; learner submissions require guide review
-- (review state to be enforced at app layer).
create table everyone_posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references profiles(id) on delete set null,
  author_role text not null check (author_role in ('learner', 'parent', 'guide')),
  author_name text not null,
  body text not null,
  status text not null default 'published' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table profiles enable row level security;
alter table learners enable row level security;
alter table parent_learner_link enable row level security;
alter table guide_learner_assignment enable row level security;
alter table year_quotes enable row level security;
alter table year_traits enable row level security;
alter table goals enable row level security;
alter table tasks enable row level security;
alter table check_ins enable row level security;
alter table logins enable row level security;
alter table everyone_posts enable row level security;

-- Profile: each user reads/writes their own profile only.
create policy "profiles_self" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Helper view: which learners can the current auth.uid() see?
-- Returns learner_id rows for: the learner themselves, their parents,
-- and their assigned guides.
create or replace view my_visible_learners as
  select id as learner_id from learners where id = auth.uid()
  union
  select learner_id from parent_learner_link where parent_id = auth.uid()
  union
  select learner_id from guide_learner_assignment where guide_id = auth.uid();

-- Learners: visible per my_visible_learners; writes only by self.
create policy "learners_read" on learners
  for select using (id in (select learner_id from my_visible_learners));
create policy "learners_write_self" on learners
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Year quotes, traits, goals, tasks, check_ins, logins all follow the same
-- visibility pattern: visible to learner + parents + guides.
-- Writes restricted to the learner themselves.

create policy "year_quotes_read" on year_quotes for select
  using (learner_id in (select learner_id from my_visible_learners));
create policy "year_quotes_write" on year_quotes for all
  using (learner_id = auth.uid()) with check (learner_id = auth.uid());

create policy "year_traits_read" on year_traits for select
  using (learner_id in (select learner_id from my_visible_learners));
create policy "year_traits_write" on year_traits for all
  using (learner_id = auth.uid()) with check (learner_id = auth.uid());

create policy "goals_read" on goals for select
  using (learner_id in (select learner_id from my_visible_learners));
create policy "goals_write" on goals for all
  using (learner_id = auth.uid()) with check (learner_id = auth.uid());

create policy "tasks_read" on tasks for select
  using (learner_id in (select learner_id from my_visible_learners));
create policy "tasks_write" on tasks for all
  using (learner_id = auth.uid()) with check (learner_id = auth.uid());

create policy "check_ins_read" on check_ins for select
  using (learner_id in (select learner_id from my_visible_learners));
create policy "check_ins_write" on check_ins for all
  using (learner_id = auth.uid()) with check (learner_id = auth.uid());

create policy "logins_read" on logins for select
  using (learner_id in (select learner_id from my_visible_learners));
create policy "logins_write" on logins for all
  using (learner_id = auth.uid()) with check (learner_id = auth.uid());

-- Parent and guide assignments: readable by all parties involved.
create policy "parent_link_read" on parent_learner_link for select
  using (parent_id = auth.uid() or learner_id = auth.uid());
create policy "guide_assignment_read" on guide_learner_assignment for select
  using (guide_id = auth.uid() or learner_id = auth.uid());

-- Everyone posts: readable by all authenticated users; only guides can
-- publish directly; learners and parents may create with status='pending'.
create policy "everyone_posts_read" on everyone_posts for select
  using (auth.uid() is not null and status = 'published');
create policy "everyone_posts_guide_publish" on everyone_posts for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );
create policy "everyone_posts_learner_submit" on everyone_posts for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('learner', 'parent'))
    and status = 'pending'
  );

-- ============================================================================
-- Updated-at triggers
-- ============================================================================
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger learners_touch before update on learners
  for each row execute function touch_updated_at();
create trigger year_quotes_touch before update on year_quotes
  for each row execute function touch_updated_at();
create trigger year_traits_touch before update on year_traits
  for each row execute function touch_updated_at();
create trigger goals_touch before update on goals
  for each row execute function touch_updated_at();
create trigger tasks_touch before update on tasks
  for each row execute function touch_updated_at();
create trigger logins_touch before update on logins
  for each row execute function touch_updated_at();
