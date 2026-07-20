// Year Map - horizontal thread of the academic year's sessions.
// Per Decision 2 of the 2026-05-11 fleet meeting: not a Google Calendar replica.
// A learner-time visualization that marks the learner's position.
//
// SESSION-WINDOW ZOOM (captain 2026-07-20; SSC working session): this map no longer
// "reveals the whole" year at once. A learner standing in Session 1 was shown all 7-8
// sessions (Kyra, a live learner, found the full strip overwhelming). The 2026-05-11
// "reveal the whole" intent is a considered REVERSAL as of 2026-07-20. Now: show the near
// window (sessions 1-3) and reveal each later session only when its calendar start date
// arrives. TIME-gated, NEVER achievement-gated (SSC invariant) - a session opens because it
// STARTS, never because the prior one was "completed"; an unfinished session must never read
// as a locked door. The full ladder still lives in the structure, off the page.

import { SESSIONS_PER_YEAR, YEAR_CALENDAR, DAYS_PER_WEEK, getStudio, getCalendarForStudio } from './studios.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Compute the protagonist's current position in their academic-year/summer-prep
// timeline. Honors actual session start dates and break periods between sessions.
// studioId is now optional — defaults to the school-year calendar; pass
// 'guide-summer' to compute against the guide summer-prep timeline.
// Returns { sessionIndex, weekInSession, dayInWeek, weekOfYear, totalWeeks,
//           beforeYearStart, afterYearEnd, onBreak }
export function computeYearPosition(today = new Date(), studioId) {
  const calendar = getCalendarForStudio(studioId);
  const totalWeeks = calendar.sessionWeeks.reduce((a, b) => a + b, 0);
  const yearStart = new Date(calendar.yearStartISO + 'T00:00:00');
  // yearEnd is inclusive - the entire last day still counts as in-session
  const yearEnd = new Date(calendar.yearEndISO + 'T23:59:59');

  if (today < yearStart) {
    return {
      sessionIndex: 1,
      weekInSession: 1,
      dayInWeek: 1,
      weekOfYear: 1,
      totalWeeks,
      beforeYearStart: true,
      afterYearEnd: false,
      onBreak: false,
    };
  }
  if (today > yearEnd) {
    return {
      sessionIndex: SESSIONS_PER_YEAR,
      weekInSession: calendar.sessionWeeks[SESSIONS_PER_YEAR - 1],
      dayInWeek: DAYS_PER_WEEK,
      weekOfYear: totalWeeks,
      totalWeeks,
      beforeYearStart: false,
      afterYearEnd: true,
      onBreak: false,
    };
  }

  // Find which session today falls inside, or whether today is on a break.
  let sessionIndex = 1;
  let weekInSession = 1;
  let onBreak = false;
  let weeksBeforeCurrent = 0; // weeks of program completed before current session

  for (let i = 0; i < calendar.sessionStarts.length; i++) {
    const sStart = new Date(calendar.sessionStarts[i] + 'T00:00:00');
    const sWeeks = calendar.sessionWeeks[i];
    const sEnd = new Date(sStart.getTime() + (sWeeks * 7 * MS_PER_DAY) - MS_PER_DAY);
    const nextStart = i + 1 < calendar.sessionStarts.length
      ? new Date(calendar.sessionStarts[i + 1] + 'T00:00:00')
      : yearEnd;

    if (today >= sStart && today <= sEnd) {
      // Inside this session
      sessionIndex = i + 1;
      const daysIntoSession = Math.floor((today - sStart) / MS_PER_DAY);
      weekInSession = Math.floor(daysIntoSession / 7) + 1;
      if (weekInSession > sWeeks) weekInSession = sWeeks;
      break;
    }
    if (today > sEnd && today < nextStart) {
      // On break between this session and the next
      sessionIndex = i + 1;
      weekInSession = sWeeks;
      onBreak = true;
      weeksBeforeCurrent += sWeeks;
      break;
    }
    weeksBeforeCurrent += sWeeks;
  }

  const weekOfYear = weeksBeforeCurrent + weekInSession;
  const dayOfWeek = today.getDay(); // 0 Sun .. 6 Sat
  const dayInWeek = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek : 0;

  return {
    sessionIndex,
    weekInSession,
    dayInWeek,
    weekOfYear,
    totalWeeks,
    beforeYearStart: false,
    afterYearEnd: false,
    onBreak,
  };
}

// Render the Year Map into the given container element for a learner.
export function renderYearMap(container, learner, opts = {}) {
  if (!container) return;
  const studio = getStudio(learner?.studio) || { yearMapDensity: 'standard', name: 'Adventure' };
  const density = opts.density || studio.yearMapDensity || 'standard';
  const calendar = getCalendarForStudio(learner?.studio);
  const position = opts.position || computeYearPosition(new Date(), learner?.studio);

  container.innerHTML = '';
  container.classList.add('year-map', `year-map-${density}`);

  // Header - just the position label (section already carries the title)
  const header = document.createElement('div');
  header.className = 'year-map-header';
  header.innerHTML = `
    <span class="year-map-position">${positionLabel(position, studio.name)}</span>
  `;
  container.appendChild(header);

  // Thread
  const thread = document.createElement('div');
  thread.className = 'year-map-thread';

  const totalWeeksInYear = calendar.sessionWeeks.reduce((a, b) => a + b, 0);

  // The near window: sessions 1-3 always, growing to include the current session as the
  // year is lived. position.sessionIndex is date-driven (computeYearPosition) - so this is
  // TIME-gated, never achievement-gated. Sessions past the window stay in the structure,
  // off the page, until their start date arrives. Past sessions remain visible as memory
  // (is-past), never a progress meter ("behind you is memory, not score" - Jake Sisko).
  // OPEN REFINEMENT: with the repeating Plan/Do/Close/Reflect cycle, per-cycle windowing
  // (collapsing prior cycles) may be layered on later; this grows a single window and keeps
  // prior sessions as memory, honoring both "just show 1-3" and "the past is memory."
  const maxVisibleSession = Math.max(3, position.sessionIndex);

  calendar.sessionWeeks.forEach((weeksInSession, sIdx) => {
    const sessionNumber = sIdx + 1;
    // Not yet started - stays in the structure, off the page (session-window zoom).
    if (sessionNumber > maxVisibleSession) return;
    const isCurrent = sessionNumber === position.sessionIndex;
    const isPast = sessionNumber < position.sessionIndex || position.afterYearEnd;
    const isFuture = sessionNumber > position.sessionIndex && !position.afterYearEnd;

    const session = document.createElement('div');
    session.className = 'year-map-session'
      + (isCurrent ? ' is-current' : '')
      + (isPast ? ' is-past' : '')
      + (isFuture ? ' is-future' : '');
    session.dataset.sessionIndex = String(sessionNumber);
    // Width proportional to week count - longer sessions (6, 7) get more space
    session.style.flex = `${weeksInSession} ${weeksInSession} 0`;

    const label = document.createElement('div');
    label.className = 'year-map-session-label';
    let labelText = density === 'compressed' ? `S${sessionNumber}` : `Session ${sessionNumber}`;
    // Session 6 = finish line, Session 7 = harvest, Session 8 = summer cycle
    if (sessionNumber === 6) {
      labelText += density === 'compressed' ? ' 🏁' : ' · finish';
      session.classList.add('year-map-finish');
    } else if (sessionNumber === 7) {
      labelText += density === 'compressed' ? ' ✦' : ' · harvest';
      session.classList.add('year-map-harvest');
    } else if (sessionNumber === 8) {
      labelText += density === 'compressed' ? ' ☀' : ' · summer';
      session.classList.add('year-map-summer');
    }
    label.textContent = labelText;
    session.appendChild(label);

    // Weeks
    if (density !== 'compressed') {
      const weekRow = document.createElement('div');
      weekRow.className = 'year-map-week-row';
      for (let w = 1; w <= weeksInSession; w++) {
        const week = document.createElement('div');
        const isCurrentWeek = isCurrent && w === position.weekInSession;
        week.className = 'year-map-week' + (isCurrentWeek ? ' is-current-week' : '');
        if (density === 'expanded') {
          week.textContent = `W${w}`;
        }
        week.title = `Session ${sessionNumber}, Week ${w}`;
        weekRow.appendChild(week);
      }
      session.appendChild(weekRow);
    } else {
      // Compressed: show a compact weeks-count badge
      const badge = document.createElement('div');
      badge.className = 'year-map-weeks-badge';
      badge.textContent = `${weeksInSession} wk`;
      session.appendChild(badge);
    }

    // Hook for click - delegate to opts.onSessionClick
    if (opts.onSessionClick) {
      session.addEventListener('click', () => opts.onSessionClick(sessionNumber));
      session.style.cursor = 'pointer';
    }

    thread.appendChild(session);
  });

  container.appendChild(thread);

  // Helper text below
  const helper = document.createElement('p');
  helper.className = 'year-map-helper';
  if (position.beforeYearStart) {
    helper.textContent = 'The year hasn\'t started yet. Your compass is ready when you are.';
  } else if (position.afterYearEnd) {
    helper.textContent = 'The year is complete. Time to look back at your patterns.';
  } else {
    helper.textContent = density === 'expanded'
      ? 'Tap a session to see its goals.'
      : 'Each block is a session. Tap to open it.';
  }
  container.appendChild(helper);
}

function positionLabel(position, studioName) {
  if (position.beforeYearStart) return 'Year hasn\'t started yet';
  if (position.afterYearEnd) return 'Year complete';
  if (position.onBreak) return `Break before Session ${position.sessionIndex + 1}`;
  return `Session ${position.sessionIndex} · Week ${position.weekInSession}`;
}

// Compact label for the header breadcrumb - "Adventure · S3 · W2 · D4"
export function breadcrumbLabel(learner) {
  const studio = getStudio(learner?.studio);
  const position = computeYearPosition();
  if (position.beforeYearStart) {
    return `${studio?.name || ''} · year not started`;
  }
  if (position.afterYearEnd) {
    return `${studio?.name || ''} · year complete`;
  }
  if (position.onBreak) {
    return `${studio?.name || ''} · break before S${position.sessionIndex + 1}`;
  }
  const parts = [studio?.name, `S${position.sessionIndex}`, `W${position.weekInSession}`];
  if (position.dayInWeek > 0) parts.push(`D${position.dayInWeek}`);
  return parts.filter(Boolean).join(' · ');
}
