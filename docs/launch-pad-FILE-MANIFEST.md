# The Launch Pad - every file, with its path

Generated from disk by `docs/build-file-manifest.py`. Nothing here is hand-maintained;
re-run the script rather than editing this file, and run it with `--check` to find out
whether it has gone stale.

Two roots:

- **`/Users/europa/Code/vibrant-life-compass/docs/`** - the program itself (sources, artwork, built PDFs, build scripts)
- **`/Users/europa/Code/evoke-agents-backup/agents/`** - the fleet review record (minutes, decision logs)

---

## 1. Print these (built PDFs)

### Reading copies
```
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/pdf/The-Forge-Year-Lesson-Plan-Book.pdf
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/pdf/The-Helm-Year-Lesson-Plan-Book.pdf
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/pdf/The-Origin-Year-Lesson-Plan-Book.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/00-launch-pad-the-story-and-the-floor.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/01-origin-year-2027-2028.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/02-forge-year-2028-2029.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/03-helm-year-2029-2030.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/10-launch-pad-three-lesson-plan-books.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/20-2026-06-25-launch-pad-overview-one-pager.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/20-The-Launch-Pad-Parent-Information-Poster-v2.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/20-The-Launch-Pad-Poster-v2.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/20-The-Launch-Pad-Story-Poster-StarMap.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/20-The-Launch-Pad-Story-Poster.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/20-family-note-PILOT-MORNING.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/30-site-walk-sheet.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/31-pilot-morning-call-sheet.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/40-the-first-conversation.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/41-access-statement-WORKING-DRAFT.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/42-promotion-and-the-not-shown-wall.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/43-the-ballast-and-open-days.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/44-the-familys-path.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/50-jenna-the-door-agenda.pdf
```

### Spiral-bindable copies
```
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/pdf/The-Forge-Year-Lesson-Plan-Book-SPIRAL.pdf
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/pdf/The-Helm-Year-Lesson-Plan-Book-SPIRAL.pdf
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/pdf/The-Origin-Year-Lesson-Plan-Book-SPIRAL.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/00-launch-pad-the-story-and-the-floor-SPIRAL.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/01-origin-year-2027-2028-SPIRAL.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/02-forge-year-2028-2029-SPIRAL.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/03-helm-year-2029-2030-SPIRAL.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/10-launch-pad-three-lesson-plan-books-SPIRAL.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/40-the-first-conversation-SPIRAL.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/42-promotion-and-the-not-shown-wall-SPIRAL.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/43-the-ballast-and-open-days-SPIRAL.pdf
/Users/europa/Code/vibrant-life-compass/docs/portfolio/44-the-familys-path-SPIRAL.pdf
```

Family-shareable: `10-...three-lesson-plan-books`, the three designed `The-*-Year-Lesson-Plan-Book` files, and the `20-` posters, one-pager and family note. Everything else carries fleet names and is guide-facing. `41-access-statement` is a working draft that prints with NOT FOR FAMILIES on its title page, and is never spiral-bound.

---

## 2. Rebuild them

```
docs/portfolio/build-portfolio.sh              # volumes + the door, reading copies
docs/portfolio/build-portfolio.sh --spiral     # same, bindable
python3 docs/lesson-plans/pdf/build_pdf.py all           # designed year books
python3 docs/lesson-plans/pdf/build_pdf.py all --spiral  # same, bindable
python3 docs/build-file-manifest.py            # this file
```

Needs pandoc and WeasyPrint. Paths for both are at the head of `build-portfolio.sh`.

### Build scripts, styles, and intermediates
```
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/README.md
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/pdf/The-Forge-Year-Lesson-Plan-Book-SPIRAL.html
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/pdf/The-Forge-Year-Lesson-Plan-Book.html
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/pdf/The-Helm-Year-Lesson-Plan-Book-SPIRAL.html
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/pdf/The-Helm-Year-Lesson-Plan-Book.html
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/pdf/The-Origin-Year-Lesson-Plan-Book-SPIRAL.html
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/pdf/The-Origin-Year-Lesson-Plan-Book.html
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/pdf/build_pdf.py
/Users/europa/Code/vibrant-life-compass/docs/portfolio/README.md
/Users/europa/Code/vibrant-life-compass/docs/portfolio/build-portfolio.sh
/Users/europa/Code/vibrant-life-compass/docs/portfolio/draft-style.css
/Users/europa/Code/vibrant-life-compass/docs/portfolio/drive-start-here-v2.html
/Users/europa/Code/vibrant-life-compass/docs/portfolio/style-onepager.css
/Users/europa/Code/vibrant-life-compass/docs/portfolio/style-spiral.css
/Users/europa/Code/vibrant-life-compass/docs/portfolio/style.css
/Users/europa/Code/vibrant-life-compass/docs/portfolio/walk-style.css
```

---

## 3. Edit these (markdown sources)

### State of the program
```
/Users/europa/Code/vibrant-life-compass/docs/launch-pad-STATUS-AND-HANDOFF.md
```

### The spine and the shared floor
```
/Users/europa/Code/vibrant-life-compass/docs/design/2026-06-24-launch-pad-three-year-story-cycle-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-closing-practice-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-somatic-floor-grammar-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-life-admin-strand-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-coach-not-therapist-referral-pathway-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-the-guides-own-floor-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2026-07-20-launchpad-entry-thresholds-v1.md
```

### The door
```
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-first-cohort-conversation-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-access-statement-v0.1-DRAFT.md
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-promotion-and-the-not-shown-wall-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-the-ballast-and-open-days-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-the-familys-path-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-family-note-pilot-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-site-walk-sheet-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-pilot-morning-call-sheet.md
/Users/europa/Code/vibrant-life-compass/docs/design/2026-10-20-jenna-the-door-agenda.md
```

### Origin, 2027-2028
```
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/origin-lesson-plan-book.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-closing-feast-boise-tables-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-closing-feast-boise-tables-v0.2.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-session-1-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-session-1-materials-list-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-session-2-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-session-3-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-session-4-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-session-5-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-session-6-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-session-7-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-studio-year-plan-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-studio-year-plan-v0.2.md
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-studio-year-plan-v0.3.md
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-session-3-forks-and-stories-v0.1.md
```

### The Forge, 2028-2029
```
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/forge-lesson-plan-book.md
/Users/europa/Code/vibrant-life-compass/docs/design/2028-2029-launch-pad-forge-session-1-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2028-2029-launch-pad-forge-session-2-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2028-2029-launch-pad-forge-session-3-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2028-2029-launch-pad-forge-session-4-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2028-2029-launch-pad-forge-session-5-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2028-2029-launch-pad-forge-session-6-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2028-2029-launch-pad-forge-session-7-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2028-2029-launch-pad-studio-year-plan-forge-v0.1.md
```

### The Helm, 2029-2030
```
/Users/europa/Code/vibrant-life-compass/docs/lesson-plans/helm-lesson-plan-book.md
/Users/europa/Code/vibrant-life-compass/docs/design/2029-2030-launch-pad-helm-session-1-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2029-2030-launch-pad-helm-session-2-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2029-2030-launch-pad-helm-session-3-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2029-2030-launch-pad-helm-session-4-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2029-2030-launch-pad-helm-session-5-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2029-2030-launch-pad-helm-session-6-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2029-2030-launch-pad-helm-session-7-day-by-day-v0.1.md
/Users/europa/Code/vibrant-life-compass/docs/design/2029-2030-launch-pad-studio-year-plan-helm-v0.1.md
```

### Artwork (HTML sources, and the PDFs they render to)
```
/Users/europa/Code/vibrant-life-compass/docs/design/2026-06-24-launch-pad-jenna-one-pager.html
/Users/europa/Code/vibrant-life-compass/docs/design/2026-06-25-launch-pad-overview-one-pager.html
/Users/europa/Code/vibrant-life-compass/docs/design/2026-06-25-launch-pad-overview-one-pager.pdf
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-100-dreams-card.html
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-five-region-dream-map.html
/Users/europa/Code/vibrant-life-compass/docs/design/2027-2028-launch-pad-year-map.html
/Users/europa/Code/vibrant-life-compass/docs/design/The-Launch-Pad-Parent-Information-Poster-v2.pdf
/Users/europa/Code/vibrant-life-compass/docs/design/The-Launch-Pad-Poster-v2.pdf
/Users/europa/Code/vibrant-life-compass/docs/design/The-Launch-Pad-Story-Poster-Families.pdf
/Users/europa/Code/vibrant-life-compass/docs/design/The-Launch-Pad-Story-Poster-Parents.pdf
/Users/europa/Code/vibrant-life-compass/docs/design/The-Launch-Pad-Story-Poster-StarMap.pdf
/Users/europa/Code/vibrant-life-compass/docs/design/The-Launch-Pad-Story-Poster.pdf
/Users/europa/Code/vibrant-life-compass/docs/design/The-Launch-Pad-Story-for-Jenna.pdf
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-poster-outcomes.html
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-poster-parents-v2.html
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-poster-startrek.html
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-poster-v2.html
/Users/europa/Code/vibrant-life-compass/docs/design/launch-pad-poster.html
```

### Design notes
```
/Users/europa/Code/vibrant-life-compass/docs/design/2026-10-21-poster-re-evaluation-and-rebuild.md
```

---

## 4. The review record
```
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/08/2026-08-28-coc-launch-pad-three-year-review.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/08/2026-08-28-leadership-launch-pad-decision-and-priorities.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/08/2026-08-28-pdc-launch-pad-three-year-holistic-review.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/08/2026-08-28-ssc-launch-pad-three-year-review.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/08/2026-08-29-oig-launch-pad-infrastructure-review.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/08/2026-08-29-tcc-launch-pad-security-review-PARTIAL.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/08/2026-08-29-tcc-launch-pad-security-review.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/08/2026-08-31-cgc-launch-pad-governance-review.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/08/2026-08-31-leadership-launch-pad-ring2-close-decision.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/08/2026-08-31-mac-launch-pad-mythic-arts-review.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/09/2026-09-01-iw-launch-pad-interdependence-review.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/09/2026-09-01-leadership-launch-pad-ring3-close-decision.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/09/2026-09-24-launch-pad-first-cohort-conversation-questionnaire.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/09/2026-09-25-launch-pad-promotion-and-portfolio.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/09/2026-09-25-launch-pad-the-waiting-learner.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/09/2026-09-28-launch-pad-fresh-eyes-review-new-substrate.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/10/2026-10-13-launch-pad-start-here-page-final-check.md
/Users/europa/Code/evoke-agents-backup/agents/meetings/2026/10/2026-10-13-month-one-year-one-book-review.md
```
```
/Users/europa/Code/evoke-agents-backup/agents/decision-logs/2026/09/2026-09-24-launch-pad-first-cohort-conversation-questionnaire.md
/Users/europa/Code/evoke-agents-backup/agents/decision-logs/2026/09/2026-09-25-launch-pad-promotion-and-portfolio.md
/Users/europa/Code/evoke-agents-backup/agents/decision-logs/2026/09/2026-09-25-launch-pad-the-waiting-learner.md
/Users/europa/Code/evoke-agents-backup/agents/decision-logs/2026/09/2026-09-28-launch-pad-fresh-eyes-review-new-substrate.md
/Users/europa/Code/evoke-agents-backup/agents/decision-logs/2026/10/2026-10-13-launch-pad-start-here-page-final-check.md
/Users/europa/Code/evoke-agents-backup/agents/decision-logs/2026/10/2026-10-13-month-one-year-one-book-review.md
/Users/europa/Code/evoke-agents-backup/agents/decision-logs/2026/10/2026-10-16-origin-week-structure-repair.md
/Users/europa/Code/evoke-agents-backup/agents/decision-logs/2026/10/2026-10-19-forge-helm-plain-language-pass.md
/Users/europa/Code/evoke-agents-backup/agents/decision-logs/2026/10/2026-10-19-forge-helm-re-cut-room.md
/Users/europa/Code/evoke-agents-backup/agents/decision-logs/2026/10/2026-10-19-origin-part-3-alignment-read.md
/Users/europa/Code/evoke-agents-backup/agents/decision-logs/2026/10/2026-10-21-session-3-forks-stories-and-the-grid.md
```
---

## 5. Named as owed, does not exist yet

No file for any of these. Four still block the door: a family-facing price, the Successor Envelope, the exceeds-capacity referral list, and the Family Charter with Enrollment Covenant. The one-page Family note, which five documents depended on, now exists and is listed above.

Then, roughly in the order a family will want them: a day on a page, the year calendar, the learner-facing page, the FAQ with a named dual-enrollment owner, the three reply letters, the guide's card, the evening run sheet, the learner's own copy of the six refusals, and the Cohort Call one-pager.

---

## 6. Unfiled

In scope, but no section in the generator claims them. Either file them by adding a
rule in `docs/build-file-manifest.py`, or let them sit here where they can be seen.

```
(none)
```

---

*Written 2026-10-21 by `docs/build-file-manifest.py`. 119 files in scope.*
