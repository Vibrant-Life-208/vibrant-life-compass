# Community Board - Go-Live Checklist

**Purpose:** the ordered, gated steps between "engineering built" and "flag lifted for everyone."
The board is **dark** behind `?commboard=on`. All three ship-blockers from the 2026-09-14 fresh
8-agent review are **built** (sw v202). What remains is verification, legal, and the human walk -
none of it code. Do NOT flip the flag until every gate below is cleared.

**Canonical references**
- Review brief + blocker detail: `docs/design/2026-09-14-community-board-cork-poster-salus-jake-review-brief.md`
- Fresh-panel minutes: `evoke-agents-backup/agents/meetings/2026/09/2026-09-14-community-board-upload-safety-fresh-review.md`
- Upload-verify harness: `scripts/verify-poster-upload.html`
- Migrations: `supabase/migrations/2026-09-12-v0.39-*`, `2026-09-14-v0.40-*`, `2026-09-15-v0.41-*`

**Built state (sw v202, dark):**
- Blocker #1 - upload hardening (SVG reject, canvas re-encode strips EXIF/GPS, dimension cap, pdf.js
  budget, `safePosterSrc` sink guard). Pipeline in `js/poster.js`.
- Blocker #2 - contact field defaults to "Ask my guide"; PII-discouraging specific path; owner review
  guidance + PII flag.
- Blocker #3 - non-shaming path-back ("Revise & share again"); learner report path; owner sees flagged
  notes; `community_post_reports` table.

---

## Gate A - Database migrations applied (owner: Europa, in Supabase) - CLEARED 2026-09-15

Applied via the Supabase SQL Editor as one transaction-wrapped, idempotent block
(`supabase/APPLY-community-board-v0.39-40-41.sql`). Verified: `community_post_reports` carries all
three RLS policies (`cpr_insert_own`, `cpr_select_staff`, `cpr_delete_owner`), which means the whole
`begin; ... commit;` committed - so v0.39 columns and the v0.40 status constraint landed with it.

- [x] **v0.39** rich board columns (title, category, when_where, contact, poster_image).
- [x] **v0.40** the `removed` status (take-down).
- [x] **v0.41** the `community_post_reports` table + RLS.
- [x] Confirmed applied cleanly (three `cpr_*` policies present; single transaction committed).

---

## Gate B - Tutela's RLS wall-walk (owner: Tutela / TCC) - SIGNED-WITH-CONDITION 2026-09-15

Walked in the running Supabase via JWT-impersonation probes (`community-board-gate-b-rls-wall-walk.md`).
Tutela SIGNED the perimeter for the identities present; one segment is unverified and is a **condition
of lift**. Decision logged 2026-09-15; recorded in Tutela's memory.

- [x] **Poster/post RLS** - a learner sees only their own posts (any status) + the posted board, NOT
      another's pending/removed post (probes B1a, B2). PASS.
- [x] **Interim exposure** - guide-of-A and owner see A's pending; verified for the one guide present
      (B3a, B3c). PASS.
- [x] **Reports RLS (v0.41)** - learner can report only a `posted` post as themselves (B7), cannot
      report a non-posted post (B8), cannot forge reporter_id (B9), CANNOT read reports (B10 -
      re-verified with a real non-owner learner), owner reads all (B12), reporting never mutates the
      post (B14). PASS.
- [x] **No cross-row writes** - learner cannot insert forged or update another's post (B4b, B5). PASS.
- [x] Tutela signed the perimeter (decision log + memory, 2026-09-15).
- [ ] **CONDITION OF LIFT (deferred, not a failure):** guide-roster isolation **across two different
      guides** (probes B3b/B6b/B11b) is UNVERIFIED - the test DB has only one guide, so cross-guide
      roster leakage could not be walked. Before lift: seed a second guide + assignment and re-run
      those probes, OR walk them on the real school roster. Tutela will not sign a segment she has not
      walked.

*Note on the walk: the initial B10 showed a false FAIL because the sparse test DB's only "second
learner" resolved to the owner's own profile (owners legitimately read reports). Re-verified PASS with
Test Adventure, a genuine non-owner learner.*

---

## Gate C - Live upload verification (owner: whoever runs the walk / CI)

The Node tests for the allowlist + sink + dimension cap already pass (deterministic). The one piece
run-by-construction, not executed there, is the live EXIF strip in a real browser engine. The harness
and the module it tests are both deployed, so this is a browser open - no local server needed.

### Step 1 - Run the harness (2 minutes, no login, no server)

- [ ] In any browser, open:
      **`https://vibrant-life-compass.vercel.app/scripts/verify-poster-upload.html`**
- [ ] The page runs the tests against the LIVE `/js/poster.js` and prints its result in place. Wait for
      the top line to change from `running...` to a status line. **PASS = the first line reads
      `STATUS: ALL-PASS (N passed, 0 failed)`**, and every line below reads `PASS`:
  - SVG rejected in every disguise (mime, extension, svg-content-with-png-name)
  - the EXIF-GPS-injected JPEG is accepted, re-encoded to `data:image/jpeg`, and the GPS **sentinel is
    absent** from the stored output (no `Exif` marker either)
  - a very tall image is bounded to <= 700x1000 (dimension cap held)
  - `safePosterSrc` drops `javascript:`, `data:text/html`, `data:image/svg+xml`, and null
- [ ] Record the status line (screenshot or copy the text) as the artifact for this gate.

*If the page stays on `running...`, open the browser console for an error and note it - but on the
deployed static host this should just run.*

### Step 2 - Real-phone-photo spot-check (belt-and-suspenders)

The harness proves EXIF stripping with a synthetic GPS tag; this confirms it on an actual camera file.

- [ ] Log in as a learner with `?commboard=on`, go to the community board, and upload a **real phone
      photo that has GPS/location** as the poster. Confirm it renders as a poster (a fresh, downscaled
      JPEG).
- [ ] (Optional, strongest) Save the rendered poster image and inspect its metadata - it should have
      **none**. E.g. `exiftool poster.jpg` shows no GPS/EXIF, or drop it into any "view EXIF" web tool.
      The original photo's GPS must not survive the canvas re-encode.

### Done-condition

- [ ] Harness `STATUS: ALL-PASS` recorded, AND the real-photo spot-check shows no surviving location.
      Note who ran it and when in the sign-off.

---

## Gate D - Counsel question (owner: Europa + counsel)

- [ ] Route the child-publication-consent question to the existing teen-sandbox age-verify counsel
      thread: *does a minor publishing an image to an all-families board require guardian consent?*
      (Tutela raised this; same §7-shape crux.) Get a written answer before lift.

---

## Gate E - Accessibility + quiet-poster pass (owner: Pervius)

- [ ] Every field + the file input labeled; focus order sane.
- [ ] The poster field reads as visually **quiet** - title + description first (the offering), poster a
      secondary "if you'd like."
- [ ] If a poster is attached, its caption doubles as **required alt text** (a blind child on the board
      deserves to know what's pinned). *(Note: caption-as-alt-text may still need building - confirm.)*
- [ ] Pins/notes meet 44x44 + contrast; reduced-motion respected on any pin animation.

---

## Gate F - Jake's binding real-child walk (owner: Jake + Salus, consented)

Jake's standing gate: no learner-facing surface clears until he watches a real learner meet the built
thing. Consented, every screen. Watch specifically:

- [ ] **Discovery (8-11) fit** - is the 6-field form + optional poster a coherent ask for an 8-year-old,
      or does the young register need a simpler cut? (Recall: young register already has no contact
      field and no when/where; confirm the poster ask lands.)
- [ ] **Poster upload** - does "add a drawing / photo of a drawing" read as an invitation, not an
      expectation a child who has no PDF can't meet?
- [ ] **Report path** - does a child understand "tell a guide," and does it feel safe (not tattling,
      not weaponizable)?
- [ ] **Path-back** - if a post were taken down, does the "not a mark against you" copy land as care?
- [ ] Salus safety read throughout: any wince, any coercive shape, any count/streak leak (there should
      be none).
- [ ] Jake + Salus sign the walk (memory / decision log) OR name what to change first.

---

## Gate G - Scale-watch acknowledged (owner: Kes / Living-Seed watch)

- [ ] Note recorded that the human moderation wall (guide -> owner) holds at ~15 families and **thins as
      it grows** - the guide gate must not become a rubber stamp. This is a standing watch, not a
      pre-lift blocker, but name it so it is watched, not discovered.

---

## The lift (only after A-F clear)

- [ ] Flip `isCommunityRich` in `js/flags.js` to default-on (mirror the Life Skills / Responsibilities
      lift pattern: `?commboard=off` becomes the opt-out).
- [ ] Bump the service worker (`sw.js` CACHE version).
- [ ] Commit + push; verify the deployed `sw.js` + `flags.js` show default-on.
- [ ] Log the lift as a decision; note it in the walk brief STATUS line (as with Responsibilities /
      Life Skills growth).
- [ ] Standing mitigation if something lands wrong for a real child: `?commboard=off` per-browser while
      adjusting.

---

*The board is the one Compass surface where "lift now, fix later" is hardest to reverse (child-uploaded
imagery + a public board). Every gate above is care for the reader we cannot see. We do not clear a
surface for a child until we have watched a child meet it.*
