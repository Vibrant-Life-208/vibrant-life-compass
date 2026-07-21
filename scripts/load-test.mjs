#!/usr/bin/env node
// Concurrency load test for Vibrant Life Compass (captain 2026-07-21).
//
// Simulates the scary moment: a whole class finishing Setup AT ONCE - each learner firing
// an onboarding write burst (a few goals + the auto-scheduler's bulk task insert) against
// the SAME Supabase project. On the FREE tier the shared micro-compute is the real ceiling,
// so this measures where it bends: latency percentiles + error rate under N concurrent
// virtual learners.
//
// Dependency-free (raw fetch to GoTrue + PostgREST; Node 18+). It authenticates real test
// LEARNER accounts (RLS requires learner_id = auth.uid() to insert goals/tasks), runs the
// burst, then DELETES everything it created (rows are tagged, see MARKER).
//
// SAFETY: run against a TEST / staging project, not production. It writes and deletes data.
//
// Usage:
//   VLC_URL=https://xxxx.supabase.co \
//   VLC_ANON_KEY=eyJ... \
//   VLC_CREDS=./scripts/loadtest-creds.json \   # [{ "email": "...", "password": "..." }, ...]
//   VLC_CONCURRENCY=55 \                         # virtual learners at once (default 55)
//   VLC_TASKS=18 \                               # tasks per learner's burst (default 18)
//   node scripts/load-test.mjs
//
// If VLC_CREDS has fewer accounts than the concurrency, they are cycled (tokens reused) so
// you can approximate 55 concurrent with just a handful of disposable learner accounts.

const URL = process.env.VLC_URL;
const ANON = process.env.VLC_ANON_KEY;
const CONCURRENCY = parseInt(process.env.VLC_CONCURRENCY || '55', 10);
const TASKS_PER = parseInt(process.env.VLC_TASKS || '18', 10);
const CREDS_PATH = process.env.VLC_CREDS;
const MARKER = '[[loadtest]]'; // tags every row we create, so teardown can find + delete them

if (!URL || !ANON) {
  console.error('Missing VLC_URL / VLC_ANON_KEY. See the header of this file.');
  process.exit(2);
}

function pct(sorted, p) {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}
async function timed(fn) {
  const t0 = Date.now();
  try { const r = await fn(); return { ms: Date.now() - t0, ok: true, r }; }
  catch (e) { return { ms: Date.now() - t0, ok: false, err: String(e.message || e) }; }
}
async function signIn(email, password) {
  const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`auth ${res.status}`);
  const j = await res.json();
  return { token: j.access_token, uid: j.user?.id };
}
function rest(path, token, method, body) {
  return fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: ANON, Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => { if (!r.ok && r.status !== 404) throw new Error(`${method} ${path} ${r.status}`); return r; });
}

// One virtual learner's onboarding burst: 3 goals + a bulk insert of TASKS_PER tasks + a read.
async function virtualLearner(cred, samples) {
  const auth = await signIn(cred.email, cred.password);
  const uid = auth.uid;
  const push = (label, res) => samples.push({ label, ...res });

  for (let g = 0; g < 3; g++) {
    push('goal-insert', await timed(() => rest('goals', auth.token, 'POST', {
      learner_id: uid, category_id: 'slice_self', scope: 'year', text: `${MARKER} goal ${g}`, status: 'active',
    })));
  }
  const rows = Array.from({ length: TASKS_PER }, (_, i) => ({
    learner_id: uid, text: `${MARKER} task ${i}`, planned_for: null, status: 'open',
    meta: { band: i % 4 === 0 ? 'milestone' : 'weekly', region: 'Self', source: 'loadtest' },
  }));
  push('tasks-bulk', await timed(() => rest('tasks', auth.token, 'POST', rows)));
  push('read', await timed(() => rest(`tasks?learner_id=eq.${uid}&select=id&limit=50`, auth.token, 'GET')));
  return auth;
}

async function teardown(auths) {
  let deleted = 0;
  for (const a of auths) {
    try {
      await rest(`tasks?text=like.*${encodeURIComponent(MARKER)}*`, a.token, 'DELETE');
      await rest(`goals?text=like.*${encodeURIComponent(MARKER)}*`, a.token, 'DELETE');
      deleted++;
    } catch { /* best-effort cleanup */ }
  }
  return deleted;
}

async function main() {
  const fs = await import('node:fs');
  if (!CREDS_PATH || !fs.existsSync(CREDS_PATH)) {
    console.error(`Missing VLC_CREDS file. Create a JSON array of TEST learner accounts:\n  [{ "email": "test1@example.com", "password": "..." }]`);
    process.exit(2);
  }
  const creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  if (!Array.isArray(creds) || !creds.length) { console.error('VLC_CREDS must be a non-empty JSON array.'); process.exit(2); }

  console.log(`\nLoad test: ${CONCURRENCY} concurrent learners, ${TASKS_PER} tasks each, ${creds.length} account(s) cycled.`);
  console.log(`Target: ${URL}\n(writes tagged ${MARKER} and deleted afterward)\n`);

  const samples = [];
  const t0 = Date.now();
  const jobs = Array.from({ length: CONCURRENCY }, (_, i) =>
    virtualLearner(creds[i % creds.length], samples).catch((e) => ({ authFail: String(e.message || e) })));
  const results = await Promise.all(jobs);
  const wall = Date.now() - t0;

  const auths = results.filter((r) => r && r.token);
  const authFails = results.filter((r) => r && r.authFail).length;

  // Report per op-label
  console.log(`Wall time for the burst: ${wall} ms   ·   auth failures: ${authFails}/${CONCURRENCY}\n`);
  const byLabel = {};
  for (const s of samples) (byLabel[s.label] ||= []).push(s);
  console.log('op'.padEnd(14), 'n'.padStart(5), 'ok'.padStart(5), 'fail'.padStart(5), 'p50'.padStart(7), 'p95'.padStart(7), 'p99'.padStart(7), '  max');
  for (const [label, arr] of Object.entries(byLabel)) {
    const ok = arr.filter((s) => s.ok);
    const lat = ok.map((s) => s.ms).sort((a, b) => a - b);
    console.log(
      label.padEnd(14),
      String(arr.length).padStart(5),
      String(ok.length).padStart(5),
      String(arr.length - ok.length).padStart(5),
      `${pct(lat, 50)}ms`.padStart(7), `${pct(lat, 95)}ms`.padStart(7), `${pct(lat, 99)}ms`.padStart(7),
      `  ${lat[lat.length - 1] || 0}ms`,
    );
  }
  const errs = samples.filter((s) => !s.ok).map((s) => s.err);
  if (errs.length) {
    const counts = {};
    for (const e of errs) counts[e] = (counts[e] || 0) + 1;
    console.log('\nErrors:');
    for (const [e, n] of Object.entries(counts)) console.log(`  ${n}x  ${e}`);
  }

  const n = await teardown(auths);
  console.log(`\nCleaned up loadtest rows for ${n} account(s).`);
  console.log('\nRead: p95 write latency climbing or "5xx"/"timeout" errors appearing = the free instance is at its ceiling.\n');
}

main().catch((e) => { console.error('load test failed:', e); process.exit(1); });
