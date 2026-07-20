// The per-goal working arc (Stage M, behind CURRENT_WHEEL_BUILD).
//
// "Clicking into a goal starts at the HALFWAY, not the year" (captain 2026-07-16).
// The working view opens on the halfway goal (the Session-3 target the onboarding walk
// produced) and shows the spine that carries it: Plan -> Do -> Close (Sessions 1, 2, 3),
// FORWARD, then Reflect (Session 4). Session 4 (Reflect) is held in grace - a look-back
// that renders IDENTICALLY whether or not Session 3 landed on time (no behind, no
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

// The Plan / Do / Close spine (Sessions 1-3), FORWARD, lived order; Session 4 is Reflect
// (the grace look-back, rendered below). Reframed to the captain's Plan/Do/Close/Reflect
// model (2026-07-20) with Kohn's "Punished by Rewards" through-line: S1 the Three C's
// (Content / Collaboration / Choice - meaningful work, a buddy, your own steps), S2
// problem-solving (talk a snag through, never push-through-alone or reward/punishment),
// S3 feedback-not-praise (notice the effect and the process, not "good job"). Exported so
// the C1 render guard can assert these phases NEVER render over a becoming-goal (finish-
// shaped only; built-surface re-walk 2026-07-17, Dec. 2).
export const ARC_PHASES = [
  { session: 1, name: 'Plan', tag: 'set yourself up',
    body: 'Plan the work: clear a reliable space, choose a buddy, and name your steps and the challenges ahead. This is where you set Session 2 up to go well.' },
  { session: 2, name: 'Do', tag: 'work the plan',
    body: 'Open your plan and do it, a bit at a time. Hit a snag? Talk it through and find the next real step - solve it together, do not push through alone or give up.' },
  { session: 3, name: 'Close', tag: 'tie it off and celebrate',
    body: 'Bring it home: tie up loose ends, check off the markers that mattered, and celebrate - or adjust and catch up. Notice the effect of what you did, not just that it is done.' },
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

// Becoming slices carry a PRESENCE register - noticing, not finishing - because "you don't
// finish becoming heroic" (§7/§11). Everything else takes the finish-shaped progressing
// question. Keyed off the slice label the goal carries.
// Discovery becoming = Heart. Adventure becomings = Spirit + Emotions (confirmed minimum).
// Fix 2026-07-18: hardcoding to 'heart' alone gave every Adventure Spirit/Emotions goal the
// finish-line spine (verified: weeklyKindFor('Spirit') === 'finish'). Fail toward presence
// for the confirmed becomings. Joy/Home/Family are the open which-areas call for the school
// and keep the default register until ratified.
// TODO: replace with a per-studio becoming map (tracker: "Generalize the Discovery-first data layer").
const BECOMING_SLICES = new Set(['heart', 'spirit', 'emotions']);
function isBecomingSlice(lifeArea) {
  return BECOMING_SLICES.has(String(lifeArea || '').trim().toLowerCase());
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
  const becoming = isBecomingSlice(area);

  // The middle of the arc, between the destination and the weekly zoom.
  //
  // A SKILL goal (Learning et al.) gets the FORWARD three-phase spine + the Session-4 grace
  // buffer. A BECOMING goal (Heart) gets NEITHER: you do not cross a finish line on becoming
  // heroic, so a finish-shaped SEQUENCE must never render over it. This is the built-surface
  // re-walk's Decision 2 (2026-07-17; Comes + Accord convergent) - a structural REFUSAL of the
  // spine, NOT a verb-swap. In its place, a still presence line: the destination is held, and
  // nothing shaped like a sequence sits between it and the weekly noticing below (Comes: "the
  // destination and the noticing, and nothing shaped like a sequence between them"). The weekly
  // question already carries the presence register (weeklyPrompt: "you do not finish becoming").
  //
  // PROVISIONAL COPY: the exact presence shape of this line is Comes' + Accord's to author at
  // their design walk / the flag-on browser walk. This satisfies the structural refusal (no
  // phases, no "you are here", no "finish line") until they set the final shape. Still dark
  // behind CURRENT_WHEEL_BUILD; nothing ships before the watch-with-a-real-learner gate.
  let middle;
  if (becoming) {
    middle = `
      <p class="arc-becoming-note">This one is a becoming, not a finish - there is no line to cross. You grow it by noticing it, a little at a time, and it is here whenever you come back.</p>`;
  } else {
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
      <p class="arc-grace">Session 4 is Reflect - a look back over Plan, Do, and Close. No rush, and never "behind": rest with what you did, notice what you learned, and let it shape your next plan.</p>`;
    middle = `
      <ul class="arc-spine">${spine}</ul>
      ${grace}`;
  }

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
        <span class="arc-week-saved" id="arc-week-saved" role="status" aria-live="polite" hidden>Saved for this week</span>
      </div>
    </section>`;

  // M3: daily tasks under this week's answer. Each is toggle-able (done/undone), no count,
  // no "2 of 3 done" meter (§1). The "two doors" every day: one small step (the add row)
  // AND rest today (a first-class choice, never a miss - the SDT wall). Self-only (§6).
  const todayList = todayTasks.length
    ? `<ul class="arc-today-list">${todayTasks.map((t) => `
        <li class="arc-today-task${t.status === 'done' ? ' is-done' : ''}">
          <button type="button" class="arc-today-toggle" data-task-id="${escapeHtml(t.id)}" aria-pressed="${t.status === 'done'}" aria-label="${t.status === 'done' ? 'Done' : 'Mark done'}: ${escapeHtml(t.text)}">${t.status === 'done' ? 'Done' : 'Mark'}</button>
          <span class="arc-today-text">${escapeHtml(t.text)}</span>
        </li>`).join('')}</ul>`
    : `<p class="arc-today-empty">Nothing set for today yet - a small step, or rest. Both are real.</p>`;
  const todayPanel = `
    <section class="arc-today">
      <h4 class="arc-zoom-heading">Today</h4>
      ${todayList}
      <div class="arc-today-add-row">
        <input type="text" id="arc-today-input" class="arc-today-input" placeholder="One small step for today">
        <button type="button" class="btn btn-text" id="arc-today-add">Add</button>
      </div>
      <div class="arc-two-doors">
        <button type="button" class="btn btn-text" id="arc-today-rest">Rest today</button>
        <span class="arc-today-rest-note" id="arc-today-rest-note" role="status" aria-live="polite" hidden>Rest is a real choice, never a miss. See you tomorrow.</span>
      </div>
    </section>`;

  const areaLine = area ? `<p class="arc-area">${escapeHtml(area)}</p>` : '';
  const destinationBlock = destination
    ? `<p class="arc-destination">${escapeHtml(destination)}</p>`
    : `<p class="arc-destination arc-destination-empty">Set your halfway goal in your walk-through, and it lands here as your middle-of-the-year target.</p>`;

  return `
    <div class="goal-arc${becoming ? ' goal-arc-becoming' : ''}">
      ${areaLine}
      <p class="arc-destination-label">Your goal for the middle of the year</p>
      ${destinationBlock}
      ${middle}
      <div class="arc-zoom">
        ${week}
        ${todayPanel}
      </div>
    </div>`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
