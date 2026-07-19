// Guide "Your Practice" — the private reflection surface (Compass port of the
// browser-verified vibrant-life-guides prototype). Ratified design, 2026-07-18.
//
// NOT a badge system. No scores, tiers, ranks, bars, leaderboards — ever. The
// vocation's success is invisible ("you win when no one knows you were there"),
// so this witnesses the PRACTICE, never measures the SUCCESS. Governing law:
// characteristic #10, process over results.
//
// Privacy: crossings are guide-private (RLS self-only), and story/moment are
// encrypted at rest inside the store adapter (TCC 2026-07-18 — moment can hold a
// child's name). This module only ever holds plaintext transiently in the DOM.

import {
  getCrossings, addCrossing, deleteCrossing,
  getSharePracticePulse, setSharePracticePulse,
} from './store.js';

// The twelve Key Characteristics grouped into the five constellations, each a
// *doing* (visible method) welded to a *being* (the attribute underneath). Plus
// the thirteenth as the center star (the one flow the twelve omit: child→guide).
const FAMILIES = [
  {
    id: 'socratic', name: 'Internalize the Socratic Mindset & Heartset',
    stars: [
      { id: 'c2', title: 'Instill confident decision-making', doing: 'by never answering a question', being: 'the composure to hold the silence you just created', prompt: 'Where did you hold the silence this week — and where did you rush to fill it?' },
      { id: 'c11', title: 'Promote deep thinking & mindful independent morality', doing: 'through intriguing questions & challenges', being: 'faith in their moral reasoning', prompt: 'What question did you pose that opened someone’s thinking, instead of closing it with your answer?' },
    ],
  },
  {
    id: 'empower', name: 'Empower Learners',
    stars: [
      { id: 'c1', title: 'Affirm the inherent genius of each child', doing: 'through genuine awe & wonder', being: 'reverence — seeing the child as already-genius', prompt: 'Whose genius did you genuinely marvel at this week?' },
      { id: 'c12', title: 'Highlight heroic character', doing: 'through praise of effort & hard work', being: 'seeing character, not performance', prompt: 'Where did you praise the effort rather than the result?' },
      { id: 'c9', title: 'Encourage intentional growth', doing: 'through reflection, feedback & failure', being: 'safety with failure', prompt: 'Where did you let a failure stand as a teacher instead of rescuing it away?' },
    ],
  },
  {
    id: 'design-end', name: 'Design with the End in Mind',
    stars: [
      { id: 'c3', title: 'Inspire the discovery of precious gifts', doing: 'through meaningful learning design', being: 'belief the gift is already in there', prompt: 'What did you design this week that invited discovery rather than delivered content?' },
      { id: 'c10', title: 'Cultivate independent excellence', doing: 'through process & practice (over results)', being: 'patience; detachment from the scoreboard', prompt: 'Where did you honor the process over the result — including your own?' },
    ],
  },
  {
    id: 'model-shrink', name: 'Model the Way & Become Smaller',
    stars: [
      { id: 'c4', title: 'Invest in Givers & demonstrate servant leadership', doing: 'through the Model, Hand-off, Shrink method', being: 'servant-heart; the willingness to become smaller', prompt: 'Where did you hand off and shrink? Where did you stay larger than you needed to be?' },
      { id: 'c6', title: 'Nurture curiosity & refinement', doing: 'through compelling Hero’s Journey launches & excellent examples', being: 'the storyteller’s fire — lit for them, not for you', prompt: 'Did your launch leave the fire with them, or with you?' },
      { id: 'c8', title: 'Honor freedom earned', doing: 'through SOLID proof of responsibility', being: 'fairness — freedom is real, so proof is real', prompt: 'Where did you honor a freedom that was genuinely earned?' },
    ],
  },
  {
    id: 'culture', name: 'Build Culture',
    stars: [
      { id: 'c5', title: 'Grow positive culture', doing: 'through contracts, experiments, rituals & triads', being: 'trust in the culture over control', prompt: 'Where did you let the culture hold something instead of stepping in to control it?' },
      { id: 'c7', title: 'Foster respect, gratitude & stewardship', doing: 'through the Diamond Guardrails', being: 'respect, gratitude, stewardship', prompt: 'Where did a guardrail teach stewardship rather than mere compliance?' },
    ],
  },
];

const CENTER_STAR = {
  id: 'c13', title: 'Let the studio change you',
  doing: 'through your own reflection, feedback & failure (Arc & Look Back)',
  being: 'teachability',
  prompt: 'How did a child change you this week?',
};

const DAY = 24 * 60 * 60 * 1000;
const PRESENT_KEY = 'hc_practice_present';   // client-only UI state; never synced

let view = 'sky';     // 'sky' or a star id
let wired = false;

function allStars() { return [...FAMILIES.flatMap((f) => f.stars), CENTER_STAR]; }
function findStar(id) { return allStars().find((s) => s.id === id) || null; }

// The human title for a characteristic id ('c1'..'c13'). Used by the owner
// culture-bloom to name what guides are returning to — counts only, no names.
export function characteristicLabel(id) {
  const s = findStar(id);
  return s ? s.title : id;
}

function isPresent() {
  try { return localStorage.getItem(PRESENT_KEY) === '1'; } catch { return false; }
}
function setPresent(on) {
  try { on ? localStorage.setItem(PRESENT_KEY, '1') : localStorage.removeItem(PRESENT_KEY); } catch { /* ignore */ }
}

function marksFor(crossings, starId) {
  return crossings
    .filter((c) => c.characteristic === starId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

// Glyph state = fidelity of return, never an attainment score.
function glyphState(crossings, starId) {
  const marks = marksFor(crossings, starId);
  if (marks.length === 0) return 'dormant';
  const now = Date.now();
  const newest = new Date(marks[0].created_at).getTime();
  const oldest = new Date(marks[marks.length - 1].created_at).getTime();
  if (marks.length >= 3 && (newest - oldest) / DAY >= 30) return 'living';
  if ((now - newest) / DAY <= 90) return 'tended';
  return 'dormant';
}

const STATE_LABEL = {
  dormant: 'You haven’t sat with this lately.',
  tended: 'You’ve reflected here this season.',
  living: 'You keep returning to this. It’s alive in your practice.',
};

// ==================== RENDER ====================

export async function renderPractice() {
  ensureWired();
  const root = document.getElementById('practice-view');
  if (!root) return;
  const present = isPresent();
  root.classList.toggle('present', present);
  const crossings = await getCrossings();
  if (view === 'sky') {
    const share = await getSharePracticePulse();
    root.innerHTML = renderSky(crossings, present, share);
  } else {
    root.innerHTML = renderStation(view, crossings, present);
  }
}

function renderSky(crossings, present, share) {
  const greeting = present
    ? `<p class="practice-greeting">You’re in a hard season. The practice will keep. Rest here.</p>`
    : `<p class="practice-greeting">Welcome back. No score here — just your practice, and where it’s been alive.</p>`;

  const toggle = `<button class="present-toggle ${present ? 'on' : ''}" data-action="toggle-present">${present ? 'Leave present-mode' : 'I’m in a hard season'}</button>`;

  // Accord's opt-in, exact copy. Never coercive; not-sharing is not failure.
  const shareRow = present ? '' : `
    <label class="pulse-optin">
      <input type="checkbox" data-action="toggle-pulse" ${share ? 'checked' : ''}>
      <span>Contribute an anonymized signal to your studio’s bloom — <em>never your words, never your name.</em></span>
    </label>`;

  const constellations = FAMILIES.map((fam) => `
    <section class="constellation">
      <h3 class="constellation-name">${esc(fam.name)}</h3>
      <div class="star-row">${fam.stars.map((s) => glyph(s, glyphState(crossings, s.id), false)).join('')}</div>
    </section>`).join('');

  return `
    <div class="practice-header"><h2>Your Practice</h2>${toggle}</div>
    ${greeting}
    ${shareRow}
    <div class="center-star">${glyph(CENTER_STAR, glyphState(crossings, CENTER_STAR.id), true)}</div>
    ${constellations}`;
}

function glyph(star, state, isCenter) {
  return `
    <button class="glyph-tile ${isCenter ? 'center' : ''}" data-action="open-star" data-star="${star.id}">
      <span class="glyph ${state}" aria-hidden="true"></span>
      <span class="glyph-title">${esc(star.title)}</span>
    </button>`;
}

function renderStation(starId, crossings, present) {
  const star = findStar(starId);
  if (!star) { view = 'sky'; return renderSky(crossings, present, false); }
  const state = glyphState(crossings, star.id);
  const marks = marksFor(crossings, star.id);

  const history = marks.length === 0
    ? `<p class="station-empty">Nothing marked here yet. When you’re ready, there’s no rush.</p>`
    : `<ul class="crossing-list">${marks.map((m) => `
        <li class="crossing">
          <div class="crossing-date">${formatDate(m.created_at)}</div>
          <div class="crossing-story">${esc(m.story)}</div>
          <button class="crossing-remove" data-action="remove-crossing" data-id="${esc(m.id)}">Remove</button>
        </li>`).join('')}</ul>`;

  const composer = present
    ? `<p class="station-rest">The practice will keep. Rest here.</p>`
    : `
      <div class="practice-mirror">
        <p class="mirror-label">Sit with it:</p>
        <p class="mirror-prompt">${esc(star.prompt)}</p>
      </div>
      <button class="btn-primary mark-btn" data-action="begin-crossing" data-star="${star.id}">✎ Mark a crossing</button>`;

  return `
    <button class="practice-back" data-action="back-to-sky">← back to your sky</button>
    <div class="station-head">
      <span class="glyph ${state} large" aria-hidden="true"></span>
      <div>
        <h2 class="station-title">${esc(star.title)}</h2>
        <p class="station-doing"><span>the doing:</span> ${esc(star.doing)}</p>
        <p class="station-being"><span>the being:</span> ${esc(star.being)}</p>
      </div>
    </div>
    <p class="station-state">${STATE_LABEL[state]}</p>
    ${composer}
    <h3 class="history-label">Your practice here:</h3>
    ${history}`;
}

// ==================== CROSSING FLOW ====================

function beginCrossing(starId) {
  const star = findStar(starId);
  if (!star) return;
  const overlay = document.getElementById('crossing-overlay');
  overlay.innerHTML = `
    <div class="crossing-sheet">
      <button class="crossing-cancel" data-action="cancel-crossing" aria-label="Close">&times;</button>
      <h2 class="crossing-heading">${esc(star.title)}</h2>
      <label class="crossing-field-label" for="crossing-story">What did you practice — and when did it happen?</label>
      <textarea id="crossing-story" class="crossing-input" placeholder="Tell the story…"></textarea>
      <label class="crossing-field-label" for="crossing-moment">A child or moment you want to remember with this? <span class="private-note">(private to you)</span></label>
      <input id="crossing-moment" class="crossing-moment" type="text" placeholder="Optional">
      <button class="btn-primary" data-action="review-crossing" data-star="${star.id}">Mark a crossing</button>
    </div>`;
  overlay.classList.add('active');
}

// The pause — the guide chooses the moment.
function reviewCrossing(starId) {
  const storyEl = document.getElementById('crossing-story');
  const story = storyEl.value.trim();
  if (!story) { storyEl.focus(); return; }
  const overlay = document.getElementById('crossing-overlay');
  overlay.dataset.star = starId;
  overlay.dataset.story = story;
  overlay.dataset.moment = document.getElementById('crossing-moment').value.trim();
  overlay.innerHTML = `
    <div class="crossing-sheet pause">
      <p class="pause-line">This is yours. No one else will ever see it.</p>
      <p class="pause-sub">Ready to mark it?</p>
      <div class="pause-actions">
        <button class="btn-quiet" data-action="cancel-crossing">Not yet</button>
        <button class="btn-primary" data-action="confirm-crossing">Mark it</button>
      </div>
    </div>`;
}

async function confirmCrossing() {
  const overlay = document.getElementById('crossing-overlay');
  const { star, story, moment } = overlay.dataset;
  if (!star || !story) { closeCrossing(); return; }
  await addCrossing({ characteristic: star, story, moment: moment || '' });
  playWitnessTone();
  closeCrossing();
  view = star;
  await renderPractice();
}

function closeCrossing() {
  const overlay = document.getElementById('crossing-overlay');
  overlay.classList.remove('active');
  overlay.innerHTML = '';
  delete overlay.dataset.star; delete overlay.dataset.story; delete overlay.dataset.moment;
}

async function removeCrossing(id) {
  await deleteCrossing(id);
  await renderPractice();
}

// ==================== WITNESS TONE ====================

let audioCtx = null;
function playWitnessTone() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 174;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + 1.8);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 1.9);
  } catch (_) { /* silence is an acceptable default */ }
}

// ==================== EVENTS (wired once) ====================

function ensureWired() {
  if (wired) return;
  const root = document.getElementById('practice-view');
  const overlay = document.getElementById('crossing-overlay');
  if (!root || !overlay) return;
  wired = true;

  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'toggle-present') { setPresent(!isPresent()); await renderPractice(); }
    else if (action === 'toggle-pulse') { await setSharePracticePulse(btn.checked); }
    else if (action === 'open-star') { view = btn.dataset.star; await renderPractice(); }
    else if (action === 'back-to-sky') { view = 'sky'; await renderPractice(); }
    else if (action === 'begin-crossing') { beginCrossing(btn.dataset.star); }
    else if (action === 'remove-crossing') { await removeCrossing(btn.dataset.id); }
  });

  overlay.addEventListener('click', async (e) => {
    if (e.target === overlay) { closeCrossing(); return; }
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'review-crossing') reviewCrossing(btn.dataset.star);
    else if (action === 'confirm-crossing') await confirmCrossing();
    else if (action === 'cancel-crossing') closeCrossing();
  });
}

// ==================== HELPERS ====================

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
