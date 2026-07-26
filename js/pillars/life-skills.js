// js/pillars/life-skills.js — the teal pillar.
// The learner picks ONE life skill to work on (Leadership / Entrepreneurship /
// Financial Literacy / Wellness), stored as foundations.climb.lifeSkill. The
// active skill sits at the top; the others sit below with notes. The goal
// breakdown + "one active at a time" switching is Phase 2.

import { shell, section, emptyNote, comingNote, escapeHtml } from './_scaffold.js';
import { getProfileFoundations } from '../store.js';

const SKILLS = {
  leadership: 'Leadership',
  entrepreneurship: 'Entrepreneurship',
  financial: 'Financial Literacy',
  wellness: 'Wellness',
};

export async function renderLifeSkills(learnerId) {
  const el = document.getElementById('lifeskills-view');
  if (!el) return;
  const foundations = await getProfileFoundations(learnerId);
  const climb = (foundations && foundations.climb && typeof foundations.climb === 'object' && !Array.isArray(foundations.climb))
    ? foundations.climb : {};
  const activeKey = climb.lifeSkill;
  const activeLabel = SKILLS[activeKey];

  const activeSection = activeLabel
    ? section('Working on this year', `<div class="pillar-goal"><p class="pillar-goal-text">${escapeHtml(activeLabel)}</p></div>`)
    : section('Working on this year', emptyNote('Choose the life skill that matters most to you at this stage, and it lives here.'));

  const others = Object.entries(SKILLS).filter(([k]) => k !== activeKey);
  const othersSection = section('Other skills', `
    <p class="pillar-prompt">The rest are here whenever you want to explore them - one active at a time.</p>
    <ul class="pillar-list">${others.map(([, label]) => `<li>${escapeHtml(label)}</li>`).join('')}</ul>`);

  const goalSection = section('Your skill goal', comingNote('Breaking your skill into a goal - setup, challenges, what success looks like - is on the way.'));

  el.innerHTML = shell(
    { color: 'lifeskills', title: 'Life Skills', subtitle: 'The capacities you build for a life you run yourself.' },
    [activeSection, othersSection, goalSection],
  );
}
