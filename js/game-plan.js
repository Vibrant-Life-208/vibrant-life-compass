// Game Plan - the week-view re-plan surface.

import { getTasks, moveTask, saveTask } from './store.js';
import { openTaskModal, openWeekAssignModal } from './modals.js';
import { todayISO } from './tasks.js';
import { taskColorStyle } from './wheel.js';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function mondayOfThisWeek(today = new Date()) {
  const d = new Date(today);
  const day = d.getDay();
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

export async function renderGamePlan(learnerId) {
  const container = document.getElementById('north-week-summary');
  if (!container) return;
  if (!learnerId) {
    container.innerHTML = '<p class="learners-empty">No learner selected.</p>';
    return;
  }

  const dates = weekDates();
  const mondayISO = dates[0];
  const today = todayISO();
  const all = await getTasks(learnerId);

  // The week's task pool: assigned to THIS week (weekOf) but not yet to a day. A
  // task in the pool has weekOf === this Monday and an empty plannedFor. Dragging it
  // to a day sets plannedFor; sending it back clears plannedFor. (Captain 2026-07-21.)
  const dayTasks = (iso) => all.filter((t) => t.plannedFor === iso);
  const poolTasks = all.filter((t) => !t.plannedFor && t.weekOf === mondayISO);

  const reload = async () => {
    await renderGamePlan(learnerId);
    document.dispatchEvent(new CustomEvent('hc:tasks-changed'));
  };
  const assign = async (task, plannedFor) => {
    // plannedFor '' => back to pool (keep weekOf so it stays in this week's pool).
    // Spread the whole task so the synced backend rebuilds its meta jsonb in full
    // (band/region/shape) rather than clobbering it with a partial write.
    await saveTask(learnerId, { ...task, plannedFor, weekOf: mondayISO });
    await reload();
  };
  const chip = (task) => {
    const item = document.createElement('div');
    item.className = 'game-plan-task' + (task.status === 'done' ? ' is-done' : '');
    item.textContent = task.text;
    item.title = 'Tap to plan';
    const style = taskColorStyle(task);
    if (style) { item.style.background = style.bg; item.style.color = style.fg; item.style.borderColor = style.border; }
    item.addEventListener('click', () => {
      openWeekAssignModal(task, { dates, labels: DAY_LABELS }, (plannedFor) => assign(task, plannedFor));
    });
    return item;
  };

  container.innerHTML = '';
  // Colour legend: shade = how load-bearing a task is (hue = which part of life).
  const legend = document.createElement('div');
  legend.className = 'gp-legend';
  legend.innerHTML = `
    <span class="gp-legend-item"><span class="gp-legend-swatch recurring"></span>rhythm</span>
    <span class="gp-legend-item"><span class="gp-legend-swatch weekly"></span>weekly milestone</span>
    <span class="gp-legend-item"><span class="gp-legend-swatch milestone"></span>milestone marker</span>`;
  container.appendChild(legend);

  // ── Days (above) ──
  const grid = document.createElement('div');
  grid.className = 'game-plan-grid';
  dates.forEach((iso, idx) => {
    const col = document.createElement('div');
    col.className = 'game-plan-day' + (iso === today ? ' is-today' : '');
    const d = new Date(iso + 'T00:00:00');
    const header = document.createElement('div');
    header.className = 'game-plan-day-header';
    header.innerHTML = `<span class="game-plan-day-label">${DAY_LABELS[idx]}</span><span class="game-plan-day-date">${d.getDate()}</span>`;
    col.appendChild(header);

    const list = document.createElement('div');
    list.className = 'game-plan-day-list';
    const tasks = dayTasks(iso);
    if (tasks.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'game-plan-day-empty';
      empty.textContent = '—';
      list.appendChild(empty);
    } else {
      tasks.forEach((task) => list.appendChild(chip(task)));
    }
    col.appendChild(list);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'game-plan-day-add';
    addBtn.textContent = '+';
    addBtn.setAttribute('aria-label', `Add task for ${DAY_LABELS[idx]}`);
    addBtn.addEventListener('click', () => {
      openTaskModal({
        defaultDate: iso,
        onSave: async (taskData) => { await saveTask(learnerId, { ...taskData, weekOf: mondayISO }); await reload(); },
      });
    });
    col.appendChild(addBtn);
    grid.appendChild(col);
  });
  container.appendChild(grid);

  // ── This week's pool (below) ──
  const pool = document.createElement('div');
  pool.className = 'game-plan-pool';
  const poolHead = document.createElement('div');
  poolHead.className = 'game-plan-pool-head';
  poolHead.innerHTML = `<span class="game-plan-pool-title">This week’s pool</span><span class="game-plan-pool-hint">tasks waiting for a day - tap one to place it</span>`;
  pool.appendChild(poolHead);

  const poolList = document.createElement('div');
  poolList.className = 'game-plan-pool-list';
  if (poolTasks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'game-plan-day-empty';
    empty.textContent = 'Nothing waiting - every task has a day.';
    poolList.appendChild(empty);
  } else {
    poolTasks.forEach((task) => poolList.appendChild(chip(task)));
  }
  pool.appendChild(poolList);

  const poolAdd = document.createElement('button');
  poolAdd.type = 'button';
  poolAdd.className = 'btn btn-text game-plan-pool-add';
  poolAdd.textContent = '+ add to this week';
  poolAdd.addEventListener('click', () => {
    openTaskModal({
      defaultDate: '',
      onSave: async (taskData) => { await saveTask(learnerId, { ...taskData, plannedFor: '', weekOf: mondayISO }); await reload(); },
    });
  });
  pool.appendChild(poolAdd);
  container.appendChild(pool);
}
