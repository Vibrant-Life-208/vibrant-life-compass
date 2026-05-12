// Logins view. Per-learner credential store for external services.
// (Khan Academy, Lexia, Google, No Red Ink, anything the learner signs into.)
// Visibility scope matches goals: learner + their parents + assigned guides.
// Stored in localStorage; never syncs off-network in the skeleton.

import { getLogins, saveLogin, deleteLogin, revealLoginPassword } from './store.js';
import { openLoginModal, openConfirmModal } from './modals.js';

// Reveal state: maps loginId -> { plaintext, hideAt (timestamp) }.
// Per Decision 4 (Worf + Tutela): default-hidden, explicit per-reveal
// confirmation, auto-hide after 10 seconds.
const revealed = new Map();
const REVEAL_DURATION_MS = 10000;
let currentFilter = 'all';

const KIND_LABEL = { core: 'Core work', passion: 'Passion project', other: 'Other' };

export async function renderLogins(learnerId) {
  const list = document.getElementById('logins-list');
  if (!learnerId) {
    list.innerHTML = '<p class="learners-empty">No learner selected.</p>';
    return;
  }
  let items = await getLogins(learnerId);
  if (currentFilter !== 'all') {
    items = items.filter((l) => (l.kind || 'core') === currentFilter);
  }
  if (items.length === 0) {
    const empty = currentFilter === 'all'
      ? 'No passwords saved yet. Tap + to add one.'
      : `No passwords in this group yet.`;
    list.innerHTML = `<p class="learners-empty">${empty}</p>`;
    return;
  }
  list.innerHTML = '';
  items.forEach((login) => {
    list.appendChild(renderLoginCard(learnerId, login));
  });
}

function renderLoginCard(learnerId, login) {
  const card = document.createElement('div');
  card.className = 'login-card';
  const kind = login.kind || 'core';
  const revealEntry = revealed.get(login.id);
  const isRevealed = revealEntry && revealEntry.hideAt > Date.now();
  const displayPass = isRevealed ? escapeHtml(revealEntry.plaintext) : '••••••••';

  card.innerHTML = `
    <div class="login-card-header">
      <span class="login-service">${escapeHtml(login.service)}</span>
      <span class="login-kind login-kind-${kind}">${KIND_LABEL[kind] || 'Other'}</span>
    </div>
    <div class="login-row">
      <span class="login-row-label">User</span>
      <span class="login-row-value">${escapeHtml(login.username || '')}</span>
    </div>
    <div class="login-row">
      <span class="login-row-label">Pass</span>
      <span class="login-row-value">
        <span class="login-pass-value">${displayPass}</span>
        <button class="login-reveal-btn" data-action="reveal" data-id="${login.id}">${isRevealed ? 'Hide' : 'Show'}</button>
        ${isRevealed ? '<span class="login-reveal-timer">auto-hide in <span data-id="' + login.id + '" class="reveal-countdown">10</span>s</span>' : ''}
      </span>
    </div>
    ${login.url ? `<div class="login-row"><span class="login-row-label">URL</span><span class="login-row-value"><a href="${escapeAttr(login.url)}" target="_blank" rel="noopener">Open</a></span></div>` : ''}
    ${login.note ? `<div class="login-row"><span class="login-row-label">Note</span><span class="login-row-value">${escapeHtml(login.note)}</span></div>` : ''}
    <div class="login-actions">
      <button class="btn btn-small btn-text" data-action="edit" data-id="${login.id}">Edit</button>
      <button class="btn btn-small btn-text" data-action="delete" data-id="${login.id}">Delete</button>
    </div>
  `;
  card.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const action = e.currentTarget.dataset.action;
      const id = e.currentTarget.dataset.id;
      if (action === 'reveal') {
        if (revealed.has(id) && revealed.get(id).hideAt > Date.now()) {
          revealed.delete(id);
          await renderLogins(learnerId);
        } else {
          openConfirmModal({
            title: 'Reveal this password?',
            body: 'The password will be visible for 10 seconds, then auto-hidden. Make sure no one is looking over your shoulder.',
            confirmLabel: 'Reveal',
            cancelLabel: 'Cancel',
            onConfirm: async () => {
              const plaintext = await revealLoginPassword(learnerId, id);
              revealed.set(id, { plaintext, hideAt: Date.now() + REVEAL_DURATION_MS });
              await renderLogins(learnerId);
              startCountdown(id, learnerId);
            },
          });
        }
      }
      if (action === 'edit') {
        const items = await getLogins(learnerId);
        const existing = items.find((l) => l.id === id);
        const plaintext = await revealLoginPassword(learnerId, id);
        const editable = { ...existing, password: plaintext };
        openLoginModal({ existing: editable, onSave: async (data) => {
          await saveLogin(learnerId, { id, ...data });
          revealed.delete(id);
          await renderLogins(learnerId);
        }});
      }
      if (action === 'delete') {
        if (confirm('Delete this login?')) {
          await deleteLogin(learnerId, id);
          revealed.delete(id);
          await renderLogins(learnerId);
        }
      }
    });
  });
  return card;
}

function startCountdown(id, learnerId) {
  let secondsLeft = REVEAL_DURATION_MS / 1000;
  const tick = setInterval(async () => {
    secondsLeft--;
    const entry = revealed.get(id);
    if (!entry || entry.hideAt <= Date.now()) {
      clearInterval(tick);
      revealed.delete(id);
      await renderLogins(learnerId);
      return;
    }
    const el = document.querySelector(`.reveal-countdown[data-id="${id}"]`);
    if (el) el.textContent = String(Math.max(0, secondsLeft));
  }, 1000);
}

export function initLogins(learnerId) {
  const fab = document.getElementById('logins-add');
  if (fab) {
    const fresh = fab.cloneNode(true);
    fab.parentNode.replaceChild(fresh, fab);
    fresh.addEventListener('click', () => {
      openLoginModal({
        onSave: async (data) => {
          await saveLogin(learnerId, data);
          await renderLogins(learnerId);
        },
      });
    });
  }
  const filter = document.getElementById('passwords-filter-select');
  if (filter && !filter.dataset.wired) {
    filter.dataset.wired = '1';
    filter.addEventListener('change', async (e) => {
      currentFilter = e.target.value;
      await renderLogins(learnerId);
    });
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s) {
  return escapeHtml(s);
}
