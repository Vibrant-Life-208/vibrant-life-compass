#!/usr/bin/env bash
# build-portfolio.sh - print the Launch Pad years as bound PDFs.
# Usage: docs/portfolio/build-portfolio.sh
# Output: docs/portfolio/*.pdf (four volumes + copies of the poster/one-pager PDFs)
set -euo pipefail
DOCS="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$DOCS/portfolio"
D="$DOCS/design"
L="$DOCS/lesson-plans"
CSS="$OUT/style.css"
WEASY="${WEASY:-/Users/europa/Library/Python/3.14/bin/weasyprint}"
PANDOC="${PANDOC:-pandoc}"

# --spiral: same volumes, bindable geometry. Mirrored gutter, folios on the
# outside edge, a ruled Notes page at the back, and an even leaf count so the
# last sheet never carries a stray recto. Writes to its own -SPIRAL filenames
# and leaves the reading copies alone.
SPIRAL=0
[ "${1:-}" = "--spiral" ] && { SPIRAL=1; shift; }
PDFINFO="${PDFINFO:-/opt/homebrew/bin/pdfinfo}"
NOTES='<section class="notespage"><h2>Notes</h2>'
for _i in $(seq 1 18); do NOTES="$NOTES<div class=\"rule\"></div>"; done
NOTES="$NOTES</section>"

pages() { "$PDFINFO" "$1" 2>/dev/null | awk '/^Pages/{print $2}'; }

build() {
  local title="$1" subtitle="$2" out="$3"; shift 3
  local css="$CSS" tail=""
  if [ "$SPIRAL" = "1" ]; then
    css="$OUT/style-spiral.css"
    out="${out%.pdf}-SPIRAL.pdf"
    subtitle="$subtitle  ·  spiral edition"
    tail="$NOTES"
  fi
  local tmp; tmp="$(mktemp -t lpvol).md"
  for f in "$@"; do
    printf '\n\n<div class="doc-break"></div>\n\n' >> "$tmp"
    # strip a leading YAML block if present (none expected, defensive)
    awk 'NR==1 && /^---$/ {skip=1; next} skip && /^---$/ {skip=0; next} !skip' "$f" >> "$tmp"
  done
  cp "$tmp" "$tmp.base"
  render() {
    { cat "$tmp.base"; printf '\n\n%s\n' "$1"; } > "$tmp"
    "$PANDOC" "$tmp" -s -f markdown-yaml_metadata_block \
      --metadata title="$title" --metadata subtitle="$subtitle" \
      --metadata date="Printed $(date +%Y-%m-%d)" \
      --toc --toc-depth=1 --css="$css" --pdf-engine="$WEASY" \
      -o "$OUT/$out" 2> >(grep -v "Ignored" >&2 || true)
  }
  render "$tail"
  if [ "$SPIRAL" = "1" ] && [ $(( $(pages "$OUT/$out") % 2 )) -eq 1 ]; then
    render "$tail"'<section class="padpage"></section>'
  fi
  rm -f "$tmp" "$tmp.base"
  echo "built $out ($(pages "$OUT/$out")pp, $(du -h "$OUT/$out" | cut -f1))"
}

# Volume 0 - the whole formation (spine + doctrine + shared floor + the door)
build "The Launch Pad" "Volume 0 - The Story, the Floor, and the Door (all three years)" \
  "00-launch-pad-the-story-and-the-floor.pdf" \
  "$D/2026-06-24-launch-pad-three-year-story-cycle-v0.1.md" \
  "$D/launch-pad-closing-practice-v0.1.md" \
  "$D/launch-pad-somatic-floor-grammar-v0.1.md" \
  "$D/launch-pad-life-admin-strand-v0.1.md" \
  "$D/2027-2028-launch-pad-coach-not-therapist-referral-pathway-v0.1.md" \
  "$D/2027-2028-launch-pad-the-guides-own-floor-v0.1.md" \
  "$D/2026-07-20-launchpad-entry-thresholds-v1.md" \
  "$D/2027-2028-launch-pad-first-cohort-conversation-v0.1.md" \
  "$D/launch-pad-the-ballast-and-open-days-v0.1.md" \
  "$D/launch-pad-the-familys-path-v0.1.md" \
  "$D/launch-pad-access-statement-v0.1-DRAFT.md" \
  "$D/launch-pad-promotion-and-the-not-shown-wall-v0.1.md"

# Volume 1 - Origin (2027-2028)
build "The Origin Year" "Volume 1 - Launch Pad Year One, 2027-2028: Who am I?" \
  "01-origin-year-2027-2028.pdf" \
  "$L/origin-lesson-plan-book.md" \
  "$D/2027-2028-launch-pad-studio-year-plan-v0.3.md" \
  "$D/2027-2028-launch-pad-session-1-day-by-day-v0.1.md" \
  "$D/2027-2028-launch-pad-session-1-materials-list-v0.1.md" \
  "$D/2027-2028-launch-pad-session-2-day-by-day-v0.1.md" \
  "$D/2027-2028-launch-pad-session-3-day-by-day-v0.1.md" \
  "$D/2027-2028-launch-pad-session-4-day-by-day-v0.1.md" \
  "$D/2027-2028-launch-pad-session-5-day-by-day-v0.1.md" \
  "$D/2027-2028-launch-pad-session-6-day-by-day-v0.1.md" \
  "$D/2027-2028-launch-pad-session-7-day-by-day-v0.1.md" \
  "$D/2027-2028-launch-pad-closing-feast-boise-tables-v0.2.md"

# Volume 2 - The Forge (2028-2029)
build "The Forge Year" "Volume 2 - Launch Pad Year Two, 2028-2029: What is worth solving?" \
  "02-forge-year-2028-2029.pdf" \
  "$L/forge-lesson-plan-book.md" \
  "$D/2028-2029-launch-pad-studio-year-plan-forge-v0.1.md" \
  "$D"/2028-2029-launch-pad-forge-session-{1,2,3,4,5,6,7}-day-by-day-v0.1.md

# Volume 3 - The Helm (2029-2030)
build "The Helm Year" "Volume 3 - Launch Pad Year Three, 2029-2030: What do I do when there is no easy answer?" \
  "03-helm-year-2029-2030.pdf" \
  "$L/helm-lesson-plan-book.md" \
  "$D/2029-2030-launch-pad-studio-year-plan-helm-v0.1.md" \
  "$D"/2029-2030-launch-pad-helm-session-{1,2,3,4,5,6,7}-day-by-day-v0.1.md

# Family-shareable set: the three lesson plan books alone (learner-safe by construction)
build "The Launch Pad - Three Years" "The guide's books for Origin, The Forge, and The Helm (written so a learner can read every page)" \
  "10-launch-pad-three-lesson-plan-books.pdf" \
  "$L/origin-lesson-plan-book.md" "$L/forge-lesson-plan-book.md" "$L/helm-lesson-plan-book.md"

# The door - each document standalone, so the guide prints the one she needs
# rather than a 112-page volume. All six carry fleet names: GUIDE-FACING, not family-handable.
# D8 (Chekov, 2026-10-13): an unpublished draft is never spiral-bound, and its
# warning runs on every page rather than on the title page a wire-o book is
# flipped past. Pass draft=1 as $5.
one() {
  local src="$1" out="$2" title="$3" subtitle="$4" draft="${5:-0}"
  local css="$CSS"
  if [ "$draft" = "1" ]; then
    if [ "$SPIRAL" = "1" ]; then
      echo "skipped ${out%.pdf}-SPIRAL.pdf (working draft is not bound - D8)"; return 0
    fi
    css="$OUT/draft-style.css"
  elif [ "$SPIRAL" = "1" ]; then
    css="$OUT/style-spiral.css"; out="${out%.pdf}-SPIRAL.pdf"
    subtitle="$subtitle  ·  spiral edition"
  fi
  local tmp; tmp="$(mktemp -t lpone).md"
  rone() {
    { cat "$src"; [ -n "$1" ] && printf '\n\n%s\n' "$1"; } > "$tmp"
    "$PANDOC" "$tmp" -s -f markdown-yaml_metadata_block \
      --metadata title="$title" --metadata subtitle="$subtitle" \
      --metadata date="Printed $(date +%Y-%m-%d)" \
      --css="$css" --pdf-engine="$WEASY" \
      -o "$OUT/$out" 2> >(grep -v "Ignored" >&2 || true)
  }
  rone ""
  if [ "$SPIRAL" = "1" ] && [ $(( $(pages "$OUT/$out") % 2 )) -eq 1 ]; then
    rone '<section class="padpage"></section>'
  fi
  rm -f "$tmp"
  echo "built $out ($(pages "$OUT/$out")pp)"
}

one "$D/2027-2028-launch-pad-first-cohort-conversation-v0.1.md" \
    "40-the-first-conversation.pdf" "The First Conversation" \
    "Launch Pad founding cohort, 2027-2028 - guide-facing working copy"
one "$D/launch-pad-access-statement-v0.1-DRAFT.md" \
    "41-access-statement-WORKING-DRAFT.pdf" "The Access Statement" \
    "WORKING DRAFT v0.2 - NOT FOR FAMILIES - five items blocking publish" 1
one "$D/launch-pad-promotion-and-the-not-shown-wall-v0.1.md" \
    "42-promotion-and-the-not-shown-wall.pdf" "The Invitation, and the Wall" \
    "Promotion posture and the Deliberately NOT Shown list - guide-facing"
one "$D/launch-pad-the-ballast-and-open-days-v0.1.md" \
    "43-the-ballast-and-open-days.pdf" "The Ballast and the Open Days" \
    "For the learner who joins a season later - guide-facing"
one "$D/launch-pad-the-familys-path-v0.1.md" \
    "44-the-familys-path.pdf" "The Family's Path" \
    "What a family receives, in what order, and what is still missing"

# Posters, one-pagers and the site walk form are single sheets or a fill-in
# form. Nothing to bind, so the spiral pass skips them.
if [ "$SPIRAL" = "1" ]; then echo "done -> $OUT (spiral edition)"; exit 0; fi

# Posters and one-pagers already rendered as PDFs in design/
for p in The-Launch-Pad-Story-Poster.pdf The-Launch-Pad-Story-Poster-Families.pdf The-Launch-Pad-Story-Poster-Parents.pdf The-Launch-Pad-Story-Poster-StarMap.pdf 2026-06-25-launch-pad-overview-one-pager.pdf The-Launch-Pad-Story-for-Jenna.pdf; do
  [ -f "$D/$p" ] && cp "$D/$p" "$OUT/20-$p"
done
# The pilot-morning Family note - a consent instrument with signature lines, its own
# print style. Added 2026-10-20: it had no recorded build command anywhere, so every
# render was a hand-typed invocation from memory, which is how it once came out at A4.
# Building it here also puts it inside the tier check below by design rather than by
# the glob happening to sweep an orphan left in the output directory.
"$PANDOC" "$D/launch-pad-family-note-pilot-v0.1.md" -s -f markdown-yaml_metadata_block \
  --metadata title="A pilot morning at the Launch Pad" \
  --css="$OUT/style-onepager.css" --pdf-engine="$WEASY" \
  -o "$OUT/20-family-note-PILOT-MORNING.pdf" 2> >(grep -v "Ignored" >&2 || true)
echo "built 20-family-note-PILOT-MORNING.pdf ($(pages "$OUT/20-family-note-PILOT-MORNING.pdf")pp)"

# The site walk sheet - a form to carry and fill in, its own print style
"$PANDOC" "$D/launch-pad-site-walk-sheet-v0.1.md" -s -f markdown-yaml_metadata_block \
  --css="$OUT/walk-style.css" --pdf-engine="$WEASY" -o "$OUT/30-site-walk-sheet.pdf" 2> >(grep -v "Ignored" >&2 || true)
echo "built 30-site-walk-sheet.pdf ($(du -h "$OUT/30-site-walk-sheet.pdf" 2>/dev/null | cut -f1))"

# ---------------------------------------------------------------- tier check
# D4 + D5 (Codex, Tutela, Naomi, Lumen, 2026-10-13). The family tier is the one
# claim on the index page a reader acts on by handing something to a family.
# It used to rest on a remembered command over one file matching eight names.
# Now it runs here, over every family-tier file, and the build fails on a hit.
#
# WHAT THIS CHECK DOES NOT ESTABLISH: it tests for fleet names and for the
# not-shown wall. It is not a truth check. It cannot see a present-tense promise
# about a room that does not exist yet, an image of a learner, or register.
# Those need a human. Known blind spot: ambiguous one-word agent names (La, Via,
# Mos, Kim, Rand, Mae, Nine) are excluded to avoid false alarms on ordinary prose.
FLEET='Accord|Aditus|Aequum|Arcana|Caelum|Canor|Chekov|Claritas|Codex|Concordia|Cura|Custodia|Custos|Domus|Faber|Fabula|Fides|Fieri|Firmitas|Foedus|Gestus|Gnosis|Gubernator|Hoshi|Impetus|Intimus|Ishka|Iter|Kropotkin|Leonard|Limen|Limina|Lingua|Ludus|Lumen|Lux|Mccoy|Memoria|Motus|Munus|Neelix|Nexus|Obrien|Ordo|Origo|Ortus|Pactum|Palmer|Pervius|Polaris|Pons|Portus|Praesens|Praxis|Pulaski|Radix|Reginald|Riker|Salus|Satis|Sato|Sensus|Signum|Solacium|Spes|Stirps|Tessera|Totum|Tutela|Umbra|Vedek|Veritas|Verus|Vigilia|Vigor|Vinculum|Vox|Wildman|Yates'
# Spelled-out numbers added 2026-10-20. The digit-only form returned a clean sweep on a
# deck that states capacity three times in words. A verify expression too narrow to see
# what is in front of it reads as a pass, which is worse than no check at all.
WALL='([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten) to ([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten) learners|ceiling of ([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten)|seven chairs|limited spots|spots are filling|applications clos|don.t miss|act now|enroll now|our graduates|graduates go on|transform your|unleash|the leader your child'
PT="${PT:-/opt/homebrew/bin/pdftotext}"

tiercheck() {
  local fails=0 f t hitN hitW
  echo; echo "--- family-tier check (fleet names + not-shown wall) ---"
  for f in "$OUT"/10-*.pdf "$OUT"/20-*.pdf "$DOCS"/lesson-plans/pdf/The-*-Year-Lesson-Plan-Book.pdf; do
    [ -f "$f" ] || continue
    case "$f" in *-SPIRAL.pdf) continue;; esac
    t="$("$PT" "$f" - 2>/dev/null)"
    hitN="$(printf '%s' "$t" | grep -o -wE "$FLEET" | sort -u | tr '\n' ' ')"
    hitW="$(printf '%s' "$t" | grep -o -iE "$WALL" | sort -u | tr '\n' ' ')"
    if [ -n "$hitN" ] || [ -n "$hitW" ]; then
      printf '  FAIL %-46s %s%s\n' "$(basename "$f")" "${hitN:+names[$hitN] }" "${hitW:+wall[$hitW]}"
      fails=$((fails+1))
    else
      printf '  pass %-46s\n' "$(basename "$f")"
    fi
  done
  if [ "$fails" -gt 0 ]; then
    echo "  TIER CHECK FAILED on $fails file(s). Inspect each hit before sharing anything." >&2
    return 1
  fi
  echo "  tier check passed, $(date +%Y-%m-%d). Not a truth check; see the note in this script."
}

tiercheck || exit 1
echo "done -> $OUT"
