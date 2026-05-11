// Game Plan - the week-view re-plan surface.
// Per Decision 8: 5-column grid (Mon-Fri), each column shows that day's tasks.
// Tap a task to move it. Learner-confirmed only; no auto-move.

import { getTasksForRange, moveTask, saveTask } from './store.js';
import { openTaskModal, openMoveTaskModal } from './modals.js';
import { todayISO } from './tasks.js';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Returns ISO date for Monday of the current week (today's Monday).
function mondayOfThisWeek(today = new Date()) {
  const d = new Date(today);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoFromDate(d) {
  return d.toISOString().slice(0, 10);
}

function weekDates() {
  const monday = mondayOfThisWeek();
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(isoFromDate(d));
  }
  return dates;
}

export function renderGamePlan(learnerId) {
  const container = document.getElementById('north-week-summary');
  if (!container) return;

  if (!learnerId) {
    container.innerHTML = '<p class="learners-empty">No learner selected.</p>';
    return;
  }

  const dates = weekDates();
  const start = dates[0];
  const end = dates[4];
  const tasksAll = getTasksForRange(learnerId, start, end);
  const today = todayISO();

  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'game-plan-grid';

  dates.forEach((iso, idx) => {
    const col = document.createElement('div');
    col.className = 'game-plan-day' + (iso === today ? ' is-today' : '');

    const header = document.createElement('div');
    header.className = 'game-plan-day-header';
    const d = new Date(iso + 'T00:00:00');
    header.innerHTML = `
      <span class="game-plan-day-label">${DAY_LABELS[idx]}</span>
      <span class="game-plan-day-date">${d.getDate()}</span>
    `;
    col.appendChild(header);

    const list = document.createElement('div');
    list.className = 'game-plan-day-list';
    const tasks = tasksAll.filter((t) => t.plannedFor === iso);
    if (tasks.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'game-plan-day-empty';
      empty.textContent = '—';
      list.appendChild(empty);
    } else {
      tasks.forEach((task) => {
        const item = document.createElement('div');
        item.className = 'game-plan-task' + (task.status === 'done' ? ' is-done' : '');
        item.textContent = task.text;
        item.title = 'Tap to move';
        item.addEventListener('click', () => {
          openMoveTaskModal(task, (newDate) => {
            moveTask(learnerId, task.id, newDate);
            renderGamePlan(learnerId);
            document.dispatchEvent(new CustomEvent('hc:tasks-changed'));
          });
        });
        list.appendChild(item);
      });
    }
    col.appendChild(list);

    // Per-day add button
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'game-plan-day-add';
    addBtn.textContent = '+';
    addBtn.setAttribute('aria-label', `Add task for ${DAY_LABELS[idx]}`);
    addBtn.addEventListener('click', () => {
      openTaskModal({
        defaultDate: iso,
        onSave: (taskData) => {
          saveTask(learnerId, taskData);
          renderGamePlan(learnerId);
          document.dispatchEvent(new CustomEvent('hc:tasks-changed'));
        },
      });
    });
    col.appendChild(addBtn);

    grid.appendChild(col);
  });

  container.appendChild(grid);
}
