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

// Each tagline is an array of sentences. Rendered one sentence per line so the
// rhythm of the writing carries visually and short sentences don't wrap awkwardly.
const ROLE_TAGLINES = {
  guide: [
    'As a guide, you walk this path',
    'alongside your learners.',
    'Your own anchor matters too.',
  ],
  learner: [
    'This is your year.',
    'Set your course.',
    'Walk it your way.',
  ],
  parent: [
    'Walk alongside your learner.',
    'Compass gives you a place to support them, and a place to walk your own path.',
  ],
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
  // PREVIEW MODE: always show welcome while captain is iterating on copy/design.
  // Restore the localStorage-check logic once she signs off on the design.
  return true;
  // eslint-disable-next-line no-unreachable
  if (isForceShow()) return true;
  return !localStorage.getItem(welcomeKey(role));
}

export function markWelcomeSeen(role) {
  localStorage.setItem(welcomeKey(role), new Date().toISOString());
}

// Show the welcome screen and resolve when the user clicks Begin.
// Returns a Promise that resolves after the user proceeds.
export function showWelcomeScreen(role) {
  console.log('[welcome] showWelcomeScreen called with role:', role);
  return new Promise((resolve) => {
    const screen = document.getElementById('welcome-screen');
    console.log('[welcome] welcome-screen element:', screen);
    if (!screen) {
      console.warn('[welcome] welcome-screen div not found - skipping');
      resolve();
      return;
    }

    // Role-specific title
    const titleEl = document.getElementById('welcome-title');
    if (titleEl) {
      titleEl.textContent = ROLE_TITLES[role] || 'Welcome.';
    }

    // Role-specific tagline - rendered one sentence per line via <br>.
    // Each tagline value is an array of sentences; we escape and join them so
    // the data layer holds the structure and the DOM holds the rendering.
    const taglineEl = document.getElementById('welcome-role-tagline');
    if (taglineEl) {
      const sentences = ROLE_TAGLINES[role] || [];
      taglineEl.innerHTML = sentences
        .map((s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
        .join('<br>');
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
    document.querySelectorAll('.screen').forEach((s) => {
      s.classList.remove('active');
      // Belt-and-suspenders: also explicitly clear inline display so .screen
      // CSS rule takes over (display:none)
      if (s !== screen) s.style.display = '';
    });
    screen.classList.add('active');
    // Force display via inline style in case CSS specificity is overriding
    screen.style.display = 'flex';
    console.log('[welcome] welcome-screen activated, display:', getComputedStyle(screen).display);

    // Wire Begin button (one-shot)
    const continueBtn = document.getElementById('welcome-continue');
    const handler = () => {
      // Don't mark seen when forced via query param - lets captain re-preview
      if (!isForceShow()) markWelcomeSeen(role);
      screen.classList.remove('active');
      // Clear the inline display:flex we set when showing the screen. Without
      // this, the inline style wins over the CSS display:none rule and the
      // welcome stays visible even after the .active class is removed.
      screen.style.display = '';
      const appScreen = document.getElementById('app-screen');
      if (appScreen) appScreen.classList.add('active');
      continueBtn.removeEventListener('click', handler);
      resolve();
    };
    continueBtn.addEventListener('click', handler);
  });
}
