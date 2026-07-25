# State of the Compass - Definitive Branch & Deploy Audit

**Date:** 2026-07-25
**Purpose:** Ground-truth map of what is on prod, what lives on each branch/worktree, and the integration path to assemble a full learner + guide walkthrough.
**Method:** git + file reads against `/Users/europa/Code/vibrant-life-compass` and all linked worktrees. The audit portion was read-only; a subsequent authorized step (below) built PR-A on a local, unpushed integration branch.

> **UPDATE 2026-07-25 - PR-A BUILT (local, not pushed).** The `origin/main` -> `feat/compass-4slice-migration` merge was executed on a fresh integration branch **`feat/compass-4slice-integrate-main`** (worktree `/Users/europa/Code/vlc-integrate`), merge commit **`e2a10dc`**. 3 conflicts resolved toward `origin/main` (`flags.js`/`app.js` now byte-identical to main; `sw.js` -> cache **v123** + main's precache). Removed `js/observatory/record-spike.js` (superseded spike) and `docs/CAPTAIN-NOTES-2026-07-21.md` (stale). Verified: CLIMB + family portrait + Observatory-Academics seam all coexist; migrations v0.34+v0.35+v0.36 all present; all changed JS passes `node --check`; net prod-facing code = `family.js`/`goal-arc.js`/`adapter`/`modals.js`/`style.css`/`sw.js` (rest inert docs). Two review flags investigated and cleared (family.js imports resolve via store.js facade; values-picker fix already on main). **Not pushed - origin untouched, primary worktree pristine at `95baf82`.** Next: functional verify (walk CLIMB + render portrait with a test login), then push + PR -> main, apply v0.35/v0.36 at deploy.

> One-line headline: **The end-to-end learner walk (CLIMB onboarding -> Compass/North map) and the guide/family/owner surfaces already ship on `origin/main` today, flag-gated behind `?climb=on`.** No single unmerged branch adds a *new* coherent walk - the outstanding branches are additive layers (family portrait + data model; Phase-2 visual "Observatory" render). The main integration hazard is that `feat/compass-4slice-migration` branched *before* the CLIMB deploys and is now 20 commits behind main.

---

## 1. Prod baseline

| Fact | Value | Evidence |
|------|-------|----------|
| `origin/main` HEAD | `661a1484269fdad28e8c205a8a45c245a594d3c9` | `git rev-parse origin/main` |
| Tip message | "CLIMB: add 'Let's get curious' page before the vision ladder (W11a)" | `git log -1 origin/main` |
| Tip date | 2026-07-23 16:04 -0600 | same |
| Deployed cache marker | `const CACHE = 'heros-compass-v122'` | `git show origin/main:sw.js` |
| Product title | "Hero's Compass" | `git show origin/main:index.html` |
| Deploy pipeline | Vercel, builds from `main`; `buildCommand: sh scripts/build-runtime-config.sh`, `outputDirectory: "."` | `git show origin/main:vercel.json` |

**Local vs remote caution:** local `main` is at `393b285` and is **4 commits behind `origin/main`**. Do not treat local `main` as prod. The worktree that actually sits on the deployed commit is `vlc-climb-work` (`climb-mountain` = `661a148` = `origin/main`).

**Features actually present on `origin/main`** (grepped real filenames, not assumed):

- **CLIMB onboarding (W1-W22):** logic lives in `js/modals.js` (there is **no** `js/climb.js`), styling in `css/climb.css`, gate in `js/flags.js` (`?climb=on`, learner-scoped). Deployed **dark**.
- **Compass / wheel / year map:** `js/wheel.js`, `js/year-map.js`, `js/year-view.js`; DOM anchors `#compass-year-map` and `#life-wheel` in `index.html`.
- **North:** `js/north.js`.
- **Family / parent / owner:** `js/family.js`, `js/parent-view.js`, `js/parent-anchor.js`, `js/parent-badges.js`, `js/owner.js`, `js/stillness.js`, `js/partner.js`.
- **Guide surfaces:** `js/tribe.js`, `js/tribe-roster.js`, `js/studios.js`, `js/practice.js`, `js/practice-timer.js`, `js/session-view.js`, `js/weekly-answers.js`.
- **Goals / tasks:** `js/goal-arc.js`, `js/goal-breakdown.js`, `js/goal-write-wall.js`, `js/game-plan.js`, `js/first-task-demo.js`, `js/task-list.js`, `js/tasks.js`, `js/auto-schedule.js`, `js/books.js`, `js/calendar-view.js`.
- **Observatory Phase-1 (shipped):** `js/observatory/academics.js`, `js/observatory/trail.js` (Lit-based, merged via `feat/compass-observatory`).
- **Support:** `js/insights.js`, `js/patterns.js`, `js/growth-record.js`, `js/setup.js`, `js/arrive.js`, `js/welcome.js`, `js/dead-watch.js` (dark-watch), backend adapters under `js/backend/`.

---

## 2. Per-branch / per-worktree inventory

Ahead/behind measured against `origin/main` (`661a148`). "Merged" = branch tip is an ancestor of `origin/main`.

| Branch | Worktree | vs origin/main | Merged? | One-line feature |
|--------|----------|----------------|---------|------------------|
| `climb-mountain` | `vlc-climb-work` | 0 / 0 | **= prod** | Identical to `origin/main` (the deployed CLIMB tip). |
| `main` (local) | main repo* | behind 4 | yes | Stale local pointer; 4 behind the deployed `origin/main`. |
| `feat/compass-observatory` | `/private/tmp/compass-phase0-deploy` | behind 9 / 0 | **yes** | Phase-0 foundation + Phase-1 Observatory (Academics + Trail + Lit) - already in prod. |
| `compass-phase0-deploy` | - | behind 15 / 0 | **yes** | Phase-0 "retire third-party credential vault" (v0.34) - in prod. |
| `climb-deploy` | - | behind 5 / 0 | **yes** | Earlier CLIMB walkable snapshot - superseded, in prod. |
| `climb-fix-connection-observatory` | - | behind 4 / 0 | **yes** | = local `main` (`393b285`) CLIMB fixes - in prod history. |
| `feat/guide-practice-surface` | - | behind 95 / 0 | **yes** | Goal-decomposition modal + Jenna copy polish - long merged. |
| `feat/stage-o-slice-walk` | - | behind 101 / 0 | **yes** | Global current-wheel flip - long merged. |
| **`feat/compass-4slice-migration`** | **main repo (checked out)** | **behind 20 / ahead 8** | **NO** | **Family "learner portrait" visibility tiers + Gate-L becoming/provenance data model (v0.35/v0.36 authored-only) + partner year-plan category names + Lit vendor spike + dead-watch.** |
| `feat/compass-disc` | `vlc-disc` | behind 9 / ahead 2 | NO | Phase-2 visual: `pillar-disc` Lit component + `observatory-stack`, mounted on Compass (flag-gated). Subset of `feat/compass-visual`. |
| `feat/compass-visual` | `vlc-visual` | behind 0 / ahead 1 | NO | Phase-2 visual **superset**: real Pillar state (C6c) + Dome (C6d) + Star Chart/asterisms (C6e). Sits directly on current main. |
| `feat/observatory-ceremony` | `vlc-ceremony` | behind 9 / ahead 1 | NO | **Byte-identical diff to `feat/compass-visual`** (same C6c/C6d/C6e payload), but off an older base. Redundant twin. |
| `feat/asterisms` | `vlc-asterisms` | behind 9 / ahead 1 | NO | Just the five per-Pillar asterism SVGs + preview (`js/observatory/asterisms.js`). Strict subset of the visual branch. |
| `feat/draft-persistence` | `vlc-draft` | behind 9 / ahead 1 | NO | Phase-1 onboarding draft-persistence in `js/store.js` + Academics WOOP. |
| `compass-phase1-mvp` | `/private/tmp/compass-phase1` | behind 19 / ahead 6 | NO | Phase-1 Observatory (Academics Mode B + Trail + Lit foundation). **Largely superseded** - the Observatory Phase-1 work already merged to main via `feat/compass-observatory`. |
| `playbook/vl-brand-and-parent-badges` | - | (separate lineage) | pushed | Playbook PDF cover graphics - not app code. |

\* `feat/compass-4slice-migration` is the branch currently checked out in the primary worktree.

**Redundancy note:** `feat/compass-visual`, `feat/observatory-ceremony`, `feat/compass-disc`, and `feat/asterisms` are four views of the same Phase-2 visual work at different completeness. `feat/compass-visual` is the most complete and is rebased onto current main (0 behind). Treat it as the canonical Phase-2 branch; the other three are archivable once it lands.

---

## 3. The walkable-set gap

**There is no gap in the core walk.** The end-to-end learner path - CLIMB W1-W22 onboarding through to the Compass year-map / North working map - plus the guide, family, parent, and owner surfaces, are **all already assembled on `origin/main`** and deployed dark (`?climb=on`, sw v122). For a learner + guide walkthrough of the *current product*, no merge is required: enable the flag on the prod build off `main`.

**What the unmerged branches would add on top**, and how to assemble each:

- **Family "learner portrait" (visibility tiers)** - only on `feat/compass-4slice-migration`. This is the branch that is 20 behind. Assembling it means **`origin/main` -> `feat/compass-4slice-migration` merge first** (bring the branch current), which is where the real conflict risk is.
- **Phase-2 visual "Observatory" (disc stack / Dome / Star Chart)** - use **`feat/compass-visual`** only (it is 0 behind main, mostly new files under `js/observatory/`). Low conflict surface. Do **not** also merge `observatory-ceremony`/`disc`/`asterisms` - they are subsets/twins and would collide.

**Conflict surface - VERIFIED by dry-run merge** (2026-07-25, `git merge --no-commit origin/main` into a throwaway detached worktree at `95baf82`, then aborted). The result was **much smaller than a file-touch analysis predicts**: only **3 conflicted files, all mechanical, all resolving in the "take `origin/main`" direction.** The feared semantic collisions did not occur:

| File | Merge result | Resolution | Risk |
|------|--------------|------------|------|
| `js/modals.js` | **auto-merged clean** | none - main's CLIMB additions and the branch's +12 lines are in different regions | **none** |
| `js/family.js` | **auto-merged clean** (the family-portrait feature itself) | none | **none** |
| `js/backend/supabase-adapter.js`, `css/style.css` | auto-merged clean | none | none |
| `sw.js` | CONFLICT (2 hunks) | take `v122` -> bump to `v123`; precache list: keep main's `trail.js`+`academics.js`, drop the branch's `record-spike.js` entry | trivial |
| `js/flags.js` | CONFLICT (add/add, 1 hunk) | **take `origin/main` wholesale** - the branch side is empty; main adds `isClimbBuild()` | trivial |
| `js/app.js` | CONFLICT (2 hunks) | **take `origin/main` wholesale** - see the one real decision below | small, well-defined |

**The one real decision (`js/app.js`):** both sides evolved the *same* strangler-fig observatory seam. The branch carries the **older Phase-0 throwaway** (`renderRecordSpike` from `js/observatory/record-spike.js`, an inline seam); main carries the **superseding Phase-1** (`renderAcademics` + a formal `renderEnvironment()` function). Main's is strictly newer and more complete. **Resolution: take main's seam and drop the branch's spike.** Verified safe: `record-spike.js` is imported *only* in `app.js` (nowhere else on the branch), and `js/family.js` - the feature we actually want to ship - has **zero** references to the observatory seam. So the spike can be deleted (`js/observatory/record-spike.js`) with no loss to the family portrait.

**Migrations merge clean too:** v0.34 (`retire-logins`) flows in from main automatically (branch gains the file + the `js/logins.js` deletion), and v0.35/v0.36 coexist with no filename collision. No renumbering needed.

**Recommended integration order** (each step is a checkpoint; do not batch):

1. **Baseline off `origin/main`** - confirm the flagged CLIMB walk is what you want to demo. If yes, a walkthrough needs nothing merged.
2. **PR-A: merge `origin/main` into `feat/compass-4slice-migration`.** Resolve the 3 mechanical conflicts as tabled above (all "take main" + delete `record-spike.js` + bump `sw.js` to v123). ~30 min, not the hairy merge first feared. Then verify CLIMB still walks *and* the family portrait renders.
3. **Migrations:** nothing to reconcile - v0.34 arrives via the merge; v0.35/v0.36 stay authored-only until deploy. Apply v0.35/v0.36 to prod as part of the PR-A deploy (they are additive, safe, and touch 0 rows today per their own headers).
4. **Merge `feat/compass-4slice-migration` -> `main`** (ships all its commits - see open question #3), deploy via Vercel.
5. **PR-B (separate, later): layer `feat/compass-visual`** for the Phase-2 Observatory render. Conflict surface is `sw.js` + the one-line mount in `js/app.js` only. Ship behind its own `?ui=observatory` flag; do not merge the three twin branches.

---

## 4. CLIMB capture target (reconciliation-critical)

CLIMB writes to **both** the dedicated profile columns *and* the `profiles.foundations` JSONB blob, split by which step is running. Traced in `js/modals.js` + `js/backend/supabase-adapter.js`:

**Dedicated columns (because CLIMB *reuses* the existing anchor-onboarding steps):**
- W1 quote -> `openQuoteFlow` -> `profiles.quote_text` / `profiles.quote_vision` (adapter lines ~206-250).
- W2 strengths -> `profiles.via_strengths_top_3` (adapter lines ~258-306).
- W3 values -> `profiles.values_top_3` (adapter lines ~275-280).
- 10/5/1 telescope + slice_plan -> existing horizon columns / the year-goals table.

**`profiles.foundations.climb` JSONB blob (the *new* CLIMB waypoints only):**
- Purpose Discs (`passion`, `contribution`, `hero`), Connection text (`consciousLiving`), Life-Skills WOOP (`woop`), Academics (`math` / `reading` / `la` program+link+baseline), and a threshold `quote`/north field.
- Persisted by `saveClimb()` -> `setProfileFoundations(profileId, {...prev, climb: state.climb})` (modals.js ~3000), merged so siblings are not clobbered. Self-only jsonb, "never surveilled - PDC-1" (modals.js comment ~1444, ~1672).
- Migration `v0.26` (`supabase/migrations/2026-07-20-v0.26-foundations.sql`) created the single `foundations jsonb not null default '{}'` column deliberately - "not one per answer... never queried per-field."

**Reconciliation task this implies:** the canonical strengths/values/quote of record remain the **dedicated columns** (`via_strengths_top_3`, `values_top_3`, `quote_text`) - CLIMB does not duplicate them into the blob; it *reads named strengths/values back* to seed the Purpose/Connection Discs (`climbStrengthsList()`/`climbValuesList()`). The open risk is drift if any **future surface reads `foundations.climb` as the source of strengths/values** instead of the dedicated columns. No reconciliation *migration* is needed - the split is already correct in code. What is needed is a documented invariant so a future Observatory panel does not read the blob by mistake.

**Proposed invariant (INV-FOUNDATIONS-CANON) - ready to ratify:**
> The strengths, values, and year-quote records of a profile are the dedicated columns `via_strengths_top_3`, `values_top_3`, and `quote_text` (+ `quote_vision`). The `profiles.foundations` JSONB blob (including `foundations.climb`) is self-only reflective narrative captured during onboarding; it is **never** the source of record for strengths/values/quote, and **must never** be read onto any guide/parent/owner dashboard, aggregate, or export. A surface that needs a learner's strengths/values reads the dedicated columns. `foundations.*` is read back only by the learner's own onboarding walk.

Placement once ratified (not done here - read-only): a one-line pointer in the header of `supabase/migrations/2026-07-20-v0.26-foundations.sql` and in the CLIMB spec (`COMPASS-CLIMB-SPEC`). Both are cheap, in-code, and put the rule where the next engineer will see it.

---

## 5. Migrations: applied vs authored-only

**Migration files by branch:**
- `origin/main`: continuous **v0.2 -> v0.34** (v0.34 = "Phase 0 (A): retire the third-party credential vault", introduced by `4d4f49d`).
- `feat/compass-4slice-migration`: v0.2 -> v0.33, then **jumps to v0.35, v0.36** - it is **missing v0.34** (branched before Phase-0 merged) and adds its own v0.35 (`goal is_becoming` flag) + v0.36 (`legacy-region provenance`).
- `feat/compass-observatory`: v0.2 -> v0.34 (matches main).

**Applied-to-prod status - VERIFIED against the live database** (2026-07-25, read-only schema query via `COMPASS_RW_URL`, checking tell-tale objects per migration):

| Migration | Tell-tale checked | Live result |
|-----------|-------------------|-------------|
| v0.21 weekly-answers | `public.weekly_answers` table exists | ✅ **applied** |
| v0.24 guide-practice | `profiles.share_practice_pulse` + `guide_crossings` | ✅ **applied** |
| v0.26 foundations | `profiles.foundations` column exists | ✅ **applied** |
| v0.33 ui-variant | `profiles.ui_variant` column exists | ✅ **applied** |
| v0.34 retire-logins | `public.logins` table is gone | ✅ **applied** |
| v0.35 is_becoming | `goals.is_becoming` column | ❌ **not applied** |
| v0.36 legacy provenance | `goals.legacy_slice_id` column | ❌ **not applied** |

- **Applied:** v0.2 - v0.34 (prod schema == `origin/main`). The spot-checks above confirm the previously-uncertain v0.21/v0.26/v0.33/v0.34 lines directly against Postgres.
- **Authored-only / NOT applied:** **v0.35** (`goal is_becoming` flag) and **v0.36** (`legacy-region provenance`) - both on `feat/compass-4slice-migration`, commit `721d1a1` labels them "authored-only"; the DB confirms neither column exists. Apply as part of the PR-A deploy.

**Note on stale docs:** the `CAPTAIN-NOTES-2026-07-21.md` on the 4slice branch is a **pre-CLIMB snapshot** (says cache `v112`, lists v0.21/v0.26 as pending). Ignore it for prod state - the live DB query above supersedes it.

---

## Open questions a human must answer

- ~~**1. Live DB applied-state.**~~ **RESOLVED 2026-07-25** by live read-only query: prod == `origin/main` through v0.34; v0.35/v0.36 not applied. See §5 table.
- ~~**2. v0.34 gap / numbering collision.**~~ **RESOLVED** by dry-run merge: v0.34 flows in automatically, v0.35/v0.36 coexist with no collision, no renumbering needed. See §3.
- ~~**3. Scope of the next deploy.**~~ **DECIDED + BUILT 2026-07-25:** whole-branch merge (not cherry-pick). Analysis of the 8 commits showed 4 wanted (family portrait + 2 bugfixes + Gate L, the last safe/inert), 2 superseded-and-auto-reconciled (Phase-0 spike/seam), 2 inert docs; cherry-pick would cost the bugfixes for no risk reduction. Built as `e2a10dc` on `feat/compass-4slice-integrate-main` (unpushed). Remaining sub-question: functional verify before it goes to `main`.
- **4. Foundations canonicality:** ratify **INV-FOUNDATIONS-CANON** (§4) so a future dashboard never reads `foundations.climb`. One-word yes/no; text is drafted and ready to place.
- **5. Phase-2 visual branch consolidation:** confirm `feat/compass-visual` is the canonical Observatory branch and `feat/observatory-ceremony` (its byte-identical twin), `feat/compass-disc`, and `feat/asterisms` can be retired after it lands.
- **6. Stale pointers:** local `main` is 4 behind `origin/main` (clean fast-forward, verified 2026-07-25); `compass-phase1-mvp` is largely superseded by the merged `feat/compass-observatory`. Approve FF of local main + pruning of superseded branches? (Not done here - read-only.)

---

*Produced read-only. `git fetch` and a read-only DB query were run (both non-mutating); a dry-run merge was performed in a throwaway detached worktree and aborted + removed (no real branch touched). No branches merged, no commits made, no refs moved, no work lost. Evidence is reproducible via the git commands cited inline.*
