// Hero's Compass - entry point.
// Boot order: Bearing -> Sign-in -> first-run onboarding (if learner) -> role-based view.

import { initBearing } from './arrive.js';
import { initAuth, requireSession, showSignIn, showApp, switchRole, startIdleTimeout, wireSignOut } from './auth.js';
import { renderNorth, setYearMapClickHandler } from './north.js';
import { renderYearView } from './year-view.js';
import { renderSessionView, initSessionNav, setCurrentSession } from './session-view.js';
import { breadcrumbLabel, computeYearPosition } from './year-map.js';
import { initStillness } from './stillness.js';
import { getLandscapeForSession } from './studios.js';
import { renderPatterns } from './patterns.js';
import { renderPartnerPage } from './partner.js';
import { renderAdminAccounts, initAdmin } from './admin.js';
import { renderSetupView } from './setup.js';
import { renderLogins, initLogins } from './logins.js';
import { initModal, openOnboardingModal } from './modals.js';
import { shouldShowWelcome, showWelcomeScreen } from './welcome.js';
import { getLearners, getYearQuote, getYearTraits, setYearQuote, setYearTraits, getSession, getPartnerNotificationCount, getNotifications, markNotificationRead } from './store.js';

// Tab configurations per role. Order matters; first tab is the default.
const TABS_BY_ROLE = {
  // Captain decision 2026-05-12: Everyone tab removed entirely. No broadcast
  // surface between learners. Accountability is 1:1 via the Partner tab.
  learner: [
    { id: 'north-view', label: 'North' },
    { id: 'year-view', label: 'Compass' },
    { id: 'session-view', label: 'Session' },
    { id: 'partner-view', label: 'Partner' },
    { id: 'patterns-view', label: 'Patterns' },
    { id: 'passwords-view', label: 'Passwords' },
  ],
  // Captain decision 2026-05-11: parents only see session goals + end-of-session
  // recap. No year goals, no daily tasks, no passwords.
  parent: [
    { id: 'parent-view', label: 'My learner' },
  ],
  // Guides don't have learner-style accountability partners (different
  // accountability model). No Partner tab here.
  guide: [
    { id: 'guide-view', label: 'My learners' },
    { id: 'north-view', label: 'North' },
    { id: 'year-view', label: 'Compass' },
    { id: 'session-view', label: 'Session' },
    { id: 'patterns-view', label: 'Patterns' },
    { id: 'passwords-view', label: 'Passwords' },
  ],
};

document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  initModal();
  // Apply the landscape backdrop before bearing so the "travel" begins
  // the moment the app opens, not after sign-in.
  applyLandscape();
  startBearingAutoCycle();
  initBearing(afterBearing);
});

// Bearing-screen auto-cycle: every 4 seconds, advance to the next landscape
// so the captain (and any viewer waiting on Begin) sees the year's journey
// previewed as a slideshow. Stops once Begin is tapped and the app loads.
let bearingCycleTimer = null;
let bearingCycleSession = 1;
function startBearingAutoCycle() {
  stopBearingAutoCycle();
  bearingCycleSession = 1;
  bearingCycleTimer = setInterval(() => {
    const bearing = document.getElementById('bearing-screen');
    if (!bearing?.classList.contains('active')) {
      stopBearingAutoCycle();
      return;
    }
    bearingCycleSession = (bearingCycleSession % 7) + 1;
    applyLandscape(bearingCycleSession);
  }, 4000);
}
function stopBearingAutoCycle() {
  if (bearingCycleTimer) {
    clearInterval(bearingCycleTimer);
    bearingCycleTimer = null;
  }
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

async function afterBearing() {
  stopBearingAutoCycle();
  applyLandscape();
  // Wire sign-out unconditionally so the button works whether the user came
  // through sign-in (initAuth path) or landed via a persisted Supabase session.
  wireSignOut();
  const session = await requireSession();
  if (!session) {
    showSignIn();
    initAuth(onSignedIn);
  } else {
    await onSignedIn();
  }
}

async function onSignedIn() {
  const session = await requireSession();
  if (!session) return;

  // Welcome page FIRST - before the dashboard renders. The user sees the
  // welcome as the first page after sign-in until they complete their anchor
  // (quote + values + character strengths). Per captain 2026-06-15.
  console.log('[welcome] onSignedIn: checking shouldShowWelcome for role:', session.role);
  const showWelcome = shouldShowWelcome(session.role);
  console.log('[welcome] shouldShowWelcome returned:', showWelcome);
  if (showWelcome) {
    await showWelcomeScreen(session.role);
    console.log('[welcome] showWelcomeScreen Promise resolved');
  }

  showApp();

  startIdleTimeout(); // auto-logout after 30 min inactivity
  document.getElementById('who-label').textContent = `${session.name} · ${session.role}`;

  // First-run gate: learner role without setupCompletedAt sees ONLY the
  // setup view until they finish (age + studio + 5 goals + top 3).
  if (session.role === 'learner' && session.learnerId) {
    const { getLearner } = await import('./store.js');
    const learner = await getLearner(session.learnerId);
    if (learner && !learner.setupCompletedAt) {
      await showSetupView(session.learnerId);
      return;
    }
  }

  await buildTabs(session.role);
  wireRoleSwitcher();

  // Refresh the Partner tab badge whenever partnership or approval state changes.
  if (!document._hcPartnerListener) {
    document._hcPartnerListener = true;
    document.addEventListener('hc:partner-changed', async () => {
      await buildTabs(session.role);
    });
  }

  const learnerId = await resolveLearnerId(session);
  initSessionNav(learnerId);
  initLogins(learnerId);
  initStillness();
  wireBearingAgain();
  await updateBreadcrumb(learnerId);
  applyLandscape();

  setYearMapClickHandler((sessionNumber) => {
    setCurrentSession(sessionNumber);
    showTab('session-view', learnerId);
  });

  // First-run onboarding: learner OR guide has no quote and no traits yet.
  const ownIdentity = session.role === 'learner' ? learnerId
                    : session.role === 'guide' ? session.guideId
                    : null;
  if (ownIdentity && await needsOnboarding(ownIdentity)) {
    openOnboardingModal({
      role: session.role,
      onComplete: async ({ quote, traits }) => {
        if (quote) await setYearQuote(ownIdentity, quote);
        if (traits.length) await setYearTraits(ownIdentity, traits);
        await showTab(TABS_BY_ROLE[session.role][0].id, learnerId);
      },
    });
  }

  const defaultTab = TABS_BY_ROLE[session.role][0].id;
  await showTab(defaultTab, learnerId);
}

async function needsOnboarding(identityId) {
  const [quote, traits] = await Promise.all([
    getYearQuote(identityId),
    getYearTraits(identityId),
  ]);
  return !quote && (!traits || traits.length === 0);
}

async function resolveLearnerId(session) {
  // Learners + parents: use the linked-learner id from the session.
  if (session.learnerId) return session.learnerId;
  // Guides: when they navigate to Compass/Session/North, the protagonist is
  // the guide themselves (test-driving the summer prep journey, Captain
  // 2026-05-15). Their guide.id is treated like a learner.id throughout the
  // protagonist data flow.
  if (session.role === 'guide' && session.guideId) return session.guideId;
  // Skeleton-review fallback (default-role buttons).
  const learners = await getLearners();
  return learners[0]?.id || null;
}

async function showSetupView(learnerId) {
  // Hide tab nav + all other tab content; show only the setup view
  const nav = document.getElementById('tab-nav');
  if (nav) nav.innerHTML = '';
  document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
  document.getElementById('setup-view')?.classList.add('active');
  await renderSetupView(learnerId);
}

async function buildTabs(role) {
  const nav = document.getElementById('tab-nav');
  nav.innerHTML = '';
  const tabs = TABS_BY_ROLE[role] || TABS_BY_ROLE.learner;
  const session = await requireSession();
  const learnerId = await resolveLearnerId(session);

  // Compute notification count for the Partner tab (learners only).
  let partnerNotifCount = 0;
  if (role === 'learner' && learnerId) {
    partnerNotifCount = await getPartnerNotificationCount(learnerId);
  }

  tabs.forEach((t, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (i === 0 ? ' active' : '');
    btn.dataset.tab = t.id;
    btn.innerHTML = escapeHtml(t.label);
    if (t.id === 'partner-view' && partnerNotifCount > 0) {
      const dot = document.createElement('span');
      dot.className = 'tab-notif-dot';
      dot.title = `${partnerNotifCount} item${partnerNotifCount === 1 ? '' : 's'} waiting`;
      dot.textContent = String(partnerNotifCount);
      btn.appendChild(dot);
    }
    btn.addEventListener('click', async () => {
      const sess = await requireSession();
      const lid = await resolveLearnerId(sess);
      await showTab(t.id, lid);
    });
    nav.appendChild(btn);
  });
}

async function showTab(tabId, learnerId) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-content').forEach((c) => {
    c.classList.toggle('active', c.id === tabId);
  });

  if (tabId === 'north-view') { await renderNorth(learnerId); applyLandscape(); }
  if (tabId === 'year-view') await renderYearView(learnerId);
  if (tabId === 'session-view') {
    await renderSessionView(learnerId);
    import('./session-view.js').then(m => applyLandscape(m.getCurrentSession()));
  }
  if (tabId === 'patterns-view') await renderPatterns(learnerId);
  if (tabId === 'passwords-view') await renderLogins(learnerId);
  if (tabId === 'partner-view') await renderPartnerPage(learnerId);
  if (tabId === 'guide-view') await renderRoleView('guide', learnerId);
  if (tabId === 'parent-view') await renderRoleView('parent', learnerId);
}

async function renderRoleView(role, learnerId) {
  if (role === 'guide') {
    const session = await getSession();
    const quoteSection = document.getElementById('guide-quote-section');
    const quoteText = document.getElementById('guide-quote-text');
    if (session?.guideId && quoteSection && quoteText) {
      const q = await getYearQuote(session.guideId);
      if (q) {
        quoteText.textContent = `“${q}”`;
        quoteSection.style.display = 'block';
      } else {
        quoteSection.style.display = 'none';
      }
    }
    // Notifications surface for this guide (year-plan-approved, milestone-shared, etc.)
    const list = document.getElementById('guide-learners');
    if (session?.guideId) {
      const notifs = await getNotifications(session.guideId);
      const unread = notifs.filter((n) => !n.readAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      // Remove any previous banner from a prior render
      document.getElementById('guide-notif-banner')?.remove();
      if (unread.length > 0) {
        const banner = document.createElement('div');
        banner.id = 'guide-notif-banner';
        banner.className = 'guide-notif-banner';
        banner.innerHTML = `
          <p class="guide-notif-label">${unread.length} new ${unread.length === 1 ? 'update' : 'updates'}</p>
          ${unread.slice(0, 6).map((n) => `
            <div class="guide-notif-item" data-notif-id="${escapeHtml(n.id)}">
              <span class="guide-notif-title">${escapeHtml(n.title)}</span>
              <p class="guide-notif-body">${escapeHtml(n.body)}</p>
            </div>
          `).join('')}
          <p class="guide-notif-hint">Tap an item to mark it read.</p>
        `;
        list.parentNode.insertBefore(banner, list.parentNode.firstChild);
        banner.querySelectorAll('[data-notif-id]').forEach((el) => {
          el.addEventListener('click', async () => {
            await markNotificationRead(el.dataset.notifId);
            await renderRoleView('guide', learnerId);
          });
        });
      }
    }

    // Admin account-creation tool
    await renderAdminAccounts();
    initAdmin();

    const learners = await getLearners();
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
    import('./parent-view.js').then(m => m.renderParentView());
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

async function updateBreadcrumb(learnerId) {
  const el = document.getElementById('position-breadcrumb');
  if (!el) return;
  if (!learnerId) { el.textContent = ''; return; }
  const learners = await getLearners();
  const learner = learners.find((l) => l.id === learnerId);
  el.textContent = learner ? breadcrumbLabel(learner) : '';
}

async function wireRoleSwitcher() {
  const buttons = document.querySelectorAll('.role-switch-btn');
  const session = await requireSession();
  buttons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.switchRole === session?.role);
    if (btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', async () => {
      await switchRole(btn.dataset.switchRole, () => {
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
