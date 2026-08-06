-- v0.38 - guide_name_for_studio: resolve a learner's guide DISPLAY NAME without
-- exposing the guide's profile row.
--
-- WHY: The 2026-08-05 fleet meeting decided the climb/onboarding copy should name
-- the real guide of the learner's tribe (Rose for Discovery, Ben for Adventure)
-- instead of a generic "your guide" - but ONLY as a witness/receiver label, never
-- impersonated, and without leaking the guide's private data. profiles is self-only
-- + same-family readable (profiles_self / profiles_family_read); a learner CANNOT
-- read a guide's row, so a client-side `select * from profiles where role='guide'`
-- returns [] for a learner and the name never resolves. A wider RLS SELECT policy
-- would over-expose the guide (email, quote, VIA strengths, foundations) to their
-- learners. Instead: a SECURITY DEFINER function that returns ONLY the name, and
-- only when EXACTLY ONE guide runs the studio (mirrors the client's studio-match /
-- generic-fallback rule; 0 or >1 -> null -> the copy keeps the generic, non-shaming
-- "your guide"). Mirrors the public.anchor_aggregates() / studio_practice_pulse()
-- definer-function pattern (public schema so it is callable via PostgREST rpc).
--
-- EXPOSURE (TCC note): any authenticated user may call guide_name_for_studio('adventure')
-- and learn "Ben". This is roster-level information a learner already holds about their
-- own school's studios; the function returns a bare name string and nothing else - no
-- id, email, anchor, or practice data. Scoped deliberately to name-only.
--
-- STATUS: DRAFT - review then apply. Safe to run standalone (adds one function; no
-- table or policy rewrites). The client (guideForStudio in supabase-adapter.js)
-- degrades to the generic "your guide" until this is applied, so nothing breaks
-- pre-migration.

begin;

create or replace function public.guide_name_for_studio(p_studio text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  -- count() and max() in one pass over the matched guides: when exactly one guide
  -- runs p_studio, max(name) is that guide's name; 0 or >1 matches -> null.
  select case when count(*) = 1 then max(p.name) end
  from profiles p
  where p.role = 'guide'
    and p.tribes @> array[p_studio];
$$;

-- Signed-in users only; anon would resolve auth-less anyway, revoke for defense in
-- depth. Mirrors anchor_aggregates() grants.
revoke all on function public.guide_name_for_studio(text) from public, anon;
grant execute on function public.guide_name_for_studio(text) to authenticated;

commit;

-- VERIFY after apply:
--   * As a Discovery learner: select public.guide_name_for_studio('discovery') -> 'Rose'.
--   * As an Adventure learner: select public.guide_name_for_studio('adventure') -> 'Ben'.
--   * A studio with 0 or 2+ guides -> null (copy shows generic "your guide").
--   * The function returns ONLY a name - confirm no other guide column is reachable
--     through it.
