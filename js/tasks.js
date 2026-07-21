// Today's tasks - per-day learner journal.
// Per Decision 8 of the 2026-05-11 fleet meeting (Lux + Praesens + Troi).

import { getTasksForDate, saveTask, toggleTaskDone, deleteTask, moveTask, getLearner } from './store.js';
import { getStudio, OVERFLOW_COPY } from './studios.js';
import { openTaskModal, openMoveTaskModal } from './modals.js';

export function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export async function renderToday(learnerId) {
  const container = document.getElementById('north-today');
  const overflowBanner = document.getElementById('north-today-overflow');
  if (!container) return;
  if (!learnerId) {
    container.innerHTML = '<p class="learners-empty">No learner selected.</p>';
    return;
  }

  const today = todayISO();
  const [tasks, learner] = await Promise.all([
    getTasksForDate(learnerId, today),
    getLearner(learnerId),
  ]);
  const openTasks = tasks.filter((t) => t.status !== 'done');

  if (overflowBanner) {
    const studio = getStudio(learner?.studio);
    const threshold = studio?.dailyTaskThreshold || 5;
    if (openTasks.length > threshold) {
      const copy = OVERFLOW_COPY[learner?.studio] || OVERFLOW_COPY.adventure;
      overflowBanner.innerHTML = `
        <p class="overflow-text">${escapeHtml(copy)}</p>
        <button type="button" class="btn btn-text overflow-btn" id="overflow-replan">Open Game Plan</button>
      `;
      overflowBanner.style.display = 'flex';
      document.getElementById('overflow-replan')?.addEventListener('click', () => {
        document.getElementById('north-week-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      overflowBanner.style.display = 'none';
      overflowBanner.innerHTML = '';
    }
  }

  if (tasks.length === 0) {
    container.innerHTML = '<p class="learners-empty">No tasks for today yet. Tap + to add one, or move from another day in the Game Plan below.</p>';
    return;
  }

  container.innerHTML = '';
  tasks.forEach((task) => container.appendChild(renderTaskCard(learnerId, task)));
}

function renderTaskCard(learnerId, task) {
  const card = document.createElement('div');
  const isRhythm = task.shape === 'rhythm';
  const done = task.status === 'done';
  // A rhythm (standing practice) has NO completion - no check, no miss. Resting is a real
  // choice beside it, never a failure. A one-off keeps the check-it-off toggle.
  card.className = 'task-card' + (done && !isRhythm ? ' task-done' : '') + (isRhythm ? ' task-rhythm' : '');
  card.dataset.taskId = task.id;
  const lead = isRhythm
    ? `<span class="task-rhythm-mark" title="A rhythm you come back to" aria-label="A rhythm you come back to">↻</span>`
    : `<button type="button" class="task-check" data-action="toggle" aria-label="${done ? 'Mark open' : 'Mark done'}">${done ? '●' : '○'}</button>`;
  card.innerHTML = `
    ${lead}
    <p class="task-text">${escapeHtml(task.text)}</p>
    <div class="task-actions">
      <button type="button" class="btn-text task-action-btn" data-action="move">Move</button>
      <button type="button" class="btn-text task-action-btn" data-action="delete">Delete</button>
    </div>
  `;
  card.addEventListener('click', async (e) => {
    const action = e.target.closest('[data-action]')?.dataset?.action;
    if (action === 'toggle') {
      await toggleTaskDone(learnerId, task.id);
      await renderToday(learnerId);
    } else if (action === 'move') {
      openMoveTaskModal(task, async (newDate) => {
        await moveTask(learnerId, task.id, newDate);
        await renderToday(learnerId);
        document.dispatchEvent(new CustomEvent('hc:tasks-changed'));
      });
    } else if (action === 'delete') {
      if (confirm('Delete this task?')) {
        await deleteTask(learnerId, task.id);
        await renderToday(learnerId);
        document.dispatchEvent(new CustomEvent('hc:tasks-changed'));
      }
    }
  });
  return card;
}

export function initTodayFab(learnerId) {
  const fab = document.getElementById('today-add');
  if (!fab) return;
  const fresh = fab.cloneNode(true);
  fab.parentNode.replaceChild(fresh, fab);
  fresh.addEventListener('click', () => {
    openTaskModal({
      defaultDate: todayISO(),
      onSave: async (taskData) => {
        await saveTask(learnerId, taskData);
        await renderToday(learnerId);
        document.dispatchEvent(new CustomEvent('hc:tasks-changed'));
      },
    });
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
