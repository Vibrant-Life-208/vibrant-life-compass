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

**Family-shareable folder, 20 October evening.** The stray Google Doc is out: moved to My Drive, not trashed. **Two posters are out as well.** Every family-facing PDF said "ages 15 to 18" when the studio is 16 to 18, and the Families and Parents posters additionally carry a full outcome-promise block (portfolio, resume, referrals, hundreds of hours, "super power," and "exceptional learners"), which is wall item 4 flat out. They were made in June, before the wall existed, and nobody had read them against it. Both moved out of the shared folder; a permissions check confirms Jenna's commenter role came from the folder and left with them, so the card must drop those two links rather than leave her dead ones. The Story Poster, Star Map and overview one-pager were rebuilt, corrected, and **uploaded as new versions on 20 October** through Manage versions, so their file IDs and the card's links survived; all three verified against local by exact byte size afterwards. `The Launch Pad Story`, 24 pages, carried the same outcomes section and **came out of the folder on the same grounds**; its corrected rebuild is committed so the PDF matches its source, but it is not in Drive and the card no longer links it. The Families poster has **no source in the repo**; it cannot be rebuilt without being written again. Replacement card text, including the dropped links, sits in `Jenna card - new text.md` beside the upload sheet, and editing the card in place still needs the Google Docs connector in the chat.

**The posters, 21 October.** The two June posters that came out of the folder are rewritten, not corrected: `design/launch-pad-poster-v2.html` ("Not a high school.") and `design/launch-pad-poster-parents-v2.html` ("We promise the conditions. Never the outcome."), rendered with weasyprint to `The-Launch-Pad-Poster-v2.pdf` and `The-Launch-Pad-Parent-Information-Poster-v2.pdf` and copied as `20-` into the portfolio. Both are built on the 1960 DDB page (picture, one headline, three columns of plain copy, signature) and every sentence on them comes from the wall's §4 list or the Origin book's Part 1. Both pass the build's wall and fleet-name checks. The investigation, the re-evaluation of all four existing pieces (the rocket poster fails wall item 9; the one-pager's three "Ends with" lines are soft outcome promises), the open captain calls (contact line, "a handful" versus the number, the Origin-year guide shape on the parent page) and the owed reads (Naomi, Chekov, Kira, Accord) are in `design/2026-10-21-poster-re-evaluation-and-rebuild.md`. Neither v2 is in Drive yet; the build list no longer copies the Families and Parents June PDFs, though the files stay on disk for the record.

**The three surviving family pieces, corrected again 21 October.** A line-by-line read of the files the card still links found two defects the 20 October age sweep was not looking for. The **Star Map** printed `[ LEARN MORE: CONTACT / QR ]`, a bracketed placeholder, in its footer; it now reads "OPENS AUGUST 2027". The **overview one-pager** carried three "Ends with" lines promising who a learner would become ("the confidence of knowing", "a public talk that makes a room care", "the capacity to make a hard call from principle") plus a June date; the lines now name what the learner does, and the date reads October 2026. Both rebuilt with headless Chrome, the renderer the originals used, and both verified clean on ages, brackets, "formation" and the outcome-word set. **Both went up as new versions the same afternoon** through the Chrome Manage-versions path, verified afterwards through the Drive API: `1wa24_CIuXW5bXA8B-7rKUYHhyjGQC4kn` now reads 725097 bytes and `1Spumxg3Ph_ThKxO1t1EJ75b1xe5MfS0H` reads 399819, each matching its local counterpart exactly, both IDs and both parents unchanged, so every link in Jenna's card survived. Each file now carries three versions in its history. The lesson is the same one the letter-spacing miss taught: a sweep finds what it is looking for and stops. Neither defect was a wall item, so nothing was watching for them.

**Jenna's card now matches the files (21 October).** Three surgical edits went into the live Doc through the Docs editor in the browser, not through a connector, which still does not exist in this chat: the "are being rewritten" clause came out, a paragraph describing the finished pair went in after it, and the rebuild sentence now covers both passes and names what the second one caught. Two went in through Find and replace, each reporting one match and one replacement; the new paragraph was typed at the end of the paragraph above it. Read back through the Drive API afterwards: all three poster links and the doc ID are unchanged. The last two owed passages went in the same afternoon, so **Jenna's card is now fully current and nothing on it is owed.** The calendar section covers all three years, with the Forge and Helm first days and the two New Year collisions named, and a new *What each year asks of me* section sits between the books and the posters, carrying the guide's shape year by year. The calendar pass looked like a section replacement but reduced to three surgical edits, each outside the paragraph's bold runs, so all three bold phrases survived. The new section was the one genuinely structural edit: cursor to the end of the last bullet, two returns to exit the list, Heading 2 by keyboard, then Normal text. Read back through the Drive API afterwards; every one of the seven links is intact.

**The two new posters are in front of Jenna (21 October, captain's call).** Both uploaded to `Launch Pad - FAMILY-SHAREABLE` as new files, not versions, because nothing was there to replace: the poster is `1RKU4e0xd2h--uYgb7bwu6voMh8qxqmr7` at 44064 bytes and the parent information sheet is `19HQ3cBG_ZVeMbW_OzglPZc0JJ2r1PSah` at 45803, each matching local exactly through the Drive API. Jenna's card now links both, bolded like its other links, and its section line reads four posters rather than two. **The wall's section 7 reads are still owed and have not happened** - Naomi, Chekov, Kira, Accord. The captain moved the pair in ahead of them, so rather than let that sit silently in a folder marked family-shareable, the card says it out loud: these have not had their last internal read, treat them as pages shown early rather than ready to hand to a family, and comment if anything is wrong. That sentence is the only thing standing between an unread page and a family, so it should not be edited out until the reads are done.

**A near miss worth keeping.** A Find and replace in that card nearly went into the document instead of the dialog. The browser viewport changed height between sessions, 867 to 811, and coordinates reused from the earlier pass landed in the dead space between the two fields. Focus stayed in the document, `cmd+a` selected the whole card, and the next keystroke would have replaced all of it. It did not, because the stray text went into the Find box instead, which is why the box later showed a sentence from the card's footer and `0 of 0`. The document was checked against the API before anything else and was intact. **Screenshot the dialog and read its coordinates before every click; never reuse coordinates across sessions.**

**The file manifest generates itself now (21 October).** `docs/build-file-manifest.py` writes `launch-pad-FILE-MANIFEST.md` from disk, and `--check` exits non-zero when the file has gone stale, which is the part worth wiring into a habit. The manifest had claimed for weeks to be generated while no generator existed, so it had drifted in both directions at once: it listed a spiral edition of the access statement that the build deliberately refuses to make, and it was missing nine fleet decision logs, the pilot morning call sheet, the door agenda, four stylesheets the build needs by name, and the family note. The one gap the script cannot close by itself is fleet naming. The October rooms are titled by the year under review rather than by the programme, so the glob list in `FLEET_PATTERNS` needs tending; a Launch Pad room named something new goes missing silently, and that is the only drift `--check` cannot see.

**One editor behaviour worth remembering.** This Doc uses straight apostrophes throughout, and the Docs editor has smart quotes on, so anything typed into the page is auto-curled and has to be put back. Text inserted through Find and replace is not auto-curled. Prefer Find and replace whenever the new text contains an apostrophe.

**A method note that cost three wrong counts today.** Letter-spacing in the posters splits `A G E S 1 5` so a plain grep reads them clean, and `informational` contains `formation` as a substring so a plain grep reads them dirty. Strip whitespace and match whole words before reporting any count off these PDFs. The first pass said five of six; the true number was six of six.

**A third Drive folder, 2026-10-21: `Launch Pad - the four gates`** (`16Yiec1OnIjiy4ZScQACfpSHalHgP8032`), shared with `vibrantlife208@gmail.com` at **commenter**. It exists because slide 10 of the Jenna deck names the four things that gate everything, and three of them lived only in GUIDE ONLY, which is shared with nobody, while the fourth was not in Drive at all. Linking them from the deck would have given her three "request access" screens and one dead link. **Three of those four came back out the same evening.** The copies were fine as copies and wrong as shares: `40-the-first-conversation` carries Accord, Chekov, Cura, Jake, Kira, Naomi and Salus; `41-access-statement` carries Accord, Chekov, Kira and Salus; `42-the-not-shown-wall` carries all seven. The first-conversation document still says "Salus and Jake in the room" in its own §0, the same error corrected in the call sheet on 20 October. **The family-tier check could never have caught this**, because it globs `10-*.pdf` and `20-*.pdf` only, and these are 40-, 41- and 42-. Hand-copying guide-tier files into a shared folder walks around the two-tree architecture entirely, and nothing in the build is watching that path. Only the Family note remains in the folder; it passes the check. The card and deck slide 10 now point at the **folder** rather than at four files, so the links stay correct as the other three are made readable and added back. The folder was, before the pull: `1 - Access statement (WORKING DRAFT, not yet published)`, `2 - Family note, pilot morning (blanks not yet filled)`, `3 - The wall - what we never show`, `4 - The first conversation, with the fit signs`. The titles carry the unfinished state on purpose, because the slide's row says these get *published* by November and two of the four are not finished. Deck slide `timeline` now links all four, and its speaker note says to read them as they stand. **Copies drift:** when the access statement publishes or the Family note's blanks are filled, the copy in this folder needs replacing too, not just the original.

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
