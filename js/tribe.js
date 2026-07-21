// Guide "Tribe" tab (captain 2026-07-21).
//
// Three tools for a guide, all operating on their own roster (getLearners is
// RLS-scoped to the guide's assigned learners in prod; all learners locally):
//
//   1. Roster + leader marking. Tap a learner to mark/unmark them a tribe leader.
//      Persisted via saveLearner({ isLeader }) - drives the roster star and the
//      randomizer's leader options.
//
//   2. Group randomizer (ephemeral - nothing saved). Two modes:
//        - Random groups: shuffle the pool into groups of N (1-10). A learner is
//          never placed in two groups; the last group takes the remainder, so an
//          uneven roster just yields one smaller group (never a crash, never a
//          silent drop). Options: exclude leaders, or one-leader-per-group.
//        - Leader-anchored: leaders sit on the side; pick a leader and draw N
//          random still-available learners into their group. The available pool
//          shrinks as you go; if fewer than N remain, it draws what's left and
//          says so.
//
//   3. Accountability partners. The learner self-pick is retired (js/partner.js);
//      the guide pairs learners here - randomly (pair-shuffle -> assign all) or by
//      hand (two pickers). Assignment persists via assignPartner and shows on the
//      learner's Partner tab. Existing pairings are listed with a dissolve control.

import {
  getLearners, saveLearner,
  getActivePartnerOf, dissolvePartnership, assignPartner,
} from './store.js';
import { getStudioName } from './studios.js';

// Ephemeral UI state for the randomizer. Never persisted - re-rolls freely.
const ui = {
  size: 2,
  mode: 'random',          // 'random' | 'anchored'
  excludeLeaders: false,
  oneLeaderPerGroup: false,
  result: null,            // { groups: string[][], leftovers: string[] }  (ids)
  anchored: null,          // { groups: {leaderId, memberIds:[]}[], poolIds:[] }
  assignA: '',
  assignB: '',
};

let rosterCache = [];      // last-loaded learners, so the randomizer/labels can resolve ids

export async function renderTribeView() {
  const container = document.getElementById('tribe-view');
  if (!container) return;
  const learners = await getLearners();
  rosterCache = learners;

  if (!learners.length) {
    container.innerHTML = `
      <div class="tribe-page">
        <h2 class="tribe-title">Tribe</h2>
        <p class="learners-empty">No learners on your roster yet.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="tribe-page">
      <h2 class="tribe-title">Tribe</h2>
      <p class="tribe-sub">Mark your leaders, shuffle groups, and pair accountability partners.</p>
      ${rosterSection(learners)}
      ${randomizerSection(learners)}
      ${partnersSection()}
    </div>`;

  wireRoster(container);
  wireRandomizer(container);
  await renderPartners(container);
}

// ── 1. Roster + leader marking ───────────────────────────────────────────────

function rosterSection(learners) {
  const rows = learners.map((l) => {
    const leader = !!l.isLeader;
    const studioNm = getStudioName(l.studio) || l.studio;
    return `
      <li class="tribe-roster-row${leader ? ' is-leader' : ''}">
        <span class="tribe-roster-name">${leader ? '<span class="tribe-star" aria-hidden="true">★</span> ' : ''}${escapeHtml(l.name)}</span>
        <span class="tribe-roster-studio">${escapeHtml(studioNm)}</span>
        <button type="button" class="btn btn-text tribe-leader-toggle" data-leader-id="${escapeHtml(l.id)}" aria-pressed="${leader}">
          ${leader ? '★ Leader' : '☆ Make leader'}
        </button>
      </li>`;
  }).join('');
  return `
    <section class="tribe-section">
      <h3 class="tribe-section-title">Roster</h3>
      <p class="tribe-section-hint">Leaders get a ★ and can be spread, excluded, or used to anchor groups below.</p>
      <ul class="tribe-roster">${rows}</ul>
    </section>`;
}

function wireRoster(container) {
  container.querySelectorAll('.tribe-leader-toggle').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.leaderId;
      const cur = rosterCache.find((l) => l.id === id);
      const next = !(cur && cur.isLeader);
      await saveLearner({ id, isLeader: next });
      // Reset any drawn groups - the leader set changed underneath them.
      ui.result = null;
      ui.anchored = null;
      await renderTribeView();
    });
  });
}

// ── 2. Group randomizer ──────────────────────────────────────────────────────

function randomizerSection(learners) {
  const leaderCount = learners.filter((l) => l.isLeader).length;
  const sizeOpts = Array.from({ length: 10 }, (_, i) => i + 1)
    .map((n) => `<option value="${n}"${ui.size === n ? ' selected' : ''}>${n === 1 ? '1 (solo)' : n}</option>`)
    .join('');
  return `
    <section class="tribe-section">
      <h3 class="tribe-section-title">Group randomizer</h3>
      <div class="tribe-controls">
        <label class="tribe-control">
          <span>Mode</span>
          <select id="tribe-mode">
            <option value="random"${ui.mode === 'random' ? ' selected' : ''}>Random groups</option>
            <option value="anchored"${ui.mode === 'anchored' ? ' selected' : ''}>Leader-anchored</option>
          </select>
        </label>
        <label class="tribe-control">
          <span>${ui.mode === 'anchored' ? 'Learners per leader' : 'Group size'}</span>
          <select id="tribe-size">${sizeOpts}</select>
        </label>
        ${ui.mode === 'random' ? `
          <label class="tribe-check">
            <input type="checkbox" id="tribe-exclude-leaders"${ui.excludeLeaders ? ' checked' : ''}>
            Exclude leaders
          </label>
          <label class="tribe-check">
            <input type="checkbox" id="tribe-one-leader"${ui.oneLeaderPerGroup ? ' checked' : ''} ${ui.excludeLeaders ? 'disabled' : ''}>
            One leader per group
          </label>` : ''}
      </div>
      <div class="tribe-actions">
        <button type="button" class="btn btn-primary" id="tribe-shuffle">Shuffle</button>
        <button type="button" class="btn btn-text" id="tribe-reset">Reset</button>
      </div>
      ${ui.mode === 'anchored' && leaderCount === 0
        ? '<p class="tribe-note">Mark at least one leader in the roster to anchor groups.</p>'
        : ''}
      <div class="tribe-results" id="tribe-results">${renderResults()}</div>
    </section>`;
}

function renderResults() {
  if (ui.mode === 'anchored') return renderAnchoredResults();
  if (!ui.result) return '<p class="tribe-results-empty">Tap Shuffle to draw groups.</p>';
  const groups = ui.result.groups.map((ids, i) => groupCard(`Group ${i + 1}`, ids)).join('');
  const leftovers = ui.result.leftovers.length
    ? groupCard('Not placed', ui.result.leftovers, true)
    : '';
  return groups + leftovers;
}

function renderAnchoredResults() {
  if (!ui.anchored) return '<p class="tribe-results-empty">Tap a leader to draw their group.</p>';
  const groups = ui.anchored.groups.map((g) => {
    const leader = nameOf(g.leaderId);
    const wanted = ui.size;
    const short = g.memberIds.length < wanted
      ? ` <span class="tribe-short">(only ${g.memberIds.length} of ${wanted} left)</span>`
      : '';
    return `
      <div class="tribe-group tribe-group-anchored">
        <div class="tribe-group-head">★ ${escapeHtml(leader)}'s group${short}</div>
        <ul class="tribe-group-list">
          ${g.memberIds.map((id) => `<li>${escapeHtml(nameOf(id))}</li>`).join('') || '<li class="tribe-results-empty">no one drawn yet</li>'}
        </ul>
      </div>`;
  }).join('');
  const leaders = leaderPool();
  const chips = leaders.map((l) => {
    const drawn = ui.anchored.groups.some((g) => g.leaderId === l.id);
    return `<button type="button" class="tribe-leader-chip${drawn ? ' is-drawn' : ''}" data-anchor-id="${escapeHtml(l.id)}" ${drawn ? 'disabled' : ''}>★ ${escapeHtml(l.name)}</button>`;
  }).join('');
  const remaining = ui.anchored.poolIds.length;
  return `
    <div class="tribe-anchor-bar">
      <span class="tribe-anchor-label">Draw ${ui.size} for:</span>
      ${chips || '<span class="tribe-note">No leaders marked.</span>'}
      <span class="tribe-anchor-remaining">${remaining} learner${remaining === 1 ? '' : 's'} left in the pool</span>
    </div>
    ${groups}`;
}

function groupCard(title, ids, muted = false) {
  return `
    <div class="tribe-group${muted ? ' tribe-group-muted' : ''}">
      <div class="tribe-group-head">${escapeHtml(title)} <span class="tribe-group-count">(${ids.length})</span></div>
      <ul class="tribe-group-list">
        ${ids.map((id) => `<li>${leaderMark(id)}${escapeHtml(nameOf(id))}</li>`).join('')}
      </ul>
    </div>`;
}

function wireRandomizer(container) {
  const modeSel = container.querySelector('#tribe-mode');
  if (modeSel) modeSel.addEventListener('change', () => {
    ui.mode = modeSel.value;
    ui.result = null;
    ui.anchored = null;
    renderTribeView();
  });
  const sizeSel = container.querySelector('#tribe-size');
  if (sizeSel) sizeSel.addEventListener('change', () => { ui.size = parseInt(sizeSel.value, 10) || 1; });
  const excl = container.querySelector('#tribe-exclude-leaders');
  if (excl) excl.addEventListener('change', () => { ui.excludeLeaders = excl.checked; if (excl.checked) ui.oneLeaderPerGroup = false; renderTribeView(); });
  const oneL = container.querySelector('#tribe-one-leader');
  if (oneL) oneL.addEventListener('change', () => { ui.oneLeaderPerGroup = oneL.checked; });

  const shuffle = container.querySelector('#tribe-shuffle');
  if (shuffle) shuffle.addEventListener('click', () => {
    if (ui.mode === 'anchored') startAnchored();
    else shuffleRandom();
    refreshResults(container);
  });
  const reset = container.querySelector('#tribe-reset');
  if (reset) reset.addEventListener('click', () => {
    ui.result = null;
    ui.anchored = null;
    refreshResults(container);
  });

  wireAnchorChips(container);
}

function refreshResults(container) {
  const box = container.querySelector('#tribe-results');
  if (box) { box.innerHTML = renderResults(); wireAnchorChips(container); }
}

function wireAnchorChips(container) {
  container.querySelectorAll('[data-anchor-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      drawForLeader(btn.dataset.anchorId);
      refreshResults(container);
    });
  });
}

// Random-groups mode: chunk the shuffled pool into groups of ui.size, remainder last.
function shuffleRandom() {
  const leaders = leaderPool();
  const nonLeaders = rosterCache.filter((l) => !l.isLeader);
  let pool;
  if (ui.excludeLeaders) {
    pool = shuffle(nonLeaders.map((l) => l.id));
  } else if (ui.oneLeaderPerGroup && leaders.length) {
    // Seed each group with one leader, then fill with shuffled non-leaders. Extra
    // leaders (more leaders than groups) fall back into the fill pool.
    const size = Math.max(1, ui.size);
    const shuffledLeaders = shuffle(leaders.map((l) => l.id));
    const groupCount = Math.max(1, Math.ceil(rosterCache.length / size));
    const seeds = shuffledLeaders.slice(0, groupCount);
    const restLeaders = shuffledLeaders.slice(groupCount);
    const fill = shuffle([...restLeaders, ...nonLeaders.map((l) => l.id)]);
    const groups = seeds.map((id) => [id]);
    let gi = 0;
    for (const id of fill) {
      // place into the smallest group under size, round-robin
      let placed = false;
      for (let k = 0; k < groups.length; k++) {
        const idx = (gi + k) % groups.length;
        if (groups[idx].length < size) { groups[idx].push(id); gi = idx + 1; placed = true; break; }
      }
      if (!placed) groups.push([id]); // overflow -> new group
    }
    ui.result = { groups, leftovers: [] };
    return;
  } else {
    pool = shuffle(rosterCache.map((l) => l.id));
  }
  ui.result = chunk(pool, Math.max(1, ui.size));
}

// Leader-anchored mode: seed the pool (non-leaders, or everyone-but-leaders), leaders
// on the side. Each draw pulls ui.size random ids out of the shared pool.
function startAnchored() {
  const nonLeaderIds = rosterCache.filter((l) => !l.isLeader).map((l) => l.id);
  ui.anchored = { groups: [], poolIds: shuffle(nonLeaderIds) };
}

function drawForLeader(leaderId) {
  if (!ui.anchored) startAnchored();
  if (ui.anchored.groups.some((g) => g.leaderId === leaderId)) return; // already drawn
  const take = Math.min(ui.size, ui.anchored.poolIds.length);
  const memberIds = ui.anchored.poolIds.slice(0, take);
  ui.anchored.poolIds = ui.anchored.poolIds.slice(take);
  ui.anchored.groups.push({ leaderId, memberIds });
}

// ── 3. Accountability partners ───────────────────────────────────────────────

function partnersSection() {
  const opts = ['<option value="">- choose -</option>']
    .concat(rosterCache.map((l) => `<option value="${escapeHtml(l.id)}">${escapeHtml(l.name)}</option>`))
    .join('');
  return `
    <section class="tribe-section">
      <h3 class="tribe-section-title">Accountability partners</h3>
      <p class="tribe-section-hint">You pair learners now - by shuffle or by hand. Learners no longer pick their own; they approve each other's year-goal check-offs once paired.</p>

      <div class="tribe-partner-random">
        <button type="button" class="btn btn-text" id="tribe-pair-shuffle">Shuffle into pairs</button>
        <span class="tribe-partner-random-note" id="tribe-pair-note"></span>
        <div id="tribe-pair-preview" class="tribe-pair-preview"></div>
      </div>

      <div class="tribe-partner-manual">
        <span class="tribe-manual-label">Pair by hand:</span>
        <select id="tribe-assign-a">${opts}</select>
        <span class="tribe-manual-amp">+</span>
        <select id="tribe-assign-b">${opts}</select>
        <button type="button" class="btn btn-primary" id="tribe-assign-btn">Pair</button>
      </div>

      <div class="tribe-partner-current" id="tribe-partner-current"></div>
    </section>`;
}

// Holds the last pair-shuffle so "assign all" knows what to persist.
let pairDraft = null;

async function renderPartners(container) {
  wirePartners(container);
  await renderCurrentPartners(container);
}

function wirePartners(container) {
  const shuffleBtn = container.querySelector('#tribe-pair-shuffle');
  if (shuffleBtn) shuffleBtn.addEventListener('click', () => {
    const ids = shuffle(rosterCache.map((l) => l.id));
    const pairs = chunk(ids, 2).groups;
    pairDraft = pairs;
    const preview = container.querySelector('#tribe-pair-preview');
    const note = container.querySelector('#tribe-pair-note');
    const full = pairs.filter((p) => p.length === 2);
    const odd = pairs.find((p) => p.length === 1);
    if (preview) {
      preview.innerHTML = full.map((p) => `<div class="tribe-pair">${escapeHtml(nameOf(p[0]))} + ${escapeHtml(nameOf(p[1]))}</div>`).join('')
        + (odd ? `<div class="tribe-pair tribe-pair-odd">${escapeHtml(nameOf(odd[0]))} - no partner (odd number)</div>` : '')
        + `<button type="button" class="btn btn-primary" id="tribe-assign-all" style="margin-top:0.5rem;">Assign all ${full.length} pair${full.length === 1 ? '' : 's'}</button>`;
    }
    if (note) note.textContent = '';
    const assignAll = container.querySelector('#tribe-assign-all');
    if (assignAll) assignAll.addEventListener('click', async () => {
      for (const p of full) { await assignPartner(p[0], p[1]); }
      pairDraft = null;
      await renderTribeView();
    });
  });

  const a = container.querySelector('#tribe-assign-a');
  const b = container.querySelector('#tribe-assign-b');
  if (a) a.addEventListener('change', () => { ui.assignA = a.value; });
  if (b) b.addEventListener('change', () => { ui.assignB = b.value; });
  const assignBtn = container.querySelector('#tribe-assign-btn');
  if (assignBtn) assignBtn.addEventListener('click', async () => {
    if (!ui.assignA || !ui.assignB || ui.assignA === ui.assignB) {
      const note = container.querySelector('#tribe-pair-note');
      if (note) note.textContent = 'Pick two different learners.';
      return;
    }
    await assignPartner(ui.assignA, ui.assignB);
    ui.assignA = ''; ui.assignB = '';
    await renderTribeView();
  });
}

async function renderCurrentPartners(container) {
  const box = container.querySelector('#tribe-partner-current');
  if (!box) return;
  // Walk the roster; collect distinct active pairings (dedupe by link id).
  const seen = new Set();
  const rows = [];
  for (const l of rosterCache) {
    const active = await getActivePartnerOf(l.id);
    if (!active || seen.has(active.linkId)) continue;
    seen.add(active.linkId);
    rows.push({ linkId: active.linkId, a: l.id, b: active.partnerId });
  }
  if (!rows.length) { box.innerHTML = '<p class="tribe-results-empty">No partnerships yet.</p>'; return; }
  box.innerHTML = `
    <h4 class="tribe-current-title">Current partnerships</h4>
    <ul class="tribe-current-list">
      ${rows.map((r) => `
        <li class="tribe-current-row">
          <span>${escapeHtml(nameOf(r.a))} + ${escapeHtml(nameOf(r.b))}</span>
          <button type="button" class="btn btn-text tribe-dissolve" data-link="${escapeHtml(r.linkId)}">Dissolve</button>
        </li>`).join('')}
    </ul>`;
  box.querySelectorAll('.tribe-dissolve').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await dissolvePartnership(btn.dataset.link);
      await renderTribeView();
    });
  });
}

// ── helpers ──────────────────────────────────────────────────────────────────

function leaderPool() { return rosterCache.filter((l) => l.isLeader); }
function nameOf(id) { const l = rosterCache.find((x) => x.id === id); return l ? (l.name || 'Unknown') : 'Unknown'; }
function leaderMark(id) { const l = rosterCache.find((x) => x.id === id); return l && l.isLeader ? '<span class="tribe-star" aria-hidden="true">★</span> ' : ''; }

// Fisher-Yates. Math.random is fine in the browser (banned only in workflow scripts).
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Chunk ids into groups of `size`; the final group holds the remainder. Returns
// { groups, leftovers } where leftovers is a trailing group smaller than size when
// size > 1 (surfaced separately so an uneven draw is visible, not hidden).
function chunk(ids, size) {
  const groups = [];
  for (let i = 0; i < ids.length; i += size) groups.push(ids.slice(i, i + size));
  if (size > 1 && groups.length > 1) {
    const last = groups[groups.length - 1];
    if (last.length < size) { groups.pop(); return { groups, leftovers: last }; }
  }
  return { groups, leftovers: [] };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
