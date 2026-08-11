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
// make-others-follow, Greene/Machiavelli specimen-firewalled). Wellness is fully drafted too
// (docs/design/2026-08-09-wellness-course-v0.1.md - grounded in the 2026-08-09 wellbeing research:
// connection is the strongest predictor, self-compassion not self-optimization, tending not fixing;
// no tracking/weight/metrics by design; AED/AAP eating-disorder safety guardrail baked in, Salus/Jake
// review owed). Entrepreneurship completes the set (docs/design/2026-08-09-entrepreneurship-course-v0.1.md
// - reuses the 2026-07-31 money report's Wardlaw "find a need that EXISTS and fill it" spine + the
// Karbo/Hill extraction fork, extended to ventures: capacity not "be your own boss / get rich",
// See -> Make -> Serve, the venture-level firewall "does it fill a real need or manufacture/capture
// one?", no hustle-culture; admission gate logged "graph not needed" - single-pass, smallest-graph
// outcome). All FOUR Life Skills courses are now fully drafted + wired behind ?lscourse=on. Salus/Jake
// developmental pass is owed across all four (the 8-11 young register is the Wave-2 rewrite).
const COURSES = {
  financial: {
    arc: ['Keep', 'Earn', 'Grow & Guard'],
    start: {
      title: 'The tenth',
      body: "Decide your tenth - the part of any money you get that you keep first. Set it aside now if you have any; if you don't yet, the decision still counts and waits for your first coin. The act, not the amount, is the lesson.",
      goal: 'Decide my tenth - the part I keep first from any money I get.',
    },
    stages: [
      { name: 'Keep', gloss: '"A part of all you earn is yours to keep."', steps: [
        'The tenth - decide the part you keep first; set it aside now, or let the decision wait for your first coin.',
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
  entrepreneurship: {
    arc: ['See', 'Make', 'Serve'],
    start: {
      title: 'Find one real need',
      body: "Notice one thing someone around you actually needs done or made - real, already there, not one you'd have to talk them into. Just spot it. Every honest venture starts at a need that already exists, not one you manufacture.",
      goal: 'Notice one real need someone around me already has, and name it.',
    },
    stages: [
      { name: 'See', gloss: '"Filling needs that exist."', steps: [
        "Spot a real need - one someone actually has, already there, not one you'd have to talk them into.",
        'Ask the person, don\'t guess - talk to someone who has the need and ask what would actually help.',
        "Check it's real, not manufactured - would you have to create the worry to sell the fix? If so, drop it.",
        "Pick the one you'd be glad to fill - a direction, not a business plan.",
      ] },
      { name: 'Make', gloss: 'Build the smallest real thing, ship it, improve it.', steps: [
        'Make the smallest real thing - the version one person could use this week, not the dream version.',
        "Put it in front of one real person - real use tells you the truth. If they don't want it, that's data about the thing, never a verdict on you.",
        "Improve from what happened, not what you hoped - change one thing based on what they actually did.",
        "Refuse the extraction shortcut - does it leave people better off, or just harder to leave? And never make yourself the product: serve a need, don't sell yourself or farm an audience.",
      ] },
      { name: 'Serve', gloss: 'Does it leave people genuinely better? Serve, don\'t hustle.', steps: [
        'Ask the capacity test - do they walk away with a real good, or only a feeling you sold them?',
        'Trade fair, both sides ahead - a fair trade leaves both richer; extraction leaves them emptier.',
        'Give some of it back - a part of what you make, for someone beyond you. A business is a way to serve.',
        'Refuse the hustle story - name what "crush it / grind / be your own boss" is selling. Real building is slow.',
      ] },
    ],
  },
  wellness: {
    arc: ['Tend', 'Be Kind', 'Connect'],
    start: {
      title: 'One small tending',
      body: 'Pick one small thing that tends your body or mind - water, a walk, a real breath - and do it today. Wellness is built from small, repeated care - not from buying, counting, or fixing anything.',
      goal: 'One small thing that tends me - and I do it today.',
    },
    stages: [
      { name: 'Tend', gloss: 'Care for your body with small, real, free things.', steps: [
        'Sleep one night well - a real wind-down tonight, screens down early.',
        'Move because it feels good - for how it feels, not to burn or count anything.',
        'Get outside - a little green or open air today.',
        'Eat something that nourishes you - no "good/bad" food, no counting. Food is care, not a scoreboard.',
      ] },
      { name: 'Be Kind', gloss: 'Treat yourself like someone you\'re helping, not a project to fix.', steps: [
        "Talk to yourself like a friend - say what you'd tell a friend who felt that way.",
        'Rest your attention - a few real minutes to breathe and notice, nothing to fix or scroll.',
        'The honest test: is a "wellness" message helping you tend yourself, or selling you as a project that\'s never fixed?',
        'Drop one number - step away from one thing you track about your body, and feel how it actually feels.',
      ] },
      { name: 'Connect', gloss: 'The strongest thing for a good life is people.', steps: [
        "Reach one person - message or sit with someone you like, today. If today is too much, that's not a failure; wanting to counts, and there's always another day.",
        'Tend one relationship - listen fully, say thanks, show up. Quality, not count.',
        'Ask for or offer help - both ends of care are wellbeing.',
        "Belong to something - show up once, when you're ready, for a group or place you are part of.",
      ] },
    ],
  },
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
