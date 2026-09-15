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

## Gate C - Live upload verification (owner: whoever runs the walk / CI) - HARNESS DONE 2026-09-15

The Node tests for the allowlist + sink + dimension cap pass (deterministic). The live browser run
was executed against the deployed harness + module.

### Step 1 - Run the harness - DONE (STATUS: ALL-PASS, 16/16, 2026-09-15)

- [x] Ran `https://vibrant-life-compass.vercel.app/scripts/verify-poster-upload.html` in a real
      browser: **STATUS: ALL-PASS (16 passed, 0 failed)**. SVG rejected in every disguise; the
      EXIF-GPS JPEG re-encoded to `data:image/jpeg` with the GPS sentinel + `Exif` marker **absent**;
      tall image capped <= 700x1000; `safePosterSrc` drops `javascript:`/`data:text/html`/
      `data:image/svg+xml`/null; normal PNG accepted; fake `.pdf` (bad magic) rejected.

**The live run caught TWO real bugs before lift (this is why Gate C exists):**
  1. **`poster.js` CSP bug (real, learner-affecting):** the site CSP is `img-src 'self' data:` (no
     `blob:`), but the pipeline decoded images via `URL.createObjectURL` (a `blob:` URL) - CSP-blocked,
     so **every** photo/drawing upload silently failed. Fixed: decode via `FileReader.readAsDataURL`
     (a `data:` URL the CSP permits). No CSP relaxation. (sw v203.)
  2. Harness-only: test strings contained a literal `</script>` that closed the inline module early;
     escaped to `<\/script>`.

### Step 2 - Real-phone-photo spot-check (belt-and-suspenders)

The harness proves EXIF stripping with a synthetic GPS tag on the deployed engine. Two things it can't
do are confirmed on real files - and they are **folded into the Gate F real-child walk** (below),
because a child uploading a real drawing IS the walk. See Gate F's "Security spot-checks (Gate C
carry-in)".

### Done-condition

- [x] Harness `STATUS: ALL-PASS` recorded (16/16, 2026-09-15).
- [ ] Real-photo EXIF spot-check + real-PDF render spot-check pass (done in Gate F). Then Gate C signs
      off. Note who ran them and when.

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

### Security spot-checks (Gate C carry-in - do them with the real upload)

The child in this walk is going to upload a real drawing/photo anyway, so verify the two things the
synthetic harness couldn't, on the actual file:

- [ ] **Real GPS photo -> no surviving location.** Have the learner (or you) upload a **real phone
      photo that has GPS/location** as the poster. It should render (a fresh, downscaled JPEG). Then
      save the rendered poster image and check its metadata is **empty** - `exiftool poster.jpg` shows
      no GPS/EXIF (or drop it into any "view EXIF" web tool). The original photo's location must not
      survive the canvas re-encode. *(If it DOES survive, stop - that is a hard blocker, not a walk
      note.)*
- [ ] **Real PDF -> renders end-to-end.** Upload an actual PDF as a poster (the harness can't build a
      real PDF; the PDF path uses pdf.js, whose worker loads same-origin, so CSP should be fine - but
      confirm live). It should render its first page as a downscaled JPEG with no error.

- [ ] Jake + Salus sign the walk (memory / decision log) OR name what to change first. If both security
      spot-checks pass, Gate C also signs off here.

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
