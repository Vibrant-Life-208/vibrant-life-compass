// Owner home (Jenna). One login that holds everything she needs, presented as a
// calm menu of three plainly-named cards - one quiet screen each, never a dense
// dashboard. Built for a non-technical owner: big labels, one choice at a time.

import { getSession, clearSession, getFamilyIdForProfile, getStudioPracticePulse } from './store.js';
import { safePosterSrc } from './poster.js';
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

// Does a submitted contact string look like personal info to strip before posting? (Blocker #2.)
// Flags the "Talk to" line in the review queue for the reviewer - never auto-edits.
function looksLikePII(v) {
  const s = String(v || '');
  if (/[\w.+-]+@[\w-]+\.\w{2,}/.test(s)) return true;                          // email
  if ((s.match(/\d/g) || []).length >= 7) return true;                         // phone-ish (7+ digits)
  if (/\b\d{1,6}\s+\w+.*\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|ct|court|way|cir|circle|pl|place)\b/i.test(s)) return true; // address
  return false;
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
        <button type="button" class="owner-card" data-go="community">
          <span class="owner-card-icon">&#128204;</span>
          <span class="owner-card-title">Community Board</span>
          <span class="owner-card-sub">Approve ideas; see what's on the board</span>
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
  screen.querySelector('[data-go="community"]').addEventListener('click', () => renderOwnerCommunity(back));
  screen.querySelector('[data-go="family"]').addEventListener('click', async () => {
    const famId = await getFamilyIdForProfile(ownIdOf(session));
    if (!famId) { renderOwnerNote('No family is linked to your account yet.', back); return; }
    renderFamilyView(famId, { onBack: back });
  });
  screen.querySelector('[data-go="compass"]').addEventListener('click', () => onCompass && onCompass());
  screen.querySelector('[data-signout]').addEventListener('click', async () => { await clearSession(); location.reload(); });
}

// Community Board — the owner's final gate (v0.37). Ideas a guide passed up sit in
// 'pending_owner'; the owner posts one to the board (-> posted). The board below is
// what every learner sees. RLS lets an owner see + act on all posts.
async function renderOwnerCommunity(onBack) {
  const screen = document.getElementById('owner-context-screen');
  if (!screen) return;
  showOnly(screen);
  const { getCommunityReviewQueue, getPostedBoard, reviewCommunityPost, getCommunityPostReports } = await import('./store.js');
  const [pending, board, reports] = await Promise.all([
    getCommunityReviewQueue('pending_owner').catch(() => []),
    getPostedBoard().catch(() => []),
    getCommunityPostReports().catch(() => []),
  ]);
  // Group reports by post so a posted note carries a "someone flagged this" prompt for the owner
  // (blocker #3). Reports never auto-remove - they only draw the eye; the owner decides.
  const reportsByPost = new Map();
  for (const r of reports) {
    if (!reportsByPost.has(r.postId)) reportsByPost.set(r.postId, []);
    if (r.reason) reportsByPost.get(r.postId).push(r.reason);
    else reportsByPost.get(r.postId).push('');
  }
  screen.innerHTML = `
    <div class="picker-container owner-context">
      <button type="button" class="owner-back" data-back="1">&#8592; Menu</button>
      <h1 class="picker-title">Community Board</h1>
      <p class="picker-sub">Ideas your guides have passed up. Post one to the board, and see what's live.</p>
      <div class="owner-community">
        <h3 class="guide-section-title">Waiting on you</h3>
        ${pending.length ? `<p class="community-review-guidance">Before you post: read the <strong>Talk to</strong> line and the text for a phone number, home address, email, or another child's full name - remove those first. Contact should route through a guide, not a child's personal details.</p>` : ''}
        ${pending.length ? pending.map((p) => {
          const poster = safePosterSrc(p.posterImage);
          const contactFlag = looksLikePII(p.contact) ? ' community-review-flag' : '';
          const detail = [
            p.category ? `<p class="community-review-meta"><span class="community-review-k">Kind</span> ${escapeHtml(p.category)}</p>` : '',
            p.whenWhere ? `<p class="community-review-meta"><span class="community-review-k">When / where</span> ${escapeHtml(p.whenWhere)}</p>` : '',
            p.contact ? `<p class="community-review-meta${contactFlag}"><span class="community-review-k">Talk to</span> ${escapeHtml(p.contact)}${contactFlag ? ' <span class="community-review-flag-tag">check &amp; remove personal info</span>' : ''}</p>` : '',
          ].join('');
          return `
          <div class="community-review-card">
            ${p.title ? `<p class="community-review-title"><strong>${escapeHtml(p.title)}</strong></p>` : ''}
            ${poster ? `<img class="community-review-poster" src="${poster}" alt="Poster for review">` : ''}
            <p class="community-review-body">${escapeHtml(p.body)}</p>
            ${detail}
            <div class="community-review-actions"><button type="button" class="btn btn-primary" data-post="${escapeHtml(p.id)}">Post it &#10003;</button></div>
          </div>`;
        }).join('') : '<p class="pillar-empty">Nothing waiting - all clear.</p>'}
        <h3 class="guide-section-title">On the board</h3>
        ${board.length ? board.slice().sort((a, b) => (reportsByPost.has(b.id) ? 1 : 0) - (reportsByPost.has(a.id) ? 1 : 0)).map((b) => {
          const flags = reportsByPost.get(b.id) || null;
          const reasons = flags ? flags.filter(Boolean) : [];
          return `
          <div class="community-review-card${flags ? ' community-review-reported' : ''}">
            ${flags ? `<p class="community-review-reportflag"><span class="community-review-flag-tag">someone flagged this (${flags.length})</span>${reasons.length ? ` <span class="community-review-reasons">${reasons.map((r) => escapeHtml(r)).join(' · ')}</span>` : ''}</p>` : ''}
            ${b.title ? `<p class="community-review-title"><strong>${escapeHtml(b.title)}</strong></p>` : ''}
            <p class="community-review-body">${escapeHtml(b.body)}</p>
            <div class="community-review-actions"><button type="button" class="btn btn-text" data-takedown="${escapeHtml(b.id)}">Take down</button></div>
          </div>`;
        }).join('') : '<p class="pillar-empty">Nothing posted yet.</p>'}
      </div>
    </div>`;
  screen.querySelector('[data-back]').addEventListener('click', () => onBack());
  screen.querySelectorAll('[data-post]').forEach((btn) => btn.addEventListener('click', async () => {
    await reviewCommunityPost(btn.dataset.post, { status: 'posted', stage: 'owner' });
    await renderOwnerCommunity(onBack);
  }));
  // Take a posted note back down (Salus condition). Sets 'removed' so it leaves the board.
  screen.querySelectorAll('[data-takedown]').forEach((btn) => btn.addEventListener('click', async () => {
    await reviewCommunityPost(btn.dataset.takedown, { status: 'removed', stage: 'owner' });
    await renderOwnerCommunity(onBack);
  }));
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
