// Sign-in placeholder. Real Supabase auth (local username + password, no
// Google OAuth) wires in next session per captain decision 2026-05-12.
// Skeleton accepts any email + any password; password is never compared.

import { getSession, setSession, clearSession, saveLearner, getLearners, saveGuide, getGuides, findAccountByHeroName, signInWithHeroName, getParentLearnerLinks, updatePassword, getFamily } from './store.js';
import { verifyPassword } from './crypto.js';
import { BACKEND_TYPE } from './backend/config.js';
import { renderMemberPicker, renderFamilyView, enterAsMember } from './family.js';

const ROLES = ['learner', 'parent', 'guide'];
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes - studio iPads are shared

export function initAuth(onSignedIn) {
  // Skeleton-only sign-in shortcuts (L/P/G default-role buttons) are hidden
  // in production. Real Supabase deploys must use real hero-name + password.
  const isProd = BACKEND_TYPE === 'supabase';
  document.querySelectorAll('.skeleton-only').forEach((el) => {
    el.hidden = isProd;
  });
  document.querySelectorAll('.production-only').forEach((el) => {
    el.hidden = !isProd;
  });

  // Hero-name + password sign-in.
  const submitBtn = document.getElementById('signin-submit');
  if (submitBtn && !submitBtn.dataset.wired) {
    submitBtn.dataset.wired = '1';
    submitBtn.addEventListener('click', async () => {
      const heroNameEl = document.getElementById('signin-hero');
      const passwordEl = document.getElementById('signin-password');
      const heroName = heroNameEl?.value?.trim().toLowerCase() || '';
      const password = passwordEl?.value || '';
      if (!heroName) {
        showSigninError('Enter your hero name.');
        return;
      }
      // Backend-aware sign-in. Local backend verifies a PBKDF2 hash from
      // the account record. Supabase backend calls auth.signInWithPassword
      // which checks server-side bcrypt. Either way, returns the account
      // on success or null on failure.
      const account = await signInWithHeroName(heroName, password);
      if (!account) {
        showSigninError('Hero name and password don\'t match. Ask a guide to reset if you forgot.');
        return;
      }
      const errorEl = document.getElementById('signin-error');
      if (errorEl) errorEl.style.display = 'none';
      // Family login -> show the member picker; a single person -> straight in.
      if (account.role === 'family') {
        const family = await getFamily(account.familyId);
        if (family) { showFamilyPicker(family, onSignedIn); return; }
        showSigninError('Could not load your family. Please try again.');
        return;
      }
      await signInWithAccount(account);
      onSignedIn();
    });
  }

  // Optional password reveal toggle.
  const passwordToggle = document.getElementById('signin-password-toggle');
  const passwordInput = document.getElementById('signin-password');
  if (passwordToggle && passwordInput && !passwordToggle.dataset.wired) {
    passwordToggle.dataset.wired = '1';
    passwordToggle.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      passwordToggle.textContent = isHidden ? 'Hide' : 'Show';
      passwordToggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
  }

  wireSignOut();
}

// Wire sign-out separately so it works whether the user came through sign-in
// OR landed on the app via a persisted Supabase session (where initAuth is
// skipped). Idempotent via dataset.wired guard.
export function wireSignOut() {
  const signOutBtn = document.getElementById('signout-btn');
  if (signOutBtn && !signOutBtn.dataset.wired) {
    signOutBtn.dataset.wired = '1';
    signOutBtn.addEventListener('click', async () => {
      await clearSession();
      location.reload();
    });
  }
}

// Forced password change on first sign-in (must_change_password). Shows the
// change-password screen and resolves only once the user sets a new password.
export function showChangePasswordScreen() {
  return new Promise((resolve) => {
    const screen = document.getElementById('change-password-screen');
    if (!screen) { resolve(); return; }
    document.querySelectorAll('.screen').forEach((s) => {
      if (s !== screen) { s.classList.remove('active'); s.style.display = ''; }
    });
    screen.classList.add('active');
    screen.style.display = 'flex';

    const pw = document.getElementById('cp-password');
    const confirm = document.getElementById('cp-confirm');
    const err = document.getElementById('cp-error');
    const btn = document.getElementById('cp-submit');
    if (pw) pw.value = '';
    if (confirm) confirm.value = '';
    // Replace the button to clear any prior listeners (one-shot wiring).
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);

    fresh.addEventListener('click', async () => {
      const a = pw.value || '';
      const b = confirm.value || '';
      const fail = (m) => { err.textContent = m; err.style.display = 'block'; };
      if (a.length < 8) return fail('Use at least 8 characters.');
      if (a !== b) return fail('The two passwords don\'t match.');
      fresh.disabled = true;
      try {
        await updatePassword(a);
      } catch (e) {
        fresh.disabled = false;
        return fail('Could not set your password. Please try again.');
      }
      screen.classList.remove('active');
      screen.style.display = '';
      resolve();
    });
  });
}

function showSigninError(msg) {
  const el = document.getElementById('signin-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

// Family flow: show the "Who's exploring?" picker, then enter the app as the
// chosen member, open the reflection-only family view, or sign out.
export function showFamilyPicker(family, onSignedIn) {
  renderMemberPicker(family, {
    onPick: async (member) => {
      await enterAsMember(family, member);
      showApp();
      onSignedIn();
    },
    onFamily: () => {
      renderFamilyView(family.id, { onBack: () => showFamilyPicker(family, onSignedIn) });
    },
    onSignOut: async () => { await clearSession(); location.reload(); },
  });
}

// Re-open the picker for an already-signed-in family session (the in-app
// "Switch member" control), without re-authenticating.
export async function reopenFamilyPicker(onSignedIn) {
  const session = await getSession();
  if (!session?.familyId) return;
  const family = await getFamily(session.familyId);
  if (family) showFamilyPicker(family, onSignedIn);
}

async function signInWithAccount(account) {
  const session = {
    role: account.role,
    name: account.name || account.heroName,
    heroName: account.heroName,
    email: account.email || `${account.heroName}@vibrantlife.local`,
    signedInAt: new Date().toISOString(),
  };
  if (account.role === 'learner') session.learnerId = account.id;
  if (account.role === 'guide') session.guideId = account.id;
  if (account.role === 'parent') {
    session.parentId = account.id;
    // Find the linked learner so parent view can show the right child
    const links = await getParentLearnerLinks();
    const link = links.find((l) => l.parentId === account.id);
    if (link) session.learnerId = link.learnerId;
  }
  await setSession(session);
}

async function signInAs(role, email) {
  const name = nameFromEmail(email, role);
  const session = {
    role,
    name,
    email,
    signedInAt: new Date().toISOString(),
  };

  if (role === 'learner') {
    let learners = await getLearners();
    let learner = learners.find((l) => l.email === email);
    if (!learner) {
      learners = await saveLearner({
        name,
        email,
        studio: 'adventure',
        guideEmail: '',
        parentEmail: '',
        setupCompletedAt: null, // gates first-run setup view
        priorityGoalIds: [],
      });
      learner = learners[learners.length - 1];
    }
    session.learnerId = learner.id;
  }

  if (role === 'guide') {
    let guides = await getGuides();
    let guide = guides.find((g) => g.email === email);
    if (!guide) {
      guides = await saveGuide({ name, email });
      guide = guides[guides.length - 1];
    }
    session.guideId = guide.id;
  }

  await setSession(session);
}

function nameFromEmail(email, role) {
  if (!email) return capitalize(role);
  const local = email.split('@')[0];
  if (!local) return capitalize(role);
  return local
    .replace(/\d+/g, '')
    .split(/[._-]+/)
    .filter(Boolean)
    .map(capitalize)
    .join(' ') || capitalize(role);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export async function requireSession() {
  return await getSession();
}

export function showSignIn() {
  document.getElementById('signin-screen')?.classList.add('active');
  document.getElementById('app-screen')?.classList.remove('active');
}

export function showApp() {
  document.getElementById('signin-screen')?.classList.remove('active');
  document.getElementById('app-screen')?.classList.add('active');
}

export async function switchRole(newRole, onSwitched) {
  if (!ROLES.includes(newRole)) return;
  const current = await getSession();
  if (!current) return;
  const email = current.email || `${newRole}@vibrantlife.local`;
  await signInAs(newRole, email);
  if (onSwitched) onSwitched();
}

// Idle-timeout: auto-logout after 30 minutes of no user activity.
// Studio iPads are shared; this prevents a learner from staying signed in
// after they walk away.
let idleTimer = null;
let idleListenersWired = false;

export function startIdleTimeout() {
  if (!idleListenersWired) {
    idleListenersWired = true;
    ['click', 'keydown', 'touchstart', 'pointermove'].forEach((ev) => {
      document.addEventListener(ev, resetIdleTimer, { passive: true });
    });
  }
  resetIdleTimer();
}

export function stopIdleTimeout() {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    await clearSession();
    alert('Signed out for inactivity. Sign in again to continue.');
    location.reload();
  }, IDLE_TIMEOUT_MS);
}
