// Hero's Compass - entry point.
// Boot order: Bearing -> Sign-in -> first-run onboarding (if learner) -> role-based view.

import { initBearing } from './arrive.js';
import { initAuth, requireSession, showSignIn, showApp, switchRole } from './auth.js';
import { renderNorth, setYearMapClickHandler } from './north.js';
import { renderYearView } from './year-view.js';
import { renderSessionView, initSessionNav, setCurrentSession } from './session-view.js';
import { breadcrumbLabel, computeYearPosition } from './year-map.js';
import { initStillness } from './stillness.js';
import { getLandscapeForSession } from './studios.js';
import { renderPatterns } from './patterns.js';
import { renderEveryone, initEveryone } from './everyone.js';
import { renderLogins, initLogins } from './logins.js';
import { initModal, openOnboardingModal } from './modals.js';
import { getLearners, getYearQuote, getYearTraits, setYearQuote, setYearTraits, getSession } from './store.js';

// Tab configurations per role. Order matters; first tab is the default.
const TABS_BY_ROLE = {
  learner: [
    { id: 'north-view', label: 'North' },
    { id: 'year-view', label: 'Compass' },
    { id: 'session-view', label: 'Session' },
    { id: 'patterns-view', label: 'Patterns' },
    { id: 'passwords-view', label: 'Passwords' },
    { id: 'everyone-view', label: 'Everyone' },
  ],
  parent: [
    { id: 'parent-view', label: 'My learner' },
    { id: 'north-view', label: 'North' },
    { id: 'year-view', label: 'Compass' },
    { id: 'session-view', label: 'Session' },
    { id: 'patterns-view', label: 'Patterns' },
    { id: 'passwords-view', label: 'Passwords' },
    { id: 'everyone-view', label: 'Everyone' },
  ],
  guide: [
    { id: 'guide-view', label: 'My learners' },
    { id: 'north-view', label: 'North' },
    { id: 'year-view', label: 'Compass' },
    { id: 'session-view', label: 'Session' },
    { id: 'patterns-view', label: 'Patterns' },
    { id: 'passwords-view', label: 'Passwords' },
    { id: 'everyone-view', label: 'Everyone' },
  ],
};

document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  initModal();
  // Apply the landscape backdrop before bearing so the "travel" begins
  // the moment the app opens, not after sign-in.
  applyLandscape();
  initBearing(afterBearing);
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

function afterBearing() {
  const session = requireSession();
  if (!session) {
    showSignIn();
    initAuth(onSignedIn);
  } else {
    onSignedIn();
  }
}

function onSignedIn() {
  showApp();
  const session = requireSession();
  if (!session) return;

  document.getElementById('who-label').textContent = `${session.name} · ${session.role}`;
  buildTabs(session.role);
  wireRoleSwitcher();

  const learnerId = resolveLearnerId(session);
  initSessionNav(learnerId);
  initEveryone();
  initLogins(learnerId);
  initStillness();
  wireBearingAgain();
  updateBreadcrumb(learnerId);
  applyLandscape();

  // Year Map session-click → jump to Session view with that session selected.
  setYearMapClickHandler((sessionNumber) => {
    setCurrentSession(sessionNumber);
    showTab('session-view', learnerId);
  });

  // First-run onboarding: learner OR guide has no quote and no traits yet.
  // The identity used for storage differs by role - learnerId for learners,
  // guideId for guides. Parents share their learner's quote, no separate one.
  const ownIdentity = session.role === 'learner' ? learnerId
                    : session.role === 'guide' ? session.guideId
                    : null;
  if (ownIdentity && needsOnboarding(ownIdentity)) {
    openOnboardingModal({
      role: session.role,
      onComplete: ({ quote, traits }) => {
        if (quote) setYearQuote(ownIdentity, quote);
        if (traits.length) setYearTraits(ownIdentity, traits);
        showTab(TABS_BY_ROLE[session.role][0].id, learnerId);
      },
    });
  }

  // Default tab.
  const defaultTab = TABS_BY_ROLE[session.role][0].id;
  showTab(defaultTab, learnerId);
}

function needsOnboarding(learnerId) {
  const quote = getYearQuote(learnerId);
  const traits = getYearTraits(learnerId);
  return !quote && (!traits || traits.length === 0);
}

function resolveLearnerId(session) {
  if (session.learnerId) return session.learnerId;
  const learners = getLearners();
  return learners[0]?.id || null;
}

function buildTabs(role) {
  const nav = document.getElementById('tab-nav');
  nav.innerHTML = '';
  const tabs = TABS_BY_ROLE[role] || TABS_BY_ROLE.learner;
  tabs.forEach((t, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (i === 0 ? ' active' : '');
    btn.dataset.tab = t.id;
    btn.textContent = t.label;
    btn.addEventListener('click', () => {
      const learnerId = resolveLearnerId(requireSession());
      showTab(t.id, learnerId);
    });
    nav.appendChild(btn);
  });
}

function showTab(tabId, learnerId) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-content').forEach((c) => {
    c.classList.toggle('active', c.id === tabId);
  });

  if (tabId === 'north-view') { renderNorth(learnerId); applyLandscape(); }
  if (tabId === 'year-view') renderYearView(learnerId);
  if (tabId === 'session-view') {
    renderSessionView(learnerId);
    // Session view drives the landscape - lets the learner travel as they navigate.
    import('./session-view.js').then(m => applyLandscape(m.getCurrentSession()));
  }
  if (tabId === 'patterns-view') renderPatterns(learnerId);
  if (tabId === 'passwords-view') renderLogins(learnerId);
  if (tabId === 'everyone-view') renderEveryone();
  if (tabId === 'guide-view') renderRoleView('guide', learnerId);
  if (tabId === 'parent-view') renderRoleView('parent', learnerId);
}

function renderRoleView(role, learnerId) {
  if (role === 'guide') {
    // Render guide's own quote at the top of their dashboard
    const session = getSession();
    const quoteSection = document.getElementById('guide-quote-section');
    const quoteText = document.getElementById('guide-quote-text');
    if (session?.guideId && quoteSection && quoteText) {
      const q = getYearQuote(session.guideId);
      if (q) {
        quoteText.textContent = `“${q}”`;
        quoteSection.style.display = 'block';
      } else {
        quoteSection.style.display = 'none';
      }
    }
    const list = document.getElementById('guide-learners');
    const learners = getLearners();
    if (!learners.length) {
      list.innerHTML = '<p class="learners-empty">No learners assigned yet.</p>';
      return;
    }
    list.innerHTML = '';
    learners.forEach((l) => {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.innerHTML = `
        <div class="category-header">
          <span class="category-name">${escapeHtml(l.name)}</span>
          <span class="category-kind">${escapeHtml(l.studio)}</span>
        </div>
        <p class="category-goal">Open their compass to see year + session goals.</p>
      `;
      list.appendChild(card);
    });
  }
  if (role === 'parent') {
    const list = document.getElementById('parent-learner');
    const learners = getLearners();
    if (!learners.length) {
      list.innerHTML = '<p class="learners-empty">No learner linked yet.</p>';
      return;
    }
    list.innerHTML = '';
    const l = learners[0];
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
      <div class="category-header">
        <span class="category-name">${escapeHtml(l.name)}</span>
        <span class="category-kind">${escapeHtml(l.studio)}</span>
      </div>
      <p class="category-goal">Open their compass to see year + session goals.</p>
    `;
    list.appendChild(card);
  }
}

// Landscape gradient definitions (matching the body class CSS).
const LANDSCAPE_GRADIENTS = {
  desert:   'linear-gradient(180deg, #e8c48a 0%, #f0d9a8 60%, #f5f0e8 100%)',
  forest:   'linear-gradient(180deg, #b8cdb0 0%, #d4dec8 60%, #f5f0e8 100%)',
  arctic:   'linear-gradient(180deg, #c4d0db 0%, #dde3eb 60%, #f5f0e8 100%)',
  city:     'linear-gradient(180deg, #c4bfb6 0%, #d8d4cc 60%, #f5f0e8 100%)',
  ocean:    'linear-gradient(180deg, #a8c2cb 0%, #c8d6db 60%, #f5f0e8 100%)',
  mountain: 'linear-gradient(180deg, #c0b29a 0%, #d4c8b4 60%, #f5f0e8 100%)',
};

function setLayerLandscape(layer, landscape) {
  if (!layer) return;
  const svg = `url('/icons/landscape-${landscape}.svg')`;
  const gradient = LANDSCAPE_GRADIENTS[landscape] || LANDSCAPE_GRADIENTS.desert;
  layer.style.backgroundImage = `${svg}, ${gradient}`;
}

let currentLandscape = null;
let panning = false;

// Apply the landscape backdrop. If sessionIndex is provided, use that; otherwise
// use the learner's current year position. When the landscape changes, the
// scene-stage pans horizontally - feels like walking forward into the next place.
export function applyLandscape(sessionIndex) {
  const position = computeYearPosition();
  const sIdx = sessionIndex || position.sessionIndex;
  const landscape = getLandscapeForSession(sIdx);
  const stage = document.getElementById('scene-stage');
  const current = document.getElementById('scene-current');
  const next = document.getElementById('scene-next');

  // First-paint: set the current layer and the next layer (next defaults to
  // the same landscape so there's no flash when a pan begins).
  if (!currentLandscape) {
    setLayerLandscape(current, landscape);
    setLayerLandscape(next, landscape);
    currentLandscape = landscape;
    positionWalker(position);
    return;
  }

  // No change, no pan needed - but still update walker position (week may have moved).
  if (landscape === currentLandscape) {
    positionWalker(position);
    return;
  }

  // If a pan is already underway, wait until it completes.
  if (panning) return;

  // Stage the new landscape in the "next" slot and cross-fade.
  setLayerLandscape(next, landscape);
  panning = true;
  stage.classList.add('panning'); // class name kept; transition is now opacity-based

  // After the fade completes, copy the new landscape to "current" and reset.
  // This makes "current" once again the active layer for the next swap.
  setTimeout(() => {
    setLayerLandscape(current, landscape);
    // Snap back without animation: remove panning, set opacities directly via a
    // transition-disabled pass, then re-enable transitions for the next swap.
    current.style.transition = 'none';
    next.style.transition = 'none';
    stage.classList.remove('panning');
    void stage.offsetWidth; // force reflow
    current.style.transition = '';
    next.style.transition = '';
    currentLandscape = landscape;
    panning = false;
  }, 1700);
}

// The forward-approach animation (scene scale 1.0 -> 1.18) lives in CSS
// on .scene-layer. The viewer is the one moving - no figure on the trail.
function positionWalker() { /* removed per captain 2026-05-11 */ }

function updateBreadcrumb(learnerId) {
  const el = document.getElementById('position-breadcrumb');
  if (!el) return;
  const learner = learnerId ? getLearners().find((l) => l.id === learnerId) : null;
  el.textContent = learner ? breadcrumbLabel(learner) : '';
}

function wireRoleSwitcher() {
  const buttons = document.querySelectorAll('.role-switch-btn');
  const session = requireSession();
  buttons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.switchRole === session?.role);
    if (btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', () => {
      switchRole(btn.dataset.switchRole, () => {
        // Re-run the post-sign-in flow so tabs + views update for the new role.
        location.reload();
      });
    });
  });
}

function wireBearingAgain() {
  const btn = document.getElementById('bearing-again');
  if (btn && !btn.dataset.wired) {
    btn.dataset.wired = '1';
    btn.addEventListener('click', () => location.reload());
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
