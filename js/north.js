// North view - the dashboard.

import { getLearner, getGoals, getQuoteState } from './store.js';
import { openViaImportModal } from './via-import.js';
import { getCategoriesForStudio } from './studios.js';
import { renderToday, initTodayFab } from './tasks.js';
import { renderGamePlan } from './game-plan.js';

// Year-map click handler is still needed (Compass page sets it).
let yearMapClickHandler = null;
export function setYearMapClickHandler(fn) { yearMapClickHandler = fn; }
export function getYearMapClickHandler() { return yearMapClickHandler; }

export async function renderNorth(learnerId) {
  const learner = await getLearner(learnerId);
  const greeting = document.getElementById('north-greeting-text');
  const dateLabel = document.getElementById('north-date');

  if (greeting) greeting.textContent = learner ? `North · ${learner.name}` : 'North';
  if (dateLabel) dateLabel.textContent = formatToday();

  // Pitch card: learners who opted in to pitch up get a card to their thresholds.
  const pitchSection = document.getElementById('north-pitch');
  const pitchBtn = document.getElementById('north-pitch-open');
  if (pitchSection && pitchBtn && learner?.pitchTargetStudio) {
    const { getStudioName } = await import('./studios.js');
    pitchBtn.textContent = `Your pitch to ${getStudioName(learner.pitchTargetStudio)} - see your thresholds`;
    pitchSection.hidden = false;
    if (!pitchBtn.dataset.wired) {
      pitchBtn.dataset.wired = '1';
      pitchBtn.addEventListener('click', async () => {
        const { openThresholdsModal } = await import('./modals.js');
        openThresholdsModal(learner.pitchTargetStudio, learner);
      });
    }
  } else if (pitchSection) {
    pitchSection.hidden = true;
  }

  await Promise.all([
    renderQuoteSection(learnerId),
    renderToday(learnerId),
    renderGamePlan(learnerId),
    renderVision(learnerId, learner),
  ]);

  initTodayFab(learnerId);

  const importBtn = document.getElementById('north-import-strengths');
  if (importBtn && !importBtn._wired) {
    importBtn._wired = true;
    importBtn.addEventListener('click', () => {
      openViaImportModal({ profileId: learnerId, onSaved: () => renderNorth(learnerId) });
    });
  }

  if (!document._hcTasksListener) {
    document._hcTasksListener = true;
    document.addEventListener('hc:tasks-changed', async () => {
      await renderToday(learnerId);
      await renderGamePlan(learnerId);
    });
  }
}

async function renderQuoteSection(learnerId) {
  const section = document.getElementById('north-quote-section');
  const text = document.getElementById('north-quote-text');
  const footer = document.getElementById('north-quote-footer');
  const noteEl = document.getElementById('north-quote-note');
  if (!section || !text) return;
  if (!learnerId) {
    section.style.display = 'none';
    return;
  }
  const { text: quote, author, note } = await getQuoteState(learnerId);
  if (!quote) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';
  text.textContent = `“${quote}”`;
  // Footer shows the attribution when present, falling back to the anchor label.
  if (footer) footer.textContent = author ? `— ${author}` : 'Your anchor for the cycle';
  // The note (what it means to you) shows beneath the quote when present.
  if (noteEl) {
    if (note) {
      noteEl.textContent = note;
      noteEl.hidden = false;
    } else {
      noteEl.textContent = '';
      noteEl.hidden = true;
    }
  }
}

function formatToday() {
  const d = new Date();
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

async function renderVision(learnerId, learner) {
  const el = document.getElementById('north-vision');
  if (!el) return;

  if (!learner) {
    el.innerHTML = '<p class="learners-empty">No learner profile yet.</p>';
    return;
  }

  const categories = getCategoriesForStudio(learner.studio);
  const allGoals = await getGoals(learnerId);
  const yearGoals = allGoals.filter((g) => g.scope === 'year');
  const priorityIds = Array.isArray(learner.priorityGoalIds) ? learner.priorityGoalIds : [];

  el.innerHTML = '';
  categories.forEach((cat) => {
    const goal = yearGoals.find((g) => g.categoryId === cat.id);
    const isPriority = goal && priorityIds.includes(goal.id);
    const tile = document.createElement('div');
    tile.className = 'vision-tile' + (goal ? ' has-goal' : '') + (isPriority ? ' is-priority' : '');
    tile.innerHTML = `
      <div class="vision-tile-header">
        <span class="vision-tile-name">${isPriority ? '★ ' : ''}${escapeHtml(cat.name)}</span>
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
