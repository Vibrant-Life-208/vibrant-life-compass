// Guide first-run onboarding (dark: gated by isGuideOnboarding() / ?guideonb=on).
//
// Two things a guide meets once, before the dashboard:
//   1. Orientation - names the STAFF-POWER boundary (a guide's tools touch real
//      children's records) and the MENTOR/MENTEE dual identity (you guide learners
//      here; you also walk the path yourself). Cura #1 + Accord's dual-identity
//      threshold, from the 2026-08-23 guide-account review.
//   2. MFA enrollment - the guide enrols a TOTP second factor so they can later reach
//      AAL2 to reset a learner's password (Phase 2 O3; council chose native MFA,
//      2026-08-28). Recovery is owner-mediated in-person re-enrol, never self-service
//      (Tutela) - that is policy, surfaced here as copy, not a self-reset button.
//
// PROVISIONAL COPY - Accord + Hoshi finalize before the flag lifts for a real guide.
// MFA is Supabase-only; on the local backend the enrollment step is skipped.

import { BACKEND_TYPE } from './backend/config.js';
import { enrollTotpFactor, verifyTotpFactor, hasVerifiedTotpFactor } from './store.js';

const ORIENTATION_SEEN_KEY = 'compass-guide-orientation-seen';

function activateScreen(screen) {
  document.querySelectorAll('.screen').forEach((s) => {
    if (s !== screen) { s.classList.remove('active'); s.style.display = ''; }
  });
  screen.classList.add('active');
  screen.style.display = 'flex';
}

// Orientation: one screen, one Continue. Not a gauntlet (Accord - a competent adult
// does not need a walkthrough; they need the boundary named once).
function renderOrientation(screen) {
  return new Promise((resolve) => {
    screen.innerHTML = `
      <div class="signin-container guide-onb">
        <h1 class="signin-title">Before you begin</h1>
        <p class="signin-sub">A guide account carries more than your own path.</p>
        <div class="guide-onb-block">
          <h2 class="guide-onb-h">Your tools touch real children's records.</h2>
          <p>You can create accounts, help a learner back in when they are locked out, and see what a studio is holding. That access is trust, not convenience - it is only ever help a learner asked for, never a quiet look inside their space.</p>
        </div>
        <div class="guide-onb-block">
          <h2 class="guide-onb-h">You mentor here - and you walk the path yourself.</h2>
          <p>Your learners' work is yours to tend. Your own North, Compass, and Practice are yours to walk. Both live in this one place; the tabs tell you which is which.</p>
        </div>
        <div class="welcome-actions">
          <button type="button" id="guide-onb-continue" class="btn btn-primary">Continue</button>
        </div>
      </div>`;
    document.getElementById('guide-onb-continue')?.addEventListener('click', () => {
      try { localStorage.setItem(ORIENTATION_SEEN_KEY, new Date().toISOString()); } catch { /* ignore */ }
      resolve();
    }, { once: true });
  });
}

// MFA enrollment: enrol a TOTP factor, show the QR + secret, verify a code. Verifying
// activates the factor AND elevates this session to AAL2. Supabase-only.
function renderMfaEnroll(screen) {
  return new Promise((resolve) => {
    const shell = (inner) => {
      screen.innerHTML = `
        <div class="signin-container guide-onb">
          <h1 class="signin-title">Set up your second factor</h1>
          <p class="signin-sub">A one-time code from your phone, required only when you reset a learner's password. It keeps a walk-up device from becoming a reset console.</p>
          ${inner}
        </div>`;
    };

    const showError = (m) => {
      const el = document.getElementById('guide-mfa-error');
      if (el) { el.textContent = m; el.style.display = 'block'; }
    };

    (async () => {
      let factor;
      try {
        factor = await enrollTotpFactor();
      } catch (e) {
        // Enrollment failed (e.g. a stale factor, or MFA disabled on the project).
        shell(`
          <p id="guide-mfa-error" class="signin-error" style="display:block">Could not start enrollment. Ask the owner to help you set this up.</p>
          <div class="welcome-actions"><button type="button" id="guide-mfa-skip" class="btn btn-text">Skip for now</button></div>`);
        document.getElementById('guide-mfa-skip')?.addEventListener('click', () => resolve(), { once: true });
        return;
      }

      const qr = factor?.qrSvg || '';
      const qrHtml = qr.startsWith('data:')
        ? `<img alt="Scan this QR code in your authenticator app" class="mfa-qr" src="${qr}">`
        : qr; // raw <svg> markup

      shell(`
        <ol class="guide-mfa-steps">
          <li>Open your authenticator app (Google Authenticator, Authy, 1Password).</li>
          <li>Scan this code, or enter the key by hand.</li>
        </ol>
        <div class="mfa-qr-wrap">${qrHtml}</div>
        <p class="mfa-secret">Key: <code>${(factor?.secret || '').replace(/(.{4})/g, '$1 ').trim()}</code></p>
        <div class="form-field">
          <label for="guide-mfa-code">Enter the 6-digit code</label>
          <input type="text" id="guide-mfa-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456">
        </div>
        <p id="guide-mfa-error" class="signin-error" style="display:none"></p>
        <button type="button" id="guide-mfa-verify" class="btn btn-primary">Verify &amp; finish</button>`);

      const verifyBtn = document.getElementById('guide-mfa-verify');
      verifyBtn?.addEventListener('click', async () => {
        const code = (document.getElementById('guide-mfa-code')?.value || '').trim();
        if (!/^\d{6}$/.test(code)) return showError('Enter the 6-digit code from your app.');
        verifyBtn.disabled = true;
        try {
          const ok = await verifyTotpFactor(factor.factorId, code);
          if (!ok) throw new Error('verify_failed');
          resolve();
        } catch (e) {
          verifyBtn.disabled = false;
          showError('That code did not match. It changes every 30 seconds - try the newest one.');
        }
      });
    })();
  });
}

// Run guide onboarding. Resolves when done (or when there is nothing to do). Safe to
// call every guide sign-in: orientation shows once (localStorage), MFA is skipped when
// the guide already has a verified factor.
export async function showGuideOnboarding() {
  const screen = document.getElementById('guide-onboarding-screen');
  if (!screen) return;

  let orientationSeen = false;
  try { orientationSeen = Boolean(localStorage.getItem(ORIENTATION_SEEN_KEY)); } catch { /* ignore */ }

  // MFA only exists on Supabase; skip the factor step on the local backend.
  let needsMfa = false;
  if (BACKEND_TYPE === 'supabase') {
    try { needsMfa = !(await hasVerifiedTotpFactor()); } catch { needsMfa = false; }
  }

  if (orientationSeen && !needsMfa) return; // nothing owed

  activateScreen(screen);
  if (!orientationSeen) await renderOrientation(screen);
  if (needsMfa) await renderMfaEnroll(screen);

  screen.classList.remove('active');
  screen.style.display = '';
  screen.innerHTML = '';
}
