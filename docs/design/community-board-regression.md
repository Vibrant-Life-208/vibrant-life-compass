# Community Board - Regression / Re-verification Cadence (Gate H item 5)

**Why this exists (Data, fresh-eyes review 2026-09-15):** a gate that runs once is an assertion about
the past. The board's verification (upload hardening, RLS perimeters) was walked once; the next commit
could quietly tear down the wall and no one would re-walk it. This makes the checks **repeatable** and
names **when** to re-run them, so "verified in July" never silently means "verified now."

## When to run (triggers)

Re-run the full suite **before any board-touching lift**, and after any change to:
- `js/poster.js` (the upload pipeline)
- `js/community-board.js` or `js/owner.js` (the board + review surfaces)
- the board **RLS / migrations** (`community_posts`, `community_post_reports`, any `cp_*`/`cpr_*` policy)
- `js/flags.js` where it governs `isCommunityRich` (the board flag)

## The three lanes

### Lane 1 + 2 - automated (`scripts/board-regression.sh`)
```
scripts/board-regression.sh
```
- **Lane 1 - syntax:** `node --check` on every board-adjacent JS file.
- **Lane 2 - upload-guard unit tests:** `scripts/board-guards.test.mjs` imports the **real** exported
  pure functions from `js/poster.js` (not copies) and asserts:
  - `posterKind` - SVG refused in every disguise (mime / ext / svg-content-with-png-name); raster
    accepted; pdf routed; unknown -> rejected. (The allowlist decision.)
  - `safePosterSrc` - only ever emits a `data:image/(jpeg|png|webp)` value; drops `javascript:`,
    `data:text/html`, `data:image/svg+xml`, null. (The render-sink guard.)
  - `clampDims` - output never exceeds 700x1000, never upscales, never below 1px. (The dimension cap.)
- **PASS** = `BOARD-GUARDS: ALL-PASS` and exit 0.
- *Note:* these are the same properties the browser harness proves end-to-end, but here against the pure
  decision functions in milliseconds, so they can gate every commit. The refactor that made this
  possible (exporting `posterKind`/`clampDims`/`fitScale`/`safePosterSrc`) is the reason the test tests
  the real code, not a drift-prone copy.

### Lane A - browser upload harness (manual; needs a real browser engine)
Open **`https://vibrant-life-compass.vercel.app/scripts/verify-poster-upload.html`** (or serve locally).
Proves the *end-to-end* pipeline in a real engine, including the two things Node cannot: the **live EXIF
strip** (a GPS-injected JPEG -> sentinel absent from the stored output) and the canvas re-encode under
the site CSP. **PASS** = top line reads `STATUS: ALL-PASS`.

### Lane B - RLS wall-walk (manual; needs the live DB)
Run the probes in the Supabase SQL editor per **`community-board-gate-b-rls-wall-walk.md`** (the Gate B
auto-discovery block + the D1/D2 delete probes). **PASS** = every probe `PASS` or `SKIP(reason)`; in
particular a learner sees/writes only their own, reports are insert-own/staff-read/owner-delete, and the
learner-delete is scoped to own rows (D1 delete OWN = PASS, D2 delete ANOTHER's = PASS).

*Known coverage gap (carried):* two-guide roster isolation (B3b/B6b/B11b) needs a second guide in the
data - re-walk on the real school roster before lift.

## Known duplication to watch (not a regression failure, a maintenance note)
The `looksLikePII` heuristic exists in BOTH `js/community-board.js` (learner nudge) and `js/owner.js`
(reviewer flag). Kept in sync by hand today. If it drifts, the browser/UI check catches it, but a future
tidy is to lift it into one shared light module so Lane 2 can test it against the real export too.

## Artifacts
- Runner: `scripts/board-regression.sh`
- Unit tests: `scripts/board-guards.test.mjs`
- Browser harness: `scripts/verify-poster-upload.html`
- RLS walk: `docs/design/community-board-gate-b-rls-wall-walk.md`
