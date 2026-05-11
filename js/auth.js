// Sign-in placeholder. Google OAuth wires in next session.
// Skeleton accepts any email + any password; password is never stored or compared.
// Role is chosen explicitly via the three buttons.

import { getSession, setSession, clearSession, saveLearner, getLearners, saveGuide, getGuides } from './store.js';

const ROLES = ['learner', 'parent', 'guide'];

export function initAuth(onSignedIn) {
  const roleButtons = document.querySelectorAll('.role-btn');
  roleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      if (!ROLES.includes(role)) return;

      const emailEl = document.getElementById('signin-email');
      const raw = emailEl?.value?.trim() || '';
      // Email is optional in skeleton mode - default to a role-keyed address.
      // Only validate if the user actually typed something.
      if (raw && emailEl && typeof emailEl.checkValidity === 'function' && !emailEl.checkValidity()) {
        emailEl.reportValidity();
        return;
      }
      const email = raw || `${role}@vibrantlife.local`;

      signInAs(role, email);
      onSignedIn();
    });
  });

  const signOutBtn = document.getElementById('signout-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      clearSession();
      location.reload();
    });
  }
}

function signInAs(role, email) {
  const name = nameFromEmail(email, role);
  const session = {
    role,
    name,
    email,
    signedInAt: new Date().toISOString(),
  };

  if (role === 'learner') {
    let learners = getLearners();
    let learner = learners.find((l) => l.email === email);
    if (!learner) {
      learners = saveLearner({
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
    let guides = getGuides();
    let guide = guides.find((g) => g.email === email);
    if (!guide) {
      guides = saveGuide({ name, email });
      guide = guides[guides.length - 1];
    }
    session.guideId = guide.id;
  }

  setSession(session);
}

function nameFromEmail(email, role) {
  if (!email) return capitalize(role);
  const local = email.split('@')[0];
  if (!local) return capitalize(role);
  // "erin.stanley358" -> "Erin Stanley"
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

export function requireSession() {
  return getSession();
}

export function showSignIn() {
  document.getElementById('signin-screen')?.classList.add('active');
  document.getElementById('app-screen')?.classList.remove('active');
}

export function showApp() {
  document.getElementById('signin-screen')?.classList.remove('active');
  document.getElementById('app-screen')?.classList.add('active');
}

// Skeleton-only: flip the active role without signing out, so the captain
// can preview learner / parent / guide views in one session. Reuses the
// signed-in email; creates the appropriate profile record (learner/guide)
// on demand.
export function switchRole(newRole, onSwitched) {
  if (!ROLES.includes(newRole)) return;
  const current = getSession();
  if (!current) return;
  const email = current.email || `${newRole}@vibrantlife.local`;
  signInAs(newRole, email);
  if (onSwitched) onSwitched();
}
