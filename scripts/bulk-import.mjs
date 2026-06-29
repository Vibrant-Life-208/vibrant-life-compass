#!/usr/bin/env node
// Hero's Compass - bulk account import (run once, on your machine).
//
// Uses the Supabase service-role key (admin API) to create auth users + profile
// rows + learner rows, and to link parents and guides to learners. Service-role
// bypasses RLS, which is why account creation must run here and not in the
// browser. The key NEVER goes in the repo or the app - you pass it via env.
//
// RUN (simple - the script asks for the key, hidden, when it needs it):
//   node scripts/bulk-import.mjs accounts.csv
//   -> it prompts: "Paste your Supabase service_role key" - paste + Enter.
//
//   The key is found in the Supabase WEBSITE: dashboard -> Project Settings ->
//   API -> "service_role" (secret). Copy that long string; paste at the prompt.
//
//   Validate a CSV without the key:  node scripts/bulk-import.mjs accounts.csv --dry-run
//   Reset one password:              node scripts/bulk-import.mjs --reset <hero_name>
//
// CSV columns (header row required), one row per person:
//   hero_name,full_name,role,studio,links
//     hero_name : the username they sign in with (lowercase, no spaces). Required.
//     full_name : display name. Optional (falls back to a prettied hero_name).
//     role      : learner | parent | guide. Required.
//     studio    : sparks | discovery | adventure | launchpad (learners only).
//     links     : for PARENTS, the hero_names of their children (semicolon-separated;
//                 multiple parents per child = list the same child on each parent).
//                 for GUIDES, the hero_names of their assigned learners (semicolon-sep).
//                 leave blank for learners.
//
// Email confirmation must be OFF in Supabase (Auth -> Providers -> Email ->
// "Confirm email" = off), since the synthetic @vibrantlife.local emails are never
// real. The script sets email_confirm=true per user as a belt-and-suspenders.

const SYNTH_DOMAIN = 'vibrantlife.local';
const STUDIOS = ['sparks', 'discovery', 'adventure', 'launchpad'];

import readline from 'node:readline';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// URL defaults to this project; only the secret key needs to be supplied, and we
// prompt for it (hidden) at run time so it never goes on the command line, in
// shell history, or in a file.
const URL = process.env.SUPABASE_URL || 'https://obnivpzwunxiyupnarca.supabase.co';
let KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
// A real key has no spaces or angle brackets. If a stale/placeholder value is in
// the environment (e.g. a copy-pasted `export ...="<...>"`), ignore it and prompt.
if (/[<>\s]/.test(KEY)) KEY = '';

function promptKey(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(query, (answer) => {
      rl.close();
      // Trim whitespace and strip any surrounding quotes the user may have pasted.
      resolve((answer || '').trim().replace(/^["']+|["']+$/g, ''));
    });
  });
}

const heroEmail = (h) => `${String(h).trim().toLowerCase()}@${SYNTH_DOMAIN}`;
const prettyName = (h) => h.split(/[-_]+/).filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase()).join(' ');

function tempPassword() {
  // Readable-but-random: two short words feel optional; keep it simple + strong.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 12; i += 1) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const authHeaders = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' });

async function adminCreateUser(email, password) {
  const res = await fetch(`${URL}/auth/v1/admin/users`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!res.ok) throw new Error(`createUser ${email}: ${res.status} ${await res.text()}`);
  return (await res.json()).id;
}

async function findUserIdByEmail(email) {
  const res = await fetch(`${URL}/auth/v1/admin/users?per_page=200`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`listUsers: ${res.status} ${await res.text()}`);
  const body = await res.json();
  const users = Array.isArray(body) ? body : body.users || [];
  return (users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase()) || {}).id || null;
}

async function adminUpdatePassword(userId, password) {
  const res = await fetch(`${URL}/auth/v1/admin/users/${userId}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(`updatePassword: ${res.status} ${await res.text()}`);
}

async function rest(path, method, body) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    method, headers: { ...authHeaders(), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
}

// Minimal CSV parser (handles quoted fields + commas/newlines inside quotes).
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

// Wipe a person's onboarding + anchor + goals so they start over from the very
// beginning on next sign-in (keeps their account + password).
async function resetOnboarding(heroName) {
  if (dryRun) { console.log(`[dry-run] would reset onboarding + goals for ${heroName}`); return; }
  const email = heroEmail(heroName);
  const id = await findUserIdByEmail(email);
  if (!id) { console.error(`No account found for "${heroName}" (${email}).`); process.exit(1); }
  await rest(`profiles?id=eq.${id}`, 'PATCH', {
    onboarding_completed_at: null, onboarding_step: 'breath', onboarding_skipped: [],
    quote_text: '', quote_cycle: '', quote_author: '', quote_note: '', quote_vision: '',
    values_top_3: [], values_freetext: [], values_archetype: '',
    via_strengths_top_3: [], via_strengths_top_8: [], via_strengths_bottom_8: [],
    vision_beyond_5yr: '', vision_within_5yr: '', vision_within_1yr: '', current_state: '', halfway_state: '',
  });
  await rest(`goals?learner_id=eq.${id}`, 'DELETE');
  await rest(`tasks?learner_id=eq.${id}`, 'DELETE');
  console.log(`\nReset done. ${heroName} starts onboarding from the beginning on next sign-in. (Account + password kept.)\n`);
}

async function resetPassword(heroName) {
  const email = heroEmail(heroName);
  const id = await findUserIdByEmail(email);
  if (!id) { console.error(`No account found for "${heroName}" (${email}).`); process.exit(1); }
  const pw = tempPassword();
  if (dryRun) { console.log(`[dry-run] would reset ${heroName} -> ${pw}`); return; }
  await adminUpdatePassword(id, pw);
  await rest(`profiles?id=eq.${id}`, 'PATCH', { must_change_password: true });
  console.log(`\nReset done. Give ${heroName} this temp password (they set their own on next sign-in):\n  ${heroName}  ->  ${pw}\n`);
}

// ── Family seeding (--families <families.csv>) ──────────────────────────────
// One shared login per family + a member picker. Members (parents + learners)
// are profiles; the family login is the only credential handed out. Seeds fresh
// (captain decision 2026-06-28): old per-person accounts are left dormant.
//
// Families CSV columns: family_username,family_name,member_kind,member_name,studio
//   member_kind : parent | learner
//   studio      : learners only. Tot|Spark|Discovery|Adventure|LaunchPad.
//                 'Tot' -> no studio (family member only, no Compass path).
//
// Member emails are namespaced under the family (family_username-slug@domain) so
// they never collide with last year's individual accounts. Idempotent: re-runs
// reuse any family/member whose email already exists.
const STUDIO_MAP = {
  tot: null, // family member only, no Compass studio/goals (captain 2026-06-28)
  spark: 'sparks', sparks: 'sparks',
  discovery: 'discovery', adventure: 'adventure',
  launchpad: 'launchpad', launchpadblue: 'launchpad',
};
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
const memberDisplay = (full) => {
  const m = full.match(/\(([^)]+)\)/);          // nickname in parens wins
  return (m ? m[1] : full.trim().split(/\s+/)[0]).trim();
};
const memberFullName = (full) => full.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

async function importFamilies(file) {
  const fs = await import('node:fs/promises');
  const rows = parseCsv(await fs.readFile(file, 'utf8'));
  const header = rows.shift().map((h) => h.trim().toLowerCase());
  const col = (r, name) => (r[header.indexOf(name)] || '').trim();

  // Group rows into families, preserving order.
  const fams = new Map();
  for (const r of rows) {
    const username = col(r, 'family_username').toLowerCase();
    if (!username) continue;
    if (!fams.has(username)) fams.set(username, { username, name: col(r, 'family_name'), members: [] });
    fams.get(username).members.push({
      kind: col(r, 'member_kind').toLowerCase(),
      name: col(r, 'member_name'),
      studioRaw: col(r, 'studio').toLowerCase(),
    });
  }

  // Validate
  const errors = [];
  for (const f of fams.values()) {
    if (!f.members.length) errors.push(`${f.username}: no members`);
    const slugs = new Set();
    for (const m of f.members) {
      if (!['parent', 'learner'].includes(m.kind)) errors.push(`${f.username}/${m.name}: bad kind "${m.kind}"`);
      if (m.kind === 'learner' && m.studioRaw && !(m.studioRaw in STUDIO_MAP)) errors.push(`${f.username}/${m.name}: unknown studio "${m.studioRaw}"`);
      let s = slugify(memberDisplay(m.name)); let n = 1;
      while (slugs.has(s)) { n += 1; s = `${slugify(memberDisplay(m.name))}${n}`; } // de-dupe within family
      slugs.add(s); m.slug = s;
      m.display = memberDisplay(m.name);
      m.full = memberFullName(m.name);
      m.studio = m.kind === 'learner' ? STUDIO_MAP[m.studioRaw] ?? null : null;
    }
  }
  const learners = [...fams.values()].flatMap((f) => f.members.filter((m) => m.kind === 'learner'));
  if (errors.length) { console.error('Family CSV problems:\n - ' + errors.join('\n - ')); process.exit(1); }
  console.log(`${fams.size} families | ${learners.length} learners (${learners.filter((m) => m.studio).length} with a studio, ${learners.filter((m) => !m.studio).length} Tot/no-studio) | ${[...fams.values()].flatMap((f) => f.members).filter((m) => m.kind === 'parent').length} parents`);
  if (dryRun) { console.log('[dry-run] Family CSV valid. Nothing created.'); return; }

  const creds = [];
  for (const f of fams.values()) {
    const famEmail = heroEmail(f.username);
    let famId = await findUserIdByEmail(famEmail);
    if (!famId) { const pw = tempPassword(); famId = await adminCreateUser(famEmail, pw); creds.push({ username: f.username, name: f.name, pw }); }
    else { creds.push({ username: f.username, name: f.name, pw: '(existing - unchanged)' }); }
    await rest('families', 'POST', { id: famId, name: f.name, username: f.username });

    let sort = 0;
    for (const m of f.members) {
      const memEmail = `${f.username}-${m.slug}@${SYNTH_DOMAIN}`;
      let memId = await findUserIdByEmail(memEmail);
      if (!memId) memId = await adminCreateUser(memEmail, tempPassword()); // member pw never used (login is the family)
      await rest('profiles', 'POST', { id: memId, role: m.kind === 'parent' ? 'parent' : 'learner', name: m.full, email: memEmail });
      if (m.kind === 'learner' && m.studio) await rest('learners', 'POST', { id: memId, studio: m.studio });
      await rest('family_members', 'POST', { family_id: famId, profile_id: memId, kind: m.kind, display_name: m.display, sort: sort++ });
    }
    console.log(`  ${f.name.padEnd(28)} ${f.members.length} members`);
  }

  console.log('\n=== FAMILY LOGINS (hand these out; the family signs in once and picks who is exploring) ===');
  console.log('  hero name                  temp password');
  for (const c of creds) console.log(`  ${c.username.padEnd(26)} ${c.pw}`);
  console.log(`\nDone. ${fams.size} families seeded.`);
}

async function importCsv(file) {
  const fs = await import('node:fs/promises');
  const text = await fs.readFile(file, 'utf8');
  const rows = parseCsv(text);
  const header = rows.shift().map((h) => h.trim().toLowerCase());
  const col = (r, name) => (r[header.indexOf(name)] || '').trim();

  // Validate
  const people = rows.map((r) => ({
    heroName: col(r, 'hero_name').toLowerCase(),
    fullName: col(r, 'full_name'),
    role: col(r, 'role').toLowerCase(),
    studio: col(r, 'studio').toLowerCase(),
    links: col(r, 'links').split(/[;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean),
  }));
  const errors = [];
  const seen = new Set();
  for (const p of people) {
    if (!p.heroName) errors.push('row missing hero_name');
    if (seen.has(p.heroName)) errors.push(`duplicate hero_name: ${p.heroName}`);
    seen.add(p.heroName);
    if (!['learner', 'parent', 'guide'].includes(p.role)) errors.push(`${p.heroName}: bad role "${p.role}"`);
    if (p.role === 'learner' && !STUDIOS.includes(p.studio)) errors.push(`${p.heroName}: bad/missing studio "${p.studio}"`);
  }
  const heroSet = new Set(people.map((p) => p.heroName));
  for (const p of people) for (const l of p.links) if (!heroSet.has(l)) errors.push(`${p.heroName}: links to unknown hero_name "${l}"`);
  if (errors.length) { console.error('CSV problems:\n - ' + errors.join('\n - ')); process.exit(1); }

  console.log(`${people.length} accounts: ${people.filter((p) => p.role === 'learner').length} learners, ${people.filter((p) => p.role === 'parent').length} parents, ${people.filter((p) => p.role === 'guide').length} guides.`);
  if (dryRun) { console.log('[dry-run] CSV valid. Nothing created.'); return; }

  // Pass 1: create users + profiles + learner rows.
  const idByHero = {};
  const creds = [];
  for (const p of people) {
    const email = heroEmail(p.heroName);
    const pw = tempPassword();
    const id = await adminCreateUser(email, pw);
    idByHero[p.heroName] = id;
    await rest('profiles', 'POST', { id, role: p.role, name: p.fullName || prettyName(p.heroName), email, must_change_password: true });
    if (p.role === 'learner') await rest('learners', 'POST', { id, studio: p.studio });
    creds.push({ heroName: p.heroName, role: p.role, pw });
    console.log(`  created ${p.role.padEnd(7)} ${p.heroName}`);
  }

  // Pass 2: links (resolve hero_name -> id).
  for (const p of people) {
    for (const l of p.links) {
      const learnerId = idByHero[l];
      if (p.role === 'parent') await rest('parent_learner_link', 'POST', { parent_id: idByHero[p.heroName], learner_id: learnerId });
      else if (p.role === 'guide') await rest('guide_learner_assignment', 'POST', { guide_id: idByHero[p.heroName], learner_id: learnerId });
    }
  }

  console.log('\n=== TEMP PASSWORDS (hand these out; each person sets their own on first sign-in) ===');
  for (const c of creds) console.log(`  ${c.role.padEnd(7)} ${c.heroName.padEnd(24)} ${c.pw}`);
  console.log(`\nDone. ${creds.length} accounts created.`);
}

(async () => {
  try {
    const resetIdx = args.indexOf('--reset');
    const resetOnbIdx = args.indexOf('--reset-onboarding');
    const familiesIdx = args.indexOf('--families');
    const file = args.find((a) => !a.startsWith('--'));
    if (resetIdx < 0 && resetOnbIdx < 0 && familiesIdx < 0 && !file) {
      console.error('Usage:\n  node scripts/bulk-import.mjs <accounts.csv> [--dry-run]\n  node scripts/bulk-import.mjs --families <families.csv> [--dry-run]\n  node scripts/bulk-import.mjs --reset <hero_name>            (new temp password)\n  node scripts/bulk-import.mjs --reset-onboarding <hero_name> (start onboarding over)');
      process.exit(1);
    }
    // Prompt for the secret key (hidden) only when we actually need it.
    if (!dryRun && !KEY) {
      KEY = await promptKey('Paste your Supabase secret/service_role key here, then press Enter:\n> ');
      if (!KEY) { console.error('\nNothing was pasted. Copy your key from the Supabase website (Settings -> API Keys), then run this again.'); process.exit(1); }
    }
    if (resetOnbIdx >= 0) await resetOnboarding(args[resetOnbIdx + 1]);
    else if (resetIdx >= 0) await resetPassword(args[resetIdx + 1]);
    else if (familiesIdx >= 0) await importFamilies(args[familiesIdx + 1] || file);
    else await importCsv(file);
  } catch (e) { console.error('\nFAILED:', e.message); process.exit(1); }
})();
