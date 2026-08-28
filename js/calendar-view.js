// Calendar view - a month-by-month picture of the academic-year cycle.
// Shown to ALL learners (Discovery, Adventure, Launch Pad) + staff adults (guides / owners);
// gated in app.js by isLearner / isStaff (NOT launchpad-only). Sparks is parent-only (no learner
// login) and parents don't get the tab.
//   AUDIENCE CORRECTED 2026-08-07: an earlier comment here wrongly claimed "Launch Pad only /
//   Discovery never see it." The gate never restricted it, and the captain confirmed it is for
//   everyone. Because the real audience includes 8-11 (Discovery) learners, the copy and the two
//   captures below still owe a young-register + Salus/Jake pass.
// Mostly renders over EXISTING data:
//   - getYearCalendar()  -> the cycle's session start dates + week counts (studios.js)
//   - goals.sessionIndex -> per-session goals, grouped under their session
//   - tasks.plannedFor   -> planned-day markers dotted onto the calendar cells
// It now also carries two small learner-owned WRITES, held to the capture rules (optional, no
// count, self-only): the year-note (one reflective line, encrypted at rest) and mark-a-day
// presence (ISO dates). Visual conventions follow the Year Map (year-map.js) and sage/earth palette.

import { getLearner, getGoals, getTasksForRange, saveLearner } from './store.js';
import { getPlanningCalendar, getStudioName, getSchoolEvents } from './studios.js';
import { taskColorStyle } from './wheel.js';
import { encryptField, decryptField } from './crypto.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Local-time ISO (YYYY-MM-DD) so day math never slips across a timezone boundary.
function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// The session each calendar day belongs to (1-based), or null on a break / outside
// the cycle. Mirrors the in-session math in year-map.js computeYearPosition: a session
// runs from its start date for sessionWeeks[i] * 7 days.
function buildSessionRanges(cal) {
  return cal.sessionStarts.map((startISO, i) => {
    const start = new Date(startISO + 'T00:00:00');
    const weeks = cal.sessionWeeks[i];
    const end = new Date(start.getTime() + weeks * 7 * MS_PER_DAY - MS_PER_DAY);
    return { index: i + 1, startISO, start, end, weeks };
  });
}

function sessionForDay(dayMs, ranges) {
  for (const r of ranges) {
    if (dayMs >= r.start.getTime() && dayMs <= r.end.getTime()) return r.index;
  }
  return null;
}

export async function renderCalendarView(learnerId) {
  const host = document.getElementById('calendar-view-content');
  if (!host) return;
  if (!learnerId) {
    host.innerHTML = '<p class="learners-empty">Sign in to see the calendar.</p>';
    return;
  }

  const learner = await getLearner(learnerId);
  // The cycle the plan lives in - the upcoming year for a summer planner, so their
  // future-dated tasks + school events actually land on this calendar. (Captain 2026-07-21.)
  const cal = getPlanningCalendar();
  const schoolEvents = getSchoolEvents(cal);
  const eventsByDay = {};
  for (const e of schoolEvents) (eventsByDay[e.date] ||= []).push(e);
  const [goals, tasks] = await Promise.all([
    getGoals(learnerId),
    getTasksForRange(learnerId, cal.yearStartISO, cal.yearEndISO),
  ]);

  const ranges = buildSessionRanges(cal);
  const yearStart = new Date(cal.yearStartISO + 'T00:00:00');
  const yearEnd = new Date(cal.yearEndISO + 'T00:00:00');
  const todayISO = isoOf(new Date());
  const startDayISO = new Set(ranges.map((r) => r.startISO));

  // Mark-a-day presence (Vic, MAC 2026-08-04): the learner can mark days they showed up - a
  // quiet mirror, never a trophy case. Just ISO dates (not intimate text), so plaintext + self-
  // only. NO count, NO streak, fully reversible. Local-only for now, like the book shelf.
  const presenceSet = new Set(Array.isArray(learner?.presenceDays) ? learner.presenceDays : []);

  // Tasks bucketed by planned day (count + titles for the tooltip).
  const tasksByDay = {};
  for (const t of tasks) {
    if (!t.plannedFor) continue;
    (tasksByDay[t.plannedFor] ||= []).push(t);
  }

  // Session goals grouped under their session; year goals counted for the header.
  const yearGoals = goals.filter((g) => g.scope === 'year' && g.text && g.text.trim());
  const sessionGoals = {};
  for (const g of goals) {
    if (g.scope !== 'session') continue;
    if (!(g.text && g.text.trim())) continue;
    const idx = Number.isFinite(g.sessionIndex) ? g.sessionIndex : null;
    if (idx == null) continue;
    (sessionGoals[idx] ||= []).push(g);
  }

  host.innerHTML = '';

  // Intro
  const intro = document.createElement('div');
  intro.className = 'calendar-intro';
  const who = learner?.studio ? getStudioName(learner.studio) : '';
  // No tally of the learner's goals/tasks in the header (MAC review 2026-08-04, unanimous, and a
  // consistency fix with the no-count discipline everywhere else in Compass). The header names the
  // year's SHAPE, not a score. Naming the session count describes the container, not the learner.
  const sessionCount = ranges.length;
  intro.innerHTML = `
    <h2 class="calendar-title">The shape of your year</h2>
    <p class="calendar-sub">${escapeHtml(who ? who + ' · ' : '')}${yearStart.getFullYear()}–${yearEnd.getFullYear()}. ${sessionCount} session${sessionCount === 1 ? '' : 's'} and the breaks between them - where you are now, and what's ahead. Yours to look over; nothing here to keep up with.</p>`;
  host.appendChild(intro);

  // Legend
  const legend = document.createElement('div');
  legend.className = 'calendar-legend';
  // Two layers (MAC/Ishka 2026-08-04): WHERE you are in time vs WHAT is on a day. The split
  // teaches the reading order - locate yourself in the year first, then read the day's content.
  legend.innerHTML = `
    <div class="cal-legend-group">
      <span class="cal-legend-label">Where you are in time</span>
      <span class="cal-legend-item"><span class="cal-swatch cal-swatch-session"></span>In session</span>
      <span class="cal-legend-item"><span class="cal-swatch cal-swatch-start"></span>Session begins</span>
      <span class="cal-legend-item"><span class="cal-swatch cal-swatch-break"></span>Break</span>
      <span class="cal-legend-item"><span class="cal-swatch cal-swatch-today"></span>Today</span>
    </div>
    <div class="cal-legend-group">
      <span class="cal-legend-label">What's on a day</span>
      <span class="cal-legend-item"><span class="cal-task-dot"></span>Planned task</span>
      <span class="cal-legend-item"><span class="cal-swatch cal-swatch-event"></span>School event</span>
    </div>`;
  host.appendChild(legend);

  // Mark-a-day hint (Vic): discoverable, warm, no productivity language.
  if (learner) {
    const markHint = document.createElement('p');
    markHint.className = 'calendar-mark-hint';
    markHint.textContent = 'Tap a day you showed up - a quiet mark, just for you. No streaks, nothing counted.';
    host.appendChild(markHint);
  }

  // Month grids from the cycle's first month through its last.
  const monthsWrap = document.createElement('div');
  monthsWrap.className = 'calendar-months';

  let cursor = new Date(yearStart.getFullYear(), yearStart.getMonth(), 1);
  const lastMonth = new Date(yearEnd.getFullYear(), yearEnd.getMonth(), 1);
  while (cursor <= lastMonth) {
    monthsWrap.appendChild(
      buildMonth(cursor.getFullYear(), cursor.getMonth(), {
        ranges, yearStart, yearEnd, todayISO, startDayISO, tasksByDay, eventsByDay, presenceSet,
      }),
    );
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  host.appendChild(monthsWrap);

  // Toggle presence on tap (delegated - only in-cycle days carry data-iso, so out-of-cycle and
  // blank cells are inert). Reversible; persists the sorted date set. A brief "just-marked" bloom
  // plays once on marking (CSS), then settles to the quiet persistent dot.
  if (learner) {
    monthsWrap.addEventListener('click', async (e) => {
      const cell = e.target.closest('.cal-cell');
      if (!cell || !cell.dataset.iso) return;
      const iso = cell.dataset.iso;
      if (presenceSet.has(iso)) {
        presenceSet.delete(iso);
        cell.classList.remove('is-present', 'just-marked');
      } else {
        presenceSet.add(iso);
        cell.classList.add('is-present', 'just-marked');
        setTimeout(() => cell.classList.remove('just-marked'), 900);
      }
      const next = Array.from(presenceSet).sort();
      learner.presenceDays = next;
      try { await saveLearner({ id: learner.id, presenceDays: next }); } catch (err) { console.warn('presence save:', err); }
    });
  }

  // Per-session goal summary (session goals grouped under their session number).
  const summary = document.createElement('div');
  summary.className = 'calendar-sessions';
  const heading = document.createElement('h3');
  heading.className = 'calendar-sessions-title';
  heading.textContent = 'Goals by session';
  summary.appendChild(heading);

  const anySessionGoals = Object.keys(sessionGoals).length > 0;
  if (!anySessionGoals) {
    const empty = document.createElement('p');
    empty.className = 'calendar-empty';
    empty.textContent = 'Session goals appear here as you set them across the year.';
    summary.appendChild(empty);
  } else {
    ranges.forEach((r) => {
      const gs = sessionGoals[r.index] || [];
      if (gs.length === 0) return;
      const row = document.createElement('div');
      row.className = 'cal-session-row';
      const startLabel = r.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      row.innerHTML = `<div class="cal-session-head"><span class="cal-session-num">Session ${r.index}</span><span class="cal-session-date">${escapeHtml(startLabel)}</span></div>`;
      const ul = document.createElement('ul');
      ul.className = 'cal-session-goals';
      gs.forEach((g) => {
        const li = document.createElement('li');
        li.textContent = g.text.trim();
        ul.appendChild(li);
      });
      row.appendChild(ul);
      summary.appendChild(row);
    });
  }
  host.appendChild(summary);

  // One line for the year (Kirk, MAC 2026-08-04): a single optional, private reflective line -
  // "the story the grid prepared them to tell." This is the calendar's first WRITE, so it is held
  // to the capture rules Salus + Jake set: optional, skippable, self-only, no count, and encrypted
  // at rest with the learner's own key (a raw profile read is ciphertext). Keyed by cycle year, so
  // each year keeps its own line. Local-only for now, like the book shelf. Folds into the
  // Salus + Jake walk as a minor-facing capture. NOTE (2026-08-07): the calendar is shown to ALL
  // learners incl. Discovery (8-11), not Launch Pad only - so this reflective line reaches young
  // learners and owes a young-register pass; watch it in the walk.
  const cycleKey = String(yearStart.getFullYear());
  const notes = (learner && learner.yearNotes) || {};
  const noteText = notes[cycleKey] ? await decryptField(learner.id, notes[cycleKey]) : '';
  // Young register (Discovery 8-11), Hoshi draft Option C via the Salus + Jake post-ship walk
  // (2026-08-11 revise item). "This year I learned that..." makes "learned" - a report-card /
  // acquisition verb - the frame; to a concrete-operational child it reads "did I learn enough to
  // write here?", a performance prompt. "Noticed" is un-gradable present-tense attention a child is
  // always already doing, keeping the verdict with the child. Hint is UNCHANGED for all tiers - it
  // already welcomes without evaluating. Adventure (12-18) + adults keep the standard register.
  // STILL OWED: the consented young-learner walk ratifies this before it is cleared for a real
  // child - voice calibration is not verification.
  const yearnoteYoung = learner?.studio === 'discovery';
  const yearnoteTitle = yearnoteYoung ? 'One thing you noticed' : 'One line for your year';
  const yearnotePlaceholder = yearnoteYoung ? 'One thing I noticed this year...' : 'This year I learned that...';
  const noteCard = document.createElement('div');
  noteCard.className = 'calendar-yearnote';
  noteCard.innerHTML = `
    <h3 class="calendar-yearnote-title">${escapeHtml(yearnoteTitle)}</h3>
    <p class="calendar-yearnote-hint">If you want to. A quiet line to close your year - just for you.</p>
    <textarea class="calendar-yearnote-input slice-box" rows="2" placeholder="${escapeHtml(yearnotePlaceholder)}">${escapeHtml(noteText)}</textarea>`;
  host.appendChild(noteCard);
  const noteInput = noteCard.querySelector('.calendar-yearnote-input');
  if (noteInput) {
    noteInput.addEventListener('change', async () => {
      const enc = await encryptField(learner.id, noteInput.value.trim());
      const nextNotes = { ...((learner && learner.yearNotes) || {}) };
      if (enc) nextNotes[cycleKey] = enc; else delete nextNotes[cycleKey];
      if (learner) learner.yearNotes = nextNotes;
      await saveLearner({ id: learner.id, yearNotes: nextNotes });
    });
  }
}

function buildMonth(year, month, ctx) {
  const { ranges, yearStart, yearEnd, todayISO, startDayISO, tasksByDay, eventsByDay, presenceSet } = ctx;
  const wrap = document.createElement('div');
  wrap.className = 'cal-month';
  // Calm entrance: the month holding today gets a gentle bloom (MAC/Chapel 2026-08-04). The
  // motion itself lives in CSS, with a prefers-reduced-motion fallback.
  if (todayISO && todayISO.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
    wrap.classList.add('is-current-month');
  }

  const title = document.createElement('div');
  title.className = 'cal-month-title';
  title.textContent = `${MONTH_NAMES[month]} ${year}`;
  wrap.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'cal-grid';

  DOW.forEach((d) => {
    const head = document.createElement('div');
    head.className = 'cal-dow';
    head.textContent = d;
    grid.appendChild(head);
  });

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Leading blanks so the 1st lands under its weekday.
  for (let i = 0; i < first.getDay(); i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-cell is-blank';
    grid.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day, 12); // noon: DST-safe comparison
    const dISO = isoOf(d);
    const cell = document.createElement('div');
    cell.className = 'cal-cell';

    const inCycle = d >= yearStart && d <= new Date(yearEnd.getFullYear(), yearEnd.getMonth(), yearEnd.getDate(), 23, 59, 59);
    if (!inCycle) cell.classList.add('out-of-cycle');
    // Only real, in-cycle days are markable (Vic's presence gesture); data-iso is the click hook.
    if (inCycle) {
      cell.dataset.iso = dISO;
      if (presenceSet && presenceSet.has(dISO)) cell.classList.add('is-present');
    }

    const sIdx = inCycle ? sessionForDay(d.getTime(), ranges) : null;
    if (sIdx != null) {
      cell.classList.add('in-session');
      cell.classList.add(sIdx % 2 === 0 ? 'session-even' : 'session-odd');
    } else if (inCycle) {
      // In the cycle but between sessions - a break. Named explicitly (captain 2026-08-04) so
      // the year reads as session / break / session, not session / blank / session.
      cell.classList.add('is-break');
    }
    if (startDayISO.has(dISO)) cell.classList.add('is-session-start');
    if (dISO === todayISO) cell.classList.add('is-today');

    const num = document.createElement('span');
    num.className = 'cal-num';
    num.textContent = String(day);
    cell.appendChild(num);

    if (sIdx != null && startDayISO.has(dISO)) {
      const tag = document.createElement('span');
      tag.className = 'cal-session-tag';
      tag.textContent = `S${sIdx}`;
      cell.appendChild(tag);
    }

    // School calendar events (holidays / breaks / orientation).
    const dayEvents = eventsByDay && eventsByDay[dISO];
    if (dayEvents && dayEvents.length) {
      cell.classList.add('has-school-event');
      const ev = document.createElement('span');
      ev.className = `cal-school-event is-${dayEvents[0].type}`;
      ev.textContent = dayEvents[0].label;
      cell.appendChild(ev);
      cell.title = `${cell.title ? cell.title + ' · ' : ''}${dayEvents.map((e) => e.label).join(' · ')}`;
    }

    const dayTasks = tasksByDay[dISO];
    if (dayTasks && dayTasks.length) {
      // One dot per task (up to 4), coloured by the task's wheel-region shade so the
      // month reads the same colour language as North + the task list. Colourless
      // tasks (no region) fall back to the neutral dot.
      const dots = document.createElement('span');
      dots.className = 'cal-task-dots';
      dayTasks.slice(0, 4).forEach((t) => {
        const dot = document.createElement('span');
        dot.className = 'cal-task-dot';
        const style = taskColorStyle(t);
        if (style) dot.style.background = style.bg;
        dots.appendChild(dot);
      });
      if (dayTasks.length > 4) { const more = document.createElement('span'); more.className = 'cal-task-more'; more.textContent = '+'; dots.appendChild(more); }
      cell.appendChild(dots);
      const titles = dayTasks.map((t) => (t.text || '').trim()).filter(Boolean).join(' · ');
      cell.title = `${dayTasks.length} task${dayTasks.length === 1 ? '' : 's'}${titles ? ': ' + titles : ''}`;
    }

    grid.appendChild(cell);
  }

  wrap.appendChild(grid);
  return wrap;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
