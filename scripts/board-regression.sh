#!/usr/bin/env bash
# Community-board regression suite (Gate H item 5 - re-verification cadence).
#
# RUN THIS before any board-touching lift, and after any change to: js/poster.js,
# js/community-board.js, js/owner.js, the board RLS/migrations, or js/flags.js (the board flag).
# A gate that runs once is an assertion about the past; this makes it repeatable (Data, 2026-09-15).
#
# Usage:  scripts/board-regression.sh
# Exit 0 = the automated lane passed. The two manual lanes are printed at the end (they need a real
# browser engine and the live DB, and cannot be automated here).

set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== LANE 1: syntax (node --check) ==="
for f in js/poster.js js/community-board.js js/owner.js js/store.js \
         js/backend/supabase-adapter.js js/backend/local-store.js js/calendar-view.js js/modals.js; do
  node --check "$f" && echo "  ok  $f"
done

echo ""
echo "=== LANE 2: upload-guard unit tests (real poster.js exports) ==="
node scripts/board-guards.test.mjs

echo ""
echo "=== AUTOMATED LANES PASSED ==="
echo ""
echo "MANUAL LANE A - browser upload harness (EXIF strip + dimension + sink, real engine):"
echo "  open  https://vibrant-life-compass.vercel.app/scripts/verify-poster-upload.html"
echo "  PASS  = top line reads 'STATUS: ALL-PASS'"
echo ""
echo "MANUAL LANE B - RLS wall-walk (run the SQL in the Supabase editor):"
echo "  see   docs/design/community-board-gate-b-rls-wall-walk.md  (Gate B probes + the D1/D2 delete probes)"
echo "  PASS  = every probe PASS or SKIP(reason); D1/D2 (learner deletes OWN / not ANOTHER's) = PASS"
echo ""
echo "Full cadence + triggers: docs/design/community-board-regression.md"
