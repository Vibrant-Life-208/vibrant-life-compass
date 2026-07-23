# Phase 0 — Deletion Dark-Watch Report

**Date started:** 2026-07-22
**Author:** Claude Code (on behalf of Europa), Compass rebuild Phase 0 Task E
**Rule:** NOTHING is deleted in Phase 0. This report starts the dark-period clock and
captures the static evidence. Deletion is gated to Phase 2+ per the safe-delete checklist,
and only after a candidate shows **zero runtime hits over a full usage cycle**.

---

## 1. Instrumentation (live as of 2026-07-22)

Each retirement candidate emits a `dead-watch` trace when it actually runs in production
(`js/dead-watch.js`; `console.info("[dead-watch:<tag>] fired…")` once per tag per page load
plus a running counter on `window.__HC_DEAD_WATCH.hits`). Default = ON (no behavior change).

| Tag | Call site(s) | Kind | Kill-switch |
|---|---|---|---|
| `patterns` | `js/patterns.js:11` (`renderPatterns`) | code-alive, data-backed | YES (`deadEnabled('patterns')`, default ON) |
| `profileFoundations` | `js/backend/local-store.js:947`, `js/backend/supabase-adapter.js:439` (`getProfileFoundations`) | DORMANT (movement screens unbuilt) | none (read-only trace) |
| `legacyToRegion:label` | `js/wheel.js:30` (`regionForLabel`) | DATA-BACKED, live | none — hard pass-through (must NOT be switchable pre-migration) |
| `legacyToRegion:category` | `js/wheel.js:40` (`regionIdForCategory`) | DATA-BACKED, live | none — hard pass-through |

Kill-switches (patterns only) via `window.__HC_RUNTIME_CONFIG__.deadWatch.patterns = false`,
`localStorage hc_dead_off = "patterns"`, or `?deadoff=patterns`.

---

## 2. Static sweep — grep (authoritative for this codebase)

Compass is a no-build browser app that dispatches through namespace imports
(`import * as localImpl` / `export const {…} = impl` in `js/store.js`) and dynamic tab keys.
Automated dead-code tools cannot trace that indirection (see §3), so a manual grep of JS + HTML
is the reliable sweep.

### Candidate: `patterns` (Patterns tab)
- Tab registered: `js/app.js:64,80` (learner + guide). Rendered: `js/app.js:580` → `renderPatterns`.
- DOM: `index.html:245` `#patterns-view`, `index.html:249` `#patterns-list`.
- **Verdict: CODE-ALIVE, DATA-BACKED.** It reads real goals + check-ins. Retirement (if any) is a
  product decision, not dead code. Dark-watch will show whether learners actually open it.

### Candidate: `getProfileFoundations` (v0.26 Session-1 foundational inventory)
- Referenced ONLY as a re-export in `js/store.js:70`. **No runtime caller anywhere** (grep of `js/`
  outside `backend/` returns nothing). Documented DORMANT until the Session-1 movement screens exist.
- **Verdict: CODE-DEAD AT RUNTIME (today).** Strongest deletion candidate — but it is scaffolding for
  an unbuilt feature, so the correct disposition is "keep, dark-watch" until the movement-screens
  decision is made, not delete. Zero `[dead-watch:profileFoundations]` hits over a usage cycle would
  confirm it never runs.

### Candidate: `LEGACY_TO_REGION` (legacy area/label → compass-region shim)
- `regionForLabel` / `regionIdForCategory` called from `js/goal-breakdown.js:20,22,26`,
  `js/growth-record.js:20,22,24`, `js/year-view.js:335,368`, `js/studios.js:356-357`.
- **Verdict: DATA-BACKED, LIVE.** Live goals are still keyed by old area/slice ids; this shim keeps
  them from orphaning. It routes to the full expand-contract migration later, NOT to deletion.
  Its dark-watch is trace-only (no kill-switch) by design — flipping it off would orphan goals.

---

## 3. Static sweep — Knip

Knip 6.29.0 was run via `npx knip` with a throwaway `package.json` + `knip.jsonc`
(entries = `sw.js`, `js/app.js`, and the other `<script type="module">` roots;
project = `js/**/*.js`; both throwaway files removed after the run, never committed).

**Results:**
- **Unused files (1):** `js/backend/migrate.js` — the localStorage→JSON export tool, invoked
  manually from the browser console, never imported. Expected; not a deletion candidate.
- **Unused exports (250):** **FALSE POSITIVES.** Nearly the entire backend surface
  (`local-store.js` / `supabase-adapter.js`) is flagged because Knip's static graph does not follow
  `import * as impl` → `export const {…} = impl` re-export-and-destructure (`js/store.js`). Every
  function reached through that dispatch reads as "unused" to Knip. This is a known limitation of
  static analysis against dynamic dispatch, not evidence of dead code.

**Conclusion:** Knip is not reliable for this app's architecture. The grep sweep (§2) plus the live
runtime dead-watch traces (§1) are the authoritative evidence for any future deletion decision.

---

## 4. Dark-period clock

| Candidate | Clock start | Disposition target |
|---|---|---|
| `patterns` | 2026-07-22 | Product decision + zero-hit evidence before any retire |
| `profileFoundations` | 2026-07-22 | Keep as scaffolding; delete only if movement screens are abandoned AND zero hits |
| `LEGACY_TO_REGION` | 2026-07-22 | NOT a deletion candidate — routes to expand-contract migration (Phase 2+) |
| `logins` table + `js/logins.js` (Task A) | Retired 2026-07-22 (TCC ruling) — code removed this phase; table safe-delete SQL authored (`supabase/migrations/2026-07-22-v0.34-retire-logins.sql`) | Already retired, not on the dark-watch clock |

**Watch procedure:** over a full usage cycle (a school session block covering all roles + tabs),
collect `window.__HC_DEAD_WATCH.hits` from live sessions. A candidate with **zero** hits and no
data dependency is eligible for the Phase 2+ safe-delete checklist. Nothing is deleted before then.
