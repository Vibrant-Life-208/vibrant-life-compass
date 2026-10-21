#!/usr/bin/env python3
"""Write docs/launch-pad-FILE-MANIFEST.md from what is actually on disk.

    python3 docs/build-file-manifest.py            # write the manifest
    python3 docs/build-file-manifest.py --check    # exit 1 if it is out of date

The manifest claimed for weeks to be "generated from disk" while no generator
existed, so it drifted: it listed three files that had been pulled, missed two
posters and a family note, and named a spiral edition the build deliberately
refuses to produce. This is the generator that makes the claim true.

HOW IT DECIDES WHAT GOES WHERE

Two steps, both deliberate.

1. SCOPE. docs/portfolio/ and docs/lesson-plans/ are Launch Pad in their
   entirety, so everything under them is in scope. docs/design/ is shared with
   the Compass work (154 files, only 63 of them Launch Pad), so a file there is
   in scope when its name carries "launch pad" in some spelling, or when it is
   named in DESIGN_EXTRAS below.

2. FILING. Sections are tried in order and the first one that claims a file
   wins, so a file appears exactly once. Most sections are patterns. Two, the
   spine and the door, are hand-ordered lists, because no pattern distinguishes
   a door document from any other launch-pad-*.md.

WHAT ACTUALLY CATCHES DRIFT

`--check` does, and it is the part worth wiring into a habit. It regenerates
into memory, compares against the file on disk ignoring only the dateline, and
exits 1 on any difference. That covers both directions: a file added and not
listed, and a file listed after being deleted. Verified against both.

"Unfiled" is a second, weaker net. Two sections are catch-alls within their own
directory, Artwork for design/*.html and *.pdf and Design notes for design/*.md,
so a new design document is filed rather than flagged. Unfiled therefore only
collects something genuinely unanticipated, such as a new file type or a new
subdirectory. Do not rely on it to notice a new markdown doc; rely on --check,
and then decide which section the new file actually belongs in.

A path that does not exist cannot be printed, because the script only ever
emits what it globbed. The old file listed a spiral edition of the access
statement that the build deliberately refuses to produce; that class of error
is now impossible.
"""

import os
import re
import sys
from datetime import date
from pathlib import Path

DOCS = Path(__file__).resolve().parent
REPO = DOCS.parent
OUT = DOCS / "launch-pad-FILE-MANIFEST.md"

# The fleet review record lives in a separate repo beside this one. Override
# with FLEET_AGENTS_DIR when it sits somewhere else; skipped when absent.
AGENTS = Path(
    os.environ.get("FLEET_AGENTS_DIR", REPO.parent / "evoke-agents-backup" / "agents")
)

# Launch Pad files in docs/design/ whose names do not say so.
DESIGN_EXTRAS = {
    "2026-10-20-jenna-the-door-agenda.md",
    "2026-10-21-poster-re-evaluation-and-rebuild.md",
}

LAUNCH_PAD_NAME = re.compile(r"launch.?pad", re.IGNORECASE)

# Fleet minutes and decision logs do not name the programme consistently. The
# October rooms are titled by the year under review (origin, forge, helm) or by
# the artifact, so globbing "launch-pad" alone missed five of them. Each pattern
# below was checked against the whole fleet record for false positives and had
# none, but this list needs tending: a Launch Pad room named something new will
# be silently absent, and that is the one kind of drift --check cannot see.
FLEET_PATTERNS = [
    "*launch-pad*",
    "*origin*",
    "*forge*",
    "*helm*",
    "*year-one-book*",
    "*session-3-forks*",
]

# Hand-ordered because no pattern separates these from any other design doc.
SPINE = [
    "design/2026-06-24-launch-pad-three-year-story-cycle-v0.1.md",
    "design/launch-pad-closing-practice-v0.1.md",
    "design/launch-pad-somatic-floor-grammar-v0.1.md",
    "design/launch-pad-life-admin-strand-v0.1.md",
    "design/2027-2028-launch-pad-coach-not-therapist-referral-pathway-v0.1.md",
    "design/2027-2028-launch-pad-the-guides-own-floor-v0.1.md",
    "design/2026-07-20-launchpad-entry-thresholds-v1.md",
]

DOOR = [
    "design/2027-2028-launch-pad-first-cohort-conversation-v0.1.md",
    "design/launch-pad-access-statement-v0.1-DRAFT.md",
    "design/launch-pad-promotion-and-the-not-shown-wall-v0.1.md",
    "design/launch-pad-the-ballast-and-open-days-v0.1.md",
    "design/launch-pad-the-familys-path-v0.1.md",
    "design/launch-pad-family-note-pilot-v0.1.md",
    "design/launch-pad-site-walk-sheet-v0.1.md",
    "design/launch-pad-pilot-morning-call-sheet.md",
    "design/2026-10-20-jenna-the-door-agenda.md",
]


def in_scope(rel: str) -> bool:
    if rel.startswith(("portfolio/", "lesson-plans/")):
        return True
    if rel.startswith("design/"):
        name = Path(rel).name
        return bool(LAUNCH_PAD_NAME.search(name)) or name in DESIGN_EXTRAS
    # Top-level docs/*.md: only the Launch Pad ones, and never this manifest.
    if "/" not in rel and rel.endswith(".md"):
        return rel.startswith("launch-pad-") and rel != OUT.name
    return False


def collect() -> list:
    found = []
    for dirpath, dirnames, filenames in os.walk(DOCS):
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]
        for fn in filenames:
            if fn.startswith("."):
                continue
            rel = str((Path(dirpath) / fn).relative_to(DOCS))
            if in_scope(rel):
                found.append(rel)
    return sorted(found)


def main() -> int:
    check = "--check" in sys.argv
    pool = set(collect())
    claimed = set()

    def take(pred, order=None):
        """Claim every unclaimed file matching pred. First section wins."""
        hits = [r for r in sorted(pool - claimed) if pred(r)]
        if order:
            ranked = {p: i for i, p in enumerate(order)}
            hits.sort(key=lambda r: (ranked.get(r, len(order)), r))
        claimed.update(hits)
        return hits

    def listed(paths):
        """Only the ones that exist; a missing path is simply never printed."""
        return [p for p in paths if p in pool]

    pdf = lambda r, d: r.startswith(d) and r.endswith(".pdf")
    spiral = lambda r: r.endswith("-SPIRAL.pdf")

    reading = take(
        lambda r: (pdf(r, "portfolio/") or pdf(r, "lesson-plans/pdf/")) and not spiral(r)
    )
    bindable = take(
        lambda r: (pdf(r, "portfolio/") or pdf(r, "lesson-plans/pdf/")) and spiral(r)
    )
    # Deliberately not .md under lesson-plans/: the three year books are sources,
    # and they belong to their year's section further down.
    tooling = take(
        lambda r: (
            r.startswith("portfolio/") and r.endswith((".sh", ".css", ".md", ".html"))
        )
        or (r.startswith("lesson-plans/pdf/") and r.endswith((".py", ".html")))
        or r == "lesson-plans/README.md"
    )
    state = take(lambda r: "/" not in r and r.endswith(".md"))
    # Before the year sections, so a dated poster or card is filed as artwork
    # rather than swept into the year its filename happens to start with.
    artwork = take(lambda r: r.startswith("design/") and r.endswith((".html", ".pdf")))
    spine = take(lambda r: r in set(listed(SPINE)), order=SPINE)
    door = take(lambda r: r in set(listed(DOOR)), order=DOOR)
    origin = take(
        lambda r: r == "lesson-plans/origin-lesson-plan-book.md"
        or r.startswith("design/2027-2028-launch-pad-")
        or r == "design/launch-pad-session-3-forks-and-stories-v0.1.md",
        order=["lesson-plans/origin-lesson-plan-book.md"],
    )
    forge = take(
        lambda r: r == "lesson-plans/forge-lesson-plan-book.md"
        or r.startswith("design/2028-2029-launch-pad-"),
        order=["lesson-plans/forge-lesson-plan-book.md"],
    )
    helm = take(
        lambda r: r == "lesson-plans/helm-lesson-plan-book.md"
        or r.startswith("design/2029-2030-launch-pad-"),
        order=["lesson-plans/helm-lesson-plan-book.md"],
    )
    notes = take(lambda r: r.startswith("design/") and r.endswith(".md"))
    unfiled = sorted(pool - claimed)

    def block(paths, root=DOCS):
        if not paths:
            return "```\n(none)\n```"
        body = "\n".join(str(root / p) for p in paths)
        return "```\n" + body + "\n```"

    def fleet(sub):
        base = AGENTS / sub
        if not base.is_dir():
            return []
        hits = set()
        for pattern in FLEET_PATTERNS:
            hits.update(str(p) for p in base.rglob(pattern) if p.is_file())
        return sorted(hits)

    meetings, decisions = fleet("meetings"), fleet("decision-logs")

    out = f"""# The Launch Pad - every file, with its path

Generated from disk by `docs/build-file-manifest.py`. Nothing here is hand-maintained;
re-run the script rather than editing this file, and run it with `--check` to find out
whether it has gone stale.

Two roots:

- **`{DOCS}/`** - the program itself (sources, artwork, built PDFs, build scripts)
- **`{AGENTS}/`** - the fleet review record (minutes, decision logs)

---

## 1. Print these (built PDFs)

### Reading copies
{block(reading)}

### Spiral-bindable copies
{block(bindable)}

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
{block(tooling)}

---

## 3. Edit these (markdown sources)

### State of the program
{block(state)}

### The spine and the shared floor
{block(spine)}

### The door
{block(door)}

### Origin, 2027-2028
{block(origin)}

### The Forge, 2028-2029
{block(forge)}

### The Helm, 2029-2030
{block(helm)}

### Artwork (HTML sources, and the PDFs they render to)
{block(artwork)}

### Design notes
{block(notes)}

---

## 4. The review record
{block(meetings, Path("/")) if meetings else "```\n(fleet record not found at " + str(AGENTS) + ")\n```"}
{block(decisions, Path("/")) if decisions else ""}
---

## 5. Named as owed, does not exist yet

No file for any of these. Four still block the door: a family-facing price, the Successor Envelope, the exceeds-capacity referral list, and the Family Charter with Enrollment Covenant. The one-page Family note, which five documents depended on, now exists and is listed above.

Then, roughly in the order a family will want them: a day on a page, the year calendar, the learner-facing page, the FAQ with a named dual-enrollment owner, the three reply letters, the guide's card, the evening run sheet, the learner's own copy of the six refusals, and the Cohort Call one-pager.

---

## 6. Unfiled

In scope, but no section in the generator claims them. Either file them by adding a
rule in `docs/build-file-manifest.py`, or let them sit here where they can be seen.

{block(unfiled)}

---

*Written {date.today().isoformat()} by `docs/build-file-manifest.py`. {len(pool)} files in scope.*
"""

    if check:
        current = OUT.read_text() if OUT.exists() else ""
        # The dateline moves every day; compare everything else.
        strip = lambda t: re.sub(r"^\*Written \d{4}-\d{2}-\d{2} ", "*Written ", t, flags=re.M)
        if strip(current) == strip(out):
            print(f"manifest is current ({len(pool)} files in scope)")
            return 0
        print("manifest is STALE - run: python3 docs/build-file-manifest.py", file=sys.stderr)
        return 1

    OUT.write_text(out)
    print(f"wrote {OUT.relative_to(REPO)} - {len(pool)} files in scope, {len(unfiled)} unfiled")
    if unfiled:
        print("unfiled (no section claims these):", file=sys.stderr)
        for r in unfiled:
            print(f"  {r}", file=sys.stderr)
    if not meetings and not decisions:
        print(f"note: no fleet review record found at {AGENTS}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
