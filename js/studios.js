import { getWheelAreas, COMPASS_V2, regionForLabel } from './wheel.js';

// Per-studio category configuration.
// PLACEHOLDER — confirm with guides before code-finalizing.
// Each studio names which categories are visible and which are conditional (visible only when assigned).
// Categories themselves come from the existing Hero's Compass spreadsheet.

// Each category has worked SMART examples - one per studio band - shown as
// the empty-state placeholder and inside the goal modal. Examples are
// developmentally tuned per Decision 1 of the 2026-05-11 fleet meeting
// (Spock + Troi + Polaris).
//
// DRAFT: pending validation with a Vibrant Life guide who knows actual
// learners. The shape is right; the wording is the captain's to adjust.
//
// Tuning principles per the council:
//   - Discovery (8-11): concrete, named, predictable. Daily cadence.
//     Guide partnership visible. Smaller scope per session.
//   - Adventure (11-14): balanced. Self-set pace. Per-session and per-week
//     cadence. The vocabulary the spreadsheet was originally written in.
//   - Launchpad (15-17): agency-first. Self-directed pace. Integration with
//     external life (apprenticeship, portfolio). Leadership framing.

export const CATEGORIES = {
  khan: {
    name: 'Math',
    kind: 'core',
    examples: {
      discovery: 'Finish the 3rd-grade addition unit by Session 4. One skill a day, ask my guide when I get stuck three in a row.',
      adventure: 'Finish the 5th-grade fractions unit by Session 4. Three skills per week, mastery quiz passed before moving on.',
      launchpad: 'Complete the Pre-Algebra unit by Session 6. Set my own weekly pace; move on when I can teach it back.',
    },
  },
  // Consolidated into `reading` (captain 2026-07-15): program-agnostic subject
  // names. Kept as definitions so any legacy goal filed under these ids still
  // resolves a label ("Reading"); no studio offers them anymore.
  lexia: {
    name: 'Reading',
    kind: 'core',
    examples: {
      discovery: 'Move up one Lexia level by the end of Session 3. Fifteen minutes, four mornings a week.',
      adventure: 'Complete Level 12 by Session 5. Twenty minutes, four days a week.',
      launchpad: 'Finish all remaining Lexia levels by Session 5 so I can focus the rest of the year on writing.',
    },
  },
  deepBook: {
    name: 'Reading',
    kind: 'core',
    examples: {
      discovery: 'Read one Deep Book per session with a partner. Share one favorite line each week with the Socratic group.',
      adventure: 'Read and journal through one Deep Book per session. Pick the next one with my guide before each session starts.',
      launchpad: 'Read three Deep Books per session. Write a one-page critique for each; lead the Socratic discussion at least three times this year.',
    },
  },
  civ: {
    name: 'Civ',
    kind: 'core',
    examples: {
      discovery: 'Hear and tell the story of two civilizations this year. Draw one map for each, share with my Socratic group.',
      adventure: 'Read about and present on three civilizations this year (one per ~2 sessions). Bring a question to Socratic each time.',
      launchpad: 'Compare two civilizations across all seven Civ axes. Produce a final synthesis essay or presentation by Session 7.',
    },
  },
  characterTrait: {
    name: 'Character',
    kind: 'core',
    examples: {
      discovery: 'Practice kindness by giving one specific compliment a day to a different learner. Notice when it changes the room.',
      adventure: 'Practice courage this year by raising my hand in Socratic at least twice each session, even when I am not sure.',
      launchpad: 'Practice steady leadership by mentoring one Discovery learner this year. Meet weekly; bring something useful each time.',
    },
  },
  reading: {
    name: 'Reading',
    kind: 'core',
    examples: {
      discovery: 'Read for 15 minutes every school day. Aim for 12 books this year, and keep a shelf of the ones I loved with a line from each I want to remember.',
      adventure: 'Read for 20 minutes every school day. Aim for 24 books by Session 7, and when a book stays with me, write down why in my reading journal.',
      launchpad: 'Read 20 books across genres I have not tried before. Pair each with a short reflection.',
    },
  },
  pathway: {
    name: 'Badges',
    kind: 'pathway',
    examples: {
      discovery: 'Try three different badges this year. Pick the one that feels most alive and earn it by Session 7.',
      adventure: 'Earn the Photography badge by Session 6. Take 100 photos and pick my top 10 with a guide.',
      launchpad: 'Earn an advanced badge with portfolio-quality output. Choose work I would show a future employer or program.',
    },
  },
  quest: {
    name: 'Quest',
    kind: 'pathway',
    examples: {
      discovery: 'Help plan one Quest exhibition this year with my group. Practice my part three times before the show.',
      adventure: 'Plan and run a Quest exhibition in Session 4 with two other learners. Three rehearsals before the show.',
      launchpad: 'Design and lead a Quest this year. Recruit my own team, set the question, run the exhibition.',
    },
  },
  apprenticeship: {
    name: 'Apprenticeship',
    kind: 'conditional',
    examples: {
      discovery: '(Apprenticeships typically start in Launchpad. Talk to your guide if you want to shadow a Launchpad apprentice.)',
      adventure: 'Shadow an older learner\'s apprenticeship for one session. Decide if I want my own next year.',
      launchpad: 'Complete a six-week apprenticeship with the local maker space. Show one finished project at the end.',
    },
  },
  noRedInk: {
    name: 'Writing',
    kind: 'core',
    examples: {
      discovery: 'Practice writing three days a week, ten minutes each. Finish two grammar units this year.',
      adventure: 'Master comma rules and sentence structure by Session 3. Ten minutes of writing practice, three days a week.',
      launchpad: 'Finish my grammar and mechanics work by Session 4, then move into longer-form essays and a portfolio piece.',
    },
  },
  thresholds: {
    name: 'Thresholds',
    kind: 'conditional',
    examples: {
      discovery: '(Thresholds are Launchpad work. Ask your guide about preparation.)',
      adventure: 'Begin building a Threshold portfolio. Save one piece of work from each session for review next year.',
      launchpad: 'Complete two Threshold projects this year. Submit each for guide review before moving on. One should integrate with my apprenticeship.',
    },
  },
};

// Get the studio-tuned example for a category. Falls back gracefully if a
// category doesn't have an entry for the requested studio.
export function getExampleForCategory(categoryId, studioId) {
  const cat = CATEGORIES[categoryId];
  if (!cat || !cat.examples) return '';
  // Sparks uses Discovery examples as its starting point - they are the most
  // grounded; Sparks-specific tuning happens at the persona level.
  const lookup = studioId === 'sparks' ? 'discovery' : studioId;
  return cat.examples[lookup]
    || cat.examples.adventure
    || cat.examples.discovery
    || cat.examples.launchpad
    || '';
}

// Studio personality declaration.
// Per Decision 1 of the 2026-05-11 fleet meeting: studios are a configuration layer,
// not a codebase split. Each studio declares its visible categories, conditional
// categories, and visual density for the Year Map and other surfaces.
//
// yearMapDensity: 'expanded' = every week visible as a node; 'standard' = weeks
// shown as ticks; 'compressed' = sessions only, weeks on tap.

// dailyTaskThreshold: when today's open-task count exceeds this, the Today
// section shows a soft overflow prompt suggesting a re-plan. Studio-tuned per
// developmental capacity. Tuned by Troi via the 2026-05-11 council. Never
// blocks the learner; just gently surfaces the option.

export const STUDIOS = {
  sparks: {
    name: 'Sparks',
    ageRange: '4-7',
    visible: ['characterTrait', 'reading', 'quest'],
    conditional: [],
    yearMapDensity: 'expanded',
    dailyTaskThreshold: 2,
  },
  discovery: {
    name: 'Discovery',
    ageRange: '8-11',
    visible: ['khan', 'reading', 'noRedInk', 'civ', 'characterTrait', 'quest', 'pathway'],
    conditional: [],
    yearMapDensity: 'expanded',
    dailyTaskThreshold: 3,
  },
  adventure: {
    name: 'Adventure',
    ageRange: '11-14',
    visible: ['khan', 'reading', 'noRedInk', 'civ', 'characterTrait', 'pathway', 'quest'],
    conditional: ['apprenticeship'],
    yearMapDensity: 'standard',
    dailyTaskThreshold: 5,
  },
  launchpad: {
    name: 'Launchpad',
    ageRange: '15-17, apprenticeship track 17-18',
    visible: ['khan', 'reading', 'noRedInk', 'civ', 'characterTrait', 'pathway', 'quest'],
    conditional: ['apprenticeship', 'thresholds'],
    yearMapDensity: 'compressed',
    dailyTaskThreshold: 7,
  },
  // Guide summer-prep journey (Captain 2026-05-15). Guides test-drive the
  // learner experience with their own goals before the school year starts.
  // 12 life-areas (from the life-table planning architecture) + 4 Acton-
  // specific categories. Calendar: May 18 → Aug 17 2026, 7 sections × 13 days.
  'guide-summer': {
    name: 'Guide Summer Prep',
    ageRange: 'May 18 → Aug 17 · walk the path before the year begins',
    visible: [
      'guide_body', 'guide_mind', 'guide_spirit', 'guide_time',
      'guide_joy', 'guide_emotions', 'guide_family', 'guide_friends',
      'guide_intimate', 'guide_home', 'guide_finances', 'guide_career',
      'guide_pedagogy', 'guide_studio', 'guide_learners', 'guide_socratic',
    ],
    conditional: [],
    yearMapDensity: 'standard',
    dailyTaskThreshold: 3,
  },
};

// Guide-specific categories. The 12 life-area architecture (Career/Mission,
// Spirit, Mind, Movement, Time, Joy, Emotions, Family, Friendships, Intimate,
// Home, Finances) + 4 Acton-specific practice domains (Pedagogy, Studio
// Leadership, Learner Relationships, Socratic Practice).
//
// Captain's framing: "equip us to know and use what the learners will be
// using so we can help from a knowing place."
export const GUIDE_CATEGORIES = {
  guide_body: {
    name: 'Movement',
    kind: 'personal',
    example: 'Daily yoga + 8 hours sleep, four days a week. By Aug 17, walking up the hill without getting winded.',
  },
  guide_mind: {
    name: 'Mind',
    kind: 'personal',
    example: 'Read 6 books across pedagogy + Acton history. One book every 2 weeks. Notes shareable with another guide.',
  },
  guide_spirit: {
    name: 'Spirit / Meaning',
    kind: 'personal',
    example: '20 min morning silence, five days a week. By Aug 17 the morning has been protected for 60 mornings.',
  },
  guide_time: {
    name: 'Time / Rhythm',
    kind: 'personal',
    example: 'Open + close discipline daily. One weekly day off held without exception. Two scheduled drops per week.',
  },
  guide_joy: {
    name: 'Joy',
    kind: 'personal',
    example: 'Weekly creative practice. Monthly explore day. One swing-of-the-wild slot kept each week.',
  },
  guide_emotions: {
    name: 'Emotions',
    kind: 'personal',
    example: 'Daily 5-min check-in (one sentence in a journal). Weekly review of what surfaced. Therapy bi-weekly.',
  },
  guide_family: {
    name: 'Family',
    kind: 'personal',
    example: 'Monthly camping. Daily phone-down dinner. One intentional act for each family member each week.',
  },
  guide_friends: {
    name: 'Friendships / Community',
    kind: 'personal',
    example: 'One in-person friend per week. One phone catch-up per week. Maintain 3-4 active reciprocal friendships.',
  },
  guide_intimate: {
    name: 'Intimate / Partner',
    kind: 'personal',
    example: 'Weekly date with my partner. Shared calendar discipline. Quarterly relationship-state conversation.',
  },
  guide_home: {
    name: 'Home / Environment',
    kind: 'personal',
    example: 'Clear workspace by Monday morning. One declutter sweep per month. Quiet bedroom = phone-free.',
  },
  guide_finances: {
    name: 'Finances',
    kind: 'personal',
    example: 'Monthly budget review. By Aug 17, runway clarity documented + income streams stable.',
  },
  guide_career: {
    name: 'Career / Mission',
    kind: 'personal',
    example: 'By Aug 17, the Vibrant Life guide-role is well-prepared AND parallel project ships first milestone.',
  },
  // Acton / Vibrant Life specific practice
  guide_pedagogy: {
    name: 'Pedagogy / Teaching Craft',
    kind: 'practice',
    example: 'Read 3 Acton-aligned pedagogy books this summer. Practice Socratic question-design with a peer guide weekly.',
  },
  guide_studio: {
    name: 'Studio Leadership',
    kind: 'practice',
    example: 'By Aug 17, year-one architecture for my studio drafted. Studio agreements written with co-guide.',
  },
  guide_learners: {
    name: 'Learner Relationships',
    kind: 'practice',
    example: 'Reach out personally to each of my assigned learners between now and Aug 17. One meaningful conversation each.',
  },
  guide_socratic: {
    name: 'Socratic Practice',
    kind: 'practice',
    example: 'Design and run 4 mock Socratic discussions with peer guides this summer. Notes on each. Refine my questioning.',
  },
};

// ── Category -> wheel slice (life area) map ──────────────────────────────────
// The 1-year horizon groups goals by wheel slice (js/wheel.js). This map says
// which slice a category belongs to. Authored as DATA, not inferred in code -
// the placement of a category into a life-area is a values judgment and must be
// visible and reviewable here, never buried in a migration or a render.
// (Fleet meeting 2026-07-12, Decisions 3 + 4; Gnosis's condition.)
//
// GUIDE-SUMMER (adult proving ground, Decision 3): the 12 life-area categories
// map 1:1 onto the adult wheel. The 4 Acton practice categories are NOT life-
// wheel areas - they map to null and render in their own "Guide Practice" group,
// outside the wheel. That is honest: the wheel is life; practice is professional
// prep for the year.
//
// LEARNER TIERS (Sparks / Discovery / Adventure / Launchpad): GATED (Decision 4).
// The curriculum core-task -> proper-slice mapping is the captain's to author as
// data, with Jake + Accord sign-off on the coverage frame and TCC review, before
// any learner sees a sliced year. Deliberately left empty here - an absent
// mapping means "not placed yet," which the render treats as invitation, never
// deficit. Do NOT guess these.
export const CATEGORY_LIFE_AREA = {
  // guide-summer -> adult 12-area wheel (labels match getWheelAreas('guide-summer'))
  guide_body: 'Movement',
  guide_mind: 'Mind',
  guide_spirit: 'Spirit',
  guide_time: 'Time',
  guide_joy: 'Joy',
  guide_emotions: 'Emotions',
  guide_family: 'Family',
  guide_friends: 'Friends',
  guide_intimate: 'Partner',
  guide_home: 'Home',
  guide_finances: 'Finances',
  guide_career: 'Career',
  // Acton practice categories: intentionally no wheel slice (null).
  guide_pedagogy: null,
  guide_studio: null,
  guide_learners: null,
  guide_socratic: null,
};

// The wheel slice a category belongs to, or null if unmapped ("not placed").
// A caller-supplied override (e.g. a goal's own lifeArea) should win over this
// default - this is only the category's declared home.
export function lifeAreaForCategory(categoryId) {
  const area = CATEGORY_LIFE_AREA[categoryId] ?? null;
  // Under the fixed compass, an academic category's declared home resolves to
  // its region (Movement -> Self, Mind -> World, ...). regionForLabel(null)=null.
  return COMPASS_V2 ? regionForLabel(area) : area;
}

// Overflow prompt copy, tuned per studio voice. Praesens + Polaris design.
// Always framed as offer, never as failure.
export const OVERFLOW_COPY = {
  sparks: 'That\'s a lot for today. Want to spread some across the week?',
  discovery: 'That\'s a lot of tasks for one day. Want help spreading them across the week?',
  adventure: 'A heavy day. Want to redistribute some of these?',
  launchpad: 'Today is full. Re-plan?',
};

// Per-category support hints shown to parents on the Parent view.
// Acton-aligned: "Don't help unless asked. Help by listening, not by doing."
// Captain decision 2026-05-11.
export const PARENT_SUPPORT_HINTS = {
  khan: 'Ask them to teach you one skill they\'re learning. Teaching is mastery.',
  lexia: 'Read alongside them for ten minutes a day. Not their level - your own.',
  deepBook: 'Ask one open question about their Deep Book. No quizzing.',
  civ: 'Watch a documentary or read a short article together on the civilization they\'re studying.',
  characterTrait: 'Notice once a week when you see them practicing it. Tell them you noticed.',
  reading: 'Visit the library together. Let them pick. Read your own book at the same time.',
  pathway: 'Ask what\'s hard right now in their badge work. Then just listen.',
  quest: 'Offer to be in the audience at the exhibition. That\'s the support.',
  apprenticeship: 'Ask about the person they\'re apprenticing with, not just the work. Mentorship is the gift.',
  noRedInk: 'No support needed here. They\'ve got this one.',
  thresholds: 'Ask one question about their Threshold project that you\'d want answered. Be a real audience.',
};

export function getStudio(studioId) {
  return STUDIOS[studioId] || null;
}

// Slices-of-life goal categories for a learner, generated from their wheel tier
// so the goal areas match the wheel exactly (Discovery 6, Adventure 8, Launch Pad
// 11). kind 'personal' groups them under "Slices of Life". Guide-summer keeps its
// own GUIDE_CATEGORIES. (Captain 2026-07-10.)
// The stable category id for a wheel-slice label. Shared so a goal saved against
// a slice from the 1-year slice-plan step uses the SAME categoryId the setup goal
// grid + year view expect (e.g. 'Spirit / Meaning' -> 'slice_spirit_meaning').
export function sliceIdForLabel(label) {
  return 'slice_' + String(label).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

function sliceCategoriesForStudio(studioId) {
  return getWheelAreas(studioId).map((label) => ({
    id: sliceIdForLabel(label),
    name: label,
    kind: 'personal',
    example: '',
  }));
}

export function getCategoriesForStudio(studioId) {
  const studio = STUDIOS[studioId];
  if (!studio) return [];
  // Guide-summer pulls from GUIDE_CATEGORIES; learner studios pull from CATEGORIES.
  if (studioId === 'guide-summer') {
    return studio.visible.map((id) => ({
      id,
      ...GUIDE_CATEGORIES[id],
      // Guide categories use a single example (no per-studio variation needed)
      example: GUIDE_CATEGORIES[id]?.example || '',
    }));
  }
  const academic = [...studio.visible, ...studio.conditional].map((id) => ({
    id,
    ...CATEGORIES[id],
    example: getExampleForCategory(id, studioId), // pre-resolve the studio-tuned example for renderers
  }));
  // Learners also get their slices of life, so goals read as Core + Slices.
  return [...academic, ...sliceCategoriesForStudio(studioId)];
}

export function getStudioName(studioId) {
  return STUDIOS[studioId]?.name || 'Unknown';
}

// ── Pitch readiness: studio progression + age gate ──────────────────────────
// See docs/design/2026-07-09-pitch-readiness-thresholds-spec-v0.1.md.
// The learner tiers a person moves UP through. Sparks is parent-only in Compass,
// so the in-app pitch targets are adventure and launchpad only.
const STUDIO_ORDER = ['sparks', 'discovery', 'adventure', 'launchpad'];
const STUDIO_ENTRY_AGE = { adventure: 11, launchpad: 15 };

// The studio one tier up that a learner could pitch INTO, or null (top tier,
// or a studio with no in-app pitch target).
export function nextStudio(studio) {
  const i = STUDIO_ORDER.indexOf(studio);
  if (i < 0 || i === STUDIO_ORDER.length - 1) return null;
  const next = STUDIO_ORDER[i + 1];
  return STUDIO_ENTRY_AGE[next] ? next : null;
}

// The age cutoff for a pitch, for DISPLAY only (captain 2026-07-10). We never
// store or compute against a learner's birthdate - the child self-reports yes/no
// against this cutoff, and their guide approves/denies. This just supplies the
// entry age + the cutoff date to show in the question: "will you have turned
// [entryAge] by [cutoffLabel]?" Cutoff = 4 months after next school-year start.
export function pitchCutoff(targetStudio) {
  const entryAge = STUDIO_ENTRY_AGE[targetStudio];
  if (!entryAge) return null;
  const start = new Date(getYearCalendar().yearStartISO);
  const nextYearStart = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
  const cutoff = new Date(nextYearStart.getFullYear(), nextYearStart.getMonth() + 4, nextYearStart.getDate());
  return {
    entryAge,
    cutoffISO: cutoff.toISOString().slice(0, 10),
    cutoffLabel: cutoff.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
}

// Session structure: 8 sessions, unified for all roles (guides, learners, parents).
// Captain decision 2026-06-15: Session 8 is Summer, treated as its own cycle.
// Previous guide-summer separate calendar removed - everyone uses one calendar.
export const SESSIONS_PER_YEAR = 8;
export const WEEKS_PER_SESSION_DEFAULT = 5;
export const DAYS_PER_WEEK = 5; // school days (M-F)

// Determine which cycle year today falls in. A cycle runs Aug 17 of year N
// through Aug 14 of year N+1 (12 months including the summer reset).
function getCycleYear(today = new Date()) {
  const year = today.getFullYear();
  const augStart = new Date(year, 7, 17); // Aug 17 this year (month is 0-indexed)
  return today < augStart ? year - 1 : year;
}

// Compute the calendar for the cycle that today falls within. Dynamic so
// the system automatically rolls forward each Aug 17 without manual updates.
//
// 8 sessions per cycle:
//   S1: Aug 17 - Sept 11 (4 weeks)    [orientation Aug 4-7]
//   S2: Sept 21 - Oct 23 (5 weeks)    [Columbus Day Oct 12]
//   S3: Nov 2 - Nov 20 (3 weeks)
//   S4: Nov 30 - Dec 18 (3 weeks)     [last before Winter Break - reflection]
//   S5: Jan 4 - Feb 12 (6 weeks)      [MLK Day Jan 18]
//   S6: Feb 22 - Apr 2 (6 weeks)      [finish line]
//   S7: Apr 12 - May 27 (7 weeks)     [last before summer - harvest/reflection]
//   S8: Jun 1 - Aug 14 (~11 weeks)    [summer cycle - rest + plan next year]
export function getYearCalendar(today = new Date()) {
  const cy = getCycleYear(today);
  return {
    yearStartISO: `${cy}-08-17`,
    yearEndISO:   `${cy + 1}-08-14`,
    sessionStarts: [
      `${cy}-08-17`,        // S1
      `${cy}-09-21`,        // S2
      `${cy}-11-02`,        // S3
      `${cy}-11-30`,        // S4
      `${cy + 1}-01-04`,    // S5
      `${cy + 1}-02-22`,    // S6
      `${cy + 1}-04-12`,    // S7
      `${cy + 1}-06-01`,    // S8 (summer cycle)
    ],
    sessionWeeks: [4, 5, 3, 3, 6, 6, 7, 11],
  };
}

// Current cycle's calendar (computed at module load - refreshed on page reload).
export const YEAR_CALENDAR = getYearCalendar();

// Legacy entry point - all roles now use the same unified calendar.
// studioId argument retained for backward compat but ignored.
export function getCalendarForStudio(_studioId) {
  return getYearCalendar();
}

// Per-session landscape theme. Sessions 1-7 are the school year journey;
// Session 8 is summer (ocean - beach/water vibes for rest + reset).
export const SESSION_LANDSCAPES = {
  1: 'desert',
  2: 'forest',
  3: 'arctic',
  4: 'city',
  5: 'ocean',
  6: 'mountain',
  7: 'desert',  // harvest / return at school year end
  8: 'ocean',   // summer cycle - rest + planning next year
};

export function getLandscapeForSession(sessionIndex) {
  return SESSION_LANDSCAPES[sessionIndex] || 'desert';
}
