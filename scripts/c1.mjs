// C1 — the three standing tests that fail the build on a current-wheel regression
// (build plan Stage R/V; Garak + Satis). Runs all three; exits non-zero if any fails.
//   #1 render-conditions   no denominator / meter / sequence / red-zero / colour-only
//   #2 read-only-to-system  no threshold id persisted as a goal row (projection rule, static)
//   #3 no-aggregation       weekly answers are discrete per-moment records, never a trend
//
// The runtime half of #2 (La'an's write-wall assertion at the store.js write edge) is
// NOT here: it touches the live store and lands captain-gated at Stage V.
// Run: node scripts/c1.mjs

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const tests = ['c1-render-conditions.mjs', 'c1-read-only-to-system.mjs', 'c1-no-aggregation.mjs'];

let failed = 0;
for (const t of tests) {
  const r = spawnSync(process.execPath, [path.join(here, t)], { encoding: 'utf8' });
  process.stdout.write((r.stdout || '') );
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) failed++;
}
if (failed) {
  console.error(`\nC1: ${failed}/${tests.length} standing test(s) FAILED`);
  process.exit(1);
}
console.log(`\nC1: all ${tests.length} standing tests PASS`);
