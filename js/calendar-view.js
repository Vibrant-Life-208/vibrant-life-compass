// Calendar view - a read-only, month-by-month picture of the academic-year cycle.
// Available to Launch Pad learners and adults (guides / parents / owners) only; the
// tab itself is gated in app.js (young tiers - Sparks / Discovery / Adventure - never
// see it). This view renders over EXISTING data only - it writes nothing and adds no
// schema:
//   - getYearCalendar()  -> the cycle's session start dates + week counts (studios.js)
//   - goals.sessionIndex -> per-session goals, grouped under their session
//   - tasks.plannedFor   -> planned-day markers dotted onto the calendar cells
// Visual conventions follow the Year Map (year-map.js) and the sage/earth palette.

import { getLearner, getGoals, getTasksForRange } from './store.js';
import { getYearCalendar, getStudioName } from './studios.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Local-time ISO (YYYY-MM-DD) so day math never slips across a timezone boundary.
function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// The session each calendar day belongs to (1-based), or null on a break / outside
// the cycle. Mirrors the in-session math in year-map.js computeYearPosition: a session
// runs from its start date for sessionWeeks[i] * 7 days.
function buildSessionRanges(cal) {
  return cal.sessionStarts.map((startISO, i) => {
    const start = new Date(startISO + 'T00:00:00');
    const weeks = cal.sessionWeeks[i];
    const end = new Date(start.getTime() + weeks * 7 * MS_PER_DAY - MS_PER_DAY);
    return { index: i + 1, startISO, start, end, weeks };
  });
}

function sessionForDay(dayMs, ranges) {
  for (const r of ranges) {
    if (dayMs >= r.start.getTime() && dayMs <= r.end.getTime()) return r.index;
  }
  return null;
}

export async function renderCalendarView(learnerId) {
  const host = document.getElementById('calendar-view-content');
  if (!host) return;
  if (!learnerId) {
    host.innerHTML = '<p class="learners-empty">Sign in to see the calendar.</p>';
    return;
  }

  const learner = await getLearner(learnerId);
  const cal = getYearCalendar();
  const [goals, tasks] = await Promise.all([
    getGoals(learnerId),
    getTasksForRange(learnerId, cal.yearStartISO, cal.yearEndISO),
  ]);

  const ranges = buildSessionRanges(cal);
  const yearStart = new Date(cal.yearStartISO + 'T00:00:00');
  const yearEnd = new Date(cal.yearEndISO + 'T00:00:00');
  const todayISO = isoOf(new Date());
  const startDayISO = new Set(ranges.map((r) => r.startISO));

  // Tasks bucketed by planned day (count + titles for the tooltip).
  const tasksByDay = {};
  for (const t of tasks) {
    if (!t.plannedFor) continue;
    (tasksByDay[t.plannedFor] ||= []).push(t);
  }

  // Session goals grouped under their session; year goals counted for the header.
  const yearGoals = goals.filter((g) => g.scope === 'year' && g.text && g.text.trim());
  const sessionGoals = {};
  for (const g of goals) {
    if (g.scope !== 'session') continue;
    if (!(g.text && g.text.trim())) continue;
    const idx = Number.isFinite(g.sessionIndex) ? g.sessionIndex : null;
    if (idx == null) continue;
    (sessionGoals[idx] ||= []).push(g);
  }

  host.innerHTML = '';

  // Intro
  const intro = document.createElement('div');
  intro.className = 'calendar-intro';
  const who = learner?.studio ? getStudioName(learner.studio) : '';
  intro.innerHTML = `
    <h2 class="calendar-title">Your year at a glance</h2>
    <p class="calendar-sub">${escapeHtml(who ? who + ' · ' : '')}${yearStart.getFullYear()}–${yearEnd.getFullYear()} cycle. ${yearGoals.length} year goal${yearGoals.length === 1 ? '' : 's'}, ${tasks.length} planned task${tasks.length === 1 ? '' : 's'}. Read-only overview.</p>`;
  host.appendChild(intro);

  // Legend
  const legend = document.createElement('div');
  legend.className = 'calendar-legend';
  legend.innerHTML = `
    <span class="cal-legend-item"><span class="cal-swatch cal-swatch-session"></span>In session</span>
    <span class="cal-legend-item"><span class="cal-swatch cal-swatch-start"></span>Session begins</span>
    <span class="cal-legend-item"><span class="cal-swatch cal-swatch-today"></span>Today</span>
    <span class="cal-legend-item"><span class="cal-task-dot"></span>Planned task</span>`;
  host.appendChild(legend);

  // Month grids from the cycle's first month through its last.
  const monthsWrap = document.createElement('div');
  monthsWrap.className = 'calendar-months';

  let cursor = new Date(yearStart.getFullYear(), yearStart.getMonth(), 1);
  const lastMonth = new Date(yearEnd.getFullYear(), yearEnd.getMonth(), 1);
  while (cursor <= lastMonth) {
    monthsWrap.appendChild(
      buildMonth(cursor.getFullYear(), cursor.getMonth(), {
        ranges, yearStart, yearEnd, todayISO, startDayISO, tasksByDay,
      }),
    );
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  host.appendChild(monthsWrap);

  // Per-session goal summary (session goals grouped under their session number).
  const summary = document.createElement('div');
  summary.className = 'calendar-sessions';
  const heading = document.createElement('h3');
  heading.className = 'calendar-sessions-title';
  heading.textContent = 'Goals by session';
  summary.appendChild(heading);

  const anySessionGoals = Object.keys(sessionGoals).length > 0;
  if (!anySessionGoals) {
    const empty = document.createElement('p');
    empty.className = 'calendar-empty';
    empty.textContent = 'Session goals appear here as you set them across the year.';
    summary.appendChild(empty);
  } else {
    ranges.forEach((r) => {
      const gs = sessionGoals[r.index] || [];
      if (gs.length === 0) return;
      const row = document.createElement('div');
      row.className = 'cal-session-row';
      const startLabel = r.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      row.innerHTML = `<div class="cal-session-head"><span class="cal-session-num">Session ${r.index}</span><span class="cal-session-date">${escapeHtml(startLabel)}</span></div>`;
      const ul = document.createElement('ul');
      ul.className = 'cal-session-goals';
      gs.forEach((g) => {
        const li = document.createElement('li');
        li.textContent = g.text.trim();
        ul.appendChild(li);
      });
      row.appendChild(ul);
      summary.appendChild(row);
    });
  }
  host.appendChild(summary);
}

function buildMonth(year, month, ctx) {
  const { ranges, yearStart, yearEnd, todayISO, startDayISO, tasksByDay } = ctx;
  const wrap = document.createElement('div');
  wrap.className = 'cal-month';

  const title = document.createElement('div');
  title.className = 'cal-month-title';
  title.textContent = `${MONTH_NAMES[month]} ${year}`;
  wrap.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'cal-grid';

  DOW.forEach((d) => {
    const head = document.createElement('div');
    head.className = 'cal-dow';
    head.textContent = d;
    grid.appendChild(head);
  });

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Leading blanks so the 1st lands under its weekday.
  for (let i = 0; i < first.getDay(); i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-cell is-blank';
    grid.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day, 12); // noon: DST-safe comparison
    const dISO = isoOf(d);
    const cell = document.createElement('div');
    cell.className = 'cal-cell';

    const inCycle = d >= yearStart && d <= new Date(yearEnd.getFullYear(), yearEnd.getMonth(), yearEnd.getDate(), 23, 59, 59);
    if (!inCycle) cell.classList.add('out-of-cycle');

    const sIdx = inCycle ? sessionForDay(d.getTime(), ranges) : null;
    if (sIdx != null) {
      cell.classList.add('in-session');
      cell.classList.add(sIdx % 2 === 0 ? 'session-even' : 'session-odd');
    }
    if (startDayISO.has(dISO)) cell.classList.add('is-session-start');
    if (dISO === todayISO) cell.classList.add('is-today');

    const num = document.createElement('span');
    num.className = 'cal-num';
    num.textContent = String(day);
    cell.appendChild(num);

    if (sIdx != null && startDayISO.has(dISO)) {
      const tag = document.createElement('span');
      tag.className = 'cal-session-tag';
      tag.textContent = `S${sIdx}`;
      cell.appendChild(tag);
    }

    const dayTasks = tasksByDay[dISO];
    if (dayTasks && dayTasks.length) {
      const dot = document.createElement('span');
      dot.className = 'cal-task-dot';
      if (dayTasks.length > 1) dot.classList.add('is-multi');
      cell.appendChild(dot);
      const titles = dayTasks.map((t) => (t.text || '').trim()).filter(Boolean).join(' · ');
      cell.title = `${dayTasks.length} task${dayTasks.length === 1 ? '' : 's'}${titles ? ': ' + titles : ''}`;
    }

    grid.appendChild(cell);
  }

  wrap.appendChild(grid);
  return wrap;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
