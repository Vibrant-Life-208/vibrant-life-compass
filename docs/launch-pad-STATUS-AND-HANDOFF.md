# The Launch Pad - Status & Handoff

> The single place to understand where the **Launch Pad** (the three-year in-person studio formation for 16-18-year-olds) design stands, what is merged, what is owed, and what the next real step is.

---

## STATE AS OF 2026-10-13 (read this first; the section below it is the 1 September baseline)

**The next real step has not changed and has not happened: one real Origin morning.** Everything since 1 September has been paper, review and packaging. Nothing has been shipped to a learner or a family, and no family conversation has been held.

**What happened since the baseline**

| When | What |
|---|---|
| 09-24, 09-25 (x2) | Three 8-voice sittings authored the door: the first-cohort conversation, the promotion plan and not-shown wall, the Ballast and Open Days, the family's path |
| 09-26 | Access statement v0.2, carrying Erin's six decisions of nine. Three remain open |
| 09-28 | **Fresh-eyes review**, 8 fresh voices, 21 decisions, 0 dissent. First review of the new family-facing substrate |
| 10-03 to 10-12 | Print pipeline: 17 reading PDFs, 12 spiral-bindable editions, the file manifest, the Drive structure, 33 PDFs uploaded |
| 10-13 | **Final-check review**, 8 voices, 11 decisions, 0 dissent. 10 of 11 closed the same day |
| 10-14 | **Pilot morning call sheet** written. Three calls, then a date |

**Open and blocking the door** (one canonical list; earlier versions of the index page carried three contradicting ones)

- [ ] Split the access statement into a family-facing file and a working list
- [ ] Audit the eleven present-tense promises in *What the room provides*. Three describe a room that does not exist: the quiet space, the large-print handouts, the equal alternative for every expedition
- [ ] Build the exceeds-capacity referral list. Six phone calls, not architecture
- [ ] Crisis numbers on the Ballast
- [ ] Plain-language pass and the funded interpreter offer. The no-child-interpreter rule is now written into the door document §1.1
- [ ] Site walk, which also chooses the quiet space (a binding gate before Session 5)
- [ ] Read the admissions timeline against the founder leave plan. **Recommendation on record: the admissions clock moves, not the leave plan. Not yet ratified**

**Open artifacts:** the one-page Family note (five documents depend on it, and it gates the pilot), a family-facing price (held by Jenna and Wes), the Successor Envelope, the Family Charter, the second adult's written authority, the named warm-referral therapist.

**The pilot's own gates:** eight. **Three in hand, one half, four open** (audited 2026-10-20 against the artifacts, not against the claims). Open: the named clinician (Call 1), consent actually given against the Family note, the crisis-concurrency name, and the external-accountability node, which was recorded closed against two fleet agents and has never been staffed by humans. See `design/launch-pad-pilot-morning-call-sheet.md`.

**Drive.** Two separate trees, deliberately. `Launch Pad - FAMILY-SHAREABLE` sits at the top level with no shareable ancestor and holds the four family PDFs, six artwork files, and its own contents card, shared with `vibrantlife208@gmail.com` at **commenter**. `Launch Pad - GUIDE ONLY (do not share)` holds the reading set, the spiral set, sources and the review record, and is **not** shared with anyone.

Both index pages were rebuilt **2026-10-17** and the superseded versions trashed:

| Page | Doc ID |
|---|---|
| Family contents card (in FAMILY-SHAREABLE) | `1bI8wklOasuXu6j6c1H1eRYaHJzzoJvPgA_MJzeM82nE` |
| Guide working index (in GUIDE ONLY) | `1_-SDF_OUajbxSYTOCtGmRKvvHcGIjLlPIYNNd5au_vA` |

The guide index now carries one canonical gate list in place of the three contradicting five-item lists, live links to all 22 guide-tier files, the calendar with the admissions/leave collision marked **recommendation, not ratified**, and the named blind spots of the two build checks.

**Two Drive-ingress limits, both confirmed by test rather than assumed.** `create_file` takes the whole payload inside the tool call, so a PDF of any real size exceeds the per-message output limit; routing through a subagent does not help, because the limit is per message and not per context. And `update_file` is metadata-only (title and parent), so a PDF cannot be replaced in place - a new upload gets a new file ID, which silently breaks every link that pointed at the old one. Replacing the four family PDFs on 10-17 is what broke the links in Jenna's card and forced the rebuild. **Check downstream links after any PDF replacement.**

Two further rendering limits, found by reading the created Docs back: a link inside a table cell renders as literal escaped markdown, and so does bold. Put links and emphasis in lists and paragraphs, never in table cells.

**All sixteen Drive copies are current as of 2026-10-20**, uploaded as new versions of the existing files (Manage versions) so every file ID and every link on both index pages survived; each one verified against its local counterpart by exact byte size through the Drive API afterwards. The staging folder `~/Desktop/Launch Pad PDFs/UPDATE in Drive 2026-10-20/` holds the set that went up and the sheet that describes it. Before that: nothing in Drive had been updated since 10-16, so the five staged on 10-17 were never uploaded, and that folder is retired. **The method that works, a third ingress path beside the two limits above:** drive the Drive web app through Chrome; the "Upload new version" button opens a native picker, so a one-line page script overrides `HTMLInputElement.prototype.click` to suppress the picker and attach the input to the page, and the browser upload tool then sets the file on that input. Each dialog is checked for the right filename before the upload is sent. The three books changed substantially on 10-19 and 10-20 (Origin's eight-voice alignment read; the Forge and Helm seven-voice plain-language pass; the nine-voice re-cut of both onto Origin's calendar shape; the guide's shape year by year), and the design volumes `01-03`, the `10-` volume and every spiral twin changed with them. `40-the-first-conversation.pdf` and its spiral twin still predate Kira's §1.1 language ruling of 10-16. Upload each as a new **version** of the existing file (Manage versions) so every link survives. The two index pages' links survive that; their text does not, and the replacement text sits beside the upload sheet (`Jenna card - new text.md`, `Guide index - changes.md`). Editing them in place needs the Google Docs connector in the chat; the 10-17 rebuild-and-trash is not the pattern to repeat. One stray: a Google Doc named `The-Origin-Year-Lesson-Plan-Book` sits in FAMILY-SHAREABLE (created 10-17 17:44), visible to Jenna, not one of the PDFs; the captain decides whether it goes.

**Family-shareable folder, 20 October evening.** The stray Google Doc is out: moved to My Drive, not trashed. **Two posters are out as well.** Every family-facing PDF said "ages 15 to 18" when the studio is 16 to 18, and the Families and Parents posters additionally carry a full outcome-promise block (portfolio, resume, referrals, hundreds of hours, "super power," and "exceptional learners"), which is wall item 4 flat out. They were made in June, before the wall existed, and nobody had read them against it. Both moved out of the shared folder; a permissions check confirms Jenna's commenter role came from the folder and left with them, so the card must drop those two links rather than leave her dead ones. The Story Poster, Star Map and overview one-pager are rebuilt and corrected locally and staged for upload. `The Launch Pad Story`, 24 pages, carries the same outcomes section and is **held pending the captain's call** - rebuilt and verified, not installed, not staged. The Families poster has **no source in the repo**; it cannot be rebuilt without being written again. Replacement card text, including the dropped links, sits in `Jenna card - new text.md` beside the upload sheet, and editing the card in place still needs the Google Docs connector in the chat.

**A method note that cost three wrong counts today.** Letter-spacing in the posters splits `A G E S 1 5` so a plain grep reads them clean, and `informational` contains `formation` as a substring so a plain grep reads them dirty. Strip whitespace and match whole words before reporting any count off these PDFs. The first pass said five of six; the true number was six of six.

**Checks now run inside the build** and fail it on a hit: 89 internal names and the not-shown wall, across all ten family-tier files. Both passed 2026-10-13. Neither is a truth check.

**Still owed to the fleet:** memory appends for **seven** sittings (09-24, 09-25 x2, 09-28, 10-13, and the two rooms of 10-16), routed through the Fleet MCP channel from an `evoke-agents-backup` session. Facilitator direct-write is not the channel.

**Unresolved, carried forward from 10-16 and not closed by the week repair:**

- **Kirk's three-to-one.** Twelve of the final sixteen weeks go inward and the return is a quarter of the descent. All five fresh voices refused it as arc, explicitly. Partially mitigated by starting the return inside Session 6's harvest. Needs the pilot, or a room with authority the closed review body does not have.
- **Odo's shadow, which is about process rather than curriculum.** Nine circles read this programme and none read its container. *"If this repair ships without asking why the calendar was invisible to every ring, the next container error ships too."*
- **The 2027-2028 break dates are projections** from the 2026-2027 pattern. Jenna sets the real ones, and the family card asks her for exactly that.

**Still open on the live Compass, affecting children today:** the `notifications_insert_any` impersonation vector, flagged July, called a queue-jumper on 1 September, still present in `supabase/schema.sql`. Not a 2027 item.

---

**As of 2026-09-01.** The complete design body is **merged to `main`** after the **full nine-circle fleet review** (every ring) and **three leadership decisions + a curation pass**. Nothing here is shipped to a live software surface - the Launch Pad is (by design) mostly pen, paper, and a room; the companion Compass app is deliberately "a lens, not a vault." **The review body is closed. The next real step is not more review - it is one real Origin morning.**

---

## 1. What is merged to `main` (the design body)

All four Launch Pad PRs merged 2026-08-31 / 09-01, all branches deleted:

| PR | Content | Merge commit |
|----|---------|--------------|
| **#7** | Origin (Year 1) complete studio-year design + the three-year spec (Ring-1 **and** Ring-2 revisions) + the Closing Practice + the new somatic-floor grammar | `bd1909b` |
| **#17** | The Forge (Year 2) studio-year design (superseded #8, which auto-closed when its base branch was deleted on the #7 merge; rebased onto main) | `5e60d13` |
| **#9** | The Helm (Year 3) studio-year design | `9d30040` |
| **#10** | The Life Admin strand (do-it-for-real, just-in-time) | `ede085d` |

The stacked-spec drift that existed during review (Forge/Helm carried an older spec) is **resolved**: there is now one canonical spec on `main` with Ring-1 + Ring-2 applied, and Origin/Forge/Helm are consistent with it.

### Canonical docs on `main` (`docs/design/`)
- `2026-06-24-launch-pad-three-year-story-cycle-v0.1.md` - **the spine.** Locked structure + the appended **"Ring-1 revisions" (2026-08-28)** and **"Ring-2 revisions" (2026-08-31)** doctrine sections. Start here.
- `launch-pad-closing-practice-v0.1.md` - the learner-held re-crossing (the one addition Ring 1 asked for); three fixed spoken prompts, no artifact ever.
- `launch-pad-somatic-floor-grammar-v0.1.md` - **new (Ring-2):** the one-page choreography of the settle / way-down / exit-ramp + the "marked quiet."
- `launch-pad-life-admin-strand-v0.1.md` - the practical adulting layer (taxes, officialdom, currency-as-skill), do-it-for-real just-in-time.
- Year plans: `2027-2028-...studio-year-plan-v0.3.md` (Origin), `2028-2029-...studio-year-plan-forge-v0.1.md` (Forge), `2029-2030-...studio-year-plan-helm-v0.1.md` (Helm).
- Session day-by-days: Origin `2027-2028-launch-pad-session-{1-7}-day-by-day-v0.1.md`; Forge `2028-2029-launch-pad-forge-session-{1-7}-...`; Helm `2029-2030-launch-pad-helm-session-{1-7}-...`.
- Supporting: the referral pathway (`2027-2028-...coach-not-therapist-referral-pathway-v0.1.md`), the closing feast, the dream map / 100-dreams card.

---

## 2. The review arc (COMPLETE - closed - do not reopen)

**Nine circles + three leadership decisions + a curation pass. Every ring of the fleet has reviewed this design.** **Standing policy (Picard v1, reaffirmed v2 + v3): no further whole-body review of any ring, kind, or composition before a real Origin session runs. The burden of proof is now on any asker to name a *class* of risk no prior circle addressed - and after nine circles, there is none.** The three predictable Ring-4 temptations are refused on sight: a follow-up circle on the accountability node (it's one name on paper); a re-review of the Family Charter (a draft goes to counsel, not a circle); "confirm the accessibility fixes landed" (that's a line in the pilot debrief). New-class risk now lives only in a real teenager's face, which no circle can see.

- **Ring 1** - PDC, SSC, COC (26 agents) + leadership v1. Sheets: `evoke-agents-backup/agents/meetings/2026/08/2026-08-28-{pdc,ssc,coc}-launch-pad-*.md` + `-leadership-launch-pad-decision-and-priorities.md`.
- **Ring 2** - OIG, TCC (9/9), MAC (8/8) + leadership v2 (Ring-2 close). Sheets: `2026-08-29-{oig,tcc}-launch-pad-*.md`, `2026-08-31-mac-launch-pad-mythic-arts-review.md`, `2026-08-31-leadership-launch-pad-ring2-close-decision.md`.
- **Ring 3** - CGC (governance, 10), IW (partnerships/culture, 8), Chekov (accessibility) + leadership v3 (the final close) + the curation pass. Sheets: `2026-08-31-cgc-launch-pad-governance-review.md`, `2026-09-01-iw-launch-pad-interdependence-review.md`, `2026-09-01-leadership-launch-pad-ring3-close-decision.md`.

**The unanimous call:** the skeleton is sound; the medicine is subtraction + the one addition (the closing practice); the pen-and-paper pilot has zero attack surface. The Ring-1/2 buildable subset (fixed closing prompts, Vineyard-in-Origin, season-scale re-crossing, "The Curious No," the two-worlds hinge, the daily-ritual through-line, crew-not-watch, "deliberately NOT built") is already in the merged docs. The Ring-3 additions are curated below (§6).

**The one strategic thing (every ring converged - understood in full only after Ring 3):** the program is one human being wide, and **protecting the guide is THREE obligations, not one - wellbeing (Rings 1-2), external accountability over ungoverned power (CGC), and reciprocity + transmissibility (IW).** Every remedy through v2 kept the monarch *healthy*; none put a decision beyond her sole reach. Protect her all three ways, or nothing else in the gate lists means anything.

---

## 3. The two clocks (they never touch)

### Clock A - the pilot morning (upstream of all software; nothing blocks it)
One real Origin Session 1 - "The Map of Me," the 100 Dreams - 2-4 real teenagers, one morning, **Salus + Jake in the room as the safety pair** (this *is* the binding real-learner walk, run as the pilot). Gated only on:
1. Referral pathway live (named clinician, same-week warm handoff).
2. Consent for this session's content - given against the **one-page Family note** (§6: what this is/isn't, the honest access statement, credential honesty, how you leave/how removal works). *Consent that hides its limits is not consent.*
3. A crisis-concurrency answer for that morning (one named reachable adult on paper).
4. A runnable somatic settle/way-down/exit-ramp (the one-page grammar, or a draft).
5. The closing-practice draft in hand (prompts already fixed in the merged doc).
6. "The Curious No" in the guide's hand (the decline primitive - the thing the pilot exists to test).
7. The **external-accountability node named** (for the pilot: Salus + Jake in the room - and watch whether either could actually stop the founder mid-morning).
8. The **multi-modal-capture sentence** ready to say on Day 1 ("the Log is captured however you hold it - written, spoken, drawn, dictated, or told to a scribe; no form is the lesser Log").

**Watch (observations, not gates) - what the pilot is actually FOR** (Naomi: the pilot cannot *validate* the sovereignty claim, because the first learners - the founder's child, the community's children - structurally cannot freely decline; so watch, don't conclude): (a) does the guide *meet* the first "no" or *manage* it (Vic); (b) does the settle land in a real body (Chapel/McCoy); (c) could Salus/Jake actually stop the founder (CGC); (d) could the first learners *freely* decline (Naomi); (e) could every learner have said *yes in the first place* (Chekov - "the learner who quietly could not participate never says no; they just don't come back"). The pilot is a mirror on the founder's own capacity to be told "no" by a child who adores her.

### Clock B - real software touching a real minor's record (2027+; fleet-built, off the guide)
The TCC gate list (G1-G8), tracked in the leadership v2 decision - **not** on the pilot's clock and **not** the operator's. Queue-jumper: the live `notifications_insert_any` / `from_id`-spoof HIGH is a defect in the **current Compass** real Vibrant Life children use today; route it to the Compass security queue now, not parked behind 2027.

---

## 4. What is owed (not blocking the pilot; on their own clocks)

**Europa's founder decisions (not auto-executed):**
- [ ] Author + sign the **pre-dated honorable-defer blessing**, this season, while rested (P0-2, now the *first* Tier-0 item; co-signed by Cura + Picard).
- [ ] Decide the **second-adult question** honestly - commit to the pair, or design the graceful degradation of solo.
- [ ] Give the go to recruit the 2-4-teenager pilot cohort and **book the morning** (a date within ~3 weeks; three calls: clinician, Salus+Jake, the families).
- [ ] Engage the **Idaho attorney** (G1 - the long pole; the one gate the fleet cannot self-certify).

**Fleet cold-build (off the guide, before software touches a minor):**
- [ ] TCC gates G1-G8 (access model `ended_at`/`active`; the `from_id`-stamped SECURITY DEFINER notification insert; encrypt-at-rest + fail-soft decrypt; delete `migrate.js` exportToSQL; session-timeout + login recovery; CSP; mentor-safeguarding ledger; counsel). See the leadership v2 decision.
- [ ] Stacked-branch note: N/A now (all merged); the Tue/Thu weekly-rhythm reconciliation propagated with the merge.

**Design build-forward (light, seeds into the Origin build; not blocking):**
- [ ] Per-season day-level wording for the season-scale closing re-crossing (named at plan level; day-level is a further pass).
- [ ] The chosen/forward-lineage door copy (Stirps read) + the between-season integration fallow day-level wording.
- [ ] The Salus + Jake consented real-learner walk verifies the felt experience (only knowable in a real room) - run it *as* the pilot.
- [ ] The Ring-3 curation writing pass (§6) - two spec additions + four short docs.

---

## 5. The Ring-3 curation - ELEVATE / POLISH / LOGGED (leadership curation pass, 2026-09-01)

Picard, Sisko, Cura, Impetus curated the whole nine-ring corpus into what to **elevate** (make permanent), **polish** (reconcile into one clean statement), and **leave logged** (real, recorded, not built now). *A curation that elevates everything has curated nothing.* This section is the permanent record; the pass produces this and stops.

### ELEVATE - into the spec as permanent doctrine (the vital few, alongside the six refusals)
Author a **"Ring-3 revisions (2026-09-01)" doctrine section** in the spine, carrying:
- **D1 - Protecting the guide is three obligations** (wellbeing / accountability / transmission). The load-bearing assumption under every other gate; a nap secures only the first.
- **D2 - Consent that hides its limits is not consent.** Governs every enrollment conversation (the access statement, credential honesty, the removal policy are its instances).
- **D3 - The program measures the learner's growing *independence from* the guide, not only the guide's depletion** (the Unnecessity Check as doctrine - the mission's no-dependency red line turned inward).
- **D4 - The sovereignty claim cannot be validated by this cohort; name the limit** (inoculation against premature virtue-certainty).
- Plus the arc-grammar adds: **multi-modal capture is law** + a non-verbal channel into every circle (Chekov); **name the worldview** as a chosen frame + the lineage-relationship spectrum (Martok); the **generative-theme vs. codification-to-a-conclusion** distinction (Janice); the L0 twin rule **"open no wider between people than you can repair"** (Winona).

### ELEVATE - into Europa's hands & heart (carry, do not delegate)
1. The pilot is a **mirror on your capacity to be told "no" by a child who adores you** - watch your own face.
2. **Name the one external adult who can tell you you're wrong** and bind yourself to obey them (the accountability node, aimed at you).
3. The **multi-modal-capture sentence, memorized**, for Origin Day 1 - the one finding that decides whether a specific child is locked out of their own Log.

### POLISH - reconcile duplicates into one clean statement each
- The **external-accountability node** = ONE role (Safeguarding Circle = Named Outside Ear = Third Chair = Article-IV holder → one sentence in the spec, not four names).
- **Guide-protection** = presented under D1's three headings (not a scattered dozen instruments); the receiving/transmission tools (Unnecessity Check, Table that Feeds the Guide, Field Journal, Successor Envelope) sit under it.
- The **refusal wall = one voice, one pass**: deliberately NOT built + NOT shown (Pulaski) + NOT licensed open (Amanda) + federation refusals (Rom). Near-free locks to write now: the multi-modal-capture line; the Unnecessity Check (never written - guardrail attached); the confidence-covenant (Winona).

### The documents to write (Sisko - two spec additions + four short docs; the whole authoring list)
1. **In-spec:** the "Ring-3 revisions" doctrine section (above).
2. **In-spec (or one short standalone):** the "Deliberately NOT built / NOT shown / NOT licensed" wall - one pass, before the pilot (the most photogenic morning arrives before any wall exists).
3. **New:** the one-page Family note (pilot version of the Charter - limits/access/credential/exit/removal).
4. **New (authored while rested, co-signed Cura + Picard):** the one-season guide packet - defer blessing + Successor Envelope + Unnecessity Check.
5. **Blank paper:** the Guide's Field Journal (one line telling her to start it - hers, no read endpoint).
6. **Ephemeral:** the pilot debrief card (spoken, same-day, thrown away - never a file).

### LOGGED - real, recorded, NOT built now (over-elevation guard; "seed, don't perfect")
The stratified license (**after** the pilot proves the practice; can't license a safety floor you haven't stood on - the single sharpest over-elevation risk); the full countersigned Family Charter (pilot runs on the one-pager); the full Safeguarding-Circle charter + governed removal (before a *second* guide/cohort); the partner-tier framework (the pilot needs one partner - the clinician); grant-funding governance (no money to govern; learner-outcome-reporting grants refused as architecture); the Council of Traditions + Kohlberg apparatus (name the worldview now; log the system for the Helm year); First-Inheritance/amendment doctrine (spoken, not a doc); federation (no substrate until a second studio). *The Cohort Call, the Re-Crossing, the Guest Chair, "The Passing" are P1 paper primitives - seed as one page each; let the room pull which ones the design actually needs.*

### What Europa owes herself (Cura's ruling - not nice-to-haves; the reciprocity leg of D1)
- **The Guide's Field Journal** - start this week, cost-free.
- **The Unnecessity Check** - in your heart, spoken once a season to one other adult, never written.
- **The Table that Feeds the Guide** - one seeded date a season where you receive and bring nothing (Kasidy: "if you build only one thing, build this").

---

## 6. The next step

**Europa's one-week path (leadership v3 + curation):** while rested, sign the honorable-defer blessing + author the Successor Envelope + name the one external adult who can tell you you're wrong (one sitting, ~20 min, co-signed Cura + Picard); start the Field Journal; three calls (clinician, Salus+Jake, families) → **pick a date within 3 weeks**; one email to the Idaho attorney (G1); route the `notifications` defect to the Compass security queue; one short writing pass (the one-page Family note + the "deliberately NOT" wall).

**Then: book one real Origin Session 1** - pen, paper, 100 Dreams, 2-4 real teenagers, one morning, Salus + Jake as the safety pair. Route what it shows to a short honest spoken debrief **in the room, same day** (the watch-questions in §3) - **not to a file, not to a new circle.** Then present the improved design to Jenna and Jaxton (15).

**Curation tripwire (Impetus):** when this handoff carries the elevate/polish/logged split (§5) and a date is on the calendar, the curation is done and the review body stays closed. A date on the calendar is the real tripwire - reviewing cannot survive contact with a booked room.

*Anti-review invariant: a review requires new-class risk, not new detail. The summit is mapped. Walk the trailhead.*

---

*"We evoke - we never extract."*
