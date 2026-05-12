// Parent view - scoped to session-level visibility only.
// Per captain decision 2026-05-11:
//   - Parents see SESSION goals (not year goals, not daily tasks)
//   - End-of-session recap: celebrations + percentages + one focus area + how-to-support
//   - Acton-aligned: help by listening, not by doing

import { getLearners, getLearner, getGoals } from './store.js';
import { getCategoriesForStudio, PARENT_SUPPORT_HINTS } from './studios.js';
import { computeYearPosition } from './year-map.js';

export function renderParentView() {
  const container = document.getElementById('parent-learner');
  if (!container) return;

  const learners = getLearners();
  if (!learners.length) {
    container.innerHTML = '<p class="learners-empty">No learner linked yet.</p>';
    return;
  }
  // For the skeleton, the parent sees the first learner. In a real auth model
  // this would be the parent_learner_link table from the schema.
  const learner = learners[0];
  const goals = getGoals(learner.id);
  const position = computeYearPosition();
  const currentSession = position.beforeYearStart ? 1 : position.sessionIndex;
  const previousSession = currentSession - 1;

  container.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'parent-header';
  header.innerHTML = `
    <h3 class="parent-learner-name">${escapeHtml(learner.name)}</h3>
    <p class="parent-learner-meta">${escapeHtml(getStudioLabel(learner.studio))} · Session ${currentSession} of 7</p>
  `;
  container.appendChild(header);

  // Last session recap (if there was one)
  if (previousSession >= 1) {
    const recap = renderRecap(learner, goals, previousSession);
    container.appendChild(recap);
  }

  // Current session goals (read-only)
  const focus = renderCurrentSessionFocus(learner, goals, currentSession);
  container.appendChild(focus);

  // One goal to help support + how
  const supportCard = renderSupportSuggestion(learner, goals, currentSession);
  if (supportCard) container.appendChild(supportCard);
}

function renderRecap(learner, allGoals, sessionIndex) {
  const sessionGoals = allGoals.filter(
    (g) => g.scope === 'session' && g.sessionIndex === sessionIndex
  );
  if (sessionGoals.length === 0) return emptyEl();

  const approved = sessionGoals.filter((g) => g.status === 'approved' || g.status === 'done');
  const pct = sessionGoals.length === 0 ? 0 : Math.round((approved.length / sessionGoals.length) * 100);

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

  // Heuristic: pick the first non-done session goal. Could be smarter
  // (e.g. the one that's been pending longest). The captain may want
  // to make this guide-selectable later.
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

function emptyEl() {
  const el = document.createElement('div');
  return el;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
