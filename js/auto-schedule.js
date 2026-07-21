// Session-1 auto-scheduler (captain 2026-07-21).
//
// When a learner finishes Session-1 Setup, their year plan is "spread across time":
// every goal's weekly steps and milestone anchors become dated, coloured tasks laid
// onto the weeks of the year. This is what "Session 1 creates time" means - the plan
// stops being an abstract list and becomes a populated schedule the learner can then
// rearrange (drag between days, or into the week pool).
//
// What it plants, per year goal:
//   - weeklySteps[session][weekIdx]  -> a WEEKLY-milestone task in that session's week
//   - eos1Point / quarterPoint / halfwayPoint -> a MILESTONE-marker task at the END of
//     Session 1 / 2 / 3 respectively
// Region (colour hue) comes from the goal's life-area; the band (colour shade) is
// weekly or milestone. Within each week, tasks are spread across the weekdays so no
// single day is overloaded ("creating time").
//
// Idempotent + non-destructive: every planted task carries source:'auto' + a stable
// planKey. Re-running (e.g. after a goal edit) refreshes wording for keys that still
// exist WITHOUT moving them - so a learner's rearrangement and check-offs are kept -
// creates tasks for new keys, and removes only still-open auto tasks whose plan entry
// is gone. It never touches a learner's own (non-auto) tasks, and skips planting a
// weekly step that a manual task with the same text already covers that week.

import { getGoals, getTasks, saveTask, deleteTask, getLearner } from './store.js';
import { getCalendarForStudio } from './studios.js';

const WEEKDAYS = 5; // Mon..Fri offsets 0..4 from a week's Monday

// Placement mode by developmental tier (research-grounded, captain 2026-07-21). The
// same scheduler, three ways of laying the plan down - scaffolding that fades with age:
//   auto       - everything onto days. Youngest (concrete-operational): the system
//                plans FOR them; distributing a pool is a demand they aren't ready for.
//   pool-steps - milestones onto days, weekly steps land in the week's POOL. Middle
//                tier (the planner-owning pivot): distributing the week yourself IS the
//                lesson, with milestones anchored so an empty week never overwhelms.
//   draft      - everything onto days as a rearrangeable draft. Oldest/adults: they
//                hold the whole arc and want a smart draft to tweak.
export const SCHEDULING_MODES = ['auto', 'pool-steps', 'draft'];
const STUDIO_SCHEDULING_MODE = {
  sparks: 'auto',
  discovery: 'auto',
  adventure: 'pool-steps',
  launchpad: 'draft',
  'guide-summer': 'draft',
};

// The tier sets the default; a guide can bump an individual up or down via
// learner.schedulingMode (the band is a default, not a cage). Unknown studios (adults/
// guides) fall to 'draft'.
export function schedulingModeFor(learner) {
  const override = learner && learner.schedulingMode;
  if (SCHEDULING_MODES.includes(override)) return override;
  return STUDIO_SCHEDULING_MODE[learner && learner.studio] || 'draft';
}

function isoAddDays(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function mondayOf(iso) {
  const d = new Date(iso + 'T00:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}
function goalRegion(g) {
  if (g.lifeArea) return g.lifeArea;
  if (typeof g.categoryId === 'string' && g.categoryId.startsWith('slice_')) return g.categoryId.slice(6);
  return undefined;
}

// Flatten every year goal's decomposition into task specs, each bound to a week.
export function buildYearPlanSpecs(goals, cal) {
  const specs = [];
  for (const g of goals) {
    if (g.scope !== 'year') continue;
    const region = goalRegion(g);
    // Milestone markers at the end of Session 1 / 2 / 3.
    const anchors = [
      { key: 'eos1', text: g.eos1Point, session: 1 },
      { key: 'quarter', text: g.quarterPoint, session: 2 },
      { key: 'halfway', text: g.halfwayPoint, session: 3 },
    ];
    for (const a of anchors) {
      const text = (a.text || '').trim();
      if (!text) continue;
      const si = a.session - 1;
      const start = cal.sessionStarts[si];
      if (!start) continue;
      const weeks = cal.sessionWeeks[si] || 1;
      const weekMonday = mondayOf(isoAddDays(start, (weeks - 1) * 7)); // the session's last week
      specs.push({ planKey: `${g.id}:${a.key}`, text, band: 'milestone', region, goalId: g.id, weekMonday, dayPref: 3 });
    }
    // Weekly milestones from the weeklySteps object.
    const ws = g.weeklySteps || {};
    for (const [sessionIndex, steps] of Object.entries(ws)) {
      (Array.isArray(steps) ? steps : []).forEach((step, i) => {
        const text = (step || '').trim();
        if (!text) return;
        const si = Number(sessionIndex) - 1;
        const start = cal.sessionStarts[si];
        if (!start) return;
        const weekMonday = mondayOf(isoAddDays(start, i * 7));
        specs.push({ planKey: `${g.id}:w:${sessionIndex}:${i}`, text, band: 'weekly', region, goalId: g.id, weekMonday });
      });
    }
  }
  return specs;
}

// Assign each spec a day within its week, per placement mode. Milestones sit on their
// preferred day; weekly steps round-robin across the weekdays so a busy week spreads out
// rather than stacking. In 'pool-steps' the weekly steps are left dayless (plannedFor '')
// so they wait in the week's pool for the learner to place - milestones still anchor.
export function assignDaysToSpecs(specs, mode = 'draft') {
  const byWeek = new Map();
  for (const s of specs) {
    if (!byWeek.has(s.weekMonday)) byWeek.set(s.weekMonday, []);
    byWeek.get(s.weekMonday).push(s);
  }
  const out = [];
  for (const [monday, list] of byWeek) {
    let rr = 0;
    for (const s of list) {
      if (mode === 'pool-steps' && s.band === 'weekly') {
        out.push({ ...s, plannedFor: '' }); // waits in this week's pool
        continue;
      }
      const offset = s.band === 'milestone' ? (s.dayPref ?? 3) : (rr++ % WEEKDAYS);
      out.push({ ...s, plannedFor: isoAddDays(monday, offset) });
    }
  }
  return out;
}

// Run the auto-scheduler for a learner. Returns the number of planned tasks.
export async function autoScheduleYearPlan(learnerId) {
  if (!learnerId) return 0;
  const [goals, existing, learner] = await Promise.all([
    getGoals(learnerId), getTasks(learnerId), getLearner(learnerId),
  ]);
  const cal = getCalendarForStudio(learner?.studio);
  const mode = schedulingModeFor(learner);
  const specs = assignDaysToSpecs(buildYearPlanSpecs(goals, cal), mode);

  const priorAuto = existing.filter((t) => t.source === 'auto');
  const priorByKey = new Map(priorAuto.map((t) => [t.planKey, t]));
  // Manual (non-auto) task texts already present in a given week - so we don't double up
  // on a weekly step a learner already added by hand / via "add to North".
  const manualByWeek = new Map();
  for (const t of existing) {
    if (t.source === 'auto') continue;
    const wk = t.weekOf || (t.plannedFor ? mondayOf(t.plannedFor) : '');
    const k = `${wk}::${(t.text || '').trim().toLowerCase()}`;
    manualByWeek.set(k, true);
  }

  const usedKeys = new Set();
  for (const s of specs) {
    usedKeys.add(s.planKey);
    const prior = priorByKey.get(s.planKey);
    if (prior) {
      // Refresh wording/colour ONLY - keep the learner's placement + completion.
      await saveTask(learnerId, { ...prior, text: s.text, band: s.band, region: s.region, goalId: s.goalId });
      continue;
    }
    // Skip a weekly step already covered by a manual task in the same week.
    if (s.band === 'weekly' && manualByWeek.has(`${s.weekMonday}::${s.text.toLowerCase()}`)) continue;
    await saveTask(learnerId, {
      text: s.text,
      plannedFor: s.plannedFor,
      weekOf: s.weekMonday,
      band: s.band,
      region: s.region,
      goalId: s.goalId,
      source: 'auto',
      planKey: s.planKey,
    });
  }
  // Remove still-open auto tasks whose plan entry is gone (a goal step was deleted). Keep
  // done ones as a record.
  for (const t of priorAuto) {
    if (!usedKeys.has(t.planKey) && t.status !== 'done') await deleteTask(learnerId, t.id);
  }
  return specs.length;
}
