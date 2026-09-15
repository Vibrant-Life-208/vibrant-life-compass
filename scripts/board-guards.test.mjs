// Board upload-guard regression test (Gate H item 5 - re-verification cadence).
// Tests the REAL exported pure functions from js/poster.js (not drift-prone copies), in Node.
// Run: node scripts/board-guards.test.mjs   (or via scripts/board-regression.sh)
import { safePosterSrc, posterKind, clampDims } from '../js/poster.js';

let pass = 0, fail = 0;
const ck = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`); };

// --- Allowlist decision (posterKind): SVG refused in every disguise; raster accepted; pdf routed ---
ck('svg mime -> rejected', posterKind('x.svg', 'image/svg+xml') === 'svg');
ck('svg ext, empty type -> rejected', posterKind('evil.svg', '') === 'svg');
ck('svg-type, png name -> rejected', posterKind('photo.png', 'image/svg+xml') === 'svg');
ck('png -> image', posterKind('a.png', 'image/png') === 'image');
ck('jpeg -> image', posterKind('a.jpg', 'image/jpeg') === 'image');
ck('heic -> image', posterKind('a.heic', 'image/heic') === 'image');
ck('no type + png ext -> image', posterKind('a.png', '') === 'image');
ck('pdf mime -> pdf', posterKind('a.pdf', 'application/pdf') === 'pdf');
ck('octet-stream, no raster ext -> other', posterKind('a.bin', 'application/octet-stream') === 'other');

// --- Sink guard (safePosterSrc): only ever emits an inert data:image value ---
ck('sink keeps data:image/jpeg', safePosterSrc('data:image/jpeg;base64,AAAA') === 'data:image/jpeg;base64,AAAA');
ck('sink keeps data:image/png', safePosterSrc('data:image/png;base64,AAAA') === 'data:image/png;base64,AAAA');
ck('sink drops javascript:', safePosterSrc('javascript:alert(1)') === '');
ck('sink drops data:text/html', safePosterSrc('data:text/html,x') === '');
ck('sink drops data:image/svg+xml', safePosterSrc('data:image/svg+xml;base64,AAAA') === '');
ck('sink drops null', safePosterSrc(null) === '');

// --- Dimension cap (clampDims): never exceeds 700x1000, never upscales, never below 1 ---
for (const [w, h] of [[80, 3000], [4000, 100], [5000, 5000], [300, 300], [1, 20000], [700, 1000]]) {
  const [ow, oh] = clampDims(w, h);
  ck(`clampDims ${w}x${h} -> ${ow}x${oh}: <=700x1000 & no upscale`,
    ow <= 700 && oh <= 1000 && ow >= 1 && oh >= 1 && ow <= w && oh <= h);
}

console.log(`\nBOARD-GUARDS: ${fail === 0 ? 'ALL-PASS' : 'FAIL'} (${pass} passed, ${fail} failed)`);
process.exit(fail === 0 ? 0 : 1);
