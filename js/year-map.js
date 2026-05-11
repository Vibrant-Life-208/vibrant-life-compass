// Year Map - horizontal thread showing 7 sessions of the academic year.
// Per Decision 2 of the 2026-05-11 fleet meeting: not a Google Calendar replica.
// A learner-time visualization that reveals the whole and marks the learner's position.

import { SESSIONS_PER_YEAR, YEAR_CALENDAR, DAYS_PER_WEEK, getStudio } from './studios.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Compute the learner's current position in the academic year.
// Returns { sessionIndex, weekInSession, dayInWeek, weekOfYear, totalWeeks, beforeYearStart, afterYearEnd }
// sessionIndex is 1-indexed (1..7). All week/day indices are 1-indexed.
export function computeYearPosition(today = new Date()) {
  const start = new Date(YEAR_CALENDAR.yearStartISO + 'T00:00:00');
  const totalWeeks = YEAR_CALENDAR.sessionWeeks.reduce((a, b) => a + b, 0);
  const totalDays = totalWeeks * 7;

  const msSinceStart = today.getTime() - start.getTime();
  const daysSinceStart = Math.floor(msSinceStart / MS_PER_DAY);

  if (daysSinceStart < 0) {
    return {
      sessionIndex: 1,
      weekInSession: 1,
      dayInWeek: 1,
      weekOfYear: 1,
      totalWeeks,
      beforeYearStart: true,
      afterYearEnd: false,
    };
  }
  if (daysSinceStart >= totalDays) {
    return {
      sessionIndex: SESSIONS_PER_YEAR,
      weekInSession: YEAR_CALENDAR.sessionWeeks[SESSIONS_PER_YEAR - 1],
      dayInWeek: DAYS_PER_WEEK,
      weekOfYear: totalWeeks,
      totalWeeks,
      beforeYearStart: false,
      afterYearEnd: true,
    };
  }

  // Determine which session
  let weeksConsumed = 0;
  let sessionIndex = 1;
  const weekOfYear = Math.floor(daysSinceStart / 7) + 1;

  for (let i = 0; i < YEAR_CALENDAR.sessionWeeks.length; i++) {
    if (weekOfYear <= weeksConsumed + YEAR_CALENDAR.sessionWeeks[i]) {
      sessionIndex = i + 1;
      break;
    }
    weeksConsumed += YEAR_CALENDAR.sessionWeeks[i];
  }
  const weekInSession = weekOfYear - weeksConsumed;

  // Map calendar day to school-day (1..5 Mon-Fri; 0 if weekend)
  const dayOfWeek = ((daysSinceStart % 7) + 1); // 1 if started on Monday
  const dayInWeek = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek : 0;

  return {
    sessionIndex,
    weekInSession,
    dayInWeek,
    weekOfYear,
    totalWeeks,
    beforeYearStart: false,
    afterYearEnd: false,
  };
}

// Render the Year Map into the given container element for a learner.
export function renderYearMap(container, learner, opts = {}) {
  if (!container) return;
  const studio = getStudio(learner?.studio) || { yearMapDensity: 'standard', name: 'Adventure' };
  const density = opts.density || studio.yearMapDensity || 'standard';
  const position = opts.position || computeYearPosition();

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

  YEAR_CALENDAR.sessionWeeks.forEach((weeksInSession, sIdx) => {
    const sessionNumber = sIdx + 1;
    const isCurrent = sessionNumber === position.sessionIndex;
    const isPast = sessionNumber < position.sessionIndex || position.afterYearEnd;
    const isFuture = sessionNumber > position.sessionIndex && !position.afterYearEnd;

    const session = document.createElement('div');
    session.className = 'year-map-session'
      + (isCurrent ? ' is-current' : '')
      + (isPast ? ' is-past' : '')
      + (isFuture ? ' is-future' : '');
    session.dataset.sessionIndex = String(sessionNumber);

    const label = document.createElement('div');
    label.className = 'year-map-session-label';
    label.textContent = density === 'compressed' ? `S${sessionNumber}` : `Session ${sessionNumber}`;
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
  const parts = [studio?.name, `S${position.sessionIndex}`, `W${position.weekInSession}`];
  if (position.dayInWeek > 0) parts.push(`D${position.dayInWeek}`);
  return parts.filter(Boolean).join(' · ');
}
