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
import { getLearner, getProfileFoundations, setProfileFoundations } from '../store.js';
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
// outcome). All FOUR Life Skills courses are now fully drafted + wired behind ?lscourse=on.
// Register tiering (SSC pass, Salus + Jake): course copy is chosen from learner.studio. The shared
// COURSES ship in two registers - Launch Pad (16-18) = standard text; Adventure (11-15) = a lowered
// floor on a few abstract steps (see registerFor / stepText). Discovery (8-11) has its OWN course set
// (COURSES_DISCOVERY, authored 2026-08-17) - a genuinely different, simpler course (3 concrete steps a
// stage), not a lowered floor. courseFor() picks the set + register. The owed reviews still stand: a
// human trauma-informed pass (Wellness is HOLD-FOR-HUMAN, the Discovery Wellness surface carries no
// body/number content by design) + the binding consented real-learner walk before any register fronts
// a real child; nothing here lifts the flag.
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
        { launchpad: 'Circle of competence - only put money into what you understand.',
          adventure: "Only put money into what you understand - if you can't explain it, don't buy it." },
        { launchpad: "Margin of safety - never risk what you can't get back.",
          adventure: "Never risk money you can't get back - keep what you can't replace safe." },
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
        { launchpad: "Name who you'd serve - what group or cause would you carry something hard for?",
          adventure: "Name who you'd help - who or what would you do something hard for, even when it's not easy?" },
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
        { launchpad: "Refuse the extraction shortcut - does it leave people better off, or just harder to leave? And never make yourself the product: serve a need, don't sell yourself or farm an audience.",
          adventure: "Refuse the extraction shortcut - does it leave people better off, or just harder to leave? And don't sell yourself or chase followers - make something that helps." },
      ] },
      { name: 'Serve', gloss: 'Does it leave people genuinely better? Serve, don\'t hustle.', steps: [
        { launchpad: 'Ask the capacity test - do they walk away with a real good, or only a feeling you sold them?',
          adventure: "Ask honestly: did the person end up with a real thing they needed - or did you just make them feel like they should buy it?" },
        { launchpad: 'Trade fair, both sides ahead - a fair trade leaves both richer; extraction leaves them emptier.',
          adventure: "If you trade or sell, make it fair - both of you should be glad afterward, not just you." },
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
        { launchpad: 'The honest test: is a "wellness" message helping you tend yourself, or selling you as a project that\'s never fixed?',
          adventure: 'The honest test: is a "wellness" message helping you take care of yourself, or telling you something is wrong with you that you have to fix or buy?' },
        { launchpad: 'Drop one number - step away from one thing you track about your body, and feel how it actually feels.',
          adventure: "If you ever count or check something about your body, take a day off from it and just notice how your body feels." },
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

// Discovery (8-11) course set - the Wave-2 young register, authored 2026-08-17 (Salus + Jake,
// approved by Europa). NOT a lowered floor: a genuinely different, simpler course for the
// concrete-operational child - three concrete steps a stage (working-memory), plain 8-year-old
// words, one doing each. Some Adventure abstractions leave entirely: Financial "Grow & Guard"
// becomes "Guard" (no markets / risk-math); Wellness carries NO body / number / tracking content at
// all, not even to criticize it (Salus: introducing the idea to an 8-year-old is itself the harm -
// the firewall + drop-a-number steps are Adventure-and-up only). The kidfluencer guard survives in
// kid words ("one happy person, not lots of followers"). Same arc names as Adventure / Launch Pad so
// the ladder grows WITH the child. Selected when learner.studio === 'discovery' (see courseFor).
const COURSES_DISCOVERY = {
  financial: {
    arc: ['Keep', 'Earn', 'Guard'],
    start: {
      title: 'Keep some of it',
      body: 'When you get any money, keep a little before you spend the rest. Put it somewhere safe. Keeping a bit is the first money habit.',
      goal: 'Keep a little of any money I get, before I spend the rest.',
    },
    stages: [
      { name: 'Keep', gloss: 'Keep a little before you spend.', steps: [
        'Keep a little of any money you get, before you spend the rest.',
        'Notice the difference between something you need and something you just want.',
        'Save up for one thing you really want, a little at a time.',
      ] },
      { name: 'Earn', gloss: 'Money comes from helping.', steps: [
        'Find one real job someone needs done, and do it.',
        'A real job for real money feels good - that is earning.',
        'Give a little of what you earn to someone who needs it.',
      ] },
      { name: 'Guard', gloss: 'Keep it safe from tricks.', steps: [
        'If money sounds too easy - a free prize, quick riches - it is probably a trick. Ask a grown-up.',
        'Money grows slowly. Saving a little, again and again, adds up.',
        'Keep your saved money somewhere safe, not loose in your pocket.',
      ] },
    ],
  },
  leadership: {
    arc: ['Serve', 'Steady', 'Gather'],
    start: {
      title: 'Help before anyone asks',
      body: 'Do one kind thing for your group before anyone asks you to. That is how leading starts.',
      goal: 'Do one kind thing for my group before anyone asks.',
    },
    stages: [
      { name: 'Serve', gloss: 'Leading starts with helping.', steps: [
        'Help before anyone asks - pick up what fell, welcome the new kid.',
        'Do a job nobody wants to do.',
        'Help someone without needing a thank-you.',
      ] },
      { name: 'Steady', gloss: 'Be someone people can count on.', steps: [
        'Keep a promise, even a small one.',
        'When something goes wrong, stay calm and ask "what do we do now?"',
        'When you mess up, say sorry and help fix it.',
      ] },
      { name: 'Gather', gloss: 'Bring people with you.', steps: [
        'Ask a quiet kid what they think - and really listen.',
        'Get a few friends together to do something kind.',
        'Let someone else have a turn being the leader.',
      ] },
    ],
  },
  entrepreneurship: {
    arc: ['See', 'Make', 'Serve'],
    start: {
      title: 'Find one thing to help with',
      body: 'Notice one thing someone around you needs or would like. Just notice it - that is where making starts.',
      goal: 'Notice one thing someone around me needs or would like.',
    },
    stages: [
      { name: 'See', gloss: 'Start with a real need.', steps: [
        'Notice one thing someone around you needs or would like.',
        'Ask them what would actually help.',
        "Pick one you'd be happy to make.",
      ] },
      { name: 'Make', gloss: 'Make one real thing.', steps: [
        'Make one real thing - draw it, build it, bake it, do it.',
        'Give it to the person and see if it helps.',
        "If they don't want it, that's okay - you learned something. Try again.",
      ] },
      { name: 'Serve', gloss: 'Did it really help?', steps: [
        'Ask if it really helped them.',
        'If you trade or sell, be fair - you should both be happy.',
        "You don't need lots of likes or followers - you need one happy person. Making something that helps feels good.",
      ] },
    ],
  },
  wellness: {
    arc: ['Tend', 'Be Kind', 'Connect'],
    start: {
      title: 'One kind thing for you',
      body: 'Do one small kind thing for your body or your feelings today - a drink of water, a stretch, a big breath.',
      goal: 'One small kind thing for me today.',
    },
    stages: [
      { name: 'Tend', gloss: 'Be good to your body.', steps: [
        'Sleep enough - your body grows and feels better when you rest.',
        'Move your body in a way that is fun - run, dance, play.',
        'Play outside a little.',
      ] },
      { name: 'Be Kind', gloss: 'Be good to yourself.', steps: [
        'Talk to yourself like you would talk to a friend.',
        'Rest - doing nothing for a bit is allowed.',
        "You're not a problem to fix. You're already okay.",
      ] },
      { name: 'Connect', gloss: 'People matter most.', steps: [
        'Spend a little time with someone you like.',
        'Be kind to a friend - or let a friend be kind to you.',
        "Ask for help when you need it - that's brave. And you belong here.",
      ] },
    ],
  },
};

// Register resolution for course copy (SSC pass, Salus + Jake, 2026-08-13). The shared courses ship at
// the Launch Pad (16-18) register; Adventure (11-15) gets a lowered floor on a few abstract steps
// (drop the finance jargon, plain fair-trade, gentler self-compassion + the "you are not the
// product" beat in plainest words). A step is either a plain string (same for everyone) or a
// { launchpad, adventure } variant. Discovery (8-11) has its OWN course set (COURSES_DISCOVERY above,
// selected in courseFor); registerFor's discovery -> 'adventure' is only a safety fallback if a
// Discovery course entry were ever missing. Unknown / guide / owner / adult -> the standard Launch Pad
// text (books.js idiom: standard is default, the young register is the explicit exception).
function registerFor(studio) {
  return (studio === 'adventure' || studio === 'discovery') ? 'adventure' : 'launchpad';
}
function stepText(step, register) {
  return typeof step === 'string' ? step : (step[register] || step.launchpad);
}

// Pick the course set + register for a learner. Discovery (8-11) has its own course; everyone else
// uses the shared course at the Launch Pad (16-18) or Adventure (11-15) register.
function courseFor(activeKey, studio) {
  if (studio === 'discovery' && COURSES_DISCOVERY[activeKey]) {
    return { course: COURSES_DISCOVERY[activeKey], register: 'discovery' };
  }
  return { course: COURSES[activeKey], register: registerFor(studio) };
}

// The "Where to start" section: the arc (when researched), the universal first step as a
// card, and a button that drops that first step into the goal below. Read-only guidance -
// no course-progress persistence yet (deferred); the goal (WOOP) is the persisted object.
function whereToStartSection(c, register) {
  if (!c || !c.start) return '';
  const arc = Array.isArray(c.arc) && c.arc.length
    ? `<ol class="ls-arc">${c.arc.map((s, i) => `<li class="ls-arc-step"><span class="ls-arc-num">${i + 1}</span>${escapeHtml(s)}</li>`).join('')}</ol>`
    : '';
  const path = Array.isArray(c.stages)
    ? `<details class="ls-path"><summary>See the whole path</summary>${c.stages.map((st) => `
        <div class="ls-stage"><p class="ls-stage-name">${escapeHtml(st.name)} <span class="ls-stage-gloss">${escapeHtml(st.gloss || '')}</span></p>
        <ul class="ls-stage-steps">${st.steps.map((x) => `<li>${escapeHtml(stepText(x, register))}</li>`).join('')}</ul></div>`).join('')}</details>`
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
  const [foundations, learner] = await Promise.all([
    getProfileFoundations(learnerId),
    getLearner(learnerId),
  ]);
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
  // flows straight into the goal. Flag-gated (dark) and only when a skill is active. The course set
  // + register are chosen from the learner's studio (Discovery gets its own course; see courseFor).
  let startSection = '';
  if (isLifeSkillsCourse() && activeKey) {
    const { course, register } = courseFor(activeKey, learner?.studio);
    if (course) startSection = whereToStartSection(course, register);
  }

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
