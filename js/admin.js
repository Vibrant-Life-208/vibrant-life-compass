// Account administration - guide-only tool.
// Captain decision 2026-05-12: Vibrant Life staff create all accounts;
// no self-signup, no email collection. Hero name + temporary password.

import {
  getLearners, saveLearner,
  getParents, saveParent,
  getGuides, saveGuide,
  linkParentToLearner, getParentLearnerLinks,
  resetPassword,
} from './store.js';
import { STUDIOS } from './studios.js';
import { openCreateAccountModal, openBulkImportModal, openTempPasswordModal } from './modals.js';
import { hashPassword, generateTempPassword } from './crypto.js';
import { BACKEND_TYPE } from './backend/config.js';

export async function renderAdminAccounts() {
  const container = document.getElementById('admin-accounts');
  if (!container) return;

  const [learners, parents, guides, links] = await Promise.all([
    getLearners(), getParents(), getGuides(), getParentLearnerLinks(),
  ]);

  // In-app reset works on LOCAL (the PBKDF2 hash IS the credential store here).
  // On Supabase the password lives in Auth, so a real reset needs the server-side
  // 2FA-gated flow (Phase 2); there we keep the "use the admin reset tool" note
  // instead of handing out a dead temp password.
  const canReset = BACKEND_TYPE === 'local';
  let html = canReset
    ? '<p class="admin-note">Forgot a password? Tap <strong>Reset password</strong> on anyone below to generate a one-time temp password. They set their own the next time they sign in.</p>'
    : '<p class="admin-note">Password resets are run from the admin reset tool for now - the secure in-app reset (with two-factor) is on the way. Any staff member can help.</p>';

  html += renderGroup('Hero geniuses (learners)', learners.map(l => ({
    id: l.id,
    name: l.heroName || l.name,
    sub: studioLabel(l.studio),
    role: 'learner',
  })), canReset);

  html += renderGroup('Parents', parents.map(p => {
    const link = links.find(x => x.parentId === p.id);
    const linkedLearner = link ? learners.find(l => l.id === link.learnerId) : null;
    return {
      id: p.id,
      name: p.heroName || p.name,
      sub: linkedLearner ? `linked to ${linkedLearner.heroName || linkedLearner.name}` : 'no learner linked',
      role: 'parent',
    };
  }), canReset);

  html += renderGroup('Guides', guides.map(g => ({
    id: g.id,
    name: g.heroName || g.name,
    sub: 'guide',
    role: 'guide',
  })), canReset);

  container.innerHTML = html;

  if (canReset) wireResetButtons(container);
}

// Wire the per-account "Reset password" buttons (local backend only). Generates
// a fresh temp password, flags must_change_password, and shows the temp once for
// the guide to hand over. Re-renders after close so the list stays live.
function wireResetButtons(container) {
  container.querySelectorAll('[data-reset-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const role = btn.dataset.resetRole;
      const id = btn.dataset.resetId;
      const heroName = btn.closest('.admin-account-row')?.querySelector('.admin-account-name')?.textContent || '';
      try {
        const res = await resetPassword(role, id);
        if (res?.tempPassword) {
          openTempPasswordModal({
            heroName,
            tempPassword: res.tempPassword,
            onClose: async () => { await renderAdminAccounts(); },
          });
        } else {
          btn.disabled = false;
        }
      } catch (e) {
        console.error('[admin] reset failed:', e);
        btn.disabled = false;
      }
    });
  });
}

function renderGroup(title, items, canReset = false) {
  return `
    <div class="admin-group">
      <h4 class="admin-group-title">${escapeHtml(title)}</h4>
      ${items.length === 0
        ? '<p class="learners-empty">None yet.</p>'
        : '<ul class="admin-account-list">' + items.map(a => `
            <li class="admin-account-row">
              <span class="admin-account-name">${escapeHtml(a.name)}</span>
              <span class="admin-account-sub">${escapeHtml(a.sub)}</span>
              ${canReset ? `<button type="button" class="btn btn-small btn-text admin-reset-btn" data-reset-role="${escapeHtml(a.role)}" data-reset-id="${escapeHtml(a.id)}">Reset password</button>` : ''}
            </li>
          `).join('') + '</ul>'
      }
    </div>
  `;
}

export function initAdmin() {
  const btn = document.getElementById('admin-create-btn');
  if (btn && !btn.dataset.wired) {
    btn.dataset.wired = '1';
    btn.addEventListener('click', () => {
      openCreateAccountModal({
        studios: STUDIOS,
        onCreate: async (data) => {
          const result = await createAccount(data);
          if (result?.tempPassword) {
            openTempPasswordModal({
              heroName: result.heroName,
              tempPassword: result.tempPassword,
              onClose: async () => { await renderAdminAccounts(); },
            });
          } else {
            await renderAdminAccounts();
          }
        },
      });
    });
  }

  const bulkBtn = document.getElementById('admin-bulk-btn');
  if (bulkBtn && !bulkBtn.dataset.wired) {
    bulkBtn.dataset.wired = '1';
    bulkBtn.addEventListener('click', () => {
      openBulkImportModal({
        studios: STUDIOS,
        onImport: async (rows) => {
          // Learners first so parent rows can resolve their linkedLearnerHeroName to a real id
          const order = { learner: 0, guide: 1, parent: 2 };
          const sorted = [...rows].sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));
          // Map from heroName → learner id, seeded with existing learners
          const existingLearners = await getLearners();
          const heroToId = new Map(existingLearners.map((l) => [(l.heroName || '').toLowerCase(), l.id]));
          const results = [];
          for (const row of sorted) {
            if (row.type === 'parent' && Array.isArray(row.linkedLearnerHeroNames)) {
              row.linkedLearnerIds = row.linkedLearnerHeroNames
                .map((n) => heroToId.get(n))
                .filter(Boolean);
            }
            const r = await createAccount(row);
            if (r) {
              results.push(r);
              if (row.type === 'learner') heroToId.set(row.heroName.toLowerCase(), r.id);
            }
          }
          openTempPasswordModal({
            multiple: results.map(r => ({ heroName: r.heroName, tempPassword: r.tempPassword })),
            onClose: async () => { await renderAdminAccounts(); },
          });
        },
      });
    });
  }

  // In-app reset removed (Ring 2 2026-06-30): the prior handler hashed a temp
  // password into PBKDF2 fields the Supabase adapter ignores, so the real Auth
  // password never changed. The secure replacement (constant-time request ->
  // tribe-guide/owner notification; 2FA-gated guide reset) is Phase 2. Until
  // then, resets are owner-run via `bulk-import.mjs --reset <hero_name>`.
}

async function createAccount(data) {
  const { type, heroName, studio, linkedLearnerId, linkedLearnerIds, fullName } = data;
  const name = heroName.trim();
  if (!name) return null;

  // Display name: prefer the explicit fullName from the CSV; fall back to
  // a pretty-cased version of the hero-name slug ("kyra-j" → "Kyra J").
  const displayName = (fullName && fullName.trim()) || prettyName(name);

  const tempPassword = generateTempPassword();
  const hashed = await hashPassword(tempPassword);

  if (type === 'learner') {
    const learners = await saveLearner({
      heroName: name,
      name: displayName,
      studio: studio || 'adventure',
      guideEmail: '',
      parentEmail: '',
      passwordHash: hashed.hash,
      passwordSalt: hashed.salt,
      setupCompletedAt: null,
      priorityGoalIds: [],
    });
    return { ...learners[learners.length - 1], tempPassword, heroName: name };
  }
  if (type === 'parent') {
    const parents = await saveParent({
      heroName: name,
      name: displayName,
      passwordHash: hashed.hash,
      passwordSalt: hashed.salt,
    });
    const parent = parents[parents.length - 1];
    const ids = Array.isArray(linkedLearnerIds) && linkedLearnerIds.length > 0
      ? linkedLearnerIds
      : (linkedLearnerId ? [linkedLearnerId] : []);
    for (const id of ids) {
      await linkParentToLearner(parent.id, id);
    }
    return { ...parent, tempPassword, heroName: name };
  }
  if (type === 'guide') {
    const guides = await saveGuide({
      heroName: name,
      name: displayName,
      passwordHash: hashed.hash,
      passwordSalt: hashed.salt,
    });
    return { ...guides[guides.length - 1], tempPassword, heroName: name };
  }
}

function prettyName(heroName) {
  return heroName
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function studioLabel(id) {
  return STUDIOS[id]?.name || id || 'unknown';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
