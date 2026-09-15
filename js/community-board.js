// js/community-board.js — the rich community board (Europa 2026-09-12).
//
// The cork-board bulletin: an extended idea-submission form (title, category, description,
// when/where, who-to-contact, and an optional poster/drawing) plus the posted board rendered as
// an old-school corkboard of pinned notes. Held DARK behind the ?commboard=on flag until the
// owed Salus/Jake young-register + upload-safety walk. The legacy single-field path in
// connection.js stays the flag-off default.
//
// Jake/Salus review conditions (2026-09-14) built in here:
//  - Discovery (~8-11) gets a SIMPLER form (title + description + optional drawing), not the full
//    six-field adult form (Jake: don't hand a young child a bar they can't reach).
//  - The poster accepts a DRAWING (image) as well as a PDF, so a young child who draws - not makes
//    PDFs - can still add one (Jake).
//  - The contact field steers to "ask a guide" rather than surfacing a child's own name (Salus).
//  (The take-down path for posted notes lives on the owner review surface; see owner.js.)
//
// Poster handling is entirely on-device: the learner picks a PDF or image, we render it to a
// downscaled JPEG here and store THAT image (a data URL) via submitCommunityPost. The original
// bytes are never uploaded or kept. pdf.js is the same vendored engine via-import.js uses, and it
// renders to pixels only (it does not execute a PDF's embedded scripts). Images are drawn to a
// canvas (pixels only, no script surface). Content is still moderated by the existing guide ->
// owner review before anything reaches the public board.

import { escapeHtml, escapeAttr } from './pillars/_scaffold.js';
import { submitCommunityPost, getMyCommunityPosts, getPostedBoard, getLearner, reportCommunityPost } from './store.js';
import { renderPosterFromFile, safePosterSrc } from './poster.js';

const POST_STATUS = {
  pending_guide: 'Waiting for your guide',
  pending_owner: 'Your guide said yes - waiting for the school',
  posted: 'Posted to the board',
  denied: 'Not this time',
  removed: 'Taken down',
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

// Poster/drawing pipeline lives in ./poster.js (renderPosterFromFile + safePosterSrc), imported above.

// --- Contact field (blocker #2): safe-by-default, with gentle PII discouragement ---
// Heuristic "does this look like personal contact info a child shouldn't publish?" - drives an inline
// nudge only (never a hard block); the guide review is the real backstop.
function looksLikePII(v) {
  const s = String(v || '');
  if (/[\w.+-]+@[\w-]+\.\w{2,}/.test(s)) return true;                          // email
  if ((s.match(/\d/g) || []).length >= 7) return true;                         // phone-ish (7+ digits)
  if (/\b\d{1,6}\s+\w+.*\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|ct|court|way|cir|circle|pl|place)\b/i.test(s)) return true; // address
  return false;
}
// Resolve the contact value from the form: the safe default ("Ask a guide") unless the learner chose
// "specific" and typed something. Young register has no contact field, so returns '' (nothing shown).
function contactValue(host) {
  const modeEl = host.querySelector('input[name="cork-contact-mode"]:checked');
  if (!modeEl) return '';
  if (modeEl.value !== 'specific') return 'Ask a guide';
  return (host.querySelector('#cork-contact')?.value.trim() || '') || 'Ask a guide';
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
    ${safePosterSrc(b.posterImage) ? `<img class="cork-poster" src="${escapeAttr(safePosterSrc(b.posterImage))}" alt="${escapeAttr((b.title || 'Community') + ' poster')}" loading="lazy">` : ''}
    <div class="cork-note-body">
      ${b.title ? `<h4 class="cork-title">${escapeHtml(b.title)}</h4>` : ''}
      ${categoryChip(b.category)}
      <p class="cork-desc">${escapeHtml(b.body)}</p>
      ${meta}
      <div class="cork-report-wrap" data-report-wrap="${escapeAttr(b.id)}">
        <button type="button" class="cork-report" data-report="${escapeAttr(b.id)}">Something wrong? Tell a guide</button>
      </div>
    </div>
  </article>`;
}

function mineRow(p) {
  // Non-shaming path-back (blocker #3, Winona): a taken-down idea is not a mark against the learner.
  // We say so warmly and offer a way to revise + share again - repair, never exile. Same for 'denied'.
  const removed = p.status === 'removed';
  const denied = p.status === 'denied';
  const statusLine = removed
    ? 'Taken down - that happens sometimes, and it is not a mark against you. You can tweak it and share it again.'
    : `${POST_STATUS[p.status] || p.status}${denied && p.guideNote ? ` - ${p.guideNote}` : ''}`;
  return `<div class="conn-mine">
    ${safePosterSrc(p.posterImage) ? `<img class="conn-mine-thumb" src="${escapeAttr(safePosterSrc(p.posterImage))}" alt="" loading="lazy">` : ''}
    <div class="conn-mine-main">
      <p class="conn-mine-body">${p.title ? `<strong>${escapeHtml(p.title)}</strong> - ` : ''}${escapeHtml(p.body)}</p>
      <p class="conn-mine-status conn-status-${escapeAttr(p.status)}">${escapeHtml(statusLine)}</p>
      ${(removed || denied) ? `<button type="button" class="btn btn-text conn-mine-revise" data-revise="${escapeAttr(p.id)}">Revise &amp; share again</button>` : ''}
    </div>
  </div>`;
}

export async function wireRichCommunity(host, learnerId) {
  if (!host) return;
  let poster = null; // { image } once a poster/drawing is rendered

  // Discovery (~8-11) gets the simpler form (Jake). Fall back to the full form if studio unknown.
  let young = false;
  try {
    const learner = await getLearner(learnerId);
    young = (learner && learner.studio === 'discovery');
  } catch (e) { young = false; }

  const render = async () => {
    const [mine, board] = await Promise.all([
      getMyCommunityPosts(learnerId).catch(() => []),
      getPostedBoard().catch(() => []),
    ]);

    // Full-form-only fields (category, when/where, contact) - omitted for the young register.
    const extraFields = young ? '' : `
        <label class="cork-field"><span class="cork-label">What kind of idea?</span>
          <select id="cork-cat">
            <option value="">Choose one...</option>
            ${CATEGORIES.map((c) => `<option value="${escapeAttr(c.id)}">${escapeHtml(c.label)}</option>`).join('')}
          </select></label>
        <label class="cork-field"><span class="cork-label">When &amp; where <span class="cork-opt">(optional)</span></span>
          <input type="text" id="cork-when" maxlength="200" placeholder="Thursdays after lunch, in the Grove..."></label>
        <fieldset class="cork-field cork-contact-field">
          <legend class="cork-label">Who can people talk to?</legend>
          <label class="cork-radio"><input type="radio" name="cork-contact-mode" value="guide" checked> Ask my guide <span class="cork-opt">(recommended)</span></label>
          <label class="cork-radio"><input type="radio" name="cork-contact-mode" value="specific"> Someone or somewhere specific</label>
          <div class="cork-contact-specific" id="cork-contact-specific" hidden>
            <input type="text" id="cork-contact" maxlength="120" placeholder="A first name, or a place like 'the Grove'">
            <span class="cork-hint">Please don't put a phone number, a home address, or another kid's full name - your guide will check this before it goes up.</span>
            <p class="cork-contact-warn" id="cork-contact-warn" hidden></p>
          </div>
        </fieldset>`;

    host.innerHTML = `
      <p class="pillar-prompt">${young
        ? 'Have an idea for everyone? A club, a fun day, a way to help? Tell your guide about it.'
        : 'Have an idea for the community - a group to start, a way to give back, an event to run? Fill it in and send it to your guide.'}</p>
      <form class="cork-form" id="cork-form" novalidate>
        <label class="cork-field"><span class="cork-label">${young ? 'What is your idea?' : 'Title'}</span>
          <input type="text" id="cork-title" maxlength="120" placeholder="${young ? 'Chess club, art day...' : 'Chess group, park clean-up...'}" required></label>
        <label class="cork-field"><span class="cork-label">${young ? 'Tell us more' : 'Tell us about it'}</span>
          <textarea id="cork-desc" rows="4" maxlength="500" placeholder="${young ? 'What is your idea, and why would it be fun?' : 'What is the idea, and why does it matter to you?'}" required></textarea></label>
        ${extraFields}
        <div class="cork-field">
          <span class="cork-label">${young ? 'Add a drawing' : 'Poster or drawing'} <span class="cork-opt">(optional)</span></span>
          <input type="file" id="cork-poster" accept="application/pdf,image/*">
          <span class="cork-hint">${young ? 'Draw your idea on paper, take a photo, and add it here.' : 'A PDF, or a photo of a drawing.'}</span>
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

    // Contact field (older register): the safe path - "Ask my guide" - is the default. A learner can
    // choose "someone specific", which reveals a text box that gently discourages raw PII (a phone
    // number, address, or another kid's full name); the guide gate is the backstop. (Blocker #2,
    // Tasha + Neelix 2026-09-15.) The young register has no contact field at all.
    const specificWrap = host.querySelector('#cork-contact-specific');
    const contactEl = host.querySelector('#cork-contact');
    const contactWarn = host.querySelector('#cork-contact-warn');
    if (specificWrap && contactEl) {
      host.querySelectorAll('input[name="cork-contact-mode"]').forEach((r) => r.addEventListener('change', () => {
        const specific = host.querySelector('input[name="cork-contact-mode"]:checked')?.value === 'specific';
        specificWrap.hidden = !specific;
        if (specific) contactEl.focus(); else { contactEl.value = ''; contactWarn.hidden = true; }
      }));
      contactEl.addEventListener('input', () => {
        contactWarn.hidden = !looksLikePII(contactEl.value);
        contactWarn.textContent = 'That looks like a phone number, email, or address - your guide will likely remove it. A first name or a place works better.';
      });
    }

    posterEl.addEventListener('change', async () => {
      poster = null; previewEl.hidden = true; previewEl.innerHTML = '';
      const file = posterEl.files && posterEl.files[0];
      if (!file) { statusEl.hidden = true; return; }
      statusEl.hidden = false; statusEl.textContent = 'Reading your file...'; statusEl.className = 'cork-poster-status';
      const res = await renderPosterFromFile(file);
      if (!res.ok) {
        statusEl.textContent = res.reason; statusEl.className = 'cork-poster-status is-error';
        posterEl.value = '';
        return;
      }
      poster = { image: res.image };
      statusEl.textContent = young ? 'Drawing ready.' : 'Poster ready.'; statusEl.className = 'cork-poster-status is-ok';
      previewEl.hidden = false;
      previewEl.innerHTML = `<img class="cork-poster-thumb" src="${escapeAttr(safePosterSrc(res.image))}" alt="Preview">`;
    });

    host.querySelector('#cork-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        title: titleEl.value.trim(),
        category: host.querySelector('#cork-cat')?.value || '',
        body: descEl.value.trim(),
        whenWhere: host.querySelector('#cork-when')?.value.trim() || '',
        contact: contactValue(host),
        posterImage: poster ? poster.image : '',
      };
      if (!payload.title || !payload.body) return;
      sendEl.disabled = true; sendEl.textContent = 'Sending...';
      await submitCommunityPost(learnerId, payload);
      poster = null;
      await render();
    });

    // Report a posted note (blocker #3): opens a small "tell a guide what's wrong" form; sending
    // files a report for staff to look at (it does NOT remove the note - the owner decides). A gentle,
    // two-step affordance so a tap is never an accidental takedown.
    host.querySelectorAll('[data-report]').forEach((btn) => btn.addEventListener('click', () => {
      const wrap = host.querySelector(`[data-report-wrap="${CSS.escape(btn.dataset.report)}"]`);
      if (!wrap || wrap.querySelector('.cork-report-form')) return;
      const id = btn.dataset.report;
      btn.hidden = true;
      const form = document.createElement('div');
      form.className = 'cork-report-form';
      form.innerHTML = `
        <label class="cork-hint" for="cork-report-why-${escapeAttr(id)}">Tell a guide what's wrong <span class="cork-opt">(optional)</span></label>
        <input type="text" id="cork-report-why-${escapeAttr(id)}" class="cork-report-why" maxlength="300" placeholder="What should a guide know?">
        <div class="cork-report-actions">
          <button type="button" class="btn btn-text" data-report-cancel="1">Never mind</button>
          <button type="button" class="btn btn-primary" data-report-send="1">Send to a guide</button>
        </div>`;
      wrap.appendChild(form);
      form.querySelector('.cork-report-why').focus();
      form.querySelector('[data-report-cancel]').addEventListener('click', () => { form.remove(); btn.hidden = false; });
      form.querySelector('[data-report-send]').addEventListener('click', async (ev) => {
        const send = ev.currentTarget; send.disabled = true; send.textContent = 'Sending...';
        const reason = form.querySelector('.cork-report-why')?.value.trim() || '';
        try { await reportCommunityPost(id, reason); } catch (_) {}
        wrap.innerHTML = '<p class="cork-report-done">Thank you - a guide will take a look.</p>';
      });
    }));

    // Non-shaming path-back: "Revise & share again" reopens the form pre-filled from the taken-down
    // (or not-this-time) idea, then scrolls to it. Repair, never exile.
    host.querySelectorAll('[data-revise]').forEach((btn) => btn.addEventListener('click', () => {
      const p = mine.find((m) => String(m.id) === String(btn.dataset.revise));
      if (!p) return;
      if (titleEl) titleEl.value = p.title || '';
      if (descEl) descEl.value = p.body || '';
      refreshValid();
      host.querySelector('#cork-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      titleEl?.focus();
    }));
  };

  await render();
}
