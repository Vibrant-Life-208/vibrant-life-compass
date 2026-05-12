// Sign-in placeholder. Real Supabase auth (local username + password, no
// Google OAuth) wires in next session per captain decision 2026-05-12.
// Skeleton accepts any email + any password; password is never compared.

import { getSession, setSession, clearSession, saveLearner, getLearners, saveGuide, getGuides, findAccountByHeroName, getParentLearnerLinks } from './store.js';
import { verifyPassword } from './crypto.js';

const ROLES = ['learner', 'parent', 'guide'];
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes - studio iPads are shared

export function initAuth(onSignedIn) {
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
      const account = await findAccountByHeroName(heroName);
      if (!account) {
        showSigninError(`No account found for "${heroName}". A guide can create one for you.`);
        return;
      }
      // Verify password. If account has no passwordHash yet, accept any
      // non-empty password (covers skeleton accounts created before this
      // hardening pass; admin tool can set a real password via Reset).
      if (account.passwordHash && account.passwordSalt) {
        const ok = await verifyPassword(password, {
          salt: account.passwordSalt,
          hash: account.passwordHash,
        });
        if (!ok) {
          showSigninError('Hero name and password don\'t match. Ask a guide to reset if you forgot.');
          return;
        }
      } else if (!password) {
        showSigninError('Enter your password. (Ask a guide if you don\'t have one set yet.)');
        return;
      }
      const errorEl = document.getElementById('signin-error');
      if (errorEl) errorEl.style.display = 'none';
      await signInWithAccount(account);
      onSignedIn();
    });
  }

  // Default-account role buttons (skeleton review only).
  const roleButtons = document.querySelectorAll('.role-btn');
  roleButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const role = btn.dataset.role;
      if (!ROLES.includes(role)) return;
      const email = `${role}@vibrantlife.local`;
      await signInAs(role, email);
      onSignedIn();
    });
  });

  const signOutBtn = document.getElementById('signout-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await clearSession();
      location.reload();
    });
  }
}

function showSigninError(msg) {
  const el = document.getElementById('signin-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
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
