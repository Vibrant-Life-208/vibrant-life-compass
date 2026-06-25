-- Hero's Compass - Migration: v0.8 aggregates use top-8 / bottom-8
-- Date: 2026-06-24
--
-- Wires the "lowest" insight properly. Before, anchor_aggregates() counted only
-- via_strengths_top_3, so "least chosen" meant "less often in someone's top 3" -
-- it could not show what the community is genuinely LOWEST in. Now strengths are
-- counted two ways:
--   * strength_top    - in a person's top 8 (signature). Falls back to top_3 for
--                       anyone who set strengths manually and never imported.
--   * strength_bottom - in a person's bottom 8 (least-developed; importers only).
-- Values are unchanged (values_top_3); their "least chosen" is the low end of the
-- selection counts.
--
-- Still counts only (no individual selections), guide-only, >=5 suppression.
-- create-or-replace: safe to run over the v0.6 function.

create or replace function public.anchor_aggregates()
returns table (
  scope text, scope_key text, kind text, item_id text, label text, cnt integer, group_size integer
)
language plpgsql
security definer
set search_path = public
as $$
declare v_min constant integer := 5;
begin
  if (select role from profiles where id = auth.uid()) is distinct from 'guide' then
    raise exception 'anchor_aggregates: guides only';
  end if;

  return query
  with base as (
    select p.id,
           p.values_top_3 as vals,
           -- top 8 if imported, else the manual top 3
           coalesce(nullif(p.via_strengths_top_8, '{}'), p.via_strengths_top_3) as strs_top,
           p.via_strengths_bottom_8 as strs_bottom,
           l.studio
    from profiles p
    left join learners l on l.id = p.id
  ),
  has_anchor as (
    select * from base
    where coalesce(array_length(vals, 1), 0) > 0
       or coalesce(array_length(strs_top, 1), 0) > 0
  ),
  school_size as (select count(*)::int n from has_anchor),
  studio_size as (
    select studio, count(*)::int n from has_anchor where studio is not null group by studio
  ),
  sel as (
    select b.id, b.studio, 'value'::text kind, unnest(b.vals) item_id from base b
    union all
    select b.id, b.studio, 'strength_top'::text kind, unnest(b.strs_top) item_id from base b
    union all
    select b.id, b.studio, 'strength_bottom'::text kind, unnest(b.strs_bottom) item_id from base b
  ),
  lex as (
    select 'value'::text kind, vl.id item_id, vl.display_label_adult label from values_lexicon vl
    union all
    select 'strength_top'::text kind, vs.id item_id, vs.display_label_adult label from via_character_strengths vs
    union all
    select 'strength_bottom'::text kind, vs.id item_id, vs.display_label_adult label from via_character_strengths vs
  ),
  school as (
    select 'school'::text scope, null::text scope_key, lex.kind, lex.item_id, lex.label,
           count(s.id)::int cnt, (select n from school_size) group_size
    from lex left join sel s on s.kind = lex.kind and s.item_id = lex.item_id
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
