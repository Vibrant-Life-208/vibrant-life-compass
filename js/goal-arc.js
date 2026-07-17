// The per-goal working arc (Stage M, behind CURRENT_WHEEL_BUILD).
//
// "Clicking into a goal starts at the HALFWAY, not the year" (captain 2026-07-16).
// The working view opens on the halfway goal (the Session-3 target the onboarding walk
// produced) and shows the three-session spine that carries it: Set up -> The challenge
// -> Cross the finish line (Sessions 1, 2, 3), FORWARD. Session 4 is grace - a catch-up
// buffer that renders IDENTICALLY whether or not Session 3 landed on time (no behind, no
// remediation). The surface only ever shows THIS week + today (the zoom); the full ladder
// lives in the structure, never on the page. The weekly progressing question is cadence-
// split by goal type (Learning finish-shaped, Heart presence) and PULLED (shown because
// the learner opened the goal), never a push-strip.
//
// M1 renders the arc structure read-only: the destination, the phase spine, the grace
// buffer, and the zoom (this-week prompt + today's tasks). M2 makes the weekly prompt an
// answerable, this-week-only, non-aggregated input; M3 puts daily tasks under the week's
// answer. Consolidated conditions honored here: §1 no denominator/meter, Session-4-
// identical; §7 cadence split + pull-only; §8 the zoom holds (no see-all-weeks/back-
// ladder/progress-strip); §9 "one step more" is an after-done gift, never a gate.
// Nothing here ships before Stage V's watch-with-a-real-learner gate.

// The three-session spine. FORWARD, lived order. Copy from the captain's decomposition
// model (2026-07-16): each phase has a job, and Session 1's easy win is the mastery
// experience that answers the overwhelm.
const ARC_PHASES = [
  { session: 1, name: 'Set up', tag: 'clear the runway',
    body: 'Make starting easy - clear the space, gather what you need, and tell someone you are beginning.' },
  { session: 2, name: 'The challenge', tag: 'the hard middle',
    body: 'Name the hardest part and take the smallest real step toward it - even on a day you do not feel like it.' },
  { session: 3, name: 'Cross the finish line', tag: 'recognize and savor',
    body: 'Bring it home. How will you know you got there - what would your buddy or guide see?' },
];

// Which session + week are we in right now, from the calendar. Clamps into range so a
// date before the year, in a between-session gap, or past the end still yields a sane
// position (never an error, never a negative "week"). Pass `today` explicitly in tests.
export function currentArcPosition(calendar, today = new Date()) {
  const toDay = (d) => (d instanceof Date ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : new Date(d + 'T00:00:00'));
  const starts = (calendar.sessionStarts || []).map(toDay);
  const weeks = calendar.sessionWeeks || [];
  const t = toDay(today);
  if (!starts.length) return { session: 1, week: 1 };
  let s = 0;
  for (let i = 0; i < starts.length; i++) { if (t >= starts[i]) s = i; else break; }
  const days = Math.max(0, Math.floor((t - starts[s]) / 86400000));
  const week = Math.min(Math.max(1, Math.floor(days / 7) + 1), Math.max(1, weeks[s] || 1));
  return { session: s + 1, week };
}

// Is this a Heart ("becoming") goal? Heart carries a PRESENCE register - noticing, not
// finishing - because "you don't finish becoming heroic" (§7/§11). Everything else takes
// the finish-shaped progressing question. Keyed off the slice label the goal carries.
function isBecomingSlice(lifeArea) {
  return String(lifeArea || '').trim().toLowerCase() === 'heart';
}

// The cadence-split kind for a slice: Heart 'becoming' goals register PRESENCE; everything
// else takes the FINISH-shaped question. Exported so the modal can tag the saved answer.
export function weeklyKindFor(lifeArea) {
  return isBecomingSlice(lifeArea) ? 'presence' : 'finish';
}

// The pulled weekly progressing question for a slice, cadence-split. Read-only prompt in
// M1 (the "pull" is that the learner opened the goal); M2 makes it answerable. Never a
// per-goal push-strip (§7).
function weeklyPrompt(lifeArea) {
  const area = escapeHtml(lifeArea || 'this part of your life');
  return isBecomingSlice(lifeArea)
    ? `This week in ${area}: what did you notice? (You do not finish becoming - you notice it growing.)`
    : `This week in ${area}: what is the one thing you will work on?`;
}

// Render the arc for a working (halfway) goal. Pure - returns an HTML string.
//   goal      the working goal (the Session-3 halfway goal); its `.text` is the destination
//   lifeArea  the wheel slice label (e.g. 'Learning', 'Heart') - drives the cadence split
//   position  { session, week } from currentArcPosition
//   todayTasks array of { text, status } for today for this goal (read-only in M1)
export function renderGoalArcHtml(goal, { lifeArea = null, position = { session: 1, week: 1 }, todayTasks = [], weeklyAnswer = '' } = {}) {
  const area = lifeArea || goal?.lifeArea || null;
  const destination = (goal?.text || '').trim();

  // Phase spine, FORWARD. The current phase is clamped to 1..3 (Session 4+ = all three
  // behind you, in grace). Marked "you are here" with NO number and NO "2 of 3" (§1).
  const currentPhase = Math.min(Math.max(1, position.session), 3);
  const inGrace = position.session >= 4;
  const spine = ARC_PHASES.map((p) => {
    const here = !inGrace && p.session === currentPhase;
    return `
      <li class="arc-phase${here ? ' arc-phase-here' : ''}">
        <div class="arc-phase-head">
          <span class="arc-phase-name">${escapeHtml(p.name)}</span>
          ${here ? '<span class="arc-phase-here-chip">you are here</span>' : ''}
          <span class="arc-phase-tag">${escapeHtml(p.tag)}</span>
        </div>
        <p class="arc-phase-body">${escapeHtml(p.body)}</p>
      </li>`;
  }).join('');

  // Session 4 grace - IDENTICAL regardless of on-time (§1 grace-not-remediation; §9 the
  // "one step more" gift is offered AFTER done, never as a gate).
  const grace = `
    <p class="arc-grace">After the finish line, Session 4 is room to land it - no rush, and never "behind." If you get there in three, the fourth is yours: rest, or add one step more just because you can.</p>`;

  // The zoom: THIS week + today only. No "see all weeks," no back-through-the-ladder, no
  // progress strip - those re-create the overwhelm (§8). The phase spine above is a still
  // orientation, not a navigable ladder.
  // M2: the prompt is answerable, THIS WEEK ONLY. Prefilled with this week's answer; no
  // prior weeks, no history, no "last answered" - each week is its own moment (§5/§8). The
  // modal wires save; a blank save withdraws the answer (not a zero).
  const week = `
    <section class="arc-week">
      <h4 class="arc-zoom-heading">This week</h4>
      <p class="arc-week-prompt">${weeklyPrompt(area)}</p>
      <textarea id="arc-week-answer" class="arc-week-input" rows="2" placeholder="Just this week - a sentence is plenty.">${escapeHtml(weeklyAnswer)}</textarea>
      <div class="arc-week-actions">
        <button type="button" class="btn btn-text" id="arc-week-save">Save this week</button>
        <span class="arc-week-saved" id="arc-week-saved" hidden>Saved for this week</span>
      </div>
    </section>`;

  const todayList = todayTasks.length
    ? `<ul class="arc-today-list">${todayTasks.map((t) => `<li class="arc-today-task${t.status === 'done' ? ' is-done' : ''}">${escapeHtml(t.text)}</li>`).join('')}</ul>`
    : `<p class="arc-today-empty">Nothing set for today yet - a small step, or rest. Both are real.</p>`;
  const todayPanel = `
    <section class="arc-today">
      <h4 class="arc-zoom-heading">Today</h4>
      ${todayList}
    </section>`;

  const areaLine = area ? `<p class="arc-area">${escapeHtml(area)}</p>` : '';
  const destinationBlock = destination
    ? `<p class="arc-destination">${escapeHtml(destination)}</p>`
    : `<p class="arc-destination arc-destination-empty">Set your halfway goal in your walk-through, and it lands here as your middle-of-the-year target.</p>`;

  return `
    <div class="goal-arc">
      ${areaLine}
      <p class="arc-destination-label">Your goal for the middle of the year</p>
      ${destinationBlock}
      <ul class="arc-spine">${spine}</ul>
      ${grace}
      <div class="arc-zoom">
        ${week}
        ${todayPanel}
      </div>
    </div>`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
