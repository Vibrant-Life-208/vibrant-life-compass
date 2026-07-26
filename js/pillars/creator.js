// js/pillars/creator.js — the yellow pillar.
// The Curiosity vision (10/5/1 horizons) and the year goals it feeds - each goal
// with its halfway point. Academic (core) goals live on the Academics pillar, so
// Creator shows the NON-core year goals (the maker/mindset goals). Emotional
// Regulation tools + Responsibilities are Phase 2.

import { shell, section, emptyNote, comingNote, goalCard, escapeHtml } from './_scaffold.js';
import { getLearner, getGoals, getProfileHorizons } from '../store.js';
import { getCategoriesForStudio } from '../studios.js';

const HORIZONS = [
  { key: 'beyond_5yr', label: '10 years from now' },
  { key: 'within_5yr', label: '5 years from now' },
  { key: 'within_1yr', label: '1 year from now' },
];

export async function renderCreatorMindset(learnerId) {
  const el = document.getElementById('creator-view');
  if (!el) return;
  const [learner, goals, horizons] = await Promise.all([
    getLearner(learnerId),
    getGoals(learnerId),
    getProfileHorizons(learnerId),
  ]);
  const cats = getCategoriesForStudio(learner?.studio) || [];
  const coreIds = new Set(cats.filter((c) => c.kind === 'core').map((c) => c.id));
  const yearGoals = (goals || []).filter((g) => g.scope === 'year');
  const makerGoals = yearGoals.filter((g) => !coreIds.has(g.categoryId));

  const h = horizons || {};
  const horizonRows = HORIZONS.map((row) => {
    const val = h[row.key];
    return val
      ? `<div class="pillar-horizon"><p class="pillar-horizon-label">${escapeHtml(row.label)}</p><p class="pillar-horizon-text">${escapeHtml(val)}</p></div>`
      : '';
  }).filter(Boolean).join('');
  const horizonSection = horizonRows
    ? section('Your vision', horizonRows)
    : section('Your vision', emptyNote('Your 10 / 5 / 1 year vision appears here once you set it.'));

  const goalsSection = makerGoals.length
    ? section('Your goals', makerGoals.map(goalCard).join(''))
    : section('Your goals', emptyNote('The goals you set from your vision will land here.'));

  const toolsSection = section('Emotional Regulation', comingNote('Tools for steadying big feelings - breathing, tapping, sound - are on the way.'));
  const respSection = section('Responsibilities', comingNote('A place for what is yours to carry is on the way.'));

  el.innerHTML = shell(
    { color: 'creator', title: 'Creator Mindset', subtitle: 'Where you find out you can build.' },
    [horizonSection, goalsSection, toolsSection, respSection],
  );
}
