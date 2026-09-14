// js/community-board.js — the rich community board (Europa 2026-09-12).
//
// The cork-board bulletin: an extended idea-submission form (title, category, description,
// when/where, who-to-contact, and an optional poster) plus the posted board rendered as an
// old-school corkboard of pinned notes. Held DARK behind the ?commboard=on flag until the
// owed Salus/Jake young-register + upload-safety walk (learners incl. Discovery 8-11 can
// attach a poster). The legacy single-field path in connection.js stays the flag-off default.
//
// Poster handling is entirely on-device: the learner picks a PDF, we render its first page to
// a downscaled JPEG here and store THAT image (a data URL) via submitCommunityPost. The PDF
// bytes are never uploaded or kept. pdf.js is the same vendored engine via-import.js uses, and
// it renders to pixels only (it does not execute a PDF's embedded scripts). Content is still
// moderated by the existing guide -> owner review before anything reaches the public board.

import { escapeHtml, escapeAttr } from './pillars/_scaffold.js';
import { submitCommunityPost, getMyCommunityPosts, getPostedBoard } from './store.js';

const POST_STATUS = {
  pending_guide: 'Waiting for your guide',
  pending_owner: 'Your guide said yes - waiting for the school',
  posted: 'Posted to the board',
  denied: 'Not this time',
};

// Display labels are learner-facing; the ids are the stable internal tokens the DB stores
// (the 'club' token keeps its check-constraint value - only the shown word changed to "Group").
const CATEGORIES = [
  { id: 'club', label: 'Group' },
  { id: 'volunteer', label: 'Volunteer' },
  { id: 'event', label: 'Event' },
  { id: 'other', label: 'Other' },
];
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

// --- Poster: render a PDF's first page to a downscaled JPEG data URL, on-device only. ---
let _pdfjs = null;
async function getPdfjs() {
  if (_pdfjs) return _pdfjs;
  const mod = await import('./vendor/pdf.min.mjs');
  mod.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;
  _pdfjs = mod;
  return mod;
}

const MAX_PDF_BYTES = 10 * 1024 * 1024; // reject anything larger than a plausible poster
const POSTER_MAX_W = 700;               // downscale the render to this width
const POSTER_MAX_LEN = 600000;          // matches the DB column cap on the data URL

async function renderPosterFromPdf(file) {
  const looksPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
  if (!looksPdf) return { ok: false, reason: 'Please choose a PDF for the poster.' };
  if (file.size > MAX_PDF_BYTES) return { ok: false, reason: 'That PDF is too large (10MB max).' };
  const buf = await file.arrayBuffer();
  const magic = new TextDecoder().decode(new Uint8Array(buf.slice(0, 5)));
  if (magic !== '%PDF-') return { ok: false, reason: 'That file is not a valid PDF.' };
  let doc;
  try {
    const pdfjs = await getPdfjs();
    doc = await pdfjs.getDocument({ data: buf }).promise;
  } catch (e) { return { ok: false, reason: 'Could not read that PDF.' }; }
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(1, POSTER_MAX_W / base.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); // flatten transparency for JPEG
    await page.render({ canvasContext: ctx, viewport }).promise;
    let out = canvas.toDataURL('image/jpeg', 0.72);
    if (out.length > POSTER_MAX_LEN) out = canvas.toDataURL('image/jpeg', 0.55);
    if (out.length > POSTER_MAX_LEN) return { ok: false, reason: 'That poster is too detailed to store - try a simpler PDF.' };
    return { ok: true, image: out };
  } catch (e) { return { ok: false, reason: 'Could not render that poster.' }; }
}

// --- Render ---
function categoryChip(cat) {
  if (!cat) return '';
  return `<span class="cork-cat cork-cat-${escapeAttr(cat)}">${escapeHtml(CATEGORY_LABEL[cat] || cat)}</span>`;
}

function boardNote(b) {
  const meta = [
    b.whenWhere ? `<p class="cork-meta"><span class="cork-meta-k">When / where</span> ${escapeHtml(b.whenWhere)}</p>` : '',
    b.contact ? `<p class="cork-meta"><span class="cork-meta-k">Talk to</span> ${escapeHtml(b.contact)}</p>` : '',
  ].join('');
  return `<article class="cork-note">
    <span class="cork-pin" aria-hidden="true"></span>
    ${b.posterImage ? `<img class="cork-poster" src="${escapeAttr(b.posterImage)}" alt="${escapeAttr((b.title || 'Community') + ' poster')}" loading="lazy">` : ''}
    <div class="cork-note-body">
      ${b.title ? `<h4 class="cork-title">${escapeHtml(b.title)}</h4>` : ''}
      ${categoryChip(b.category)}
      <p class="cork-desc">${escapeHtml(b.body)}</p>
      ${meta}
    </div>
  </article>`;
}

function mineRow(p) {
  return `<div class="conn-mine">
    ${p.posterImage ? `<img class="conn-mine-thumb" src="${escapeAttr(p.posterImage)}" alt="" loading="lazy">` : ''}
    <div class="conn-mine-main">
      <p class="conn-mine-body">${p.title ? `<strong>${escapeHtml(p.title)}</strong> - ` : ''}${escapeHtml(p.body)}</p>
      <p class="conn-mine-status conn-status-${escapeAttr(p.status)}">${escapeHtml(POST_STATUS[p.status] || p.status)}${p.status === 'denied' && p.guideNote ? ` - ${escapeHtml(p.guideNote)}` : ''}</p>
    </div>
  </div>`;
}

export async function wireRichCommunity(host, learnerId) {
  if (!host) return;
  let poster = null; // { image } once a PDF is rendered

  const render = async () => {
    const [mine, board] = await Promise.all([
      getMyCommunityPosts(learnerId).catch(() => []),
      getPostedBoard().catch(() => []),
    ]);
    host.innerHTML = `
      <p class="pillar-prompt">Have an idea for the community - a club to start, a way to give back, an event to run? Fill it in and send it to your guide.</p>
      <form class="cork-form" id="cork-form" novalidate>
        <label class="cork-field"><span class="cork-label">Title</span>
          <input type="text" id="cork-title" maxlength="120" placeholder="Chess club, park clean-up..." required></label>
        <label class="cork-field"><span class="cork-label">What kind of idea?</span>
          <select id="cork-cat">
            <option value="">Choose one...</option>
            ${CATEGORIES.map((c) => `<option value="${escapeAttr(c.id)}">${escapeHtml(c.label)}</option>`).join('')}
          </select></label>
        <label class="cork-field"><span class="cork-label">Tell us about it</span>
          <textarea id="cork-desc" rows="4" maxlength="500" placeholder="What is the idea, and why does it matter to you?" required></textarea></label>
        <label class="cork-field"><span class="cork-label">When &amp; where <span class="cork-opt">(optional)</span></span>
          <input type="text" id="cork-when" maxlength="200" placeholder="Thursdays after lunch, in the Grove..."></label>
        <label class="cork-field"><span class="cork-label">Who can people talk to? <span class="cork-opt">(optional)</span></span>
          <input type="text" id="cork-contact" maxlength="120" placeholder="Me! Or ask a guide..."></label>
        <div class="cork-field">
          <span class="cork-label">Poster <span class="cork-opt">(optional PDF)</span></span>
          <input type="file" id="cork-poster" accept="application/pdf">
          <p class="cork-poster-status" id="cork-poster-status" hidden></p>
          <div class="cork-poster-preview" id="cork-poster-preview" hidden></div>
        </div>
        <div class="cork-form-actions">
          <button type="submit" class="btn btn-primary" id="cork-send" disabled>Send to my guide</button>
        </div>
      </form>
      ${mine.length ? `<h4 class="pillar-subhead">Your ideas</h4>${mine.map(mineRow).join('')}` : ''}
      <h4 class="pillar-subhead">What's happening around school</h4>
      ${board.length
        ? `<div class="cork-board">${board.map(boardNote).join('')}</div>`
        : '<div class="cork-board cork-board-empty"><p class="pillar-empty">Nothing pinned yet - yours could be the first.</p></div>'}`;

    const titleEl = host.querySelector('#cork-title');
    const descEl = host.querySelector('#cork-desc');
    const sendEl = host.querySelector('#cork-send');
    const posterEl = host.querySelector('#cork-poster');
    const statusEl = host.querySelector('#cork-poster-status');
    const previewEl = host.querySelector('#cork-poster-preview');

    const refreshValid = () => { sendEl.disabled = !(titleEl.value.trim() && descEl.value.trim()); };
    titleEl.addEventListener('input', refreshValid);
    descEl.addEventListener('input', refreshValid);

    posterEl.addEventListener('change', async () => {
      poster = null; previewEl.hidden = true; previewEl.innerHTML = '';
      const file = posterEl.files && posterEl.files[0];
      if (!file) { statusEl.hidden = true; return; }
      statusEl.hidden = false; statusEl.textContent = 'Reading your poster...'; statusEl.className = 'cork-poster-status';
      const res = await renderPosterFromPdf(file);
      if (!res.ok) {
        statusEl.textContent = res.reason; statusEl.className = 'cork-poster-status is-error';
        posterEl.value = '';
        return;
      }
      poster = { image: res.image };
      statusEl.textContent = 'Poster ready.'; statusEl.className = 'cork-poster-status is-ok';
      previewEl.hidden = false;
      previewEl.innerHTML = `<img class="cork-poster-thumb" src="${escapeAttr(res.image)}" alt="Poster preview">`;
    });

    host.querySelector('#cork-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        title: titleEl.value.trim(),
        category: host.querySelector('#cork-cat').value || '',
        body: descEl.value.trim(),
        whenWhere: host.querySelector('#cork-when').value.trim(),
        contact: host.querySelector('#cork-contact').value.trim(),
        posterImage: poster ? poster.image : '',
      };
      if (!payload.title || !payload.body) return;
      sendEl.disabled = true; sendEl.textContent = 'Sending...';
      await submitCommunityPost(learnerId, payload);
      poster = null;
      await render();
    });
  };

  await render();
}
