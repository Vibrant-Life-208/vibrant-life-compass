// Parent view - scoped to session-level visibility only.

import { getLearners, getGoals, getSession, getNotifications, markNotificationRead, getParents, getParentLearnerLinks } from './store.js';
import { getCategoriesForStudio, PARENT_SUPPORT_HINTS } from './studios.js';
import { computeYearPosition } from './year-map.js';
import { renderParentBadgesJourney } from './parent-badges.js';

// Which kid this parent is currently viewing (per-session, in-memory).
// Reset on every renderParentView call if not set.
let activeKidIndex = 0;

export async function renderParentView() {
  const container = document.getElementById('parent-learner');
  if (!container) return;

  // CRITICAL: scope to ONLY this parent's linked kids.
  // Reading learners[0] for everyone (the prior implementation) leaks the first
  // learner's data to any signed-in parent.
  const session = await getSession();
  if (!session?.parentId) {
    container.innerHTML = '<p class="learners-empty">No parent session active.</p>';
    return;
  }

  container.innerHTML = '';

  // Parent mini North - their own year quote as a personal anchor, at the top.
  const anchorHost = document.createElement('div');
  anchorHost.id = 'parent-anchor-host';
  anchorHost.className = 'parent-anchor-host';
  container.appendChild(anchorHost);
  const { renderParentAnchor } = await import('./parent-anchor.js');
  renderParentAnchor(anchorHost, session.parentId);

  // Parents & Tots recognition - the canonical gated four-badge journey from
  // js/parent-badges.js (single source of truth). Rendered first so a P&T parent
  // whose tot isn't on Compass still has a home here. This legacy per-parent path
  // is being retired by the family-login migration (captain 2026-06-28); migrated
  // parents get this same component in the family view. Previously this rendered a
  // divergent local copy (renderParentsAndTots) that carried a "Session undefined"
  // kicker and lacked the conversation-first gate - removed 2026-07-17.
  const ptHost = document.createElement('div');
  container.appendChild(ptHost);
  renderParentBadgesJourney(ptHost, session.parentId);

  const [allLearners, allLinks] = await Promise.all([getLearners(), getParentLearnerLinks()]);
  const myLinks = allLinks.filter((l) => l.parentId === session.parentId);
  const myKids = myLinks
    .map((l) => allLearners.find((x) => x.id === l.learnerId))
    .filter(Boolean);

  if (myKids.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'learners-empty';
    empty.textContent = 'No learner linked to your account yet. Ask a guide to link your account.';
    container.appendChild(empty);
    return;
  }

  // Clamp the active index in case the link list changed since last render.
  if (activeKidIndex >= myKids.length) activeKidIndex = 0;
  const learner = myKids[activeKidIndex];
  const goals = await getGoals(learner.id);
  const position = computeYearPosition();
  const currentSession = position.beforeYearStart ? 1 : position.sessionIndex;
  const previousSession = currentSession - 1;

  // Notifications surface for the parent (year-plan-approved + milestone-shared)
  const notifs = await getNotifications(session.parentId);
  const unread = notifs.filter((n) => !n.readAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (unread.length > 0) {
    const notifBox = document.createElement('div');
    notifBox.className = 'parent-notif-card';
    notifBox.innerHTML = unread.slice(0, 5).map((n) => `
      <div class="parent-notif-item" data-notif="${n.id}">
        <span class="parent-notif-title">${escapeHtml(n.title)}</span>
        <p class="parent-notif-body">${escapeHtml(n.body)}</p>
      </div>
    `).join('');
    container.appendChild(notifBox);
    notifBox.querySelectorAll('[data-notif]').forEach((el) => {
      el.addEventListener('click', async () => {
        await markNotificationRead(el.dataset.notif);
        el.classList.add('parent-notif-read');
      });
    });
  }

  // Kid switcher - shown only when this parent has multiple linked kids.
  // For single-kid families this stays hidden.
  if (myKids.length > 1) {
    const switcher = document.createElement('div');
    switcher.className = 'parent-kid-switcher';
    switcher.innerHTML = myKids.map((k, i) => `
      <button type="button" class="parent-kid-tab${i === activeKidIndex ? ' is-active' : ''}" data-kid-index="${i}">
        ${escapeHtml(k.name)}
      </button>
    `).join('');
    container.appendChild(switcher);
    switcher.querySelectorAll('[data-kid-index]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        activeKidIndex = Number(btn.dataset.kidIndex);
        await renderParentView();
      });
    });
  }

  const header = document.createElement('div');
  header.className = 'parent-header';
  header.innerHTML = `
    <h3 class="parent-learner-name">${escapeHtml(learner.name)}</h3>
    <p class="parent-learner-meta">${escapeHtml(getStudioLabel(learner.studio))} · Session ${currentSession} of 7</p>
  `;
  container.appendChild(header);

  if (previousSession >= 1) {
    const recap = renderRecap(learner, goals, previousSession);
    container.appendChild(recap);
  }

  const focus = renderCurrentSessionFocus(learner, goals, currentSession);
  container.appendChild(focus);

  const supportCard = renderSupportSuggestion(learner, goals, currentSession);
  if (supportCard) container.appendChild(supportCard);
}

function renderRecap(learner, allGoals, sessionIndex) {
  const sessionGoals = allGoals.filter(
    (g) => g.scope === 'session' && g.sessionIndex === sessionIndex
  );
  if (sessionGoals.length === 0) return document.createElement('div');

  // Reflection, not verdict: show what the learner worked on this session — their own
  // goals, self-referenced, no count/percentage/comparison. (Principle 2, sharpened
  // 2026-07-18: reflect competence informationally; never score. A parent scorecard reads
  // to a child as distrust of their competence — a measured harm, not just a breach.)
  const wrap = document.createElement('div');
  wrap.className = 'parent-recap-card';
  wrap.innerHTML = `
    <div class="parent-recap-header">
      <span class="parent-section-label">What they worked on, session ${sessionIndex}</span>
    </div>
    <ul class="parent-celebrations">${sessionGoals.map((g) => `<li>${escapeHtml(g.text)}</li>`).join('')}</ul>
  `;
  return wrap;
}

function renderCurrentSessionFocus(learner, allGoals, sessionIndex) {
  const sessionGoals = allGoals.filter(
    (g) => g.scope === 'session' && g.sessionIndex === sessionIndex
  );

  const wrap = document.createElement('div');
  wrap.className = 'parent-current-card';
  wrap.innerHTML = `<div class="parent-section-label">Session ${sessionIndex} goals</div>`;

  if (sessionGoals.length === 0) {
    wrap.innerHTML += '<p class="learners-empty">No session goals set yet.</p>';
    return wrap;
  }

  const list = document.createElement('ul');
  list.className = 'parent-goal-list';
  sessionGoals.forEach((g) => {
    const cat = findCategoryName(learner.studio, g.categoryId);
    const status = g.status || 'active';
    // "In review" pending-approval badge removed (2026-07-18): a verdict-in-waiting on the
    // parent surface. The broader approval-verb -> witness conversion is a leadership call
    // (fix-now vs at-flip) tracked separately.
    const statusBadge = status === 'approved' || status === 'done'
      ? '<span class="parent-goal-status parent-goal-done">Done</span>'
      : '';
    const li = document.createElement('li');
    li.className = 'parent-goal-item' + (status === 'approved' || status === 'done' ? ' is-done' : '');
    li.innerHTML = `
      <span class="parent-goal-cat">${escapeHtml(cat)}</span>
      <p class="parent-goal-text">${escapeHtml(g.text)} ${statusBadge}</p>
    `;
    list.appendChild(li);
  });
  wrap.appendChild(list);
  return wrap;
}

function renderSupportSuggestion(learner, allGoals, sessionIndex) {
  const sessionGoals = allGoals.filter(
    (g) => g.scope === 'session' && g.sessionIndex === sessionIndex && g.status !== 'approved' && g.status !== 'done'
  );
  if (sessionGoals.length === 0) return null;

  const focus = sessionGoals[0];
  const cat = findCategoryName(learner.studio, focus.categoryId);
  const hint = PARENT_SUPPORT_HINTS[focus.categoryId] || 'Ask one open question. Listen more than you talk.';

  const wrap = document.createElement('div');
  wrap.className = 'parent-support-card';
  wrap.innerHTML = `
    <div class="parent-section-label">One goal to help support</div>
    <p class="parent-support-goal">${escapeHtml(cat)} · "${escapeHtml(focus.text)}"</p>
    <p class="parent-support-how-label">How to support</p>
    <p class="parent-support-how">${escapeHtml(hint)}</p>
  `;
  return wrap;
}

function findCategoryName(studioId, categoryId) {
  const cats = getCategoriesForStudio(studioId);
  return cats.find((c) => c.id === categoryId)?.name || categoryId;
}

function getStudioLabel(studioId) {
  const labels = {
    sparks: 'Sparks',
    discovery: 'Discovery',
    adventure: 'Adventure',
    launchpad: 'Launchpad',
  };
  return labels[studioId] || studioId;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
