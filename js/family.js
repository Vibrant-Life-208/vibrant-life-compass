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
  getFamily, setSession, getSession, getParentLearnerLinks,
  getProfileValues, getValuesFreetext, getStrengthRanking,
  getValuesLexicon, getViaCharacterStrengths,
  getFamilyUpdates, addFamilyUpdate,
  getGoals, getLearner,
} from './store.js';
import { getBooks } from './books.js';
import { renderSafeBaseDailyBlessing } from './parent-badges.js';

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
  // Parents only. Discovery+ learners sign in with their own logins; younger
  // learners have none. This picker is the parent / owner door. (Original index
  // kept on data-member so onPick maps back to the right member.)
  const tiles = members.map((m, i) => ({ m, i })).filter(({ m }) => m.kind === 'parent').map(({ m, i }) => `
    <button type="button" class="member-tile" data-member="${i}">
      <span class="member-avatar member-avatar-${m.kind}">${initials(m.displayName || m.name)}</span>
      <span class="member-name">${m.displayName || m.name}</span>
      <span class="member-kind">${m.is_owner ? 'Owner' : 'Parent'}</span>
    </button>`).join('');

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

  // Learner cards open a fuller portrait of that child; parent cards stay static.
  // A learner name is a doorway, not a row of data (fleet meeting 2026-07-21).
  const cards = summaries.map((s, i) => {
    const isLearner = s.member.kind === 'learner';
    const inner = `
      <h3 class="family-member-name">${escapeHtml(s.member.displayName || s.member.name)}
        <span class="member-kind">${isLearner ? 'Learner' : 'Parent'}</span>${isLearner ? '<span class="family-member-open">View &rarr;</span>' : ''}</h3>
      <div class="family-row"><span class="family-row-label">Values</span>
        <span class="family-chips">${chips(s.values, 'Not chosen yet')}</span></div>
      <div class="family-row"><span class="family-row-label">Strengths</span>
        <span class="family-chips">${chips(s.strengths, 'Not added yet')}</span></div>`;
    return isLearner
      ? `<button type="button" class="family-member-card family-member-card-open" data-portrait="${i}">${inner}</button>`
      : `<div class="family-member-card">${inner}</div>`;
  }).join('');

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
      <div id="parent-anchor-host" class="parent-anchor-host"></div>
      ${shared}
      <div class="family-updates">
        <h3>Updates from your learners</h3>
        ${feed}
      </div>
      <div class="family-members">${cards}</div>
      <div id="pt-journey" class="pt-journey"></div>
      <button type="button" class="picker-signout" data-back="1">Back</button>
    </div>`;
  screen.querySelector('[data-back]')?.addEventListener('click', () => onBack && onBack());

  // A child's name is a doorway. Clicking it opens their portrait; Back returns here.
  screen.querySelectorAll('[data-portrait]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const member = summaries[Number(btn.dataset.portrait)]?.member;
      if (!member) return;
      renderLearnerPortrait(member, family, { onBack: () => renderFamilyView(familyId, { onBack }) });
    });
  });

  // Parent-side Parents & Tots - the daily Safe-Base blessing during the first session
  // (captain 2026-07-20; replaces the four-badge journey). Shows nothing outside session 1.
  const session = await getSession();
  const activeMember = (family.members || []).find((m) => m.profileId === session?.activeProfileId);
  if (activeMember && activeMember.kind === 'parent') {
    renderSafeBaseDailyBlessing(document.getElementById('pt-journey'));
    const { renderParentAnchor } = await import('./parent-anchor.js');
    renderParentAnchor(document.getElementById('parent-anchor-host'), activeMember.profileId);
  }
}

function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'This learner';
}

// A learner's portrait — a portrait, not a report (fleet meeting 2026-07-21).
// Tiers by sovereignty class:
//   A (always shareable, identity the learner authored to be seen): strengths, values.
//   B (shareable with framing, never a scoreboard): goals in the learner's own words,
//     book titles. Completion state — goal status, book progress — is NEVER surfaced.
//   C (sealed): the North Star quote is self-only in RLS and simply does not load for an
//     owner; practice/private moments never render. Absence is invisible — no padlock,
//     no "Private" placeholder. What isn't shown leaves no shadow.
async function renderLearnerPortrait(member, family, { onBack } = {}) {
  const screen = document.getElementById('family-view-screen');
  if (!screen) return;
  showOnly(screen);
  const name = member.displayName || member.name || 'This learner';
  screen.innerHTML = `<div class="picker-container family-view"><p class="picker-sub">Gathering ${escapeHtml(firstName(name))}'s portrait…</p></div>`;

  const [lexicon, viaList] = await Promise.all([getValuesLexicon(), getViaCharacterStrengths()]);
  const summary = await memberSummary(member, lexicon, viaList); // Tier A: values + strengths

  // Tier B — reaching toward: active goals in the learner's own words. Status is used to
  // hide finished goals from the shelf; it is never shown. No percentages, no counts.
  let reaching = [];
  try {
    const goals = await getGoals(member.profileId);
    reaching = (goals || [])
      .filter((g) => g && g.text && g.status !== 'done' && g.status !== 'archived')
      .map((g) => String(g.text).trim())
      .filter(Boolean)
      .slice(0, 4);
  } catch { reaching = []; }

  // Tier B — lighting up lately: book titles only. The bookmark ("where you are") is the
  // learner's private evolving now and is deliberately not carried here.
  let books = [];
  try {
    const learner = await getLearner(member.profileId);
    books = getBooks(learner).map((b) => b.title).filter(Boolean).slice(0, 3);
  } catch { books = []; }

  const reachingBlock = reaching.length ? `
    <div class="portrait-section">
      <h2 class="portrait-section-title">Reaching toward</h2>
      <ul class="portrait-list">${reaching.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
    </div>` : '';
  const booksBlock = books.length ? `
    <div class="portrait-section">
      <h2 class="portrait-section-title">Lighting up lately</h2>
      <ul class="portrait-list">${books.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
    </div>` : '';

  screen.innerHTML = `
    <div class="picker-container family-view learner-portrait">
      <button type="button" class="owner-back" data-back="1">&#8592; ${escapeHtml(family?.name || 'Family')}</button>
      <div class="portrait-head">
        <span class="member-avatar member-avatar-learner portrait-avatar">${initials(name)}</span>
        <h1 class="portrait-name">${escapeHtml(name)}</h1>
      </div>
      <p class="portrait-frame">This is who ${escapeHtml(firstName(name))} is showing us they're becoming - an invitation to encourage, not a report to evaluate.</p>
      <div class="portrait-section">
        <span class="family-row-label">Strengths</span>
        <div class="family-chips">${chips(summary.strengths, 'Not added yet')}</div>
      </div>
      <div class="portrait-section">
        <span class="family-row-label">Values</span>
        <div class="family-chips">${chips(summary.values, 'Not chosen yet')}</div>
      </div>
      ${reachingBlock}
      ${booksBlock}
      <button type="button" class="picker-signout" data-back="1">Back</button>
    </div>`;
  screen.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => onBack && onBack()));
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
