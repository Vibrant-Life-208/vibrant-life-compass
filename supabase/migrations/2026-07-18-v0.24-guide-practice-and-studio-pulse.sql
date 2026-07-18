-- Hero's Compass — Migration: v0.24 guide practice + studio pulse
-- Date: 2026-07-18
--
-- STATUS: RATIFIED WITH CHANGES (privacy panel 2026-07-18 — Naomi, Worf, Tutela,
-- Accord, Geordi). The three required changes are applied: (1) function moved
-- private→public so the owner client can call it (Geordi); (2) story+moment
-- encrypted at rest as AES-GCM envelopes, client-side (Worf/Tutela — moment can
-- hold a child's name); (3) v_min=3 + graceful degradation confirmed (Naomi/Accord).
-- Still apply on a prod-in-a-transaction dry run and reconcile with schema.sql
-- first (v0.16 discipline). STANDING CONDITION (Naomi): any future migration that
-- adds a policy/view/function reading guide_crossings must preserve
-- self-only-or-suppressed-aggregate and return to this panel.
--
-- WHAT: the guide "Your Practice" surface and the owner "Tending the Studio"
-- culture-bloom. Design source:
--   evoke-agents-backup/agents/meetings/2026/07/2026-07-18-guide-socratic-skills-surface.md
--   docs/guide-practice-owner-surface-scope.md
--
-- THE WALL (G1). A guide's reflections are private to that guide, enforced at the
-- DB layer:
--   1. guide_crossings has a SELF-ONLY RLS read policy (guide_id = auth.uid()).
--      No owner path, no peer path, no visible-set membership. An owner literally
--      cannot select another guide's crossing — the same insider-abuse mitigation
--      the SECURITY.md threat model already relies on.
--   2. The owner/guide culture-bloom is a private SECURITY DEFINER aggregate that
--      returns COUNTS ONLY — never story, never moment, never guide_id — with a
--      suppression floor. It reads the table as definer (like visible_learner_ids
--      / anchor_aggregates) but can only ever emit anonymized, suppressed counts.
--
-- Two OPEN DECISIONS are marked inline for the ratifiers (search "OPEN DECISION").

begin;

-- ── guide_crossings: a guide's private, self-named reflections ──────────────
create table if not exists guide_crossings (
  id             uuid primary key default gen_random_uuid(),
  guide_id       uuid not null references profiles(id) on delete cascade,
  characteristic text not null,           -- 'c1'..'c13' (see practice.js FAMILIES/CENTER_STAR) — PLAINTEXT (feeds the aggregate)
  story          text not null,           -- the guide's own words — JSON-serialized AES-GCM envelope, opaque to the DB (see below)
  moment         text not null default '', -- optional private note — JSON-serialized AES-GCM envelope, opaque to the DB (see below)
  created_at     timestamptz not null default now()  -- PLAINTEXT (feeds the aggregate)
);

create index if not exists guide_crossings_guide_idx
  on guide_crossings (guide_id, characteristic, created_at desc);

-- RESOLVED (TCC ratification 2026-07-18, Worf + Tutela — REQUIRED CHANGE):
-- `story` and `moment` are ENCRYPTED AT REST as AES-GCM envelopes, written
-- client-side via the existing js/crypto.js (the same envelope external-service
-- passwords use). RLS defends user-to-user; it does NOT defend against the
-- insider-abuse / DB-compromise threats SECURITY.md names — and `moment` invites
-- a CHILD'S NAME ("a child or moment you want to remember"). Child-adjacent free
-- text must not sit plaintext behind RLS alone. The DB stores an opaque text
-- envelope; only `characteristic` + `created_at` stay plaintext, and the bloom
-- reads ONLY those two, so encryption costs the aggregate nothing.
-- Obligation lands on the adapter + UI (encrypt on write, decrypt on read).

alter table guide_crossings enable row level security;

-- SELF-ONLY. This single policy is the wall: a row is readable/writable only by
-- the guide who authored it. There is deliberately NO owner or peer read path.
create policy "guide_crossings_self" on guide_crossings
  for all using (guide_id = auth.uid()) with check (guide_id = auth.uid());

-- ── opt-in to contribute an anonymized signal to the studio bloom ───────────
-- User-writable by the guide on their own row (via profiles_self). Unlike is_owner
-- (v0.14), this grants NO power over others — it is consent to share one's own
-- anonymized signal — so it is intentionally NOT added to the service-role-only
-- identity-trigger set. Default false: nothing is derived from a non-opted guide.
alter table profiles
  add column if not exists share_practice_pulse boolean not null default false;

-- ── the culture bloom: a suppressed, anonymized aggregate ───────────────────
-- Returns per-characteristic counts of DISTINCT opted-in guides in a tribe who
-- have reflected on that characteristic this season. Never story, never guide_id.
-- Lives in `public` because the OWNER CLIENT calls it over RPC (like
-- anchor_aggregates) — NOT `private`, which is off the API surface and only for
-- RLS-internal helpers (Geordi, TCC ratification 2026-07-18: a private function
-- would be unreachable by the client — a correctness blocker, now fixed). Safe
-- on the API surface because it is SECURITY DEFINER, role-gated, and revoked from
-- anon. Definer + pinned search_path so it cannot be hijacked by a caller-set path.
create or replace function public.studio_practice_pulse(p_tribe text)
returns table (characteristic text, guides int, group_size int)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  -- RESOLVED (Naomi + Accord, ratification 2026-07-18): the suppression floor is
  -- 3, WITH graceful degradation — below 3 opted-in guides the bloom returns an
  -- EMPTY set and the owner UI shows Accord's offer-not-judge message ("your
  -- studio is small — the bloom needs more gardeners before it can stay
  -- anonymous"). Better an empty bloom than a de-anonymized one. The stricter
  -- per-characteristic floor (below) is also ratified.
  v_min constant int := 3;
begin
  -- Authorization: caller must TEND this tribe — an owner (any tribe) or a guide
  -- who runs it. Owner = role='guide' + is_owner=true (v0.14). Mirrors the role
  -- gate in anchor_aggregates(). RESOLVED (Geordi, 2026-07-18): owners who opt in
  -- and run the tribe DO count in the bloom — an owner practicing is part of the
  -- studio's culture, and excluding them shrinks an already-tiny pool.
  if not exists (
    select 1 from profiles
    where id = auth.uid()
      and role = 'guide'
      and (is_owner or p_tribe = any(tribes))
  ) then
    raise exception 'studio_practice_pulse: caller does not tend this tribe';
  end if;

  return query
  with opted as (               -- opted-in guides who run this tribe
    select p.id
    from profiles p
    where p.role = 'guide'
      and p_tribe = any(p.tribes)
      and p.share_practice_pulse = true
  ),
  gsize as (select count(*)::int n from opted),
  season as (                   -- distinct (guide, characteristic) this season (90d)
    select distinct gc.guide_id, gc.characteristic
    from guide_crossings gc
    join opted o on o.id = gc.guide_id
    where gc.created_at >= now() - interval '90 days'
  ),
  per_char as (                 -- distinct opted-in guides per characteristic
    select s.characteristic, count(*)::int cnt
    from season s
    group by s.characteristic
  )
  select pc.characteristic, pc.cnt, (select n from gsize)
  from per_char pc
  where (select n from gsize) >= v_min   -- studio big enough to anonymize at all
    and pc.cnt >= v_min;                  -- never reveal a small count. Stricter
                                          -- than anchor_aggregates (which shows all
                                          -- counts once group>=min) — deliberate,
                                          -- given the tiny guide pool. Ratifiers:
                                          -- confirm this stricter rule.
end;
$$;

-- Only signed-in users may call it; anon (null auth.uid()) fails the role gate
-- anyway. Mirrors anchor_aggregates() grants.
revoke all on function public.studio_practice_pulse(text) from public, anon;
grant execute on function public.studio_practice_pulse(text) to authenticated;

commit;

-- ── Verify after applying ───────────────────────────────────────────────────
-- 1. Self-only wall (as guide A, try to read guide B's crossing → 0 rows):
--    curl -s "$SUPABASE_URL/rest/v1/guide_crossings?select=story&guide_id=eq.<B>" \
--      -H "apikey: $ANON" -H "Authorization: Bearer $A_JWT"        -> []
-- 2. Bloom is counts-only + suppressed, and client-reachable over RPC (as owner):
--    curl -s "$SUPABASE_URL/rest/v1/rpc/studio_practice_pulse" -X POST \
--      -H "apikey: $ANON" -H "Authorization: Bearer $OWNER_JWT" \
--      -H "Content-Type: application/json" -d '{"p_tribe":"discovery"}'
--      -> rows of (characteristic,guides,group_size) with guides>=3 only; [] if studio < 3
-- 3. Opt-in is self-writable, is_owner still protected:
--    update profiles set share_practice_pulse=true where id=auth.uid();  -> ok
--    update profiles set is_owner=true where id=auth.uid();              -> raises (TCC v0.14)
