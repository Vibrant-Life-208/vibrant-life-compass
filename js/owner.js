// Owner home (Jenna). One login that holds everything she needs, presented as a
// calm menu of three plainly-named cards - one quiet screen each, never a dense
// dashboard. Built for a non-technical owner: big labels, one choice at a time.

import { getSession, clearSession, getFamilyIdForProfile } from './store.js';
import { renderFamilyView } from './family.js';
import { renderAnchorInsights } from './insights.js';

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function showOnly(screen) {
  document.querySelectorAll('.screen').forEach((s) => {
    if (s !== screen) { s.classList.remove('active'); s.style.display = ''; }
  });
  screen.classList.add('active');
  screen.style.display = 'flex';
}

const ownIdOf = (s) => s?.id || s?.guideId || s?.activeProfileId || null;

// The clean three-card menu. onCompass hands control back to the normal app for
// her own Compass (the only context that lives in the tabbed app).
export async function renderOwnerHome({ onCompass } = {}) {
  const screen = document.getElementById('owner-home-screen');
  if (!screen) return;
  showOnly(screen);
  const session = await getSession();
  const first = (session?.name || 'there').split(/\s+/)[0];

  screen.innerHTML = `
    <div class="picker-container owner-home">
      <h1 class="picker-title">Welcome, ${escapeHtml(first)}</h1>
      <p class="picker-sub">What would you like to do?</p>
      <div class="owner-cards">
        <button type="button" class="owner-card" data-go="school">
          <span class="owner-card-icon">&#127979;</span>
          <span class="owner-card-title">Whole School</span>
          <span class="owner-card-sub">Values &amp; strengths, every tribe</span>
        </button>
        <button type="button" class="owner-card" data-go="family">
          <span class="owner-card-icon">&#128106;</span>
          <span class="owner-card-title">My Family</span>
          <span class="owner-card-sub">Your family's values, strengths &amp; updates</span>
        </button>
        <button type="button" class="owner-card" data-go="compass">
          <span class="owner-card-icon">&#129517;</span>
          <span class="owner-card-title">My Compass</span>
          <span class="owner-card-sub">Your own goals</span>
        </button>
      </div>
      <button type="button" class="picker-signout" data-signout="1">Sign out</button>
    </div>`;

  const back = () => renderOwnerHome({ onCompass });
  screen.querySelector('[data-go="school"]').addEventListener('click', () => renderOwnerSchool(back));
  screen.querySelector('[data-go="family"]').addEventListener('click', async () => {
    const famId = await getFamilyIdForProfile(ownIdOf(session));
    if (!famId) { renderOwnerNote('No family is linked to your account yet.', back); return; }
    renderFamilyView(famId, { onBack: back });
  });
  screen.querySelector('[data-go="compass"]').addEventListener('click', () => onCompass && onCompass());
  screen.querySelector('[data-signout]').addEventListener('click', async () => { await clearSession(); location.reload(); });
}

// Whole-school view on its own clean screen, with a clear way back to the menu.
async function renderOwnerSchool(onBack) {
  const screen = document.getElementById('owner-context-screen');
  if (!screen) return;
  showOnly(screen);
  screen.innerHTML = `
    <div class="picker-container owner-context">
      <button type="button" class="owner-back" data-back="1">&#8592; Menu</button>
      <h1 class="picker-title">Whole School</h1>
      <div id="owner-insights-section"><div id="owner-insights-body"></div></div>
    </div>`;
  screen.querySelector('[data-back]').addEventListener('click', () => onBack());
  await renderAnchorInsights('owner-insights-section', 'owner-insights-body');
}

function renderOwnerNote(msg, onBack) {
  const screen = document.getElementById('owner-context-screen');
  if (!screen) return;
  showOnly(screen);
  screen.innerHTML = `
    <div class="picker-container owner-context">
      <button type="button" class="owner-back" data-back="1">&#8592; Menu</button>
      <p class="picker-sub">${escapeHtml(msg)}</p>
    </div>`;
  screen.querySelector('[data-back]').addEventListener('click', () => onBack());
}
