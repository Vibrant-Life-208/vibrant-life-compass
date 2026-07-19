// Owner home (Jenna). One login that holds everything she needs, presented as a
// calm menu of three plainly-named cards - one quiet screen each, never a dense
// dashboard. Built for a non-technical owner: big labels, one choice at a time.

import { getSession, clearSession, getFamilyIdForProfile, getStudioPracticePulse } from './store.js';
import { renderFamilyView } from './family.js';
import { renderAnchorInsights } from './insights.js';
import { characteristicLabel } from './practice.js';

// The studios an owner may tend (v0.14 tribe enum), with plain labels.
const STUDIO_LABEL = { sparks: 'Sparks', discovery: 'Discovery', adventure: 'Adventure', launchpad: 'Launch Pad', tot: 'Tots' };
const ALL_STUDIOS = ['sparks', 'discovery', 'adventure', 'launchpad', 'tot'];

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
        <button type="button" class="owner-card" data-go="studio">
          <span class="owner-card-icon">&#127793;</span>
          <span class="owner-card-title">Tending the Studio</span>
          <span class="owner-card-sub">How your guides' practice is blooming</span>
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
  screen.querySelector('[data-go="studio"]').addEventListener('click', () => renderOwnerStudio(back, session));
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

// Tending the Studio — the culture bloom. Anonymized, suppressed counts of what
// guides are returning to this season. Never a name, never a verdict. An owner's
// OWN practice lives under My Compass -> Practice (Region A); this is Region B.
async function renderOwnerStudio(onBack, session) {
  const screen = document.getElementById('owner-context-screen');
  if (!screen) return;
  showOnly(screen);
  screen.innerHTML = `
    <div class="picker-container owner-context">
      <button type="button" class="owner-back" data-back="1">&#8592; Menu</button>
      <h1 class="picker-title">Tending the Studio</h1>
      <p class="picker-sub">Where your guides' practice is alive this season — by count, never by name.</p>
      <div id="studio-bloom-body"><p class="bloom-loading">Reading the season…</p></div>
      <p class="studio-own-note">Your own practice lives under <strong>My Compass &rarr; Practice</strong>.</p>
    </div>`;
  screen.querySelector('[data-back]').addEventListener('click', () => onBack());

  // Which studios to read: the owner's own tribes, else all (is_owner may view any).
  const tribes = (Array.isArray(session?.tribes) && session.tribes.length) ? session.tribes : ALL_STUDIOS;
  await renderStudioBlooms(tribes);
}

async function renderStudioBlooms(tribes) {
  const body = document.getElementById('studio-bloom-body');
  if (!body) return;

  const sections = [];
  for (const tribe of tribes) {
    let rows = [];
    try { rows = await getStudioPracticePulse(tribe); } catch { rows = []; }
    if (rows && rows.length) sections.push({ tribe, rows });
  }

  // Graceful degradation (Accord): below the suppression floor there is nothing to
  // show — and that is the wall holding, not a gap. One warm, singular message,
  // never a per-studio pile of "too small," never a verdict.
  if (!sections.length) {
    body.innerHTML = `
      <div class="bloom-gathering">
        <p>The bloom is still gathering.</p>
        <p>As guides opt in and reflect across a season, their practice shows here — anonymously, by count, never by name. A studio needs a few gardeners before it can stay anonymous. Nothing to tend yet is an early season, not a shortfall.</p>
      </div>`;
    return;
  }

  body.innerHTML = sections.map(({ tribe, rows }) => {
    const studio = STUDIO_LABEL[tribe] || tribe;
    const lines = rows.map((r) => {
      const n = r.guides;
      const verb = n === 1 ? 'guide has' : 'guides have';
      return `<li class="bloom-line">${n} ${verb} been returning to <em>${escapeHtml(characteristicLabel(r.characteristic))}</em>.</li>`;
    }).join('');
    return `
      <section class="studio-bloom">
        <h2 class="studio-bloom-name">${escapeHtml(studio)} — this season</h2>
        <ul class="bloom-list">${lines}</ul>
      </section>`;
  }).join('');
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
