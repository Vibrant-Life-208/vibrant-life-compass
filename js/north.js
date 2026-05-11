// North - the dashboard / home view.
// Three sections: Today (day plan), This week (week plan), Year vision (the map at a glance).
// In the skeleton, day and week plans are placeholders until breakdown UI lands;
// Year vision renders year-goals as a visual grid.

import { getLearner, getGoals, getYearQuote } from './store.js';
import { getCategoriesForStudio } from './studios.js';
import { renderYearMap } from './year-map.js';
import { renderToday, initTodayFab } from './tasks.js';
import { renderGamePlan } from './game-plan.js';

let yearMapClickHandler = null;

export function setYearMapClickHandler(fn) {
  yearMapClickHandler = fn;
}

export function renderNorth(learnerId) {
  const learner = getLearner(learnerId);
  const greeting = document.getElementById('north-greeting-text');
  const dateLabel = document.getElementById('north-date');

  if (greeting) greeting.textContent = learner ? `North · ${learner.name}` : 'North';
  if (dateLabel) dateLabel.textContent = formatToday();

  renderQuoteSection(learnerId);
  renderYearMapSection(learner);
  renderToday(learnerId);
  initTodayFab(learnerId);
  renderGamePlan(learnerId);
  renderVision(learnerId, learner);

  // Re-render Today + Game Plan when tasks change anywhere in the app
  if (!document._hcTasksListener) {
    document._hcTasksListener = true;
    document.addEventListener('hc:tasks-changed', () => {
      renderToday(learnerId);
      renderGamePlan(learnerId);
    });
  }
}

function renderQuoteSection(learnerId) {
  const section = document.getElementById('north-quote-section');
  const text = document.getElementById('north-quote-text');
  const footer = document.getElementById('north-quote-footer');
  if (!section || !text) return;
  if (!learnerId) {
    section.style.display = 'none';
    return;
  }
  const quote = getYearQuote(learnerId);
  if (!quote) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';
  text.textContent = `“${quote}”`;
  if (footer) footer.textContent = 'Your anchor until Session 7';
}

function renderYearMapSection(learner) {
  const container = document.getElementById('north-year-map');
  if (!container) return;
  if (!learner) {
    container.innerHTML = '<p class="learners-empty">Sign in to see your year.</p>';
    return;
  }
  renderYearMap(container, learner, {
    onSessionClick: (sessionNumber) => {
      if (yearMapClickHandler) yearMapClickHandler(sessionNumber);
    },
  });
}

function formatToday() {
  const d = new Date();
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function renderVision(learnerId, learner) {
  const el = document.getElementById('north-vision');
  if (!el) return;

  if (!learner) {
    el.innerHTML = '<p class="learners-empty">No learner profile yet.</p>';
    return;
  }

  const categories = getCategoriesForStudio(learner.studio);
  const yearGoals = getGoals(learnerId).filter((g) => g.scope === 'year');

  el.innerHTML = '';
  categories.forEach((cat) => {
    const goal = yearGoals.find((g) => g.categoryId === cat.id);
    const tile = document.createElement('div');
    tile.className = 'vision-tile' + (goal ? ' has-goal' : '');
    tile.innerHTML = `
      <div class="vision-tile-header">
        <span class="vision-tile-name">${escapeHtml(cat.name)}</span>
        <span class="vision-tile-kind">${cat.kind}</span>
      </div>
      <p class="vision-tile-goal">${goal ? escapeHtml(goal.text) : 'Not yet set'}</p>
    `;
    el.appendChild(tile);
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
