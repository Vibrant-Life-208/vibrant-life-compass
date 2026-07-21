// The Breakdown tab: each goal, broken down by goal (captain 2026-07-21).
//
// Where the Compass is the goal EDIT surface (the wheel + the ladder you tap to plan)
// and the Plan is every task ordered by week, the Breakdown is the vertical read-through
// of ONE goal at a time: its whole arc from where you are now, up the milestone ladder
// (End of Session 1 -> 2 -> 3-locked), through the weekly steps per session, down to the
// actual dated tasks it produced. Priority goals rise to the top with a ★.
//
// Read-only (editing stays on the Compass). Gated to the mature tier - holding a goal's
// full hierarchy in view is a late-teen/adult tool; younger tiers stay on Today + the
// week planner. (Age-tiered surfacing, research-grounded.)

import { getGoals, getTasks, getLearner } from './store.js';
import { REGION_COLORS, regionForLabel, taskColorStyle, taskBand } from './wheel.js';
import { lifeAreaForCategory } from './studios.js';

const BAND_LABEL = { recurring: 'rhythm', weekly: 'weekly', milestone: 'milestone' };

function goalRegion(g) {
  if (g.lifeArea) { const r = regionForLabel(g.lifeArea); if (REGION_COLORS[r]) return r; }
  if (typeof g.categoryId === 'string' && g.categoryId.startsWith('slice_')) {
    const r = regionForLabel(g.categoryId.slice(6));
    if (REGION_COLORS[r]) return r;
  }
  // Academic categories resolve to their declared region (learning -> World, etc.).
  const r = regionForLabel(lifeAreaForCategory(g.categoryId));
  if (REGION_COLORS[r]) return r;
  return null;
}
function fmtWhen(iso) {
  if (!iso) return 'pool';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export async function renderGoalBreakdown(learnerId) {
  const container = document.getElementById('breakdown-view');
  if (!container) return;
  if (!learnerId) {
    container.innerHTML = '<p class="learners-empty">No learner selected.</p>';
    return;
  }
  const [allGoals, tasks, learner] = await Promise.all([
    getGoals(learnerId), getTasks(learnerId), getLearner(learnerId),
  ]);
  const priorityIds = Array.isArray(learner?.priorityGoalIds) ? learner.priorityGoalIds : [];
  const goals = allGoals.filter((g) => g.scope === 'year' && g.text && g.text.trim());

  if (!goals.length) {
    container.innerHTML = `
      <div class="breakdown-page">
        <h2 class="breakdown-title">Breakdown</h2>
        <p class="learners-empty">No goals yet. Once you plan a goal on the Compass, its full arc shows here.</p>
      </div>`;
    return;
  }

  // Priority goals first (in the learner's chosen order), then the rest.
  const ordered = [
    ...priorityIds.map((id) => goals.find((g) => g.id === id)).filter(Boolean),
    ...goals.filter((g) => !priorityIds.includes(g.id)),
  ];

  // Tasks bucketed by the goal that produced them.
  const tasksByGoal = new Map();
  for (const t of tasks) {
    if (!t.goalId) continue;
    if (!tasksByGoal.has(t.goalId)) tasksByGoal.set(t.goalId, []);
    tasksByGoal.get(t.goalId).push(t);
  }

  const html = ordered.map((g) => goalCard(g, tasksByGoal.get(g.id) || [], priorityIds.includes(g.id))).join('');
  container.innerHTML = `
    <div class="breakdown-page">
      <h2 class="breakdown-title">Breakdown</h2>
      <p class="breakdown-sub">Each goal, whole: where you start, the milestones you climb, the steps between, and the tasks they become.</p>
      ${html}
    </div>`;
}

function goalCard(g, goalTasks, isPriority) {
  const region = goalRegion(g);
  const color = region ? REGION_COLORS[region] : 'var(--earth-light)';

  // The milestone ladder, bottom (now) to top (year). Only rungs that exist render.
  const rungs = [
    { label: 'By end of year', text: g.text, top: true },
    { label: 'End of Session 3 · your Session-3 goal · locked', text: g.halfwayPoint, locked: true },
    { label: 'End of Session 2 · your Session-2 goal', text: g.quarterPoint },
    { label: 'End of Session 1 · your Session-1 goal', text: g.eos1Point },
    { label: 'Starting line', text: g.baseline, base: true },
  ].filter((r) => r.text && String(r.text).trim());
  const ladder = rungs.map((r) => `
    <li class="breakdown-rung${r.top ? ' is-top' : ''}${r.base ? ' is-base' : ''}${r.locked ? ' is-locked' : ''}">
      <span class="breakdown-rung-dot" style="border-color:${color}"></span>
      <span class="breakdown-rung-label">${escapeHtml(r.label)}${r.locked ? ' 🔒' : ''}</span>
      <span class="breakdown-rung-text">${escapeHtml(r.text)}</span>
    </li>`).join('');

  // Weekly steps grouped by session.
  const ws = g.weeklySteps || {};
  const sessions = Object.keys(ws).map(Number).filter((n) => Array.isArray(ws[n]) && ws[n].some((s) => (s || '').trim())).sort((a, b) => a - b);
  const steps = sessions.length ? sessions.map((s) => `
    <div class="breakdown-session">
      <span class="breakdown-session-label">Session ${s}</span>
      <ol class="breakdown-steps">
        ${(ws[s] || []).map((step, i) => (step || '').trim() ? `<li><span class="breakdown-step-wk">wk ${i + 1}</span> ${escapeHtml(step)}</li>` : '').join('')}
      </ol>
    </div>`).join('') : '<p class="breakdown-empty">No weekly steps yet.</p>';

  // The tasks this goal produced.
  const doneCount = goalTasks.filter((t) => t.status === 'done').length;
  const taskRows = goalTasks.length ? goalTasks
    .slice()
    .sort((a, b) => (a.plannedFor || '9999').localeCompare(b.plannedFor || '9999'))
    .map((t) => {
      const style = taskColorStyle(t);
      const band = taskBand(t);
      const dotStyle = style ? `background:${style.bg};border-color:${style.border}` : '';
      const tag = (style && band) ? `<span class="task-band-tag" style="background:${style.bg};color:${style.fg}">${BAND_LABEL[band] || ''}</span>` : '';
      return `<li class="breakdown-task${t.status === 'done' ? ' is-done' : ''}">
        <span class="tasklist-dot" style="${dotStyle}"></span>
        <span class="breakdown-task-when">${escapeHtml(fmtWhen(t.plannedFor))}</span>
        <span class="breakdown-task-text">${escapeHtml(t.text)}${tag}</span>
      </li>`;
    }).join('') : '<p class="breakdown-empty">No tasks planted yet - finish Session-1 setup or tap “sync from goals”.</p>';

  return `
    <section class="breakdown-goal" style="border-left-color:${color}">
      <header class="breakdown-goal-head">
        <span class="breakdown-goal-dot" style="background:${color}"></span>
        <h3 class="breakdown-goal-title">${isPriority ? '<span class="breakdown-star">★</span> ' : ''}${escapeHtml(g.text)}</h3>
        ${region ? `<span class="breakdown-goal-region">${escapeHtml(region)}</span>` : ''}
      </header>

      <div class="breakdown-block">
        <h4 class="breakdown-block-title">The climb</h4>
        <ul class="breakdown-ladder">${ladder || '<li class="breakdown-empty">No milestones set yet.</li>'}</ul>
      </div>

      <div class="breakdown-block">
        <h4 class="breakdown-block-title">Weekly steps</h4>
        ${steps}
      </div>

      <div class="breakdown-block">
        <h4 class="breakdown-block-title">Tasks${doneCount ? ` <span class="breakdown-count">${doneCount} done</span>` : ''}</h4>
        <ul class="breakdown-tasks">${taskRows}</ul>
      </div>
    </section>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
