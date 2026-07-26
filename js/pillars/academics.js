// js/pillars/academics.js — the orange apex.
// The core academic subjects (Math, Language Arts, Reading, Civ) and their year
// goals, each with its starting line + halfway. Deep book + library wishlist +
// the creative-writing journal are Phase 2. (This is a fresh, Pillar-styled
// render; the observatory academics-env MVP behind ?ui=observatory is separate.)

import { shell, section, emptyNote, comingNote, goalCard, escapeHtml } from './_scaffold.js';
import { getLearner, getGoals } from '../store.js';
import { getCategoriesForStudio } from '../studios.js';

export async function renderAcademicsPillar(learnerId) {
  const el = document.getElementById('academics-view');
  if (!el) return;
  const [learner, goals] = await Promise.all([
    getLearner(learnerId),
    getGoals(learnerId),
  ]);
  const cats = getCategoriesForStudio(learner?.studio) || [];
  const coreCats = cats.filter((c) => c.kind === 'core');
  const yearGoals = (goals || []).filter((g) => g.scope === 'year');
  const goalFor = (catId) => yearGoals.find((g) => g.categoryId === catId);

  const subjectSections = coreCats.map((c) => {
    const g = goalFor(c.id);
    return section(c.name, g ? goalCard(g) : emptyNote('No goal set yet.'));
  });
  const subjectsBlock = subjectSections.length
    ? subjectSections
    : [section('Core subjects', emptyNote('Your academic subjects appear here.'))];

  const readingSection = section('Deep reading', comingNote('Your deep book, library wishlist, and reading journal are on the way.'));
  const writingSection = section('Creative writing', comingNote('A private creative-writing journal is on the way.'));

  el.innerHTML = shell(
    { color: 'academics', title: 'Academics', subtitle: 'The tools you build for understanding the world - built, not given.' },
    [...subjectsBlock, readingSection, writingSection],
  );
}
