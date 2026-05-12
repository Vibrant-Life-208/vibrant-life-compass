// Sign-in placeholder. Real Supabase auth (local username + password, no
// Google OAuth) wires in next session per captain decision 2026-05-12.
// Skeleton accepts any email + any password; password is never compared.

import { getSession, setSession, clearSession, saveLearner, getLearners, saveGuide, getGuides } from './store.js';

const ROLES = ['learner', 'parent', 'guide'];

export function initAuth(onSignedIn) {
  const roleButtons = document.querySelectorAll('.role-btn');
  roleButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const role = btn.dataset.role;
      if (!ROLES.includes(role)) return;

      const emailEl = document.getElementById('signin-email');
      const raw = emailEl?.value?.trim() || '';
      if (raw && emailEl && typeof emailEl.checkValidity === 'function' && !emailEl.checkValidity()) {
        emailEl.reportValidity();
        return;
      }
      const email = raw || `${role}@vibrantlife.local`;

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
