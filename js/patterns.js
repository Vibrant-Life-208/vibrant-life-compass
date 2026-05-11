// Patterns view. Observations, not scores.
// Skeleton: scans goals + check-ins and surfaces simple, quiet observations.
// Real algorithm is deferred until a guide confirms tone.

import { getGoals, getCheckIns } from './store.js';

export function renderPatterns(learnerId) {
  const list = document.getElementById('patterns-list');
  const goals = getGoals(learnerId);
  const checkIns = getCheckIns(learnerId);

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
  if (yearGoals.length === 0) {
    return out;
  }

  // Observation 1: how many year-goals are authored
  out.push(`You have ${yearGoals.length} year-goal${yearGoals.length === 1 ? '' : 's'} set.`);

  // Observation 2: which categories have any session-goals set
  const sessionGoalsByCategory = {};
  goals.filter((g) => g.scope === 'session').forEach((g) => {
    sessionGoalsByCategory[g.categoryId] = (sessionGoalsByCategory[g.categoryId] || 0) + 1;
  });
  Object.entries(sessionGoalsByCategory).forEach(([catId, count]) => {
    if (count >= 3) {
      out.push(`You've returned to ${catId} across ${count} sessions.`);
    }
  });

  // Observation 3: check-in cadence
  if (checkIns.length >= 4) {
    out.push(`You've checked in ${checkIns.length} times. Steady is the practice.`);
  }

  return out;
}
