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
import { isLifeSkillsCourse } from '../flags.js';

const SKILLS = {
  leadership: 'Leadership',
  entrepreneurship: 'Entrepreneurship',
  financial: 'Financial Literacy',
  wellness: 'Wellness',
};

// "Where to start" (Europa 2026-08-04, flag-gated ?lscourse=on): the staged path behind each
// Life Skill, so a learner who picked a skill isn't left staring at a blank goal. The FIRST step
// is the universal, same-day-doable, no-capital / no-permission entry - what they drop into their
// goal to begin. NO placement quiz (the money-ethics ruling warns against "you're behind"): one
// clear first move, the arc visible behind it. Financial Literacy is fully drafted
// (docs/design/2026-08-04-financial-literacy-course-v0.1.md - grounded in the 2026-07-31
// money-books research + the 2026-07-20 money-ethics ruling: capacity not a number, beneficence
// keystone, "millionaire" never appears). Leadership is now also fully drafted
// (docs/design/2026-08-06-leadership-course-v0.1.md - grounded in the 2026-08-06 leadership-books
// research: capacity not a title, Greenleaf's servant-first + best test, worth-following vs
// make-others-follow, Greene/Machiavelli specimen-firewalled). The remaining two (Entrepreneurship,
// Wellness) carry only a v0.1 first step pending their own research pass (draft: true) - no
// fabricated full arc.
const COURSES = {
  financial: {
    arc: ['Keep', 'Earn', 'Grow & Guard'],
    start: {
      title: 'The tenth',
      body: 'Set aside a part of any money you have now - however small. A jar, an account. The act, not the amount, is the lesson.',
      goal: 'Set aside a part of any money I get - my tenth.',
    },
    stages: [
      { name: 'Keep', gloss: '"A part of all you earn is yours to keep."', steps: [
        'The tenth - set aside a part of any money you have now.',
        'Need vs want, one week - sort what you spend on, no judgment.',
        "Find one leak - redirect one thing you don't value into the tenth.",
        'Name your "free with" - what would enough set aside let you not worry about?',
      ] },
      { name: 'Earn', gloss: '"Find a need and fill it."', steps: [
        'Find a real need someone around you actually has.',
        'Fill it once, for real - earning is serving.',
        'The honest test: does an offer sell a capacity, or just a feeling? The tell is the promise about effort.',
        'Give one back - set aside a part of what you earn for someone beyond you.',
      ] },
      { name: 'Grow & Guard', gloss: 'Make it work without gambling.', steps: [
        'Make a coin work - put a small amount where it grows.',
        'Circle of competence - only put money into what you understand.',
        "Margin of safety - never risk what you can't get back.",
        'Spot the trickster - name one "fast / easy / guaranteed" pitch. Real growth is slow on purpose.',
      ] },
    ],
  },
  leadership: {
    arc: ['Serve', 'Steady', 'Gather'],
    start: {
      title: 'Go first',
      body: 'Do one small thing that helps a group before anyone asks - pick up what got dropped, start the dull job, welcome the new person. Leading starts with going first, once.',
      goal: 'Do one small thing that helps a group before anyone asks.',
    },
    stages: [
      { name: 'Serve', gloss: '"The servant-leader is servant first."', steps: [
        'Go first - do one small thing that helps a group before anyone asks.',
        'Serve the real need - find the thing your group actually needs done, and do it.',
        'Serve without the credit - help once where no one will know it was you.',
        "Name who you'd serve - what group or cause would you carry something hard for?",
      ] },
      { name: 'Steady', gloss: 'Be someone a group can rely on.', steps: [
        'Keep one word - promise your group one small thing and do it, exactly.',
        'Stay steady when it\'s hard - be the one who asks "what now?" instead of blaming.',
        'Own one miss - when you get it wrong, say so plainly and fix it.',
        "Lift, don't push - the honest test: worth following, or making others follow?",
      ] },
      { name: 'Gather', gloss: 'The group chooses the one who has served.', steps: [
        'Make room for another voice - draw out someone quieter, and mean it.',
        'Organize one real thing - pull a few people together to help beyond yourselves.',
        'Ask the best test - did the people I served grow more capable and free, or did I just get my way?',
        'Hand it on - give away a piece of what you lead; teach someone else to carry it.',
      ] },
    ],
  },
  entrepreneurship: { draft: true, start: {
    title: 'Find one need',
    body: 'Notice one real thing someone around you needs done or made. Just spot it - that is where every venture starts.',
    goal: 'Notice one real need someone around me has, and name it.',
  } },
  wellness: { draft: true, start: {
    title: 'One small tending',
    body: 'Pick one small thing that tends your body or mind - water, a walk, a real breath - and do it today. Wellness is built from small, repeated care.',
    goal: 'One small thing that tends me - and I do it today.',
  } },
};

// The "Where to start" section: the arc (when researched), the universal first step as a
// card, and a button that drops that first step into the goal below. Read-only guidance -
// no course-progress persistence yet (deferred); the goal (WOOP) is the persisted object.
function whereToStartSection(activeKey) {
  const c = activeKey && COURSES[activeKey];
  if (!c || !c.start) return '';
  const arc = Array.isArray(c.arc) && c.arc.length
    ? `<ol class="ls-arc">${c.arc.map((s, i) => `<li class="ls-arc-step"><span class="ls-arc-num">${i + 1}</span>${escapeHtml(s)}</li>`).join('')}</ol>`
    : '';
  const path = Array.isArray(c.stages)
    ? `<details class="ls-path"><summary>See the whole path</summary>${c.stages.map((st) => `
        <div class="ls-stage"><p class="ls-stage-name">${escapeHtml(st.name)} <span class="ls-stage-gloss">${escapeHtml(st.gloss || '')}</span></p>
        <ul class="ls-stage-steps">${st.steps.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`).join('')}</details>`
    : '<p class="ls-draft-note">The full path is still being written - for now, this first step is where to begin.</p>';
  const body = `
    <p class="pillar-prompt">Not sure where to begin? Start with one small, real thing, then let it grow. ${arc ? 'Here is the path:' : ''}</p>
    ${arc}
    <div class="ls-start-card">
      <p class="ls-start-kicker">Start here</p>
      <p class="ls-start-title">${escapeHtml(c.start.title)}</p>
      <p class="ls-start-body">${escapeHtml(c.start.body)}</p>
      <button type="button" class="btn btn-text ls-start-use" data-ls-goal="${escapeAttr(c.start.goal || c.start.title)}">Use this as my start</button>
    </div>
    ${path}`;
  return section('Where to start', body);
}

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
  // "Where to start" sits between the active skill and the goal editor, so its first step
  // flows straight into the goal. Flag-gated (dark) and only when a skill is active.
  const startSection = (isLifeSkillsCourse() && activeKey) ? whereToStartSection(activeKey) : '';

  el.innerHTML = shell(
    { color: 'lifeskills', title: 'Life Skills', subtitle: 'The capacities you build for a life you run yourself.' },
    [activeSection, startSection, goalSection, othersSection].filter(Boolean),
  );

  wireSkillGoal(learnerId, foundations || {}, climb);
  wireWhereToStart();
}

// "Use this as my start" - drop the course's first step into the goal's first field and save
// it (via the existing change-triggered wireSkillGoal handler). Client-only; no new persistence.
function wireWhereToStart() {
  document.querySelectorAll('[data-ls-goal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ta = document.getElementById('ls-woop-setup');
      if (!ta) return;
      ta.value = btn.dataset.lsGoal || '';
      ta.dispatchEvent(new Event('change'));
      ta.focus();
    });
  });
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
