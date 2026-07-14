// Parent view - scoped to session-level visibility only.

import { getLearners, getGoals, getSession, getNotifications, markNotificationRead, getParents, getParentLearnerLinks } from './store.js';
import { getCategoriesForStudio, PARENT_SUPPORT_HINTS } from './studios.js';
import { computeYearPosition } from './year-map.js';
import {
  PARENT_BADGE_ARC, SAFE_BASE_DAILY_GOALS, BADGE_HONESTY,
  isPtFamily, setPtFamily, isHoldingBadge, setHoldingBadge,
} from './parent-badges.js';

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

  // Parents & Tots recognition arc (self-disclosed, local-only, never tracked).
  // Rendered first so a P&T family with no learner record still has a home here.
  // Category wall: recognition of a parent posture, never learner mastery.
  renderParentsAndTots(container, session.parentId);

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

// --- Parents & Tots recognition arc --------------------------------------
// Self-disclosed, local-only, never tracked. Recognition of a parent posture,
// rendered visually distinct from learner mastery. Category wall enforced: no
// count, streak, completion, or guide/admin visibility ever appears here.
// See js/parent-badges.js. Build step 1: the Safe Base worked example.
function renderParentsAndTots(container, parentId) {
  const card = document.createElement('section');
  card.className = 'parent-pt-card';

  // Not yet self-identified as a P&T family: a quiet invitation, easy to ignore.
  if (!isPtFamily(parentId)) {
    card.classList.add('parent-pt-optin');
    card.innerHTML = `
      <div class="parent-section-label">Parents &amp; Tots</div>
      <p class="pt-optin-line">Are you a <b>Parents &amp; Tots</b> family? Your own Hero's Journey has recognitions here - for you, not your child.</p>
      <button type="button" class="pt-btn pt-btn-quiet" data-pt-join>Show my Tots arc</button>
    `;
    card.querySelector('[data-pt-join]').addEventListener('click', () => {
      setPtFamily(parentId, true);
      renderParentView();
    });
    container.appendChild(card);
    return;
  }

  const badge = PARENT_BADGE_ARC[0]; // Safe Base - the worked example (build step 1)
  const holding = isHoldingBadge(parentId, badge.id);

  // NOTE: "The Path" (the four-badge marker) was removed from step 1 by owner
  // review (2026-07-08, convergent signal: Accord/Comes/Salus/Polaris). A fixed
  // "you are here = 1 of 4" read as a developmental ladder / loading bar. It
  // returns in step 2 as a moving LOOP synced to the real session (never a
  // fixed rung, never a percentage). For now, step 1 is the Safe Base card alone.

  const goalsBlock = holding ? `
    <div class="pt-goals-wrap">
      <p class="pt-goals-label">A gentle prompt for each day - invitations, never a checklist</p>
      <ul class="pt-goals">
        ${SAFE_BASE_DAILY_GOALS.map((g) => `
          <li class="pt-goal">
            <span class="pt-goal-name">${escapeHtml(g.goal)}</span>
            <span class="pt-goal-why">${escapeHtml(g.why)}</span>
          </li>`).join('')}
      </ul>
    </div>` : '';

  card.innerHTML = `
    <div class="pt-head">
      <div class="parent-section-label">Parents &amp; Tots · Your Hero's Journey</div>
      <button type="button" class="pt-manage" data-pt-leave>This isn't us</button>
    </div>
    <p class="pt-recognition-note">A recognition, not a reward. Nothing to complete, nothing counted - this names a way of being you already practice.</p>

    <div class="pt-badge">
      <div class="pt-badge-kicker">Session ${badge.session} · ${escapeHtml(badge.stage)}</div>
      <h3 class="pt-badge-name">${escapeHtml(badge.name)}</h3>
      <p class="pt-badge-quote">"${escapeHtml(badge.quote)}"</p>
      <p class="pt-badge-practice"><b>The practice:</b> ${escapeHtml(badge.practice)}</p>
      <p class="pt-badge-why">${escapeHtml(badge.why)}</p>
      <button type="button" class="pt-btn${holding ? ' is-holding' : ''}" data-pt-hold>
        ${holding ? "You're holding The Safe Base" : "I'm holding this"}
      </button>
      <p class="pt-hard-day">The hard day is allowed - some days you leave before they're ready. A clean, short goodbye is how, and you have not failed a test.</p>
      <p class="pt-device-note">Saved on this device only, just for you - never shared, never counted.</p>
    </div>

    ${goalsBlock}

    <details class="pt-honesty">
      <summary>What we promise about this badge</summary>
      <ul>${BADGE_HONESTY.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>
      <p class="pt-sources">Where this comes from: ask Ms. Erin, or see the Parent Badges Sources &amp; Discussion sheet. We show our work, including anything we've since corrected.</p>
    </details>
  `;

  card.querySelector('[data-pt-hold]').addEventListener('click', () => {
    setHoldingBadge(parentId, badge.id, !holding);
    renderParentView();
  });
  card.querySelector('[data-pt-leave]').addEventListener('click', () => {
    setPtFamily(parentId, false);
    renderParentView();
  });

  container.appendChild(card);
}

function renderRecap(learner, allGoals, sessionIndex) {
  const sessionGoals = allGoals.filter(
    (g) => g.scope === 'session' && g.sessionIndex === sessionIndex
  );
  if (sessionGoals.length === 0) return document.createElement('div');

  const approved = sessionGoals.filter((g) => g.status === 'approved' || g.status === 'done');
  const pct = Math.round((approved.length / sessionGoals.length) * 100);

  const wrap = document.createElement('div');
  wrap.className = 'parent-recap-card';
  wrap.innerHTML = `
    <div class="parent-recap-header">
      <span class="parent-section-label">Session ${sessionIndex} recap</span>
      <span class="parent-recap-pct">${pct}%</span>
    </div>
    <p class="parent-recap-line">${approved.length} of ${sessionGoals.length} session goals reached.</p>
    ${approved.length > 0 ? `<ul class="parent-celebrations">${approved.map((g) => `<li>${escapeHtml(g.text)}</li>`).join('')}</ul>` : ''}
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
    const statusBadge = status === 'approved' || status === 'done'
      ? '<span class="parent-goal-status parent-goal-done">Done</span>'
      : status === 'pending-approval'
        ? '<span class="parent-goal-status parent-goal-pending">In review</span>'
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
