// The Plan tab: every task on one page, ordered by timing then importance (captain
// 2026-07-21). The whole year of work in a single scroll - grouped by week, each week
// chronological, and within a week ordered milestone -> weekly -> recurring so the most
// load-bearing thing sits on top. Colour-coded by the same wheel-region shade system as
// North + the Game Plan. Read-through to the underlying tasks; edits happen where tasks
// live (North / Game Plan), this is the bird's-eye order.
//
// Gated to the mature tier (Launch Pad learners + guides/owners) - the dense,
// whole-year ordered view is a late-teen/adult tool; younger tiers stay on Today + the
// week planner. (Age-tiered surfacing, research-grounded.)

import { getTasks, getLearner } from './store.js';
import { taskColorStyle, taskBand, taskRegion } from './wheel.js';
import { getYearCalendar } from './studios.js';
import { todayISO } from './tasks.js';

const BAND_RANK = { milestone: 0, weekly: 1, recurring: 2 };
const BAND_LABEL = { recurring: 'rhythm', weekly: 'weekly', milestone: 'milestone' };

function mondayOf(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}
function fmtWeek(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
// Which session a week's Monday falls in (for a light "Session N" tag). Returns '' when
// the week sits outside the cycle.
function sessionForWeek(mondayISO, cal) {
  if (!mondayISO) return '';
  let idx = -1;
  for (let i = 0; i < cal.sessionStarts.length; i++) {
    if (mondayISO >= cal.sessionStarts[i]) idx = i;
  }
  return idx >= 0 ? idx + 1 : '';
}

export async function renderTaskList(learnerId) {
  const container = document.getElementById('tasklist-view');
  if (!container) return;
  if (!learnerId) {
    container.innerHTML = '<p class="learners-empty">No learner selected.</p>';
    return;
  }
  const [tasks, learner] = await Promise.all([getTasks(learnerId), getLearner(learnerId)]);
  const cal = getYearCalendar();
  const priorityGoalIds = Array.isArray(learner?.priorityGoalIds) ? learner.priorityGoalIds : [];

  if (!tasks.length) {
    container.innerHTML = `
      <div class="tasklist-page">
        <h2 class="tasklist-title">Plan</h2>
        <p class="learners-empty">No tasks yet. Finish your Session-1 plan and they’ll appear here, week by week.</p>
      </div>`;
    return;
  }

  // Group by week (weekOf, or the Monday of a dated task, or an "unscheduled" bucket).
  const byWeek = new Map();
  for (const t of tasks) {
    const wk = t.weekOf || mondayOf(t.plannedFor) || 'none';
    if (!byWeek.has(wk)) byWeek.set(wk, []);
    byWeek.get(wk).push(t);
  }
  // Sort weeks chronologically; the "none" (unscheduled) bucket sorts last.
  const weeks = [...byWeek.keys()].sort((a, b) => {
    if (a === 'none') return 1;
    if (b === 'none') return -1;
    return a < b ? -1 : a > b ? 1 : 0;
  });

  const thisMonday = mondayOf(todayISO());
  const today = todayISO();

  // Within a week: importance (milestone -> weekly -> recurring -> plain), a priority-goal
  // boost, then by day (dated before pool), then text.
  const rank = (t) => {
    const b = taskBand(t);
    let r = (b in BAND_RANK) ? BAND_RANK[b] : 3;
    if (t.goalId && priorityGoalIds.includes(t.goalId)) r -= 0.5; // nudge priority-goal work up
    return r;
  };
  const orderInWeek = (a, b) => {
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    const da = a.plannedFor || '9999', db = b.plannedFor || '9999'; // pool (no day) sinks
    if (da !== db) return da < db ? -1 : 1;
    return (a.text || '').localeCompare(b.text || '');
  };

  let html = `
    <div class="tasklist-page">
      <h2 class="tasklist-title">Plan</h2>
      <p class="tasklist-sub">Every task, in order - by week, then by weight. Milestones first.</p>
      <div class="tasklist-legend">
        <span class="tasklist-legend-item"><span class="gp-legend-swatch recurring"></span>rhythm</span>
        <span class="tasklist-legend-item"><span class="gp-legend-swatch weekly"></span>weekly</span>
        <span class="tasklist-legend-item"><span class="gp-legend-swatch milestone"></span>milestone</span>
      </div>`;

  for (const wk of weeks) {
    const list = byWeek.get(wk).slice().sort(orderInWeek);
    const isNow = wk === thisMonday;
    const sess = wk === 'none' ? '' : sessionForWeek(wk, cal);
    const header = wk === 'none'
      ? 'Unscheduled'
      : `Week of ${fmtWeek(wk)}${sess ? ` · Session ${sess}` : ''}`;
    html += `
      <section class="tasklist-week${isNow ? ' is-now' : ''}">
        <h3 class="tasklist-week-head">${header}${isNow ? ' <span class="tasklist-now-tag">this week</span>' : ''}</h3>
        <ul class="tasklist-rows">
          ${list.map((t) => rowHtml(t, today)).join('')}
        </ul>
      </section>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

function rowHtml(task, today) {
  const style = taskColorStyle(task);
  const band = taskBand(task);
  const region = taskRegion(task);
  const done = task.status === 'done';
  const when = task.plannedFor
    ? new Date(task.plannedFor + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
    : 'pool';
  const isToday = task.plannedFor === today;
  const dot = style ? `background:${style.bg};border-color:${style.border}` : '';
  const tag = (style && band) ? `<span class="task-band-tag" style="background:${style.bg};color:${style.fg}">${BAND_LABEL[band] || ''}</span>` : '';
  return `
    <li class="tasklist-row${done ? ' is-done' : ''}${isToday ? ' is-today' : ''}">
      <span class="tasklist-dot" style="${dot}"></span>
      <span class="tasklist-when">${escapeHtml(when)}</span>
      <span class="tasklist-text">${escapeHtml(task.text)}${tag}</span>
      ${region ? `<span class="tasklist-region">${escapeHtml(region)}</span>` : ''}
    </li>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
