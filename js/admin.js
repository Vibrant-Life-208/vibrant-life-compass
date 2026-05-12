// Account administration - guide-only tool.
// Captain decision 2026-05-12: Vibrant Life staff create all accounts;
// no self-signup, no email collection. Hero name + temporary password.
//
// Skeleton storage: temporary passwords are NOT stored locally (we don't
// have password auth yet in skeleton mode). When Supabase activates, this
// tool calls supabase.auth.admin.createUser({ email: synthetic, password,
// email_confirm: true }) and shows the temp password once to the guide,
// who hands it to the learner on paper.

import {
  getLearners, saveLearner,
  getParents, saveParent,
  getGuides, saveGuide,
  linkParentToLearner, getParentLearnerLinks,
} from './store.js';
import { STUDIOS } from './studios.js';
import { openCreateAccountModal } from './modals.js';

export async function renderAdminAccounts() {
  const container = document.getElementById('admin-accounts');
  if (!container) return;

  const [learners, parents, guides, links] = await Promise.all([
    getLearners(), getParents(), getGuides(), getParentLearnerLinks(),
  ]);

  let html = '';

  html += renderGroup('Hero geniuses (learners)', learners.map(l => ({
    name: l.heroName || l.name,
    sub: studioLabel(l.studio),
    role: 'learner',
  })));

  html += renderGroup('Parents', parents.map(p => {
    const link = links.find(x => x.parentId === p.id);
    const linkedLearner = link ? learners.find(l => l.id === link.learnerId) : null;
    return {
      name: p.heroName || p.name,
      sub: linkedLearner ? `linked to ${linkedLearner.heroName || linkedLearner.name}` : 'no learner linked',
      role: 'parent',
    };
  }));

  html += renderGroup('Guides', guides.map(g => ({
    name: g.heroName || g.name,
    sub: 'guide',
    role: 'guide',
  })));

  container.innerHTML = html;
}

function renderGroup(title, items) {
  return `
    <div class="admin-group">
      <h4 class="admin-group-title">${escapeHtml(title)}</h4>
      ${items.length === 0
        ? '<p class="learners-empty">None yet.</p>'
        : '<ul class="admin-account-list">' + items.map(a => `
            <li class="admin-account-row">
              <span class="admin-account-name">${escapeHtml(a.name)}</span>
              <span class="admin-account-sub">${escapeHtml(a.sub)}</span>
              <button type="button" class="btn btn-text admin-reset-btn" data-role="${a.role}" data-name="${escapeHtml(a.name)}">Reset password</button>
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
        availableLearners: null, // resolved at submit time
        onCreate: async (data) => {
          await createAccount(data);
          await renderAdminAccounts();
        },
      });
    });
  }
  // Reset password buttons - skeleton shows a placeholder message
  document.getElementById('admin-accounts')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('admin-reset-btn')) {
      const tempPassword = generateTempPassword();
      alert(`Temporary password for ${e.target.dataset.name}:\n\n${tempPassword}\n\n(Skeleton only - real reset wires in when Supabase Auth activates. Hand this to the learner on paper.)`);
    }
  });
}

async function createAccount(data) {
  const { type, heroName, studio, linkedLearnerId } = data;
  const name = heroName.trim();
  if (!name) return;

  if (type === 'learner') {
    const learners = await saveLearner({
      heroName: name,
      name: prettyName(name),
      studio: studio || 'adventure',
      guideEmail: '',
      parentEmail: '',
    });
    return learners[learners.length - 1];
  }
  if (type === 'parent') {
    const parents = await saveParent({
      heroName: name,
      name: prettyName(name),
    });
    const parent = parents[parents.length - 1];
    if (linkedLearnerId) {
      await linkParentToLearner(parent.id, linkedLearnerId);
    }
    return parent;
  }
  if (type === 'guide') {
    const guides = await saveGuide({
      heroName: name,
      name: prettyName(name),
    });
    return guides[guides.length - 1];
  }
}

function prettyName(heroName) {
  return heroName
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function generateTempPassword() {
  // Skeleton placeholder. Real Supabase reset generates a cryptographically
  // secure password via the admin API and stores it hashed.
  const words = ['compass', 'lantern', 'river', 'meadow', 'summit', 'harbor', 'thistle', 'beacon'];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${w}-${n}`;
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
