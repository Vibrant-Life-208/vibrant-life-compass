// Session view. 1 of 7 sessions, navigable.

import { getLearner, getGoals, saveGoal } from './store.js';
import { getCategoriesForStudio, getStudioName, SESSIONS_PER_YEAR, WEEKS_PER_SESSION_DEFAULT } from './studios.js';
import { openGoalModal } from './modals.js';

let currentSession = 1;

export function setCurrentSession(n) {
  if (n >= 1 && n <= 7) currentSession = n;
}

export function getCurrentSession() {
  return currentSession;
}

export async function renderSessionView(learnerId) {
  const learner = await getLearner(learnerId);
  const title = document.getElementById('session-title');
  const meta = document.getElementById('session-meta');
  const list = document.getElementById('session-goals');

  if (!learner) {
    list.innerHTML = '<p class="learners-empty">No learner profile yet.</p>';
    return;
  }

  title.textContent = `Session ${currentSession} of ${SESSIONS_PER_YEAR}`;
  meta.textContent = `${getStudioName(learner.studio)} studio · ~${WEEKS_PER_SESSION_DEFAULT} weeks · ${learner.name}`;

  document.getElementById('session-prev').disabled = currentSession <= 1;
  document.getElementById('session-next').disabled = currentSession >= SESSIONS_PER_YEAR;

  const categories = getCategoriesForStudio(learner.studio);
  const allGoals = await getGoals(learnerId);
  const sessionGoals = allGoals.filter(
    (g) => g.scope === 'session' && g.sessionIndex === currentSession
  );

  list.innerHTML = '';
  categories.forEach((cat) => {
    const goal = sessionGoals.find((g) => g.categoryId === cat.id);
    const card = document.createElement('div');
    card.className = 'category-card';
    const placeholder = `Example: ${cat.example}`;
    card.innerHTML = `
      <div class="category-header">
        <span class="category-name">${cat.name}</span>
        <span class="category-kind">${cat.kind}</span>
      </div>
      <p class="category-goal ${goal ? '' : 'empty'}">${goal ? escapeHtml(goal.text) : escapeHtml(placeholder)}</p>
    `;
    card.addEventListener('click', () => {
      openGoalModal({
        title: `${cat.name} - Session ${currentSession} goal`,
        existing: goal,
        example: cat.example,
        onSave: async (text) => {
          await saveGoal({
            id: goal?.id,
            learnerId,
            categoryId: cat.id,
            scope: 'session',
            sessionIndex: currentSession,
            text,
            status: 'active',
          });
          await renderSessionView(learnerId);
        },
      });
    });
    list.appendChild(card);
  });
}

export function initSessionNav(learnerId) {
  document.getElementById('session-prev').addEventListener('click', async () => {
    if (currentSession > 1) {
      currentSession--;
      await renderSessionView(learnerId);
      import('./app.js').then(m => m.applyLandscape?.(currentSession));
    }
  });
  document.getElementById('session-next').addEventListener('click', async () => {
    if (currentSession < SESSIONS_PER_YEAR) {
      currentSession++;
      await renderSessionView(learnerId);
      import('./app.js').then(m => m.applyLandscape?.(currentSession));
    }
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
