// Welcome screen - shown on first sign-in OR at the start of each new cycle.
// Captain design 2026-06-15: introduce Compass, surface late-start context
// (works for any role at any session/week), adapt copy by role.
// Force-show via ?welcome=1 query parameter (for testing/preview).

import { getYearCalendar } from './studios.js';
import { computeYearPosition } from './year-map.js';

const ROLE_TITLES = {
  guide: 'Welcome, Guide.',
  learner: 'Welcome.',
  parent: 'Welcome.',
};

const ROLE_TAGLINES = {
  guide: 'As a guide, you walk this path alongside your learners. Your own anchor matters too.',
  learner: 'This is your year. Set your course. Walk it your way.',
  parent: 'Walk alongside your learner - Compass gives you a place to support them, and a place to walk your own path.',
};

// Session 8 is the summer cycle. Other sessions are part of the school year.
function sessionLabel(sessionIndex) {
  if (sessionIndex === 8) return 'Session 8 (Summer)';
  return `Session ${sessionIndex}`;
}

function welcomeKey(role) {
  const calendar = getYearCalendar();
  return `compass-welcome-seen-${role}-${calendar.yearStartISO}`;
}

function isForceShow() {
  const params = new URLSearchParams(location.search);
  return params.get('welcome') === '1';
}

export function shouldShowWelcome(role) {
  if (isForceShow()) return true;
  return !localStorage.getItem(welcomeKey(role));
}

export function markWelcomeSeen(role) {
  localStorage.setItem(welcomeKey(role), new Date().toISOString());
}

// Show the welcome screen and resolve when the user clicks Begin.
// Returns a Promise that resolves after the user proceeds.
export function showWelcomeScreen(role) {
  return new Promise((resolve) => {
    const screen = document.getElementById('welcome-screen');
    if (!screen) {
      resolve();
      return;
    }

    // Role-specific title
    const titleEl = document.getElementById('welcome-title');
    if (titleEl) {
      titleEl.textContent = ROLE_TITLES[role] || 'Welcome.';
    }

    // Role-specific tagline
    const taglineEl = document.getElementById('welcome-role-tagline');
    if (taglineEl) {
      taglineEl.textContent = ROLE_TAGLINES[role] || '';
    }

    // Late-start context if applicable - works for any role at any session/week
    const position = computeYearPosition(new Date());
    const lateStartEl = document.getElementById('welcome-late-start');
    if (lateStartEl) {
      if (!position.beforeYearStart && !position.afterYearEnd
          && (position.sessionIndex > 1 || position.weekInSession > 1)) {
        const label = sessionLabel(position.sessionIndex);
        lateStartEl.innerHTML = `You're joining mid-cycle, in <strong>${label}, Week ${position.weekInSession}</strong>. That's okay. Compass adjusts with you - what matters is where you choose to walk from here.`;
        lateStartEl.hidden = false;
      } else {
        lateStartEl.hidden = true;
      }
    }

    // Hide all other screens, show welcome
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    screen.classList.add('active');

    // Wire Begin button (one-shot)
    const continueBtn = document.getElementById('welcome-continue');
    const handler = () => {
      // Don't mark seen when forced via query param - lets captain re-preview
      if (!isForceShow()) markWelcomeSeen(role);
      screen.classList.remove('active');
      const appScreen = document.getElementById('app-screen');
      if (appScreen) appScreen.classList.add('active');
      continueBtn.removeEventListener('click', handler);
      resolve();
    };
    continueBtn.addEventListener('click', handler);

    // Optional instructions link (placeholder - full instructions page TBD)
    const instructionsLink = document.getElementById('welcome-instructions');
    if (instructionsLink && !instructionsLink.dataset.wired) {
      instructionsLink.dataset.wired = '1';
      instructionsLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Instructions page coming soon. For now, just dive in - Compass will guide you through it.');
      });
    }
  });
}
