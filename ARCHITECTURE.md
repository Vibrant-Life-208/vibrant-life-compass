# Vibrant Life Compass — Architecture & Operations

> The single source of truth for **how Compass accounts work** and **how to run the
> yearly setup**. If you're coming back to this after months away, start here.
>
> Written after the June–July 2026 account-model build. Reviewed to the standard of
> "clarity is compassion" — the person this is for is future-you.

---

## 1. What Compass is

A vanilla-JS PWA (no framework) with a **Supabase** backend (Postgres + Auth +
RLS), deployed on **Vercel** (auto-deploys on push to `main`). A service worker
caches assets network-first; its cache version is bumped every deploy (`sw.js`,
`const CACHE = 'heros-compass-vNN'`).

Learners set an **anchor** (a quote, their **values**, their **character
strengths**) and **goals** across life horizons. The school is Vibrant Life
(owner: Jenna Jones). Accounts are **staff-created** — no self-signup, no real
emails (synthetic `hero-name@vibrantlife.local`).

Backend is abstracted behind `js/store.js` → `js/backend/supabase-adapter.js`
(prod) or `js/backend/local-store.js` (offline skeleton for dev/testing). Both
expose the same function names.

---

## 2. The four-login model (who logs in, and who sees what)

| Who | Login | Lands on | Sees |
|---|---|---|---|
| **Learner** — Discovery / Adventure / Launch Pad (8+) | their **own** hero-name (e.g. `mason-j`) | their Compass | own goals, daily steps, horizons, wheel |
| **Young learner** — Tot / Spark (2–7) | **none** | — | Spark: an *optional*, parent-run child-version values/strengths quiz (create-on-demand). Tot: nothing yet. |
| **Parent** | the **shared family login** (e.g. `jones-family`) → member picker | family view | everyone's **values + character strengths** + the **updates** learners chose to share. **Never goals.** |
| **Guide** | their **own** login (e.g. `rose-l-guide`) | guide dashboard | **their tribe(s)** + **whole-school** insights (counts only, ≥5-learner suppression) |
| **Owner** — Jenna **and** Wes | the **shared family login** → picker (their tiles are owners) | **owner home** | **Whole School** (every tribe) · **My Family** · **My Compass** |

**Key ideas:**
- A **family login is one shared credential** per household. Signing in opens a
  **"Who's exploring?" picker** — **parents only** (learners sign in themselves).
- **Owner is a flag, not a separate login.** `is_owner` on a parent's profile makes
  their picker tile open the *owner home* instead of the plain family view. The
  Jones family is the special case: both parents are owners.
- **Flat staff power:** owner and guides have the **same** admin abilities. `is_owner`
  only widens *insight scope* (all tribes vs. own tribe). Nobody is a bottleneck.

---

## 3. The account model (tables)

- **`profiles`** — one row per person. `role` = `learner | parent | guide`.
  Owner = `role='guide'` + `is_owner=true`. Guides carry `tribes text[]` (the
  studios they run). Holds the anchor (values, strengths, quote) and onboarding
  state. Every profile is backed by an `auth.users` row (even parents, whose
  password is never used — they enter via the family login).
- **`families`** — one row per household. `id` = the family login's `auth.users`
  id. `username` = the hero-name typed to sign in (e.g. `jones-family`).
- **`family_members`** — links `family_id` → `profile_id`, with `kind` =
  `parent | learner` and a `display_name`. This is what the picker + family view read.
- **`learners`** — a learner's `studio` (a.k.a. "tribe"). Guides get a row here too,
  with `studio='guide-summer'` (their own Compass journey).
- **`family_updates`** — the learner-shared feed (goal celebration / note). Learner
  writes; the family reads. Receive-only for parents.

**Studios / tribes:** `tot`, `sparks`, `discovery`, `adventure`, `launchpad`
(+ `guide-summer` for guides). Only **Discovery / Adventure / Launch Pad** get
individual logins. **Tot + Spark are family-member-only** (no login), re-added when
they're promoted to Discovery.

---

## 4. Design principles (why it's shaped this way)

- **Goals are private; values + strengths are shared.** Parents' window is the
  family view (values + character strengths) + only what a learner *chooses* to
  share. No streaks, reminders, or "incomplete" flags ever reach a parent. This is
  deliberate anti-helicoptering.
- **Learner-initiated sharing only.** A learner can "Share with my family" (a goal
  win or a short note). Parents receive; they can't reply in-app. (A gentle ~10-day
  nudge to share is queued, not built.)
- **Developmental split by independence,** not just age: young kids can't manage a
  login, so they don't have one.
- **Security is not optional** (see §7). RLS was TCC-reviewed; identity/authorization
  columns are service-role-only.

---

## 5. Yearly onboarding runbook

All account operations run through **one script** with your **service_role key**
(pasted at a prompt — never on the command line). Run from the repo root.

**Order of operations for a new year:**

1. **Apply pending migrations** in the Supabase SQL editor (see §6), one at a time,
   confirm "Success. No rows returned."
2. **Seed families** (family logins + parent/learner member profiles):
   `node scripts/bulk-import.mjs --families <families.csv>`
3. **Seed guides** (with their tribes; mark the owner):
   `node scripts/bulk-import.mjs --guides <guides.csv>`
4. **Re-link learners** so Discovery+ reuse their existing logins and Tot/Spark are
   cleared (dry-run first, then `--execute`, which pauses for a typed `EXECUTE`):
   `node scripts/bulk-import.mjs --relink-learners <families.csv>`  ← review the plan
   `node scripts/bulk-import.mjs --relink-learners <families.csv> --execute`
5. **Wire owners** (promote each owner parent; remove any stray standalone owner):
   `node scripts/bulk-import.mjs --make-owner <hero>`
6. Hand out the printed **temp passwords**; each person sets their own on first
   sign-in (`must_change_password`).

**CSV formats:**
- accounts: `hero_name,full_name,role,studio,links`
- families: `family_username,family_name,member_kind,member_name,studio`
- guides: `hero_name,full_name,tribe,is_owner` (tribe = `;`-separated for multiple)

---

## 6. `scripts/bulk-import.mjs` — all modes

| Command | What it does |
|---|---|
| `<accounts.csv>` | Generic learner/parent/guide creation |
| `--families <csv>` | Seed family logins + member profiles |
| `--guides <csv>` | Seed guide accounts (tribes, is_owner) + guide-summer row |
| `--relink-learners <csv> [--execute]` | Reuse existing Discovery+ logins, drop seed dups, delete Tot/Spark. **Dry-run by default; deletes gated behind a typed `EXECUTE`.** |
| `--make-owner <hero>` | Promote a profile to owner-guide (role=guide, is_owner, guide-summer) |
| `--delete <hero>` | Permanently delete one account (typed `DELETE` confirm) |
| `--test-family` | Stand up a Test Family linking `test-discovery` / `test-adventure` |
| `--whois <text>` | Show accounts whose email contains `<text>`, and what each IS |
| `--reset <hero>` | Issue a new temp password (forces change on next sign-in) |
| `--reset-onboarding <hero>` | Wipe a person's onboarding/anchor/goals to start over |

The script is idempotent (reuses accounts whose email already exists). The key is
prompted only when needed; a re-link dry-run needs no key.

---

## 7. Migration ledger

Migrations live in `supabase/migrations/`, applied by hand in the SQL editor. They
are written to be safe to re-run (`if not exists` / drop-then-create). The database
is the source of truth for what's live; verify with an anon `curl` probe
(200 = column/table exists).

*(v0.2–v0.10 predate this build: anchor-on-profiles, VIA strengths, horizon cascade,
quote author/note, anchor_aggregates, must_change_password, values_freetext.)*

| Migration | Adds | Applied? |
|---|---|---|
| **v0.11** families + member RLS | `families`, `family_members`; family-scoped RLS; **identity trigger** (role/email/id immutable to non-service writes) | ✅ |
| **v0.12** family_updates | `family_updates` table + RLS (learner-shared feed) | ✅ |
| **v0.13** learner-authored updates | tightens v0.12: only a signed-in learner posts; family login can't | ⚠️ **confirm applied** |
| **v0.14** guide tribe + owner | `profiles.tribes[]` + `is_owner`; trigger extended to protect them | ✅ |
| **v0.15** allow guide-summer | widens `learners_studio_check` to include `guide-summer` | ✅ |

---

## 8. Security posture

- **RLS is the wall.** Family logins read/write only their own members; guides see
  only their tribes + the school aggregate; family updates belong to the family
  (no guide/owner read). All reviewed by the **Trust Custodians Circle** (Worf +
  Tutela) — decision logs in `evoke-agents-backup/agents/decision-logs/2026/06/`.
- **Identity/authorization columns are service-role-only:** `role`, `email`, `id`,
  `is_owner`, `tribes` cannot be changed by a normal (self or family) write — a
  trigger (`protect_profile_identity_columns`) blocks it. This closes
  self-escalation (e.g. a learner making themselves an owner).
- **Passwords** are hashed/salted by Supabase Auth (bcrypt). Temp passwords are
  one-time; `must_change_password` forces a reset on first sign-in.
- **Forgot-password (Phase 2, NOT built):** planned as a non-enumerable request →
  guide notification → 2FA-gated (TOTP) guide reset, with an audit log + Turnstile
  CAPTCHA. Reviewed by a Ring 2 panel (minutes in the fleet repo). The old in-app
  reset button was **removed** because it didn't work in prod.

---

## 9. Frontend map (key files)

- `js/app.js` — boot + `onSignedIn` routing (owner → owner home; parent → family
  view; learner → Compass).
- `js/auth.js` — sign-in, the family picker flow, forced password change.
- `js/family.js` — member picker, family view + updates feed, share modal.
- `js/owner.js` — the owner home (Whole School / My Family / My Compass).
- `js/insights.js` — anchor aggregates, tribe-scoped.
- `js/studios.js` — studio/tribe definitions + guide categories.
- `js/backend/{store,supabase-adapter,local-store}.js` — the data layer.
- `scripts/bulk-import.mjs` — all account operations.

---

## 10. Pending / TODO (as of 2026-07)

- **Confirm v0.13 applied** (learner-authored updates).
- **The 3 Tots** (Eloise / Paige / Riley) — need their parents to add.
- **Parent-run Spark child-quiz** — create-on-demand (content from the L6-reviewed
  kid-values draft).
- **~10-day learner "share a goal update" nudge.**
- **Phase 2 auth** — forgot-password flow (Edge Functions + TOTP + CAPTCHA + audit).
- **P&T cross-device persistence** — the parent-side P&T journey (`js/parent-badges.js`
  `isPtFamily` / `isHoldingBadge`) is currently **local-only** (`vl.pt.*` localStorage),
  so a parent's "holding" marks don't follow them across devices. Next step: move to a
  **parent-private** server store (small migration + adapter functions, replace the
  localStorage calls; keep a local fallback offline). **Guardrails (category wall +
  Polaris standing condition, decision log 2026-07-08):** parent-private only — RLS
  scoped so a family login reads/writes **only its own parent members'** marks;
  **never** readable by a guide/owner-as-guide, **never** aggregated, **never** counted
  (a boolean per posture, nothing more). Route the RLS past TCC/Polaris like v0.11/v0.14
  before applying. The guide-view *reference* stays content-only and never touches this.

*(Done 2026-07-08: Jenna + Wes wired as owner-guides on prod — the Jones login opens the owner home for both. Done 2026-07-10: both P&T surfaces live — guide-view reference + parent-side private journey, SW v99.)*

---

## 11. Where the decisions live

Design decisions, security reviews, and dissent are logged in the **fleet repo**
(`evoke-agents-backup`), not here — meetings under `agents/meetings/2026/…` and
decision logs under `agents/decision-logs/2026/…` (TCC reviews of v0.11/v0.12/v0.14,
the Ring 2 account-recovery meeting). This doc is the *code-side* summary; those are
the *why* in full.
