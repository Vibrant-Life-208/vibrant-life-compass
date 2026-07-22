// Hero's Compass - entry point.
// Boot order: Bearing -> Sign-in -> first-run onboarding (if learner) -> role-based view.

import { initBearing } from './arrive.js';
import { initAuth, requireSession, showSignIn, showApp, switchRole, startIdleTimeout, wireSignOut, showChangePasswordScreen, reopenFamilyPicker } from './auth.js';
import { renderNorth, setYearMapClickHandler } from './north.js';
import { renderYearView } from './year-view.js';
import { renderSessionView, initSessionNav, setCurrentSession } from './session-view.js';
import { breadcrumbLabel, computeYearPosition } from './year-map.js';
import { initStillness } from './stillness.js';
import { getLandscapeForSession, getYearCalendar, getStudioName, pitchCutoff } from './studios.js';
import { renderPatterns } from './patterns.js';
import { renderPartnerPage } from './partner.js';
import { renderTribeView } from './tribe.js';
import { renderAdminAccounts, initAdmin } from './admin.js';
import { renderAnchorInsights } from './insights.js';
import { renderSetupView } from './setup.js';
import { renderCalendarView } from './calendar-view.js';
import { renderTaskList } from './task-list.js';
import { renderGoalBreakdown } from './goal-breakdown.js';
import { renderGrowthRecord } from './growth-record.js';
import { renderPractice } from './practice.js';
import { renderLogins, initLogins } from './logins.js';
import { initModal, openOnboardingModal, openQuoteFlow } from './modals.js';
import { shouldShowWelcome, showWelcomeScreen } from './welcome.js';
import { getLearners, getYearQuote, getQuoteState, getYearTraits, setYearTraits, getSession, getPartnerNotificationCount, getNotifications, markNotificationRead, hasCompletedOnboarding, getOnboardingState, saveLearner, addNotification } from './store.js';
import { isNewToTribe } from './tribe-roster.js';
import { isEnrolled } from './flags.js';

// --- Strangler-fig seam (Phase 0). Observatory (new UI) view registry — EMPTY for now.
// An environment renders the new UI only if it has an entry here AND the user is enrolled
// (see js/flags.js, ROLLOUT_PCT = 0). Empty registry => every tab falls through to the
// legacy chain in showTab() below. This is a pure no-op until views are registered. ---
const observatoryViews = {};

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
    { id: 'tribe-view', label: 'Tribe' },
    { id: 'school-view', label: 'School' },
    { id: 'north-view', label: 'North' },
    { id: 'year-view', label: 'Compass' },
    { id: 'session-view', label: 'Session' },
    { id: 'patterns-view', label: 'Patterns' },
    { id: 'practice-view', label: 'Practice' },
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
  // The whole session-check path is guarded: finish() (arrive.js) removes the
  // bearing screen BEFORE calling us, so any throw here (e.g. the Supabase
  // client failed to load, or the network is down) would otherwise leave EVERY
  // screen inactive - a blank white page with no way back. Instead, always land
  // the user on the sign-in screen with a readable message they can retry from.
  // Never a zero-active-screen state (fleet meeting 2026-07-09).
  try {
    // Cap the session check: a stalled network call (token refresh, logout, a
    // slow query) must never wedge the boot on the bare landscape with no
    // screen. On timeout we throw into the catch below and land on sign-in.
    const session = await Promise.race([
      requireSession(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('session check timed out')), 8000)),
    ]);
    if (!session) {
      showSignIn();
      initAuth(onSignedIn);
    } else if (session.needsPicker) {
      // Persisted family login with no member chosen yet -> re-show the picker.
      await reopenFamilyPicker(onSignedIn);
    } else {
      await onSignedIn();
    }
  } catch (err) {
    console.error('[boot] afterBearing failed; showing sign-in fallback:', err);
    showSignIn();
    const errEl = document.getElementById('signin-error');
    if (errEl) {
      errEl.textContent = "Couldn't reach the server. Check your connection and tap Sign in to try again.";
      errEl.style.display = '';
    }
    initAuth(onSignedIn);
  }
}

// When the owner picks "My Compass", we re-enter onSignedIn but skip the owner
// menu so the normal app loads. The Menu button resets this.
let ownerWantsCompass = false;

async function onSignedIn() {
  const session = await requireSession();
  if (!session) return;

  // Forced password change after a temp password (bulk-created / reset accounts).
  // Must happen before anything else loads.
  if (session.must_change_password) {
    await showChangePasswordScreen();
  }

  // Owner (Jenna + Wes): one login, a calm three-card menu (Whole School / My
  // Family / My Compass). Checked BEFORE the parent branch so an owner-parent
  // lands on the owner home, not the plain family view. "My Compass" hands control
  // back here to the normal app. Built clean for non-technical owners.
  if (session.is_owner && !ownerWantsCompass) {
    const { renderOwnerHome } = await import('./owner.js');
    await renderOwnerHome({ onCompass: () => { ownerWantsCompass = true; onSignedIn(); } });
    return;
  }

  // Family parent (non-owner): their home is the calm family view + shared updates
  // - never the learner goal app (anti-helicoptering, captain 2026-06-28). Handles
  // both a fresh pick and a reload.
  if (session.familyId && session.role === 'parent') {
    const { renderFamilyView } = await import('./family.js');
    await renderFamilyView(session.familyId, { onBack: () => reopenFamilyPicker(onSignedIn) });
    await maybePromptParentQuote(session); // skippable, on top of the family view
    return;
  }

  // The signed-in person's own profile id. On reload getSession sets session.id;
  // on a FRESH sign-in only the role-specific id is populated (guideId/parentId/
  // learnerId) and session.id is undefined. Resolve across both so the welcome +
  // quote/onboarding gates run for guides and parents too - not just on reload.
  // (Bug: keying the gate off session.id alone skipped it entirely for guides,
  // dropping them straight to the dashboard with no quote/onboarding.)
  const ownIdentity = session.id
    || (session.role === 'guide' ? session.guideId
      : session.role === 'parent' ? session.parentId
      : session.learnerId);

  // Welcome page FIRST - before the dashboard renders. The user sees the
  // welcome as the first page after sign-in until they complete their anchor
  // (quote + values + character strengths). Per captain 2026-06-15.
  // Welcome gating reads from Supabase (Decision 3 of 2026-06-16 meeting).
  // session.id is profile.id (set by getSession) and works for guide, learner,
  // and parent persisted sessions; session.guideId/parentId/learnerId are only
  // populated by the fresh-sign-in auth path and are undefined on reload.
  const gateProfileId = ownIdentity;
  console.log('[welcome] onSignedIn: checking shouldShowWelcome for role:', session.role);
  const showWelcome = await shouldShowWelcome(session.role, gateProfileId);
  console.log('[welcome] shouldShowWelcome returned:', showWelcome);
  if (showWelcome) {
    await showWelcomeScreen(session.role);
    console.log('[welcome] showWelcomeScreen Promise resolved');
  }

  showApp();

  startIdleTimeout(); // auto-logout after 30 min inactivity
  document.getElementById('who-label').textContent = session.familyName
    ? `${session.name} · ${session.familyName}`
    : `${session.name} · ${session.role}`;

  // Family sessions get a "Switch member" control that reopens the picker
  // without re-authenticating. Idempotent wiring.
  const switchBtn = document.getElementById('switch-member-btn');
  if (switchBtn) {
    if (session.familyId) {
      switchBtn.hidden = false;
      if (!switchBtn.dataset.wired) {
        switchBtn.dataset.wired = '1';
        switchBtn.addEventListener('click', () => reopenFamilyPicker(onSignedIn));
      }
    } else {
      switchBtn.hidden = true;
    }
  }

  // Owner in "My Compass" mode gets a Menu button back to her three-card home.
  const ownerMenuBtn = document.getElementById('owner-menu-btn');
  if (ownerMenuBtn) {
    if (session.is_owner) {
      ownerMenuBtn.hidden = false;
      if (!ownerMenuBtn.dataset.wired) {
        ownerMenuBtn.dataset.wired = '1';
        ownerMenuBtn.addEventListener('click', async () => {
          ownerWantsCompass = false;
          const { renderOwnerHome } = await import('./owner.js');
          renderOwnerHome({ onCompass: () => { ownerWantsCompass = true; onSignedIn(); } });
        });
      }
    } else {
      ownerMenuBtn.hidden = true;
    }
  }

  // Family learners get a "Share with my family" control. Learner-initiated only;
  // the session is read fresh on click so the control follows the active member.
  const shareBtn = document.getElementById('share-family-btn');
  if (shareBtn) {
    if (session.familyId && session.role === 'learner') {
      shareBtn.hidden = false;
      if (!shareBtn.dataset.wired) {
        shareBtn.dataset.wired = '1';
        shareBtn.addEventListener('click', async () => {
          const s = await requireSession();
          if (!s?.familyId) return;
          const { openShareModal } = await import('./family.js');
          openShareModal({ familyId: s.familyId, learnerId: s.activeProfileId || s.learnerId });
        });
      }
    } else {
      shareBtn.hidden = true;
    }
  }

  // First-run gate: learner role without setupCompletedAt sees ONLY the setup
  // view until they finish (studio + 5 goals + top 3). BUT only once the
  // onboarding cascade is done - otherwise this early return skips the cascade
  // (strengths -> values -> wheel -> 10yr -> 5yr -> pitch -> slice-plan) entirely
  // for every fresh learner. Onboarding runs first, then Setup. (Bug fix
  // 2026-07-14: the two first-run gates were racing and Setup won.)
  // Full learner-style goal-setting path (captain 2026-07-16): learners route to Setup
  // by learnerId; guides + owners route by their OWN profile id (their guide-summer
  // learner row), so they set year goals the same way learners do. Parents stay light
  // (no Setup). If a guide/owner has no learner row / studio yet, getLearner is null
  // and we simply don't route - no breakage.
  const goalSettingProfileId = session.role === 'learner' ? session.learnerId
    : (session.role === 'guide' || session.is_owner) ? ownIdentity
    : null;
  if (goalSettingProfileId) {
    const { getLearner } = await import('./store.js');
    const learner = await getLearner(goalSettingProfileId);
    const onboardingDone = await hasCompletedOnboarding(ownIdentity);
    if (onboardingDone && learner && learner.studio && !learner.setupCompletedAt) {
      await showSetupView(goalSettingProfileId);
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
  // Defensive: a backend hiccup in the breadcrumb fetch must never abort the
  // rest of sign-in (the onboarding/quote gate + the initial tab render that
  // wires the dashboard). Previously a thrown getLearners() here killed all of
  // it, leaving "nothing works but sign out".
  try {
    await updateBreadcrumb(learnerId);
  } catch (e) {
    console.error('[onSignedIn] updateBreadcrumb failed (non-fatal):', e);
  }
  applyLandscape();

  setYearMapClickHandler((sessionNumber) => {
    setCurrentSession(sessionNumber);
    showTab('session-view', learnerId);
  });

  // First-run cascade per the 2026-06-22 fleet meeting. Gating reads from
  // Supabase via hasCompletedOnboarding (true once the person has walked the
  // cascade once - Decisions 1+2, walk-the-pages-once, not answer-every-field).
  // The modal saves every step atomically and resumes on the saved step, so a
  // pause - including the external VIA/Values round-trip - loses nothing.
  // session.id is the profile id, always set on persisted sessions.
  // First-run gate (captain 2026-07-15): the quote anchor + onboarding cascade are
  // walked BEFORE a learner can reach the main face. The modals are non-dismissable
  // (js/modals.js setModalGated), and while a gate is pending we do NOT render a tab
  // behind it - the gate's onComplete renders the right surface once it is walked.
  // Parents are excluded from this hard gate: their quote is offered as a
  // skippable mini-North prompt (below / maybePromptParentQuote), never a wall.
  let gatingPending = false;
  if (ownIdentity && session.role !== 'parent') {
    const currentCycle = getYearCalendar().yearStartISO;
    const quote = await getQuoteState(ownIdentity);
    // The quote is the front-of-line anchor: missing, or stamped for a past cycle.
    const needsQuote = !quote.text || quote.cycle !== currentCycle;
    // The cascade (strengths/values/horizons) is gated separately.
    // ANNUAL VISION REFRESH (captain 2026-07-20, SSC working session): the cascade is no
    // longer one-time. Each new year-cycle (Session 1) re-opens it - values + the 10/5/1
    // telescope + the mirror + goals - prefilled with last year's answers to edit or keep.
    // Character strengths are NOT re-walked (stable year to year); refresh mode drops them
    // (see openOnboardingModal). Staleness = onboarding completed in a PRIOR cycle: the
    // existing onboarding_completed_at timestamp is before this cycle's yearStartISO. No
    // schema change. Applies to learners + guides + owners (all reach this cascade); parents
    // are excluded by the role gate above. A learner mid-draft THIS cycle (completedAt within
    // the cycle) is untouched - the refresh only fires once the calendar rolls to a new year.
    const onbState = await getOnboardingState(ownIdentity);
    const completedThisCycle = Boolean(onbState.completedAt)
      && String(onbState.completedAt).slice(0, 10) >= currentCycle;
    const annualRefresh = Boolean(onbState.completedAt) && !completedThisCycle;
    const needsCascade = !completedThisCycle;
    gatingPending = needsQuote || needsCascade;

    // Studio drives developmental gating of the long-horizon steps (captain
    // 2026-07-14, superseding Decision 5): only Sparks is screen-free; Discovery
    // and up get the full telescope. Guides/parents have no studio -> full.
    let onbStudio = null;
    if (needsCascade && goalSettingProfileId) {
      const { getLearner } = await import('./store.js');
      const l = await getLearner(goalSettingProfileId);
      onbStudio = l?.studio || null;
    }

    // After the gate: a learner who still owes Setup (studio + 5 year goals) lands
    // on the Setup grid - the goal-setting surface - never straight on a tab. This
    // makes "no main face until goals are set" airtight in the first session too,
    // not just on the next login. Everyone else lands on their default tab.
    const finishGate = async () => {
      if (goalSettingProfileId) {
        const { getLearner } = await import('./store.js');
        const l = await getLearner(goalSettingProfileId);
        if (l && l.studio && !l.setupCompletedAt) { await showSetupView(goalSettingProfileId); return; }
      }
      await showTab(TABS_BY_ROLE[session.role][0].id, learnerId);
    };

    const runCascade = () => {
      if (!needsCascade) {
        // No cascade owed. If the quote was the only gate, render now; otherwise
        // the bottom-of-function showTab handles the no-gate case.
        if (needsQuote) finishGate();
        return;
      }
      openOnboardingModal({
        profileId: ownIdentity,
        role: session.role,
        studio: onbStudio,
        learnerId, // the slice-plan step saves year goals against this learner
        annualRefresh, // new year-cycle re-walk (drops strengths; prefills last year's answers)
        onComplete: finishGate,
      });
    };

    // Quote first (its own reliable flow that Begin always leads into), then the
    // cascade if still needed. Quote saved + cycle-stamped inside openQuoteFlow.
    if (needsQuote) {
      openQuoteFlow({
        profileId: ownIdentity,
        currentCycle,
        existing: quote,
        onComplete: runCascade,
      });
    } else {
      runCascade();
    }
  }

  // Render the main face here only when no first-run gate is pending; otherwise the
  // gate's onComplete (finishGate) renders Setup or the default tab once walked.
  if (!gatingPending) {
    const defaultTab = TABS_BY_ROLE[session.role][0].id;
    await showTab(defaultTab, learnerId);
  }

  // Non-family parents: offer the skippable quote on top of their rendered tab.
  // (Family parents are handled in their own branch above.)
  if (session.role === 'parent' && !session.familyId) {
    await maybePromptParentQuote(session);
  }
}

// Parents: a personal year-quote anchor, offered (never forced) and re-offered
// each new cycle. Opened on top of the parent's already-rendered home, so a skip
// simply lands them back on it. The quote then lives in the mini North
// (parent-anchor.js). (Captain 2026-07-19.)
async function maybePromptParentQuote(session) {
  const parentId = session.id || session.parentId;
  if (!parentId) return;
  const currentCycle = getYearCalendar().yearStartISO;
  const quote = await getQuoteState(parentId);
  if (quote.text && quote.cycle === currentCycle) return; // already set this cycle
  openQuoteFlow({
    profileId: parentId,
    currentCycle,
    existing: quote,
    gated: false, // skippable for parents
    onComplete: () => {
      const host = document.getElementById('parent-anchor-host');
      if (host) import('./parent-anchor.js').then((m) => m.renderParentAnchor(host, parentId));
    },
  });
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
  const tabs = [...(TABS_BY_ROLE[role] || TABS_BY_ROLE.learner)];
  const session = await requireSession();
  const learnerId = await resolveLearnerId(session);

  // Plan (task list) + Calendar are viewable by EVERY learner (captain 2026-07-21): a
  // learner needs to see their whole plan - including future-dated work that hasn't reached
  // the daily view yet (e.g. a summer plan that lights on Aug 17). Guides + owners also get
  // the Calendar (a year-at-a-glance of their own). Parents stay on their own surface.
  // Breakdown (the dense per-goal read-through) stays a Launch Pad learner tool. Injected
  // dynamically so the gate lives in one place; inserted right after the Compass, in order.
  const isLearner = role === 'learner' && !!learnerId;
  const isStaff = role === 'guide' || !!session.is_owner;
  let matureLearner = false;
  if (isLearner) {
    const { getLearner } = await import('./store.js');
    const l = await getLearner(learnerId);
    matureLearner = l?.studio === 'launchpad';
  }
  const inject = [];
  if (isLearner) inject.push({ id: 'tasklist-view', label: 'Plan' });
  if (isLearner && matureLearner) inject.push({ id: 'breakdown-view', label: 'Breakdown' });
  if (isLearner || isStaff) inject.push({ id: 'calendar-view', label: 'Calendar' });
  // Growth Record - preview/scaffold. Shown only to staff (the "grown-ups who review a
  // record") while it is being built; not surfaced to learners yet. (Captain 2026-07-21.)
  if (isStaff) inject.push({ id: 'record-view', label: 'Record' });
  const yearAt = tabs.findIndex((t) => t.id === 'year-view');
  let insertAt = yearAt >= 0 ? yearAt + 1 : tabs.length;
  for (const t of inject) {
    if (tabs.some((x) => x.id === t.id)) continue;
    tabs.splice(insertAt, 0, t);
    insertAt += 1;
  }

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

  // Strangler-fig seam: an observatory view renders only if registered AND the user is enrolled;
  // otherwise fall through to the legacy chain below. observatoryViews is empty => always legacy.
  if (observatoryViews[tabId]) {
    try {
      const session = await getSession();
      if (isEnrolled(session)) { await observatoryViews[tabId](learnerId, session); return; }
    } catch (e) { console.warn('observatory seam -> legacy fallback:', e); }
  }

  if (tabId === 'north-view') { await renderNorth(learnerId); applyLandscape(); }
  if (tabId === 'year-view') await renderYearView(learnerId);
  if (tabId === 'session-view') {
    await renderSessionView(learnerId);
    import('./session-view.js').then(m => applyLandscape(m.getCurrentSession()));
  }
  if (tabId === 'patterns-view') await renderPatterns(learnerId);
  if (tabId === 'practice-view') await renderPractice();
  if (tabId === 'school-view') { try { await renderAnchorInsights(); } catch (e) { console.warn('anchor insights:', e); } }
  if (tabId === 'passwords-view') await renderLogins(learnerId);
  if (tabId === 'partner-view') await renderPartnerPage(learnerId);
  if (tabId === 'guide-view') await renderRoleView('guide', learnerId);
  if (tabId === 'tribe-view') { try { await renderTribeView(); } catch (e) { console.warn('tribe view:', e); } }
  if (tabId === 'parent-view') await renderRoleView('parent', learnerId);
  if (tabId === 'calendar-view') await renderCalendarView(learnerId);
  if (tabId === 'tasklist-view') { try { await renderTaskList(learnerId); } catch (e) { console.warn('task list:', e); } }
  if (tabId === 'breakdown-view') { try { await renderGoalBreakdown(learnerId); } catch (e) { console.warn('breakdown:', e); } }
  if (tabId === 'record-view') { try { await renderGrowthRecord(learnerId); } catch (e) { console.warn('growth record:', e); } }
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

    // Flat staff power (captain 2026-06-30): owner and guides hold the SAME
    // abilities so no one is a bottleneck (esp. since the owner isn't the most
    // technical). Every staff member gets the account tools. The owner label only
    // means broader insight scope (all tribes), not exclusive keys.
    const adminSection = document.getElementById('admin-accounts-section');
    if (adminSection) adminSection.hidden = false;
    await renderAdminAccounts();
    initAdmin();

    // Anchor insights now live on their own "School" tab (school-view dispatch),
    // not buried at the bottom of My Learners.

    // Parents & Tots recognition arc - REFERENCE only, content-only, no per-parent
    // state (Polaris ruling 2026-07-08). Shown to Tots guides + owners only.
    try {
      const s = await requireSession();
      const showPt = !!(s?.is_owner || (Array.isArray(s?.tribes) && s.tribes.includes('tot')));
      const { renderParentBadgesReference } = await import('./parent-badges.js');
      renderParentBadgesReference(showPt);
    } catch (e) { console.warn('pt reference:', e); }

    const learners = await getLearners();
    if (!learners.length) {
      list.innerHTML = '<p class="learners-empty">No learners assigned yet.</p>';
      return;
    }
    list.innerHTML = '';
    learners.forEach((l) => {
      const card = document.createElement('div');
      card.className = 'category-card';
      const studioNm = getStudioName(l.studio) || l.studio;
      card.innerHTML = `
        <div class="category-header">
          <span class="category-name">${escapeHtml(l.name)}</span>
          <span class="category-kind">${escapeHtml(l.studio)}</span>
        </div>
        <p class="category-goal">Open their compass to see year + session goals.</p>
        <label class="learner-newtribe">
          <input type="checkbox" data-newtribe="${escapeHtml(l.id)}" ${isNewToTribe(l) ? 'checked' : ''}>
          New to ${escapeHtml(studioNm)} this year
        </label>
        <p class="learner-newtribe-hint">New learners get the hand-holding path - a guided first task and more scaffolding that fades as they settle in.</p>
      `;
      list.appendChild(card);
    });

    // New-to-tribe toggle (captain 2026-07-21): the guide marks who is new to their tribe this
    // year -> the hand-holding path. The guide-set field replaces the hard-coded roster seed.
    list.querySelectorAll('[data-newtribe]').forEach((cb) => {
      cb.addEventListener('change', () => {
        saveLearner({ id: cb.dataset.newtribe, newToTribe: cb.checked });
      });
    });

    // Pending pitch approvals: learners who opted into a pitch and need the guide
    // to confirm the age gate (captain 2026-07-10 - a "yes, they'll be old enough,"
    // not a birthday check). Approve/deny writes the status + notifies the learner.
    // Guarded so a backend hiccup can't break the rest of the guide dashboard.
    try { await renderPitchApprovals(learners, session, () => renderRoleView('guide', learnerId)); }
    catch (e) { console.warn('pitch approvals:', e); }
    // Year-plan sign-off: learners who finished setup submit their plan to their guide.
    try { await renderGuideYearPlanApprovals(learners, session, () => renderRoleView('guide', learnerId)); }
    catch (e) { console.warn('yearplan approvals:', e); }
  }
  if (role === 'parent') {
    import('./parent-view.js').then(m => m.renderParentView());
  }
}

// Year-plan sign-off surface for the guide (captain 2026-07-21). A learner submits their
// plan to their guide at the end of setup (not to a peer partner); the guide reads it here
// and signs off, or sends it back with a note. Guide id = session.guideId; owners (flat
// staff power) fall back to session.id so the reviewer is always recorded.
async function renderGuideYearPlanApprovals(learners, session, onChange) {
  const section = document.getElementById('guide-yearplan-approvals');
  const list = document.getElementById('guide-yearplan-list');
  if (!section || !list) return;
  const reviewerId = session?.guideId || session?.id || null;
  const { getPendingYearPlansForGuide, getGoals, approveYearPlan, returnYearPlan } = await import('./store.js');
  const pending = await getPendingYearPlansForGuide(reviewerId);
  if (!pending.length) { section.hidden = true; list.innerHTML = ''; return; }
  section.hidden = false;
  list.innerHTML = '';
  for (const plan of pending) {
    const learner = (learners || []).find((l) => l.id === plan.learnerId);
    const goals = (await getGoals(plan.learnerId)).filter((g) => g.scope === 'year' && g.text && g.text.trim());
    const priorityIds = Array.isArray(learner?.priorityGoalIds) ? learner.priorityGoalIds : [];
    const card = document.createElement('div');
    card.className = 'yearplan-approval-card';
    card.innerHTML = `
      <p class="yearplan-approval-who"><strong>${escapeHtml(learner?.name || 'A learner')}</strong> finished setup - ${goals.length} year goal${goals.length === 1 ? '' : 's'}.</p>
      <ul class="yearplan-approval-goals">
        ${goals.map((g) => `<li>${priorityIds.includes(g.id) ? '★ ' : ''}${escapeHtml(g.text)}${g.halfwayPoint ? ` <span class="yearplan-approval-mile">Session-3 goal: ${escapeHtml(g.halfwayPoint)}</span>` : ''}</li>`).join('')}
      </ul>
      <div class="yearplan-approval-actions">
        <button type="button" class="btn btn-text" data-yp-return="${escapeHtml(plan.id)}">Send back</button>
        <button type="button" class="btn btn-primary" data-yp-approve="${escapeHtml(plan.id)}">Sign off ✓</button>
      </div>`;
    list.appendChild(card);
  }
  list.querySelectorAll('[data-yp-approve]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await approveYearPlan(btn.dataset.ypApprove, reviewerId, '');
      if (onChange) await onChange();
    });
  });
  list.querySelectorAll('[data-yp-return]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const note = prompt('What would you like the learner to reconsider? (optional)') || '';
      await returnYearPlan(btn.dataset.ypReturn, reviewerId, note);
      if (onChange) await onChange();
    });
  });
}

// Pending pitch approvals surface for the guide (captain 2026-07-10 age-gate loop).
// A learner opts into a pitch (pitchAgeStatus='pending'); the guide confirms the age
// gate here. Approve/deny writes the status + reviewer + timestamp and notifies the
// learner. No birthdate is stored - only the guide's yes/no on the self-report.
async function renderPitchApprovals(learners, session, onChange) {
  const section = document.getElementById('guide-pitch-approvals');
  const list = document.getElementById('guide-pitch-list');
  if (!section || !list) return;
  const pending = (learners || []).filter((l) => l.pitchAgeStatus === 'pending' && l.pitchTargetStudio);
  if (!pending.length) { section.hidden = true; list.innerHTML = ''; return; }
  section.hidden = false;
  list.innerHTML = '';
  pending.forEach((l) => {
    const cut = pitchCutoff(l.pitchTargetStudio) || { entryAge: '', cutoffLabel: 'next year' };
    const card = document.createElement('div');
    card.className = 'pitch-approval-card';
    card.innerHTML = `
      <div class="pitch-approval-body">
        <p class="pitch-approval-who"><strong>${escapeHtml(l.name)}</strong> wants to move up to <strong>${escapeHtml(getStudioName(l.pitchTargetStudio))}</strong>.</p>
        <p class="pitch-approval-gate">They said yes to: turned <strong>${escapeHtml(String(cut.entryAge))}</strong> by <strong>${escapeHtml(cut.cutoffLabel)}</strong>. Your call - a "yes, they'll be old enough," not a birthday check.</p>
      </div>
      <div class="pitch-approval-actions">
        <button type="button" class="btn btn-primary" data-pitch-approve="${escapeHtml(l.id)}">Approve</button>
        <button type="button" class="btn btn-text" data-pitch-deny="${escapeHtml(l.id)}">Not yet</button>
      </div>`;
    list.appendChild(card);
  });
  list.querySelectorAll('[data-pitch-approve]').forEach((btn) => {
    btn.addEventListener('click', () => decidePitch(btn.dataset.pitchApprove, 'approved', learners, session, onChange));
  });
  list.querySelectorAll('[data-pitch-deny]').forEach((btn) => {
    btn.addEventListener('click', () => decidePitch(btn.dataset.pitchDeny, 'denied', learners, session, onChange));
  });
}

async function decidePitch(learnerId, decision, learners, session, onChange) {
  const learner = (learners || []).find((l) => l.id === learnerId);
  if (!learner) return;
  // Guides have guideId; owners use the same view (flat staff power) and fall back to
  // their session id, so the reviewer is always recorded.
  const reviewerId = session?.guideId || session?.id || null;
  await saveLearner({
    id: learnerId,
    pitchAgeStatus: decision,
    pitchAgeReviewedBy: reviewerId,
    pitchAgeReviewedAt: new Date().toISOString(),
  });
  const target = getStudioName(learner.pitchTargetStudio);
  if (decision === 'approved') {
    await addNotification({
      recipientId: learnerId,
      type: 'pitch-approved',
      title: 'Your move up is confirmed',
      body: `Your guide confirmed you're set to move up to ${target}. Keep working your thresholds!`,
      fromId: reviewerId,
    });
  } else {
    await addNotification({
      recipientId: learnerId,
      type: 'pitch-denied',
      title: 'About moving up',
      body: `Your guide feels this isn't the year to move up to ${target} - and that's okay. Let's make this year count where you are.`,
      fromId: reviewerId,
    });
  }
  if (onChange) await onChange();
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
