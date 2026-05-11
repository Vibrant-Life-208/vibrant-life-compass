// Today's tasks - per-day learner journal.
// Per Decision 8 of the 2026-05-11 fleet meeting (Lux + Praesens + Troi):
// - No auto-move; learner always confirms
// - Framed as care, not failure
// - Studio-tuned overflow threshold + copy
// - No score-shaped feedback

import { getTasksForDate, saveTask, toggleTaskDone, deleteTask, moveTask, getLearner } from './store.js';
import { getStudio, OVERFLOW_COPY } from './studios.js';
import { openTaskModal, openMoveTaskModal } from './modals.js';

export function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function renderToday(learnerId) {
  const container = document.getElementById('north-today');
  const overflowBanner = document.getElementById('north-today-overflow');
  if (!container) return;

  if (!learnerId) {
    container.innerHTML = '<p class="learners-empty">No learner selected.</p>';
    return;
  }

  const today = todayISO();
  const tasks = getTasksForDate(learnerId, today);
  const openTasks = tasks.filter((t) => t.status !== 'done');

  // Overflow banner (gentle, never blocking)
  if (overflowBanner) {
    const learner = getLearner(learnerId);
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
  const done = task.status === 'done';
  card.className = 'task-card' + (done ? ' task-done' : '');
  card.dataset.taskId = task.id;
  card.innerHTML = `
    <button type="button" class="task-check" data-action="toggle" aria-label="${done ? 'Mark open' : 'Mark done'}">
      ${done ? '●' : '○'}
    </button>
    <p class="task-text">${escapeHtml(task.text)}</p>
    <div class="task-actions">
      <button type="button" class="btn-text task-action-btn" data-action="move">Move</button>
      <button type="button" class="btn-text task-action-btn" data-action="delete">Delete</button>
    </div>
  `;
  card.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset?.action;
    if (action === 'toggle') {
      toggleTaskDone(learnerId, task.id);
      renderToday(learnerId);
    } else if (action === 'move') {
      openMoveTaskModal(task, (newDate) => {
        moveTask(learnerId, task.id, newDate);
        renderToday(learnerId);
        document.dispatchEvent(new CustomEvent('hc:tasks-changed'));
      });
    } else if (action === 'delete') {
      if (confirm('Delete this task?')) {
        deleteTask(learnerId, task.id);
        renderToday(learnerId);
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
      onSave: (taskData) => {
        saveTask(learnerId, taskData);
        renderToday(learnerId);
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
