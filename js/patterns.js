// Patterns view. Observations, not scores.
// Skeleton: scans goals + check-ins and surfaces simple observations.
// Per Decision 3 of the 2026-05-11 council, real algorithm deferred
// until a guide confirms tone.

import { getGoals, getCheckIns } from './store.js';
import { deadWatch, deadEnabled } from './dead-watch.js'; // Phase 0 dark-watch (retirement candidate)

export async function renderPatterns(learnerId) {
  const list = document.getElementById('patterns-list');
  deadWatch('patterns');
  if (!deadEnabled('patterns')) { if (list) list.innerHTML = ''; return; } // Phase 0 kill-switch (default ON)
  const [goals, checkIns] = await Promise.all([
    getGoals(learnerId),
    getCheckIns(learnerId),
  ]);

  const observations = buildObservations(goals, checkIns);

  if (observations.length === 0) {
    list.innerHTML = '<p class="patterns-empty">Patterns appear as you check in across sessions.</p>';
    return;
  }

  list.innerHTML = '';
  observations.forEach((text) => {
    const el = document.createElement('div');
    el.className = 'pattern-item';
    el.textContent = text;
    list.appendChild(el);
  });
}

function buildObservations(goals, checkIns) {
  const out = [];
  const yearGoals = goals.filter((g) => g.scope === 'year');
  if (yearGoals.length === 0) return out;

  out.push(`You have ${yearGoals.length} year-goal${yearGoals.length === 1 ? '' : 's'} set.`);

  const sessionGoalsByCategory = {};
  goals.filter((g) => g.scope === 'session').forEach((g) => {
    sessionGoalsByCategory[g.categoryId] = (sessionGoalsByCategory[g.categoryId] || 0) + 1;
  });
  Object.entries(sessionGoalsByCategory).forEach(([catId, count]) => {
    if (count >= 3) {
      out.push(`You've returned to ${catId} across ${count} sessions.`);
    }
  });

  if (checkIns.length >= 4) {
    out.push(`You've checked in ${checkIns.length} times. Steady is the practice.`);
  }

  return out;
}
