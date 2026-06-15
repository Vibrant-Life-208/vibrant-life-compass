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
    name: 'Khan Academy',
    kind: 'core',
    examples: {
      discovery: 'Finish the 3rd-grade addition unit by Session 4. One skill a day, ask my guide when I get stuck three in a row.',
      adventure: 'Finish the 5th-grade fractions unit by Session 4. Three skills per week, mastery quiz passed before moving on.',
      launchpad: 'Complete the Pre-Algebra Mission by Session 6. Set my own weekly pace; track my streak in the dashboard.',
    },
  },
  lexia: {
    name: 'Lexia PowerUp',
    kind: 'core',
    examples: {
      discovery: 'Move up one Lexia level by the end of Session 3. Fifteen minutes, four mornings a week.',
      adventure: 'Complete Level 12 by Session 5. Twenty minutes, four days a week.',
      launchpad: 'Finish all remaining Lexia levels by Session 5 so I can focus the rest of the year on writing.',
    },
  },
  deepBook: {
    name: 'Deep Book',
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
    name: 'Character Trait',
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
      discovery: 'Read for 15 minutes every school day. Finish 12 books by the end of the year - track them on my bookshelf.',
      adventure: 'Read for 20 minutes every school day. Track 24 books finished by Session 7.',
      launchpad: 'Read 20 books across genres I have not tried before. Pair each with a short reflection.',
    },
  },
  pathway: {
    name: 'Pathway Badges',
    kind: 'pathway',
    examples: {
      discovery: 'Try three different Pathway Badges this year. Pick the one that feels most alive and earn it by Session 7.',
      adventure: 'Earn the Photography Pathway Badge by Session 6. Take 100 photos and pick my top 10 with a guide.',
      launchpad: 'Earn an advanced Pathway Badge with portfolio-quality output. Choose work I would show a future employer or program.',
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
    name: 'No Red Ink',
    kind: 'conditional',
    examples: {
      discovery: 'Pass two No Red Ink units this year. Ten minutes, three days a week.',
      adventure: 'Pass the Comma Rules unit by Session 3. Practice ten minutes three days a week.',
      launchpad: 'Finish all assigned No Red Ink units by Session 4 so writing-focused work can move to longer-form pieces.',
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
    visible: ['khan', 'reading', 'civ', 'characterTrait', 'quest', 'pathway'],
    conditional: ['noRedInk'],
    yearMapDensity: 'expanded',
    dailyTaskThreshold: 3,
  },
  adventure: {
    name: 'Adventure',
    ageRange: '11-14',
    visible: ['khan', 'lexia', 'deepBook', 'civ', 'characterTrait', 'pathway', 'quest'],
    conditional: ['noRedInk', 'apprenticeship'],
    yearMapDensity: 'standard',
    dailyTaskThreshold: 5,
  },
  launchpad: {
    name: 'Launchpad',
    ageRange: '15-17, apprenticeship track 17-18',
    visible: ['khan', 'lexia', 'deepBook', 'civ', 'characterTrait', 'pathway', 'quest'],
    conditional: ['apprenticeship', 'thresholds', 'noRedInk'],
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
// Spirit, Mind, Body, Time, Joy, Emotions, Family, Friendships, Intimate,
// Home, Finances) + 4 Acton-specific practice domains (Pedagogy, Studio
// Leadership, Learner Relationships, Socratic Practice).
//
// Captain's framing: "equip us to know and use what the learners will be
// using so we can help from a knowing place."
export const GUIDE_CATEGORIES = {
  guide_body: {
    name: 'Body',
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
  pathway: 'Ask what\'s hard right now in their Pathway. Then just listen.',
  quest: 'Offer to be in the audience at the exhibition. That\'s the support.',
  apprenticeship: 'Ask about the person they\'re apprenticing with, not just the work. Mentorship is the gift.',
  noRedInk: 'No support needed here. They\'ve got this one.',
  thresholds: 'Ask one question about their Threshold project that you\'d want answered. Be a real audience.',
};

export function getStudio(studioId) {
  return STUDIOS[studioId] || null;
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
  return [...studio.visible, ...studio.conditional].map((id) => ({
    id,
    ...CATEGORIES[id],
    example: getExampleForCategory(id, studioId), // pre-resolve the studio-tuned example for renderers
  }));
}

export function getStudioName(studioId) {
  return STUDIOS[studioId]?.name || 'Unknown';
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
