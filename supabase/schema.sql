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
  -- Year-level anchor: quote + vision + character strengths + values.
  -- Held on profiles (not learners) so guides, parents, and learners all
  -- have a single place to store their own anchor. Per Decisions 1+2+3 of
  -- the 2026-06-16 meeting. The values_top_3 and via_strengths_top_3 arrays
  -- are constrained at the app layer to ids from values_lexicon and
  -- via_character_strengths respectively.
  quote_text text not null default '',
  quote_vision text not null default '',
  quote_locked_until_session int default 7,
  -- The cycle (year_calendar.yearStartISO) the current quote_text was written
  -- for. When it differs from the current cycle, the person is re-prompted for a
  -- fresh quote next year. See the 2026-06-24 v0.4 migration.
  quote_cycle text not null default '',
  -- "Who said it" + "what it means to you", captured in the quote flow and shown
  -- with the quote on North. See the 2026-06-24 v0.5 migration.
  quote_author text not null default '',
  quote_note text not null default '',
  values_top_3 text[] not null default '{}',
  via_strengths_top_3 text[] not null default '{}',
  -- v0.3 horizon cascade + onboarding resume pointer. Per the 2026-06-22 fleet
  -- meeting. Held on profiles so each person's vision is private to them via the
  -- profiles_self policy (self-only); cross-role sharing, if ever built, must be
  -- additive + learner-initiated, never a default. See the 2026-06-22 migration.
  -- The telescoping life-vision steps (3-7 of the first-run cascade):
  vision_beyond_5yr text not null default '',
  vision_within_5yr text not null default '',
  vision_within_1yr text not null default '',
  -- Person-level "where you are now" + "halfway point". Named to echo the
  -- per-goal baseline / halfway concepts (same idea, different altitude); not
  -- overloaded onto the goal columns.
  current_state text not null default '',
  halfway_state text not null default '',
  -- Resume pointer: which step the person lands on next. The enum is the
  -- canonical flow order. 'breath' = body-first door; 'complete' = gate receded.
  onboarding_step text not null default 'breath'
    check (onboarding_step in (
      'breath', 'strengths', 'values', 'beyond_5yr', 'within_5yr',
      'within_1yr', 'current_state', 'halfway', 'complete'
    )),
  -- Steps the person said "not now" to (a positive, honored skip, not failure).
  onboarding_skipped text[] not null default '{}',
  -- Null until the cascade is walked once (set even if steps were skipped).
  onboarding_completed_at timestamptz,
  -- Bumped on every save so "right where you left off" stays fresh.
  onboarding_updated_at timestamptz default now(),
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

-- Year-level motivational quote + 1-year vision statement.
-- (vision added 2026-05-13 pedagogy addition - the protagonist statement
-- alongside the motivational quote and the character traits.)
-- Lock until S7.
create table year_quotes (
  learner_id uuid primary key references learners(id) on delete cascade,
  text text not null default '',
  vision text not null default '',
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
-- Partner links (accountability partnerships between learners)
-- ============================================================================
create table partner_links (
  id uuid primary key default uuid_generate_v4(),
  proposer_id uuid not null references learners(id) on delete cascade,
  partner_id uuid not null references learners(id) on delete cascade,
  status text not null default 'proposed'
    check (status in ('proposed', 'accepted', 'declined', 'dissolved')),
  proposed_at timestamptz default now(),
  responded_at timestamptz,
  dissolved_at timestamptz,
  check (proposer_id <> partner_id)
);
create index idx_partner_links_proposer on partner_links(proposer_id);
create index idx_partner_links_partner on partner_links(partner_id);
create index idx_partner_links_status on partner_links(status);

-- ============================================================================
-- Year plans (learner submits for partner sign-off)
-- ============================================================================
create table year_plans (
  id uuid primary key default uuid_generate_v4(),
  learner_id uuid not null references learners(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'returned', 'superseded')),
  submitted_at timestamptz default now(),
  approver_id uuid references learners(id) on delete set null,
  approved_at timestamptz,
  note text default ''
);
create index idx_year_plans_learner on year_plans(learner_id);
create index idx_year_plans_status on year_plans(status);

-- ============================================================================
-- Notifications (year-plan-approved, milestone-shared, partner-proposal, etc.)
-- ============================================================================
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  from_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  read_at timestamptz
);
create index idx_notifications_recipient on notifications(recipient_id, read_at);
create index idx_notifications_recipient_created on notifications(recipient_id, created_at desc);

-- ============================================================================
-- Reference tables: VIA character strengths and values lexicon
-- ============================================================================

-- Canonical 24 VIA character strengths organized into 6 virtue categories.
-- Source: viacharacter.org/character-strengths. Per Decision 2 of the
-- 2026-06-16 meeting, the onboarding selection surface reads from this table
-- so capture is constrained to the canonical vocabulary.
create table via_character_strengths (
  id text primary key,
  virtue_category text not null,
  display_label_adult text not null,
  sort_order int not null
);

insert into via_character_strengths (id, virtue_category, display_label_adult, sort_order) values
  ('creativity',             'Wisdom & Knowledge', 'Creativity',                            1),
  ('curiosity',              'Wisdom & Knowledge', 'Curiosity',                             2),
  ('judgment',               'Wisdom & Knowledge', 'Judgment',                              3),
  ('love_of_learning',       'Wisdom & Knowledge', 'Love of Learning',                      4),
  ('perspective',            'Wisdom & Knowledge', 'Perspective',                           5),
  ('bravery',                'Courage',            'Bravery',                               6),
  ('perseverance',           'Courage',            'Perseverance',                          7),
  ('honesty',                'Courage',            'Honesty',                               8),
  ('zest',                   'Courage',            'Zest',                                  9),
  ('love',                   'Humanity',           'Love',                                 10),
  ('kindness',               'Humanity',           'Kindness',                             11),
  ('social_intelligence',    'Humanity',           'Social Intelligence',                  12),
  ('teamwork',               'Justice',            'Teamwork',                             13),
  ('fairness',               'Justice',            'Fairness',                             14),
  ('leadership',             'Justice',            'Leadership',                           15),
  ('forgiveness',            'Temperance',         'Forgiveness',                          16),
  ('humility',               'Temperance',         'Humility',                             17),
  ('prudence',               'Temperance',         'Prudence',                             18),
  ('self_regulation',        'Temperance',         'Self-Regulation',                      19),
  ('appreciation_of_beauty', 'Transcendence',      'Appreciation of Beauty & Excellence',  20),
  ('gratitude',              'Transcendence',      'Gratitude',                            21),
  ('hope',                   'Transcendence',      'Hope',                                 22),
  ('humor',                  'Transcendence',      'Humor',                                23),
  ('spirituality',           'Transcendence',      'Spirituality',                         24);

-- Values lexicon: 36 values from the "Virtues: The Gifts of Character" card
-- (52 items) minus 16 items that overlap with VIA character strengths
-- (7 direct word, 5 conceptual, 4 synonym - full list documented in the
-- 2026-06-17 migration file).
create table values_lexicon (
  id text primary key,
  display_label_adult text not null,
  sort_order int not null
);

insert into values_lexicon (id, display_label_adult, sort_order) values
  ('assertiveness',    'Assertiveness',     1),
  ('caring',           'Caring',            2),
  ('cleanliness',      'Cleanliness',       3),
  ('commitment',       'Commitment',        4),
  ('compassion',       'Compassion',        5),
  ('confidence',       'Confidence',        6),
  ('consideration',    'Consideration',     7),
  ('cooperation',      'Cooperation',       8),
  ('courtesy',         'Courtesy',          9),
  ('detachment',       'Detachment',       10),
  ('diligence',        'Diligence',        11),
  ('flexibility',      'Flexibility',      12),
  ('friendliness',     'Friendliness',     13),
  ('generosity',       'Generosity',       14),
  ('gentleness',       'Gentleness',       15),
  ('helpfulness',      'Helpfulness',      16),
  ('honor',            'Honor',            17),
  ('idealism',         'Idealism',         18),
  ('integrity',        'Integrity',        19),
  ('joyfulness',       'Joyfulness',       20),
  ('loyalty',          'Loyalty',          21),
  ('moderation',       'Moderation',       22),
  ('orderliness',      'Orderliness',      23),
  ('patience',         'Patience',         24),
  ('peacefulness',     'Peacefulness',     25),
  ('purposefulness',   'Purposefulness',   26),
  ('reliability',      'Reliability',      27),
  ('respect',          'Respect',          28),
  ('responsibility',   'Responsibility',   29),
  ('service',          'Service',          30),
  ('tact',             'Tact',             31),
  ('tolerance',        'Tolerance',        32),
  ('trust',            'Trust',            33),
  ('trustworthiness',  'Trustworthiness',  34),
  ('understanding',    'Understanding',    35),
  ('unity',            'Unity',            36);

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
alter table partner_links enable row level security;
alter table year_plans enable row level security;
alter table notifications enable row level security;
alter table via_character_strengths enable row level security;
alter table values_lexicon enable row level security;

-- Reference tables: world-readable to any authenticated user (canonical
-- lookup data, no user-owned rows). No write policies.
create policy "via_strengths_readable_authenticated" on via_character_strengths
  for select using (auth.role() = 'authenticated');
create policy "values_lexicon_readable_authenticated" on values_lexicon
  for select using (auth.role() = 'authenticated');

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

-- Partner links: readable by either party (proposer OR partner).
-- Insert: only proposer can create a proposal for themselves.
-- Update: either party can update status (e.g., partner accepts/declines,
-- proposer dissolves, etc.). App layer enforces which transitions are valid.
create policy "partner_links_read" on partner_links for select
  using (proposer_id = auth.uid() or partner_id = auth.uid());
create policy "partner_links_insert" on partner_links for insert
  with check (proposer_id = auth.uid());
create policy "partner_links_update" on partner_links for update
  using (proposer_id = auth.uid() or partner_id = auth.uid())
  with check (proposer_id = auth.uid() or partner_id = auth.uid());

-- Year plans: readable by the learner, their parents, their guides, and
-- their accepted partner. Insert: only the learner. Update: the partner
-- (for approval / returning) or the learner (to supersede).
create policy "year_plans_read" on year_plans for select
  using (
    learner_id in (select learner_id from my_visible_learners)
    or exists (
      select 1 from partner_links pl
      where pl.status = 'accepted'
        and (
          (pl.proposer_id = year_plans.learner_id and pl.partner_id = auth.uid())
          or (pl.partner_id = year_plans.learner_id and pl.proposer_id = auth.uid())
        )
    )
  );
create policy "year_plans_insert_self" on year_plans for insert
  with check (learner_id = auth.uid());
create policy "year_plans_update_learner_or_partner" on year_plans for update
  using (
    learner_id = auth.uid()
    or exists (
      select 1 from partner_links pl
      where pl.status = 'accepted'
        and (
          (pl.proposer_id = year_plans.learner_id and pl.partner_id = auth.uid())
          or (pl.partner_id = year_plans.learner_id and pl.proposer_id = auth.uid())
        )
    )
  );

-- Notifications: recipient reads + marks-read their own. Any authenticated
-- user can insert (the app enforces which sender/recipient pairs are valid).
create policy "notifications_read_self" on notifications for select
  using (recipient_id = auth.uid());
create policy "notifications_insert_any" on notifications for insert
  with check (auth.uid() is not null);
create policy "notifications_update_self" on notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Everyone posts: readable by all authenticated users; only guides can
-- publish directly; learners and parents may create with status='pending'.
-- author_id must equal auth.uid() to prevent impersonation.
-- Updates restricted to guides (for moderation: pending -> published / rejected).
create policy "everyone_posts_read" on everyone_posts for select
  using (auth.uid() is not null and status = 'published');
create policy "everyone_posts_guide_publish" on everyone_posts for insert
  with check (
    author_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and role = 'guide')
  );
create policy "everyone_posts_learner_submit" on everyone_posts for insert
  with check (
    author_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and role in ('learner', 'parent'))
    and status = 'pending'
  );
create policy "everyone_posts_guide_moderate" on everyone_posts for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'guide'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'guide'));

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

-- Guide insights: privacy-preserving anchor aggregates (counts only, guide-only,
-- small-group suppressed >=5). See 2026-06-24 v0.6 migration for full notes.
create or replace function public.anchor_aggregates()
returns table (scope text, scope_key text, kind text, item_id text, label text, cnt integer, group_size integer)
language plpgsql security definer set search_path = public as $$
declare v_min constant integer := 5;
begin
  if (select role from profiles where id = auth.uid()) is distinct from 'guide' then
    raise exception 'anchor_aggregates: guides only';
  end if;
  return query
  with base as (
    select p.id, p.values_top_3 as vals, p.via_strengths_top_3 as strs, l.studio
    from profiles p left join learners l on l.id = p.id
  ),
  has_anchor as (
    select * from base where coalesce(array_length(vals,1),0) > 0 or coalesce(array_length(strs,1),0) > 0
  ),
  school_size as (select count(*)::int n from has_anchor),
  studio_size as (select studio, count(*)::int n from has_anchor where studio is not null group by studio),
  sel as (
    select b.id, b.studio, 'value'::text kind, unnest(b.vals) item_id from base b
    union all
    select b.id, b.studio, 'strength'::text kind, unnest(b.strs) item_id from base b
  ),
  lex as (
    select 'value'::text kind, vl.id item_id, vl.display_label_adult label from values_lexicon vl
    union all
    select 'strength'::text kind, vs.id item_id, vs.display_label_adult label from via_character_strengths vs
  ),
  school as (
    select 'school'::text scope, null::text scope_key, lex.kind, lex.item_id, lex.label,
           count(s.id)::int cnt, (select n from school_size) group_size
    from lex left join sel s on s.kind=lex.kind and s.item_id=lex.item_id
    group by lex.kind, lex.item_id, lex.label
  ),
  studios as (
    select 'studio'::text scope, ss.studio scope_key, lex.kind, lex.item_id, lex.label,
           count(s.id)::int cnt, ss.n group_size
    from studio_size ss cross join lex
    left join sel s on s.kind=lex.kind and s.item_id=lex.item_id and s.studio=ss.studio
    where ss.n >= v_min
    group by ss.studio, ss.n, lex.kind, lex.item_id, lex.label
  )
  select * from school where (select n from school_size) >= v_min
  union all select * from studios;
end;
$$;
revoke all on function public.anchor_aggregates() from public, anon;
grant execute on function public.anchor_aggregates() to authenticated;
