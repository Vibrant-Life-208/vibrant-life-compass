// Year Map - horizontal thread showing 7 sessions of the academic year.
// Per Decision 2 of the 2026-05-11 fleet meeting: not a Google Calendar replica.
// A learner-time visualization that reveals the whole and marks the learner's position.

import { SESSIONS_PER_YEAR, YEAR_CALENDAR, DAYS_PER_WEEK, getStudio } from './studios.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Compute the learner's current position in the Vibrant Life academic year.
// Honors actual session start dates and break periods between sessions.
// Returns { sessionIndex, weekInSession, dayInWeek, weekOfYear, totalWeeks,
//           beforeYearStart, afterYearEnd, onBreak }
export function computeYearPosition(today = new Date()) {
  const totalWeeks = YEAR_CALENDAR.sessionWeeks.reduce((a, b) => a + b, 0);
  const yearStart = new Date(YEAR_CALENDAR.yearStartISO + 'T00:00:00');
  // yearEnd is inclusive - the entire last day still counts as in-session
  const yearEnd = new Date(YEAR_CALENDAR.yearEndISO + 'T23:59:59');

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
      weekInSession: YEAR_CALENDAR.sessionWeeks[SESSIONS_PER_YEAR - 1],
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

  for (let i = 0; i < YEAR_CALENDAR.sessionStarts.length; i++) {
    const sStart = new Date(YEAR_CALENDAR.sessionStarts[i] + 'T00:00:00');
    const sWeeks = YEAR_CALENDAR.sessionWeeks[i];
    const sEnd = new Date(sStart.getTime() + (sWeeks * 7 * MS_PER_DAY) - MS_PER_DAY);
    const nextStart = i + 1 < YEAR_CALENDAR.sessionStarts.length
      ? new Date(YEAR_CALENDAR.sessionStarts[i + 1] + 'T00:00:00')
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
    let labelText = density === 'compressed' ? `S${sessionNumber}` : `Session ${sessionNumber}`;
    // Per captain decision 2026-05-11: Session 6 is the finish line, Session 7 is harvest
    if (sessionNumber === 6) {
      labelText += density === 'compressed' ? ' 🏁' : ' · finish';
      session.classList.add('year-map-finish');
    } else if (sessionNumber === 7) {
      labelText += density === 'compressed' ? ' ✦' : ' · harvest';
      session.classList.add('year-map-harvest');
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
