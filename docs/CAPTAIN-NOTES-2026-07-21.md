# Captain Notes & Ops Handoff — Vibrant Life Compass (2026-07-21 → 22)

A durable record of what we built, where it stands, and every remaining step. Readable on
GitHub anytime. Nothing here is lost when a session closes.

---

## 1. What was built this session

All on branch **`feat/compass-4slice-migration`** (pushed to GitHub, **not yet merged/deployed**):

- **Copy fix** — the app names itself ("Welcome to your compass") once at the threshold, not repeatedly.
- **Guide "Tribe" tab** — mark tribe leaders, a group **randomizer** (size 1–10, leader-anchored draws, no reuse), and **guide-assigned accountability partners** (learner self-pick retired).
- **Task wheel-colours** — one hue per compass region (Self=gold, Others=red, Making=green, World=blue, Voice=cream/white), three shades by band (recurring→light, weekly→colour, milestone→dark). Academic goals (Math/Reading/etc.) colour **World/blue**.
- **Week pool → days planner** (Game Plan) — days above, a "this week's pool" below; tap to place.
- **Session-1 auto-scheduler** — plants each goal's **milestone skeleton** (from the 3-phase `threshold[]`) across the year; the learner fills the weeks. Age-dial: Discovery=`auto`, Adventure=`pool-steps`, Launch Pad=`draft`, with a per-learner guide override. Summer onboarders plan the **next** cycle ("lights on Aug 17"). Deleting an auto task keeps it deleted (tombstones). Milestones spread across a week (Wed/Thu/Fri).
- **Plan tab** (ordered task list) + **Breakdown tab** (per-goal read-through) — Plan + Calendar now viewable by **every** learner; Breakdown is Launch Pad only.
- **School calendar events** on the Calendar view.
- **Year-plan sign-off → the GUIDE** (Rose for Discovery, Ben for Adventure), not a peer partner. Guide dashboard has a "Year plans to sign off" section.
- **Staged Setup gates** — enter North at **2** goals, top-3 priorities prompt at **3**, full set is 5.
- **Age gate → August** (was December): learners must reach the age gate by the new-year start.
- **Scale hardening** — write **retries** on a transient failure + **batched** scheduler inserts (for ~55 concurrent onboarding).
- **Growth Record scaffold** — a staff-only preview of the learner-owned record (compass + per-direction ribbon from real data; the "becoming" story + "proof" are placeholders for the next build).

---

## 2. Git / deploy status

- Branch **`feat/compass-4slice-migration`** is on GitHub, fully in sync. **Not merged to `main`, not deployed.**
- Prod deploys from **`main`** via **Vercel** (build runs `scripts/build-runtime-config.sh`, which reads Vercel env vars: `BACKEND_TYPE=supabase`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`).

---

## 3. Migrations — status

Applied via Supabase Dashboard → SQL Editor.

- ✅ **Applied:** v0.2–v0.20, v0.22–v0.25, v0.27, v0.28, v0.29, v0.30, v0.31, v0.32 (confirmed).
- ⏳ **Still need to apply:** **v0.21** (`weekly_answers` table) and **v0.26** (`profiles.foundations`). SQL below.
- ❓ **Verify** (almost certainly already applied — the app couldn't run without it): **v0.14** (`profiles.tribes` + `is_owner`).

**To finish — paste this into Supabase → SQL Editor → Run:**

```sql
create table if not exists weekly_answers (
  id uuid primary key default uuid_generate_v4(),
  learner_id uuid not null references learners(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  session int not null check (session between 1 and 7),
  week int not null check (week between 1 and 6),
  kind text not null default 'finish',
  text text not null,
  unique (learner_id, goal_id, session, week)
);
create index if not exists idx_weekly_answers_lookup
  on weekly_answers(learner_id, goal_id, session, week);
alter table weekly_answers enable row level security;
drop policy if exists "weekly_answers_read" on weekly_answers;
create policy "weekly_answers_read" on weekly_answers for select
  using (learner_id in (select learner_id from my_visible_learners));
drop policy if exists "weekly_answers_write" on weekly_answers;
create policy "weekly_answers_write" on weekly_answers for all
  using (learner_id = auth.uid()) with check (learner_id = auth.uid());

alter table profiles add column if not exists foundations jsonb not null default '{}'::jsonb;
```

The full combined migration file (all pending, with a verify block) is at **`supabase/APPLY-PENDING-2026-07-21.sql`**.

---

## 4. To deploy to prod (when ready — captain's call)

1. **Apply the remaining migrations** (v0.21 + v0.26 above). Additive + safe.
2. **Bump the service-worker cache** — in `sw.js`, change `const CACHE = 'heros-compass-v112'` to `'v113'`. Required so returning users get the new code instead of stale cache.
3. **Merge `feat/compass-4slice-migration` → `main`.** This triggers the Vercel prod deploy. NOTE: this ships **all 48 commits** on the branch (multi-session work) — confirm the whole branch is prod-ready, not just the recent pieces.
4. **Confirm Vercel env vars** are set (`BACKEND_TYPE=supabase`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`).
5. **Post-deploy verify:** hard-refresh; check the new tabs render; run a Discovery/Adventure/Launch Pad learner flow; confirm a guide can sign off a year plan.

---

## 5. Data safety on the FREE plan

**Where data lives:** all learner data is in **Supabase (Postgres)** — a real server-side database, separate from the app code, the cache, and the browser. **Code updates and cache bumps CANNOT lose data.**

**The gap:** the free tier has **no automated backups / no point-in-time recovery.** So we make our own restore points:

- **Local backup:** `scripts/backup.sh` — a full `pg_dump`, optionally AES-256 encrypted, to a gitignored `./backups` folder you control. **Run it right before any migration**, and weekly.
  - Needs: the connection string (Supabase → Project Settings → Database → Connection string → **Session pooler** tab, with your DB password), and `brew install libpq` for `pg_dump`.
- **Automated cloud backup:** `.github/workflows/db-backup.yml` — nightly encrypted `pg_dump` in the cloud (no laptop), stored as a 90-day GitHub artifact. **Activates once the branch is on `main`.** Needs two repo secrets: `VLC_DB_URL`, `VLC_BACKUP_PASSPHRASE`.
- **The simplest option:** **Supabase Pro ($25/mo)** = automatic daily backups + 7-day point-in-time recovery, **zero setup**. Recommended before a real learner cohort relies on it. The DIY scripts are a genuine net in the meantime, but they ask you to keep running them.

**Already protecting you (no action):** RLS (each user only sees their own data), write retries, additive-only migrations.

---

## 6. Supabase MCP (optional — lets Claude verify/diagnose the DB directly)

1. Terminal (not IDE): `claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=obnivpzwunxiyupnarca"`
2. `claude /mcp` → select `supabase` → Authenticate. **Choose read-only scope** for safety.
Once connected, Claude can run the migration diagnostics/verifications directly.

---

## 7. Open items / decisions (captain)

- [ ] Apply remaining migrations **v0.21 + v0.26** (§3).
- [ ] **Merge to main + deploy** — with the SW cache bump (§4).
- [ ] Turn on backups — local now, cloud Action at deploy (§5).
- [ ] **Supabase Pro** decision (automatic backups + PITR) before a live cohort.
- [ ] **55-concurrent load test** before the real cohort — script at `scripts/load-test.mjs` (needs test learner logins; runs against a TEST project).
- [ ] **Growth Record / transcript** — the full learner-owned record is the next real project: the seasonal "who you're becoming" authoring surface, the "proof" upload + learner consent/privacy, and the portability/export + TCC/counsel legal pass. Scaffold + mockup exist.

---

## 8. Key files

| Purpose | Path |
|---|---|
| Pending migrations (combined + verify) | `supabase/APPLY-PENDING-2026-07-21.sql` |
| All migration files | `supabase/migrations/` |
| Local backup script | `scripts/backup.sh` |
| Automated backup workflow | `.github/workflows/db-backup.yml` |
| Load-test script | `scripts/load-test.mjs` |
| Guide Tribe tab | `js/tribe.js` |
| Session-1 auto-scheduler | `js/auto-schedule.js` |
| Plan tab | `js/task-list.js` |
| Breakdown tab | `js/goal-breakdown.js` |
| Growth Record scaffold | `js/growth-record.js` |
| Service-worker cache version | `js/../sw.js` (`const CACHE`) |
