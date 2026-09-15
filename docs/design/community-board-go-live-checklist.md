# Community Board - Go-Live Checklist

**Purpose:** the ordered, gated steps between "engineering built" and "flag lifted for everyone."
The board is **dark** behind `?commboard=on`. All three ship-blockers from the 2026-09-14 fresh
8-agent review are **built** (sw v202). What remains is verification, legal, and the human walk -
none of it code. Do NOT flip the flag until every gate below is cleared.

**Canonical references**
- Review brief + blocker detail: `docs/design/2026-09-14-community-board-cork-poster-salus-jake-review-brief.md`
- Fresh-panel minutes: `evoke-agents-backup/agents/meetings/2026/09/2026-09-14-community-board-upload-safety-fresh-review.md`
- Upload-verify harness: `scripts/verify-poster-upload.html`
- Migrations: `supabase/migrations/2026-09-12-v0.39-*`, `2026-09-14-v0.40-*`, `2026-09-15-v0.41-*`,
  `2026-09-15-v0.42-*` (learner-delete RLS - apply this too)

**Built state (sw v205, dark):**
- Blocker #1 - upload hardening (SVG reject, canvas re-encode strips EXIF/GPS, dimension cap, pdf.js
  budget, `safePosterSrc` sink guard, data:-URL decode under CSP). Pipeline in `js/poster.js`.
- Blocker #2 - contact field defaults to "Ask my guide"; PII-discouraging specific path; owner review
  guidance + PII flag.
- Blocker #3 - non-shaming path-back ("Revise & share again"); learner report path; owner sees flagged
  notes; `community_post_reports` table.

### NOT-YET-VERIFIED / NOT-YET-BUILT ledger (read this first - Data, fresh-eyes review 2026-09-15)

So "mostly verified" is never mistaken for "verified." Open, by design:
- **Pre-lift Gate H items 1-4 now BUILT (sw v206):** learner-delete, family-objection path, child
  assent, stated board intention. Item 5 (re-verification cadence) still to formalize.
- **v0.42 APPLIED + verified** 2026-09-15: `cp_delete_own` present; delete perimeter walked (D1 delete
  OWN = PASS, D2 cannot delete ANOTHER's = PASS).
- **Not verified:** two-guide RLS isolation (B3b/B6b/B11b - only one guide in test data); the real-photo
  EXIF + real-PDF upload spot-checks (Gate F); the live screen-reader read-through (Gate F).
- **Runs once, not yet repeatable:** the RLS wall-walk + the upload harness are one-time; make them
  regression checks re-run on any board-touching change (Gate H item 5).
- **Fast-follows (post-lift):** "your idea is on the board" moment; family board explainer + changelog;
  portability (export/take your posts on leaving).

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

Packet ready: **`community-board-gate-d-counsel-packet.md`** - a narrow ADDENDUM to the existing Vibrant
Life child-data engagement (Growth Record brief + teen-sandbox age-verification thread), so it routes
to the **same counsel**, not a fresh engagement.

- [ ] Send the packet to counsel. Core question: *when an under-13 learner PUBLISHES self-authored
      content + an image to a board visible to all enrolled families, does it require verifiable
      parental consent, or does the school-consent lane cover it?* (Publication/disclosure, distinct
      from the Growth Record's private model.)
- [ ] Gating answers before lift: **Q1** (consent lane) and **Q3** (image likeness / third-party
      children). Then Q2 (is moderation load-bearing), Q4 (FERPA in/out), Q5 (contact field for the
      under-13 register).
- [ ] Get the answer **in writing**; record the consent lane + any required consent-form / contract
      language. If direct verified consent is required, that becomes its own build (VPC, both
      directions) before lift.
- [ ] **Proposed instrument attached** (packet Appendix A): a plain-language, granular, revocable
      at-enrollment consent (separate permissions for text / image / a photo of the child), drafted for
      counsel to finalize. Vibrant Life currently has **no** media release, so this would be new.
- [ ] **Build item if adopted:** a **per-learner consent flag** the board checks before allowing a post
      (no consent -> no publish; text-only -> withhold the image/poster field). Small build; noted now
      so it isn't discovered after lift.

---

## Gate E - Accessibility + quiet-poster pass (owner: Pervius)

Full audit: **`community-board-gate-e-a11y-audit.md`** (Parts 1-3 + sign-off). Summary:

- [x] **Mechanical WCAG fixes applied** (sw v204): labeled the contact input + the file input
      (`aria-label` / `aria-labelledby` / `aria-describedby`); made the poster status a live region
      (`aria-live="polite"`); narrowed the file `accept` to the raster allowlist (no SVG in the picker).
      Title/description/category/when-where were already properly labeled.
- [x] **Quiet-poster ordering already met** - the poster field is the LAST field (title + description
      first); no change needed.
- [x] **Rendered-surface fixes applied (Pervius, 2026-09-15, sw v205):** contrast FAIL (muted #8a8a8a
      = 3.0-3.4:1) fixed -> functional board text now `--text-soft` #5a5a5a (6.1-6.8:1); `.cork-report`
      touch target FAIL (~12px) fixed -> >=24px tap area via padding, visual weight unchanged.
      Reduced-motion already covered for `.cork-note`.
- [x] **Judgment calls resolved:** (a) report-target tension resolved by separating tap-area from
      prominence (bigger reach, same small quiet link); (b) caption-as-alt-text = named **fast-follow**,
      NOT a lift-blocker (title-derived alt already meets the AA floor).
- [ ] **CONDITION (fold into Gate F):** live **screen-reader read-through** with a real AT user (form +
      board + owner UI announce; focus visible/ordered; focus not lost on the report "Thank you"). Then
      Pervius's sign-off is complete. Audit: `community-board-gate-e-a11y-audit.md`.

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

### Accessibility read-through (Gate E carry-in - Pervius's sign-off condition)

- [ ] **Screen-reader read-through** with a real AT user (VoiceOver/NVDA): every form field + hint
      announces a name; the poster status announces on change (`aria-live`); each board note reads
      title -> body -> meta; focus is visible and ordered; focus is not lost when the report "Thank
      you" replaces the button. (Pervius fixed the measurable contrast + touch-target items in code;
      this lived read-through completes his sign-off.)

- [ ] Jake + Salus sign the walk (memory / decision log) OR name what to change first. If the security
      spot-checks AND the screen-reader read-through pass, **Gate C and Gate E also sign off here.**

---

## Gate G - Scale-watch acknowledged (owner: Kes / Living-Seed watch)

- [ ] Note recorded that the human moderation wall (guide -> owner) holds at ~15 families and **thins as
      it grows** - the guide gate must not become a rubber stamp. This is a standing watch, not a
      pre-lift blocker, but name it so it is watched, not discovered.

---

## Gate H - Sovereignty additions (fresh-eyes review 2026-09-15)

From the 8-agent strategic review (Spock/Guinan/Data/Ezri/Sarek/Quark/Kira/Sisko). Core finding: the
code is well-verified, but the **child's sovereignty, the family's voice, and the board's living
meaning** are under-built relative to the security. Convergent (Spock+Quark+Kira+Ezri): the child and
the family each need a hand on the off switch, and the child must be a KNOWING party, not just moderated.
Minutes: `agents/meetings/2026/09/2026-09-15-community-board-fresh-eyes-strategic-review.md`.

**PRE-LIFT (build before flag-on) - BUILT 2026-09-15 (sw v206):**
- [x] **1. Learner-delete of own post** (Quark, non-negotiable) - "Delete this idea" on the learner's
      own posts (any non-removed status); a two-tap confirm, then a hard delete of their own row (reports
      cascade). Store `deleteMyCommunityPost`. **Migration v0.42 APPLIED + RLS WALKED 2026-09-15:**
      `cp_delete_own` present; probes D1 (learner deletes OWN) = PASS, D2 (cannot delete ANOTHER's) =
      PASS. Delete perimeter scoped correctly.
- [x] **2. Family-objection path** (Kira) - the report form now has "This post is about me or my
      family"; it routes to the owner like any report, prefixed `[ABOUT MY FAMILY]` so the reviewer's
      eye goes straight to it. Reuses `community_post_reports` (no new migration). **[Kira held this
      pre-lift; built pre-lift.]**
- [x] **3. Child assent** (Spock) - the send button is gated on an assent checkbox: "I understand my
      idea will be shown to all the Vibrant Life families, and I want to share it" (young register:
      simpler wording). Consent protects the guardian's authority; assent protects the child.
- [x] **4. Stated board intention** (Guinan) - an in-app line under the board prompt: *"A place to
      offer, not to perform. Every idea is received; none is ranked."* (Also belongs at the top of the
      family explainer, fast-follow #7.)
- [ ] **5. Deferred-ledger + re-verification cadence** (Data) - ledger done (top of file). Still to
      formalize: make the RLS wall-walk + upload harness **repeatable regression checks** re-run before
      any board-touching lift.

**FAST-FOLLOWS (post-lift):**
- [ ] 6. "Your idea is on the board" warm moment on approval (Ezri).
- [ ] 7. Family board explainer + policy changelog (Sarek) - opens with Guinan's intention sentence.
- [ ] 8. Portability - a learner can export/take their posts when they leave (Quark).

**CONSIDERATIONS (watch):** proportional ship discipline / name the minimum-to-lift (Sisko); the stage
risk - guard the social dynamic (Guinan); the power to silence - audit that report/take-down protects
children rather than quiets inconvenient ones (Kira).

---

## The lift (only after A-F + Gate H pre-lift clear)

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
