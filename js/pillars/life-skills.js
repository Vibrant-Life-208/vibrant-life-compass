// js/pillars/life-skills.js — the teal pillar.
// The learner picks ONE life skill to work on (Leadership / Entrepreneurship /
// Financial Literacy / Wellness), stored as foundations.climb.lifeSkill. The
// active skill sits at the top; the others sit below. "Your skill goal" surfaces
// the WOOP the learner set in onboarding (foundations.climb.woop) as a LIVING,
// editable object they tend through the year.
//
// Model note (research verdict, 2026-07-27 — see docs/design/2026-07-16-goal-
// decomposition-progression-architecture.md §2026-07-27 addendum): Life Skills are
// CAPACITIES, so WOOP is the right instrument — BUT valid only when the wish is a
// CONCRETE BEHAVIOUR inside the capacity, not "achieve leadership." No success-line
// scoring, no streak: the goal is the plan, tended. (Dispositions — the Creator
// Mindset pillar — are a category error to goal-shape and are NOT built here.)

import { shell, section, emptyNote, escapeHtml, escapeAttr } from './_scaffold.js';
import { getProfileFoundations, setProfileFoundations } from '../store.js';

const SKILLS = {
  leadership: 'Leadership',
  entrepreneurship: 'Entrepreneurship',
  financial: 'Financial Literacy',
  wellness: 'Wellness',
};

// The four WOOP fields, in order, with concrete-behaviour framing on the wish.
const WOOP_FIELDS = [
  { key: 'setup', label: 'What you want to be true - one concrete thing', hint: 'By the end of this year, I will…' },
  { key: 'obstacle', label: 'One thing that could get in the way (not a prediction - just worth noticing)', hint: 'One thing to watch for…' },
  { key: 'ifThen', label: 'My plan', hint: 'If ___, then I will ___' },
  { key: 'success', label: 'What it looks like when it is going well', hint: 'It is going well when…' },
];

function skillGoalSection(activeLabel, woop) {
  if (!activeLabel) {
    return section('Your skill goal', emptyNote('Pick the life skill that matters most above, then break it into a goal here - one concrete step, a challenge to watch for, and what going well looks like.'));
  }
  const w = (woop && typeof woop === 'object' && !Array.isArray(woop)) ? woop : {};
  const fields = WOOP_FIELDS.map((f) => `
    <div class="pillar-woop-field">
      <label class="pillar-woop-label" for="ls-woop-${f.key}">${escapeHtml(f.label)}</label>
      <textarea id="ls-woop-${f.key}" class="pillar-woop-input" data-woop-key="${escapeAttr(f.key)}" rows="2" placeholder="${escapeAttr(f.hint)}">${escapeHtml(w[f.key] || '')}</textarea>
    </div>`).join('');
  const body = `
    <p class="pillar-prompt">Your goal for <strong>${escapeHtml(activeLabel)}</strong> this year - a real, doable step, not the whole skill at once. Change any of it whenever you like; it grows as you do.</p>
    ${fields}`;
  return section('Your skill goal', body);
}

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

  const goalSection = skillGoalSection(activeLabel, climb.woop);

  el.innerHTML = shell(
    { color: 'lifeskills', title: 'Life Skills', subtitle: 'The capacities you build for a life you run yourself.' },
    [activeSection, othersSection, goalSection],
  );

  wireSkillGoal(learnerId, foundations || {}, climb);
}

// Save the WOOP fields back to foundations.climb.woop on edit. Self-only reflective
// narrative (INV-FOUNDATIONS-CANON): never a source of record, never read onto any
// guide/parent/owner surface. Blur/change-triggered; a failed save is non-blocking.
function wireSkillGoal(learnerId, foundations, climb) {
  const fields = document.querySelectorAll('[data-woop-key]');
  if (!fields.length) return;
  const save = async () => {
    const woop = {};
    document.querySelectorAll('[data-woop-key]').forEach((t) => { woop[t.dataset.woopKey] = t.value.trim(); });
    const next = { ...foundations, climb: { ...climb, woop } };
    try {
      await setProfileFoundations(learnerId, next);
      climb.woop = { ...woop };
      foundations.climb = { ...climb };
    } catch (e) { console.warn('skill goal save failed:', e); }
  };
  fields.forEach((t) => t.addEventListener('change', save));
}
