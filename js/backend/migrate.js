// Migration export tool.
// Reads localStorage data and produces a JSON file that can be imported
// into a Supabase project via the dashboard's Table Editor "Import data"
// feature, or via the SQL editor with `\copy`.
//
// Usage (run in browser console):
//   import { exportToJSON } from '/js/backend/migrate.js';
//   const blob = await exportToJSON();
//   // Triggers a download of heros-compass-export.json
//
// The export does NOT include the per-learner encryption key (which lives
// in IndexedDB as non-extractable). When migrating, learners will re-enter
// passwords on first sign-in, OR an admin can pre-export their plaintexts
// via the in-app Reveal flow and import them encrypted under the new key.

const LOCALSTORAGE_KEYS = [
  'hc_session',
  'hc_learners',
  'hc_goals',
  'hc_check_ins',
  'hc_everyone_posts',
  'hc_year_quotes',
  'hc_year_traits',
  'hc_logins',
  'hc_tasks',
];

export async function exportToJSON() {
  const payload = {
    exportedAt: new Date().toISOString(),
    sourceVersion: 'hero-compass-skeleton',
    data: {},
  };
  for (const key of LOCALSTORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        payload.data[key] = JSON.parse(raw);
      } catch {
        payload.data[key] = raw;
      }
    }
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `heros-compass-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return payload;
}

// Reverse direction: given an export payload, write to localStorage.
// Useful for testing the migration round-trip or restoring a backup.
export function importFromJSON(payload) {
  if (!payload?.data) throw new Error('Invalid export payload');
  for (const [key, value] of Object.entries(payload.data)) {
    if (LOCALSTORAGE_KEYS.includes(key)) {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  }
}

// Generates SQL INSERT statements from the localStorage export.
// Use case: a guide who wants to seed a Supabase project from a
// captain's review session. Run the output in the Supabase SQL editor.
export function exportToSQL(payload) {
  const lines = [];
  lines.push('-- Hero\'s Compass migration SQL');
  lines.push(`-- Exported ${payload.exportedAt}`);
  lines.push('-- Run after applying schema.sql.');
  lines.push('');

  const learners = payload.data?.hc_learners || [];
  learners.forEach((l) => {
    lines.push(`-- Learner: ${escapeSqlStr(l.name)}`);
    lines.push(`-- A profiles row + learners row must exist first (via auth signup).`);
    lines.push(`-- Then:`);
    lines.push(`update learners set studio = '${l.studio}' where id = '${l.id}';`);
    lines.push('');
  });

  const quotes = payload.data?.hc_year_quotes || {};
  Object.entries(quotes).forEach(([learnerId, text]) => {
    lines.push(`insert into year_quotes (learner_id, text) values ('${learnerId}', '${escapeSqlStr(text)}') on conflict (learner_id) do update set text = excluded.text;`);
  });

  const traits = payload.data?.hc_year_traits || {};
  Object.entries(traits).forEach(([learnerId, arr]) => {
    const traitsSql = '{' + arr.map((t) => `"${escapeSqlStr(t)}"`).join(',') + '}';
    lines.push(`insert into year_traits (learner_id, traits) values ('${learnerId}', '${traitsSql}') on conflict (learner_id) do update set traits = excluded.traits;`);
  });

  const goals = payload.data?.hc_goals || [];
  goals.forEach((g) => {
    lines.push(`insert into goals (id, learner_id, category_id, scope, session_index, text, status) values ('${g.id}', '${g.learnerId}', '${g.categoryId}', '${g.scope}', ${g.sessionIndex || 'null'}, '${escapeSqlStr(g.text)}', '${g.status || 'active'}');`);
  });

  const tasks = payload.data?.hc_tasks || {};
  Object.entries(tasks).forEach(([learnerId, list]) => {
    list.forEach((t) => {
      lines.push(`insert into tasks (id, learner_id, text, planned_for, status) values ('${t.id}', '${learnerId}', '${escapeSqlStr(t.text)}', '${t.plannedFor}', '${t.status}');`);
    });
  });

  const logins = payload.data?.hc_logins || {};
  Object.entries(logins).forEach(([learnerId, list]) => {
    list.forEach((l) => {
      const ct = l.password?.ct || '';
      const iv = l.password?.iv || '';
      lines.push(`insert into logins (id, learner_id, kind, service, username, password_ct, password_iv, url, note) values ('${l.id}', '${learnerId}', '${l.kind || 'core'}', '${escapeSqlStr(l.service)}', '${escapeSqlStr(l.username || '')}', '${ct}', '${iv}', '${escapeSqlStr(l.url || '')}', '${escapeSqlStr(l.note || '')}');`);
    });
  });

  return lines.join('\n');
}

function escapeSqlStr(s) {
  return String(s || '').replace(/'/g, "''");
}
