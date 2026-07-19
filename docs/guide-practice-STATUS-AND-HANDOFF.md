# Guide Practice + Owner Bloom — Status & Handoff

> The single place to understand where the **guide "Your Practice"** surface and the
> **owner "Tending the Studio"** bloom stand. Written for future-you (and Jenna).
> Companion to `guide-practice-owner-surface-scope.md` (the design) and the fleet
> meeting minutes (the reasoning).

**Last updated:** 2026-07-19

---

## 1. Status at a glance — SHIPPED & LIVE (2026-07-19)

| Thing | State |
|---|---|
| Deploy | **LIVE on `main`** — merged and deployed via Vercel. |
| Migration `v0.24` | **Applied to prod** (idempotent; re-runnable). Confirmed live. |
| Guide "Your Practice" | Live (a tab in the guide dashboard). |
| Owner "Tending the Studio" | Live (owner-home card). Shows "still gathering" — see §10. |
| Guide "School" tab (bonus) | Live — whole-school anchor insights, relocated from the buried bottom of My Learners. Role-aware, ≥5 suppressed. |

> **How it shipped:** the `feat/guide-practice-surface` branch (guide surface,
> owner bloom, migration, docs) merged to `main`, then the "School" tab landed via
> a parallel session's commit. This repo takes **direct, parallel commits to `main`**
> from multiple sessions — always `git fetch` and compare against `origin/main`
> (your *local* `main` goes stale) before assuming anything.

---

## 2. What this is

Two coupled surfaces for Vibrant Life (owners: **Jenna & Wes Jones**):

- **Guide "Your Practice"** (a tab in the guide dashboard) — a private reflection
  surface on the twelve Key Characteristics of a learner-driven Socratic guide, plus
  a thirteenth center star ("let the studio change you"). Self-named "crossings,"
  breathing glyphs (dormant→tended→living), present-mode for hard seasons.
  **Not a badge system** — no scores, tiers, ranks, or leaderboards, by design
  (governing law: characteristic #10, process over results).
- **Owner "Tending the Studio"** (a card on the owner home) — an anonymized,
  suppressed **culture bloom**: counts of how many guides are returning to each
  characteristic this season. Never a name, never a verdict. The owner's own
  practice lives under **My Compass → Practice**.

Design source: `agents/meetings/2026/07/2026-07-18-guide-socratic-skills-surface.md`
(in `evoke-agents-backup`). Scope: `docs/guide-practice-owner-surface-scope.md`.

---

## 3. The privacy guarantees (ratified 2026-07-18)

Ratified by a fleet privacy panel — Naomi (G1), Worf + Tutela (TCC), Accord, Geordi.

- **The wall — guide reflections are guide-private.** RLS **self-only** on
  `guide_crossings` (`guide_id = auth.uid()`). No owner path, no peer path. An owner
  — including Jenna and Wes — literally cannot read another guide's crossing.
- **Encrypted at rest.** `story` + `moment` are AES-GCM envelopes (same as external
  passwords), enforced at the store-adapter boundary. The `moment` field invites a
  child's name, so it must not sit plaintext behind RLS alone.
- **The bloom is counts-only + suppressed.** `public.studio_practice_pulse(tribe)`
  returns per-characteristic counts of distinct opted-in guides — never text, names,
  or ids. Floor `v_min = 3`; below 3 opted-in guides it returns empty and the UI
  shows the "still gathering" message (better empty than de-anonymized).
- **Opt-in.** `profiles.share_practice_pulse` (default false). Nothing is derived
  from a guide who hasn't opted in.
- **Standing condition (Naomi):** any future migration that reads `guide_crossings`
  must preserve self-only-or-suppressed-aggregate and go back to the privacy panel.

---

## 4. Where the code lives

- `js/practice.js` — guide surface (render + crossings + present-mode + witness tone)
  and `characteristicLabel()` used by the owner bloom.
- `js/owner.js` — the "Tending the Studio" card + `renderOwnerStudio` / `renderStudioBlooms`.
- `js/crypto.js` — `encryptField` / `decryptField` (the field-at-rest chokepoint).
- `js/backend/{supabase-adapter,local-store}.js` — `addCrossing`, `getCrossings`,
  `deleteCrossing`, `get/setSharePracticePulse`, `getStudioPracticePulse`.
- `js/store.js` — facade exports for the above.
- `js/app.js` — guide `practice-view` tab entry + dispatch.
- `index.html` — `#practice-view` container + `#crossing-overlay`.
- `css/style.css` — practice + bloom styles (scoped under `#practice-view` / `#crossing-overlay`).
- `supabase/migrations/2026-07-18-v0.24-...sql` — the schema.

---

## 5. Migration — how to confirm it's live

`v0.24` appears already applied in prod (a second apply hit 42710; it's now
idempotent). Confirm in the Supabase SQL editor:

```sql
select count(*) from guide_crossings;                                  -- table exists
select proname from pg_proc where proname = 'studio_practice_pulse';   -- function exists
select 1 from information_schema.columns
  where table_name='profiles' and column_name='share_practice_pulse';  -- column exists
```

Sanity — guides need `tribes` set to appear in / view a studio bloom (private
practice works regardless):

```sql
select name, tribes, is_owner, share_practice_pulse from profiles where role='guide';
```

If `v0.24` is NOT applied, paste the migration file into the SQL editor and run
(it's a single `begin;`/`commit;` transaction, safe to re-run).

---

## 6. Merge — what it looks like

- The branch adds **only** the guide-practice feature; the discovery/stage-o work
  (migrations v0.18–v0.23) is **already on `origin/main`**. Merging brings nothing else.
- **Keep separate from the goal-decomposition work.** The working tree also holds
  ongoing Jenna-fixes (goal-decomposition: `supabase-adapter` DECOMPOSITION_FIELDS,
  `modals.js`, `year-view.js`, `index.html` CSP). Those are a **different stream**,
  destined for main on their own path. They don't conflict with guide-practice
  (different files/regions), and they should NOT ride along in this merge.
- **To ship:** confirm §5 → open a PR `feat/guide-practice-surface` → `main` →
  review the 14-file diff → merge. Vercel deploys; the Practice tab + owner card go live.

---

## 7. Verified

- Crypto roundtrip in a real browser: `story`/`moment` stored as `{ct,iv}` envelopes;
  a seeded **child name ("Mason") appears nowhere** in the stored record; decrypts back exactly.
- Bloom suppression in-browser: 3 guides on a characteristic → shows; a lone
  reflection → suppressed; a below-floor studio → empty (graceful).
- Static: ESM parse + adapter parity + wiring across all touched files.

---

## 8. Deferred / open

- **Region C — offer-to-commons** (owner posts a launch/story guides can pick up):
  **not built.** Needs a guide-facing *reader* surface (the old "Everyone" broadcast
  was removed). Building the write half alone would be a dead end.
- **Prod smoke test not yet done** — verified in the local backend, not visually
  against live Supabase. 2 min: guide → Practice (mark a crossing) + School (insights
  render); Jenna → Tending the Studio ("still gathering" expected).

---

## 10. Real-world finding — the bloom won't populate at current scale

The suppression floor is `v_min = 3`. The current staff (2026-07-19) is ~6 guides
spread across studios, **1–2 per studio** (adventure: Ben; discovery: Rose; sparks:
Megan + Erin; tot/launchpad: Erin). **No single studio will ever reach 3 opted-in
guides**, so the *per-tribe* "Tending the Studio" bloom will **always** show the
"still gathering" message. That's the wall holding (better empty than de-anonymized),
not a bug — but the owner bloom has ~no utility at this size.

- **The real value shipped is the guide's OWN Practice surface** (each guide
  reflecting privately) + the School tab. Those work for everyone today.
- **Recommended next pass (needs the privacy panel per Naomi's standing condition):**
  a **school-level bloom** — aggregate all ~6 guides school-wide instead of per-tribe.
  Once 3+ opt in and reflect, Jenna/Wes see an anonymized school pulse. It's *more*
  anonymous (bigger pool), and it actually populates at this scale.

## 11. Data quirks to tidy (found 2026-07-19)

- **"Test Parent" had `is_owner = true`** — a test account with whole-school scope.
  Flip to false via the SQL in the session notes (needs the v0.14 identity trigger
  briefly disabled: `is_owner` is service-role-only).
- **"Jenna Jones" appears twice** (one `is_owner: true`, one `false`, both
  `role='guide'`) — likely a duplicate profile; could put a stray tile in the picker.
  Inspect the two rows before deciding which to keep.

---

## 9. Where the decisions live

- Design meeting: `evoke-agents-backup/agents/meetings/2026/07/2026-07-18-guide-socratic-skills-surface.md`
- Privacy ratification: `evoke-agents-backup/agents/decision-logs/2026-07-18.md`
- Scope: `docs/guide-practice-owner-surface-scope.md`
- Security posture: `SECURITY.md` → "Guide reflections — the Practice surface (v0.24)"
- Architecture: `ARCHITECTURE.md` → §2 four-login, §3 tables, §7 migration ledger
