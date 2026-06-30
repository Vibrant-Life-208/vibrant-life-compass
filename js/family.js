// Family login layer: one shared login per family, then a "Who's exploring?"
// member picker (like profiles on a streaming app). Picking a member opens that
// member's normal Compass; a "whole family" tile opens a reflection-only view of
// everyone's values + character strengths together (the parent-facing piece).
//
// Each family member is an existing profile (parent or learner). The picker just
// chooses which profile this session acts as - so the rest of the app, which is
// already role-driven, needs no changes. A family session carries familyId so the
// person can switch members or open the family view without signing out.

import {
  getFamily, setSession, getParentLearnerLinks,
  getProfileValues, getValuesFreetext, getStrengthRanking,
  getValuesLexicon, getViaCharacterStrengths,
  getFamilyUpdates, addFamilyUpdate,
} from './store.js';

export function isFamilySession(session) {
  return !!(session && session.familyId);
}

// Build the per-member session from a chosen family member. Mirrors auth.js
// signInWithAccount role mapping, plus the family context so the member can
// switch / open the family view later.
export async function enterAsMember(family, member) {
  const session = {
    role: member.role,
    name: member.displayName || member.name,
    heroName: family.username,
    email: member.email || `${family.username}@vibrantlife.local`,
    signedInAt: new Date().toISOString(),
    familyId: family.id,
    familyName: family.name,
    activeProfileId: member.profileId,
    is_owner: !!member.is_owner, // owner-parents (e.g. Jenna + Wes) route to the owner home
  };
  if (member.role === 'learner') session.learnerId = member.profileId;
  if (member.role === 'guide') session.guideId = member.profileId;
  if (member.role === 'parent') {
    session.parentId = member.profileId;
    const links = await getParentLearnerLinks();
    const link = links.find((l) => l.parentId === member.profileId);
    if (link) session.learnerId = link.learnerId;
  }
  await setSession(session);
  return session;
}

function initials(name) {
  return String(name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

// "Who's exploring today?" - member tiles + a whole-family tile.
// onPick(member) enters the app as that member; onFamily() opens the family view.
export function renderMemberPicker(family, { onPick, onFamily, onSignOut }) {
  const screen = document.getElementById('member-picker-screen');
  if (!screen) return;
  showOnly(screen);

  const members = family.members || [];
  // A learner with no studio is a Tot (or not-yet-in-Compass): shown so the
  // family is whole, but not pickable as an explorer (no goals path yet).
  const isExplorer = (m) => m.kind === 'parent' || (m.kind === 'learner' && m.studio);
  const tiles = members.map((m, i) => {
    const active = isExplorer(m);
    return `
    <button type="button" class="member-tile${active ? '' : ' member-tile-inactive'}" ${active ? `data-member="${i}"` : 'disabled'}>
      <span class="member-avatar member-avatar-${m.kind}">${initials(m.displayName || m.name)}</span>
      <span class="member-name">${m.displayName || m.name}</span>
      <span class="member-kind">${active ? (m.kind === 'parent' ? 'Parent' : 'Learner') : 'Joining soon'}</span>
    </button>`;
  }).join('');

  screen.innerHTML = `
    <div class="picker-container">
      <h1 class="picker-title">${family.name}</h1>
      <p class="picker-sub">Who's exploring today?</p>
      <div class="member-grid">
        ${tiles}
        <button type="button" class="member-tile member-tile-family" data-family="1">
          <span class="member-avatar member-avatar-all">&#9733;</span>
          <span class="member-name">See our whole family</span>
          <span class="member-kind">Values &amp; strengths</span>
        </button>
      </div>
      <button type="button" class="picker-signout" data-signout="1">Sign out</button>
    </div>`;

  screen.querySelectorAll('[data-member]').forEach((btn) => {
    btn.addEventListener('click', () => onPick(members[Number(btn.dataset.member)]));
  });
  screen.querySelector('[data-family]')?.addEventListener('click', () => onFamily());
  screen.querySelector('[data-signout]')?.addEventListener('click', () => onSignOut && onSignOut());
}

// Resolve one member's top values + top character strengths into display labels.
async function memberSummary(member, lexicon, viaList) {
  const id = member.profileId;
  const [picked, typed, ranking] = await Promise.all([
    getProfileValues(id), getValuesFreetext(id), getStrengthRanking(id),
  ]);
  // Adults type their values; younger learners pick from the curated list.
  let values = (typed && typed.values && typed.values.length)
    ? typed.values.slice(0, 5)
    : (picked || []).map((vid) => labelFor(lexicon, vid)).filter(Boolean).slice(0, 5);
  const strengthIds = (ranking.top8 && ranking.top8.length) ? ranking.top8 : (ranking.top3 || []);
  const strengths = strengthIds.map((sid) => labelFor(viaList, sid)).filter(Boolean).slice(0, 5);
  return { member, values, strengths };
}

function labelFor(list, id) {
  const row = (list || []).find((r) => r.id === id);
  return row ? (row.display_label_adult || row.display_label || row.id) : id;
}

function tally(items) {
  const counts = new Map();
  items.forEach((x) => counts.set(x, (counts.get(x) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

// Reflection-only view of the whole family's values + character strengths.
export async function renderFamilyView(familyId, { onBack } = {}) {
  const screen = document.getElementById('family-view-screen');
  if (!screen) return;
  showOnly(screen);
  screen.innerHTML = '<div class="picker-container"><p class="picker-sub">Gathering your family…</p></div>';

  const family = await getFamily(familyId);
  if (!family) { screen.innerHTML = '<div class="picker-container"><p>Family not found.</p></div>'; return; }
  const [lexicon, viaList, updates] = await Promise.all([
    getValuesLexicon(), getViaCharacterStrengths(), getFamilyUpdates(familyId),
  ]);
  const summaries = await Promise.all((family.members || []).map((m) => memberSummary(m, lexicon, viaList)));

  const sharedValues = tally(summaries.flatMap((s) => s.values)).filter(([, n]) => n >= 2);
  const sharedStrengths = tally(summaries.flatMap((s) => s.strengths)).filter(([, n]) => n >= 2);

  const cards = summaries.map((s) => `
    <div class="family-member-card">
      <h3 class="family-member-name">${s.member.displayName || s.member.name}
        <span class="member-kind">${s.member.kind === 'parent' ? 'Parent' : 'Learner'}</span></h3>
      <div class="family-row"><span class="family-row-label">Values</span>
        <span class="family-chips">${chips(s.values, 'Not chosen yet')}</span></div>
      <div class="family-row"><span class="family-row-label">Strengths</span>
        <span class="family-chips">${chips(s.strengths, 'Not added yet')}</span></div>
    </div>`).join('');

  const shared = (sharedValues.length || sharedStrengths.length) ? `
    <div class="family-shared">
      <h3>What your family shares</h3>
      ${sharedValues.length ? `<div class="family-row"><span class="family-row-label">Values</span>
        <span class="family-chips">${chips(sharedValues.map(([v]) => v))}</span></div>` : ''}
      ${sharedStrengths.length ? `<div class="family-row"><span class="family-row-label">Strengths</span>
        <span class="family-chips">${chips(sharedStrengths.map(([v]) => v))}</span></div>` : ''}
    </div>` : '';

  // Updates feed: only what the learners chose to share. Receive-only - no reply,
  // no reaction, and nothing about streaks or unfinished work ever appears here.
  const feed = updates.length ? updates.map((u) => `
    <div class="family-update">
      <span class="family-update-icon">${u.kind === 'goal' ? '✨' : '\u{1F4AC}'}</span>
      <div class="family-update-body">
        <p class="family-update-text">${escapeHtml(u.body)}</p>
        <p class="family-update-meta">${escapeHtml(u.learnerName || 'A learner')}${u.kind === 'goal' ? ' · reached a goal' : ''} · ${formatDay(u.createdAt)}</p>
      </div>
    </div>`).join('') : '<p class="family-empty">No updates yet. When a learner shares something, it will appear here.</p>';

  screen.innerHTML = `
    <div class="picker-container family-view">
      <h1 class="picker-title">${family.name}</h1>
      <p class="picker-sub">Your family's values and character strengths, side by side. Reflection only - nothing is scored.</p>
      ${shared}
      <div class="family-updates">
        <h3>Updates from your learners</h3>
        ${feed}
      </div>
      <div class="family-members">${cards}</div>
      <button type="button" class="picker-signout" data-back="1">Back</button>
    </div>`;
  screen.querySelector('[data-back]')?.addEventListener('click', () => onBack && onBack());
}

function chips(items, emptyText) {
  if (!items || !items.length) return `<em class="family-empty">${emptyText || '—'}</em>`;
  return items.map((x) => `<span class="family-chip">${escapeHtml(x)}</span>`).join('');
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function formatDay(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

// Learner-initiated "Share with my family" - a goal celebration or a short note.
// Receive-only on the parent side; this is the only place an update is created.
export function openShareModal({ familyId, learnerId, onShared } = {}) {
  if (!familyId || !learnerId) return;
  const wrap = document.createElement('div');
  wrap.className = 'share-overlay';
  wrap.innerHTML = `
    <div class="share-modal" role="dialog" aria-modal="true">
      <h2 class="share-title">Share with your family</h2>
      <p class="share-sub">Only what you choose to share is seen. Your goals and daily steps stay yours.</p>
      <div class="share-kinds">
        <button type="button" class="share-kind is-on" data-kind="goal">✨ I reached a goal</button>
        <button type="button" class="share-kind" data-kind="note">💬 A little update</button>
      </div>
      <textarea class="share-text" maxlength="500" rows="3" placeholder="Say it in your own words…"></textarea>
      <div class="share-actions">
        <button type="button" class="btn share-cancel">Cancel</button>
        <button type="button" class="btn btn-primary share-send" disabled>Share</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  let kind = 'goal';
  const text = wrap.querySelector('.share-text');
  const send = wrap.querySelector('.share-send');
  const close = () => wrap.remove();
  wrap.querySelectorAll('.share-kind').forEach((b) => b.addEventListener('click', () => {
    kind = b.dataset.kind;
    wrap.querySelectorAll('.share-kind').forEach((x) => x.classList.toggle('is-on', x === b));
  }));
  text.addEventListener('input', () => { send.disabled = !text.value.trim(); });
  wrap.querySelector('.share-cancel').addEventListener('click', close);
  wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  send.addEventListener('click', async () => {
    const body = text.value.trim();
    if (!body) return;
    send.disabled = true;
    try { await addFamilyUpdate(familyId, learnerId, kind, body); } catch { /* surfaced below */ }
    close();
    if (onShared) onShared();
  });
  text.focus();
}

function showOnly(screen) {
  document.querySelectorAll('.screen').forEach((s) => {
    if (s !== screen) { s.classList.remove('active'); s.style.display = ''; }
  });
  screen.classList.add('active');
  screen.style.display = 'flex';
}
