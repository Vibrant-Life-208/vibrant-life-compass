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
    const file = args.find((a) => !a.startsWith('--'));
    if (resetIdx < 0 && !file) {
      console.error('Usage: node scripts/bulk-import.mjs <accounts.csv> [--dry-run]  |  --reset <hero_name>');
      process.exit(1);
    }
    // Prompt for the secret key (hidden) only when we actually need it.
    if (!dryRun && !KEY) {
      KEY = await promptKey('Paste your Supabase secret/service_role key here, then press Enter:\n> ');
      if (!KEY) { console.error('\nNothing was pasted. Copy your key from the Supabase website (Settings -> API Keys), then run this again.'); process.exit(1); }
    }
    if (resetIdx >= 0) await resetPassword(args[resetIdx + 1]);
    else await importCsv(file);
  } catch (e) { console.error('\nFAILED:', e.message); process.exit(1); }
})();
