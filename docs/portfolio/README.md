# The Launch Pad Portfolio - printed years

Built by `build-portfolio.sh` from the markdown sources in `../design/` and `../lesson-plans/`. Re-run the script after any edit; the PDFs here are outputs, not sources.

```
docs/portfolio/build-portfolio.sh
```

Requires pandoc and WeasyPrint (see the script header for the paths on Europa's Mac).

## What is in the box

| File | What it is | Share with families? |
|---|---|---|
| `00-launch-pad-the-story-and-the-floor.pdf` | Volume 0. The three-year spine with its Ring-1/Ring-2 doctrine, the closing practice, the somatic floor grammar, the Life Admin strand, the referral pathway, the guide's own floor, the entry thresholds, the first-cohort conversation, and the promotion plan with the "not shown" wall | **No.** Internal design archive; carries fleet review language and agent names |
| `01-origin-year-2027-2028.pdf` | Volume 1. The Origin lesson plan book, the studio year plan v0.3, sessions 1-7 day by day, the Session 1 materials list, the closing feast | Lesson plan book yes; the rest is internal (agent names in the design docs) |
| `02-forge-year-2028-2029.pdf` | Volume 2. The Forge lesson plan book, the Forge year plan, sessions 1-7 day by day | Same split as Volume 1 |
| `03-helm-year-2029-2030.pdf` | Volume 3. The Helm lesson plan book, the Helm year plan, sessions 1-7 day by day | Same split as Volume 1 |
| `10-launch-pad-three-lesson-plan-books.pdf` | The three lesson plan books alone, one bound set | **Yes.** Written so a learner can read every page; zero fleet names (verified 2026-09-25) |
| `20-The-Launch-Pad-Story-Poster*.pdf`, `20-*-overview-one-pager.pdf`, `20-The-Launch-Pad-Story-for-Jenna.pdf` | The posters and one-pagers already rendered in `../design/` | Yes (poster, families, parents, star map, one-pager); the Jenna deck is for Jenna |
| `30-site-walk-sheet.pdf` | A working form, not a document. Carry it round the studio with a tape measure, fill in the blank columns, and the access statement's *The space* section writes itself from what you wrote | No. It is a tool for the guide |
| `40-the-first-conversation.pdf` · `41-access-statement-WORKING-DRAFT.pdf` · `42-promotion-and-the-not-shown-wall.pdf` · `43-the-ballast-and-open-days.pdf` · `44-the-familys-path.pdf` | The door, each document standalone so you print the one you need instead of Volume 0. 7 to 10 pages each | **No.** All five carry fleet names (12 to 16 hits each, verified 2026-10-03). `41` prints with NOT FOR FAMILIES on its title page and stays that way until the five blocking items close |

## Spiral edition

```
docs/portfolio/build-portfolio.sh            # reading copies
docs/portfolio/build-portfolio.sh --spiral   # bindable copies -> *-SPIRAL.pdf
```

Every volume and every standalone document has a spiral-bindable twin. Same content, same design, different geometry, written to its own filenames so the reading copies are never touched.

| Spiral file | Pages |
|---|---|
| `00-launch-pad-the-story-and-the-floor-SPIRAL.pdf` | 114 |
| `01-origin-year-2027-2028-SPIRAL.pdf` | 94 |
| `02-forge-year-2028-2029-SPIRAL.pdf` | 68 |
| `03-helm-year-2029-2030-SPIRAL.pdf` | 78 |
| `10-launch-pad-three-lesson-plan-books-SPIRAL.pdf` | 78 |
| `40-` through `44-` (the door, each standalone) | 8 to 10 |

What changes, and only this:

- **Mirrored gutter.** Binding edge 1.2in, outside edge 0.65in. Recto pages are bound on the left, verso on the right, so the punch never eats text.
- **Folios move to the outside edge**, where a thumb finds them, instead of sitting beside the coil.
- **Even page count, always.** The build renders, counts, and pads with one blank when the body lands odd, so the last sheet never carries a stray recto with nothing on its back.
- **A ruled Notes page at the back** of each volume.

Geometry lives in `style-spiral.css`. The three lesson plan books have their own designed spiral build in `../lesson-plans/pdf/` via `build_pdf.py all --spiral`; use those rather than `10-` if you want the warm covers and the per-year accent.

Posters, the one-pagers and the site walk form are single sheets or a fill-in form, so the spiral pass skips them.

**What to tell the print shop:** US Letter, double-sided, black spiral or wire-o on the long edge, card stock front and back, no trimming. The gutter is already in the file, so ask them not to scale or shift the pages.

## Tiers, verified

Two tiers, and the separation is checked rather than assumed. Re-verified 2026-10-03 after the 40-series was added:

- **Family-shareable:** `10-` (the three lesson plan books, **0 fleet-name hits**) plus the `20-` posters and one-pager.
- **Internal:** `00-03` (the design volumes), `30-` (a guide's tool), `40-44` (the door). Every one carries fleet review language or fleet names by construction.

Nothing in the family tier was authored for the door. A family can currently be handed the books and the posters, and nothing else.

To re-check the separation after any edit:

```
pdftotext 10-launch-pad-three-lesson-plan-books.pdf - | grep -cE 'Salus|Chekov|Kira|Accord|Comes|Naomi|Cura|Ibn Khaldun'
```

## Printing notes

- Letter size, 0.9 in margins, page numbers bottom center. Each source document starts on a new page; the table of contents lists them.
- The family-shareable set is `10-` plus the `20-` posters and one-pager. Hand a family the books, not the archive.
- The design volumes (`00-03`) are the guide's working reference and the record of how the design was reviewed. They are honest but not written for a family's eyes.
- The promotion plan's "not shown" wall governs anything printed for outreach: no learner's face, story, or number appears in any of these.

## Sources

- Spine: `design/2026-06-24-launch-pad-three-year-story-cycle-v0.1.md`
- Lesson plan books: `lesson-plans/{origin,forge,helm}-lesson-plan-book.md`
- Year plans and day-by-days: `design/2027-2028-*`, `design/2028-2029-*`, `design/2029-2030-*`
- The door: `design/2027-2028-launch-pad-first-cohort-conversation-v0.1.md`
- Promotion: `design/launch-pad-promotion-and-the-not-shown-wall-v0.1.md`
- Status: `launch-pad-STATUS-AND-HANDOFF.md`
