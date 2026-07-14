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

  // Pitch card. Two states, shown to EVERY eligible learner (not just onboarding):
  //   - opted in  -> a card to their thresholds page.
  //   - not yet   -> an invitation to explore pitching up (opens the opt-in).
  // Only learners with a studio above them (Discovery, Adventure) are eligible.
  const pitchSection = document.getElementById('north-pitch');
  const pitchBtn = document.getElementById('north-pitch-open');
  if (pitchSection && pitchBtn && learner) {
    const { getStudioName, nextStudio } = await import('./studios.js');
    const up = nextStudio(learner.studio);
    if (learner.pitchTargetStudio) {
      pitchBtn.textContent = `Your pitch to ${getStudioName(learner.pitchTargetStudio)} - see your thresholds`;
      pitchSection.hidden = false;
      pitchBtn.onclick = async () => {
        const { openThresholdsModal } = await import('./modals.js');
        openThresholdsModal(learner.pitchTargetStudio, learner);
      };
    } else if (up) {
      pitchBtn.textContent = `Thinking about ${getStudioName(up)}? Explore pitching up`;
      pitchSection.hidden = false;
      pitchBtn.onclick = async () => {
        const { openPitchOptInModal } = await import('./modals.js');
        openPitchOptInModal(learner, () => renderNorth(learnerId));
      };
    } else {
      pitchSection.hidden = true;
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

  // Tasks-grouped-by-category, not a wall of blank category shells.
  // (Captain 2026-07-13.) The old grid listed every category with "Not yet set,"
  // which felt overwhelming during setup and offered no path to plan. Now only
  // categories that HAVE a goal show, each surfaced through its concrete steps -
  // the plan itself. Planning still happens in Setup's guided 9-stage walkthrough
  // (js/setup.js); this view shows its output. Nothing is set from here.
  const planned = categories
    .map((cat) => ({ cat, goal: yearGoals.find((g) => g.categoryId === cat.id) }))
    .filter((x) => x.goal);

  el.innerHTML = '';

  // Empty state points at the walkthrough, not a blank grid. (Fixes "no walk
  // through on how to plan" - the guidance is in Setup, so send them there.)
  if (planned.length === 0) {
    el.innerHTML = '<p class="north-vision-empty">Your map is empty for now. Head to <strong>Setup</strong> to walk through your goals one at a time - it builds this map for you, one area at a time.</p>';
    return;
  }

  planned.forEach(({ cat, goal }) => {
    const isPriority = priorityIds.includes(goal.id);
    const steps = stepsForGoal(goal);
    const group = document.createElement('div');
    group.className = 'vision-cat' + (isPriority ? ' is-priority' : '');
    const body = steps.length
      ? `<ul class="vision-cat-tasks">${steps.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
      : `<p class="vision-cat-aim">${escapeHtml(goal.text || 'Goal set - add weekly steps in Setup.')}</p>`;
    group.innerHTML = `
      <div class="vision-cat-header">
        <span class="vision-cat-name">${isPriority ? '★ ' : ''}${escapeHtml(cat.name)}</span>
        <span class="vision-cat-kind">${escapeHtml(cat.kind)}</span>
      </div>
      ${body}
    `;
    el.appendChild(group);
  });
}

// Flatten a year goal's weeklySteps { 1:[w1..], 2:[..], 3:[..] } into ordered
// step texts (session then week). These are the "goal tasks" of the category -
// the concrete plan the learner walked through in Setup.
function stepsForGoal(goal) {
  const out = [];
  const ws = goal?.weeklySteps || {};
  Object.keys(ws)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b)
    .forEach((s) => {
      (Array.isArray(ws[s]) ? ws[s] : []).forEach((t) => {
        const text = (t || '').trim();
        if (text) out.push(text);
      });
    });
  return out;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
