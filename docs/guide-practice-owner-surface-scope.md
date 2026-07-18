# Scope — Guide "Your Practice" + Owner "Tending the Studio"

> Build scope for the guide-skill reflection surface and the owner cultivation
> surface, in Compass. Grounds the 2026-07-18 fleet-meeting design in Compass's
> real account model, RLS, and suppression patterns.
>
> **Status: DRAFT.** The migration (§4) must not be applied until the privacy
> architecture is ratified by Naomi (G1 gate-holder) and a TCC voice (Worf /
> Tutela), per the fleet meeting's hard gates. This mirrors Compass's own
> "DRAFT — do NOT apply standalone" migration discipline (see v0.16).

---

## 1. What this is

Two coupled surfaces, one backend, one wall:

- **Guide — "Your Practice"** (guide login): a private reflection surface on the
  twelve Key Characteristics of a learner-driven Socratic guide (+ a thirteenth,
  "let the studio change you"). Self-named crossings, no scores/tiers/ranks/bars.
  A working, browser-verified UX prototype exists in `vibrant-life-guides`
  (`js/practice.js`) — it becomes the **reference**; production lives here.
- **Owner — "Tending the Studio"** (owner home, Jenna & Wes): their *own*
  disappearing-practice (owners are guides too) + an anonymized culture-bloom +
  offer-to-commons. No route to any individual guide's reflections.

Design source: `agents/meetings/2026/07/2026-07-18-guide-socratic-skills-surface.md`
(evoke-agents-backup). The twelve+one characteristics and their being/doing/prompt
content are defined verbatim in the prototype's `FAMILIES` / `CENTER_STAR`.

## 2. Why Compass (not a new backend)

Compass already ships every hard primitive:

| Need | Compass already has |
|---|---|
| Guide + owner identity | Four-login model; `is_owner` + `tribes` on `profiles` (v0.14) |
| The G1 privacy wall | RLS per-user access at the DB layer (threat model: "insider abuse", "peer surveillance") |
| Anonymized aggregates | `≥5-learner suppression`, `private.*` `SECURITY DEFINER` funcs (v0.16), `anchor_aggregates()` |
| Authorization hardening | `is_owner`/`tribes` are service-role-only columns (v0.14, Worf) |
| Commons / sharing | `everyone_posts` table (reuse for offer-to-commons) |
| Dual backend | `store.js` → `supabase-adapter.js` / `local-store.js` |

The owner culture-bloom is a **natural extension of the reviewed ≥N-suppression
pattern**, not a new risk surface.

## 3. The gates (carried from the meeting, in Compass terms)

- **G1 — the wall (Naomi, hard gate).** No owner or peer route to an individual
  guide's crossings, *ever*. Enforced at the DB layer by RLS self-only read on
  `guide_crossings` and by the culture-bloom being a `private` `SECURITY DEFINER`
  aggregate that returns counts only — never `story`, `moment`, or `guide_id`.
- **G2 — no ranking (Accord).** Counts, never ranks; no cross-guide comparison;
  the bloom offers, never judges — no "culture health" verdict.
- **G3 — lexicon (Hoshi).** score/rank/top/ahead/behind/leaderboard/level appear
  nowhere in either surface.
- **G4 — somatic (Chapel/McCoy).** Breathing glyphs, no bars/meters/count-ups;
  silence-default, one soft witness-tone on a self-named crossing (frontend).

## 4. Data model (migration v0.24 — DRAFT)

**`guide_crossings`** — a guide's private reflections. RLS **self-only**.
```
id            uuid  pk default gen_random_uuid()
guide_id      uuid  not null references profiles(id) on delete cascade
characteristic text not null            -- 'c1'..'c13'
story         text  not null            -- the guide's own words (private)
moment        text  default ''          -- optional private note
created_at    timestamptz not null default now()
```
RLS: select/insert/update/delete all `using (guide_id = auth.uid())`. **No owner
path. No peer path. No visible-set membership.** This is the wall. **`story` and
`moment` are encrypted at rest** as AES-GCM envelopes (client-side, via
`js/crypto.js` — the external-password envelope) — ratified 2026-07-18 by Worf +
Tutela because `moment` can hold a child's name, and child-adjacent free text must
not sit plaintext behind RLS alone. `characteristic` + `created_at` stay plaintext
(the bloom reads only those).

**`profiles.share_practice_pulse boolean default false`** — the guide's *opt-in*
to contribute an anonymized signal to their studio's bloom. **User-writable by the
guide on their own row** (it is consent to share *their own* signal, grants no
power over others — unlike `is_owner`, so it does NOT join the service-role-only
set). Default off: nothing is derived from a guide who hasn't opted in.

**`public.studio_practice_pulse(tribe text)`** — `SECURITY DEFINER`, `stable`,
`search_path=public`, in the **`public`** schema (the owner client calls it over
RPC, like `anchor_aggregates()` — `private` would be unreachable; Geordi, ratified
2026-07-18). Safe on the API surface: definer + role-gated + revoked from anon. Returns
`setof (characteristic text, guides int)`:
- counts **distinct opted-in guides** (`share_practice_pulse = true`) in `tribe`
  who have ≥1 crossing on that characteristic in the current season (last 90d);
- **suppresses** any characteristic with `guides < N` (see open decision §7);
- never returns `story`, `moment`, or `guide_id`.
- callable only by an owner (`is_owner`) or a guide for a tribe they run; grants
  mirror `anchor_aggregates()` (revoke from public/anon; grant to authenticated).

**Offer-to-commons:** reuse `everyone_posts` (no new table) for owner→guide
launches/stories. Offer, never assign.

## 5. Backend adapter (both `supabase-adapter.js` and `local-store.js`)

New functions, same names in both adapters (Compass's dual-adapter rule):
`addCrossing`, `getCrossings(characteristic?)`, `deleteCrossing(id)`,
`setSharePracticePulse(bool)`, `getSharePracticePulse()`, `getStudioPracticePulse(tribe)`.

## 6. Frontend

- **Guide "Your Practice"** — port `vibrant-life-guides/js/practice.js` onto the
  adapter + Compass design system: the five-constellation sky, stations
  (being-mirror + doing-witness), self-named crossing with the pause and the soft
  tone, dormant→tended→living breathing glyphs, present-mode. Add a quiet
  **share-pulse opt-in** ("contribute an anonymized signal to your studio's bloom
  — never your words, never your name"). New guide-dashboard section `practice.js`.
- **Owner "Tending the Studio"** — a section of owner home:
  - *My Compass* — the owner's own Practice sky (reuse the guide component).
  - *The culture's bloom* — `getStudioPracticePulse`; **graceful degradation**:
    if fewer than N opted-in contributors, show no counts — instead Accord's
    offer ("your studio is small — the bloom needs more gardeners before it can
    stay anonymous; here's a practice you might model"). Better an empty bloom
    than a de-anonymized one.
  - *Offer to the commons* — post a launch/story via `everyone_posts`.

## 7. Decisions (resolved at 2026-07-18 ratification unless noted)

1. **Suppression threshold N — RESOLVED: 3, with graceful degradation** (Naomi +
   Accord). Below 3 opted-in guides the bloom is empty and the owner UI shows the
   offer-not-judge message. Stricter per-characteristic floor (never show a count
   < 3) also ratified.
2. **Reflection at rest — RESOLVED: encrypt `story` + `moment`** (Worf + Tutela),
   AES-GCM via `js/crypto.js`; `moment` can hold a child's name, so RLS alone is
   insufficient against insider/DB-compromise. Reverses the earlier plaintext
   recommendation.
3. **Function schema — RESOLVED: `public`, not `private`** (Geordi) — client-called
   RPC must be reachable.
4. **Season window.** 90 days (matches the glyph "this season"). Confirm.
5. **Nav placement** of Practice in the guide dashboard and owner home.
6. **Standing condition (Naomi).** Any future migration reading `guide_crossings`
   must preserve self-only-or-suppressed-aggregate and return to the privacy panel.

## 8. Build sequence

1. **Ratify §4 privacy architecture** — Naomi (G1) + Worf/Tutela (TCC). Dry-run in
   a transaction per v0.16 discipline. *Gate: no apply before this.*
2. Migration v0.24 (table + RLS + column + suppressed aggregate + grants).
3. Adapter functions (both adapters).
4. Guide "Your Practice" UI (port prototype).
5. Owner "Tending the Studio" UI.
6. Update `SECURITY.md` (guide-reflection = guide-private, RLS self-only; bloom =
   suppressed aggregate) and `ARCHITECTURE.md` (new surface, new tables).

---

*Scope authored 2026-07-18. Reference prototype: `vibrant-life-guides/js/practice.js`
(browser-verified). Meeting: `evoke-agents-backup/agents/meetings/2026/07/2026-07-18-guide-socratic-skills-surface.md`.*
