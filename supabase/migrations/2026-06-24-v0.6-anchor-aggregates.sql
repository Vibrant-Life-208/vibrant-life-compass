-- Hero's Compass - Migration: v0.6 anchor aggregates (guide insights)
-- Date: 2026-06-24
-- Refs: agents/meetings/2026/06/2026-06-24-compass-onboarding-cant-reach-next-page.md
--
-- Lets guides see which values + character strengths are most/least chosen, by
-- studio (the "tribe") and school-wide. PRIVACY BY CONSTRUCTION:
--   * Returns COUNTS ONLY - never which person chose what. No individual row is
--     ever exposed; the per-person profiles_self RLS is untouched.
--   * SECURITY DEFINER so it can aggregate across profiles, but it FIRST checks
--     the caller is a guide and raises otherwise.
--   * Small-group suppression: a scope (school, or a studio) is only returned
--     when it has >= 5 contributing people, so a count can't re-identify a child.
--   * Studio scope is learners-only by nature (only learners have a studio);
--     school scope includes everyone with an anchor (learners + guides + parents)
--     per the 2026-06-24 captain decision.
--
-- Every value/strength in the lexicon is returned with its count (0 if no one
-- chose it) so "least chosen" can include never-selected items.

create or replace function public.anchor_aggregates()
returns table (
  scope text,        -- 'school' | 'studio'
  scope_key text,    -- null for school; studio name for studio
  kind text,         -- 'value' | 'strength'
  item_id text,
  label text,
  cnt integer,       -- number of people who chose this item in this scope
  group_size integer -- contributing people in this scope (for context + suppression)
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_min constant integer := 5;
begin
  -- Guides only. Anyone else gets nothing (not even an empty aggregate).
  if (select role from profiles where id = auth.uid()) is distinct from 'guide' then
    raise exception 'anchor_aggregates: guides only';
  end if;

  return query
  with base as (
    select p.id, p.values_top_3 as vals, p.via_strengths_top_3 as strs, l.studio
    from profiles p
    left join learners l on l.id = p.id
  ),
  has_anchor as (
    select * from base
    where coalesce(array_length(vals, 1), 0) > 0
       or coalesce(array_length(strs, 1), 0) > 0
  ),
  school_size as (select count(*)::int n from has_anchor),
  studio_size as (
    select studio, count(*)::int n from has_anchor
    where studio is not null group by studio
  ),
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
    from lex
    left join sel s on s.kind = lex.kind and s.item_id = lex.item_id
    group by lex.kind, lex.item_id, lex.label
  ),
  studios as (
    select 'studio'::text scope, ss.studio scope_key, lex.kind, lex.item_id, lex.label,
           count(s.id)::int cnt, ss.n group_size
    from studio_size ss
    cross join lex
    left join sel s on s.kind = lex.kind and s.item_id = lex.item_id and s.studio = ss.studio
    where ss.n >= v_min
    group by ss.studio, ss.n, lex.kind, lex.item_id, lex.label
  )
  select * from school where (select n from school_size) >= v_min
  union all
  select * from studios;
end;
$$;

-- Callable by any signed-in user; the body restricts to guides. Never anon.
revoke all on function public.anchor_aggregates() from public, anon;
grant execute on function public.anchor_aggregates() to authenticated;
