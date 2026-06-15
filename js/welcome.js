// Welcome screen - shown on first sign-in OR at the start of each new cycle.
// Captain design 2026-06-15: welcome page should introduce Compass, offer
// optional instructions link, surface late-start context if applicable, and
// adapt copy by role (guide / learner / parent).

import { getYearCalendar } from './studios.js';
import { computeYearPosition } from './year-map.js';

const ROLE_TAGLINES = {
  guide: 'Guides walk the path first so they can teach from a knowing place.',
  learner: 'This is your year. Set your course. Walk it your way.',
  parent: "Witness your hero's journey unfold and walk alongside them.",
};

function welcomeKey(role) {
  const calendar = getYearCalendar();
  return `compass-welcome-seen-${role}-${calendar.yearStartISO}`;
}

export function shouldShowWelcome(role) {
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

    // Role-specific tagline
    const taglineEl = document.getElementById('welcome-role-tagline');
    if (taglineEl) {
      taglineEl.textContent = ROLE_TAGLINES[role] || '';
    }

    // Late-start context if applicable
    const position = computeYearPosition(new Date());
    const lateStartEl = document.getElementById('welcome-late-start');
    if (lateStartEl) {
      if (!position.beforeYearStart && !position.afterYearEnd
          && (position.sessionIndex > 1 || position.weekInSession > 1)) {
        lateStartEl.textContent = `You're joining in Session ${position.sessionIndex}, Week ${position.weekInSession}. That's okay - Compass will help you find your footing in this cycle.`;
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
      markWelcomeSeen(role);
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
