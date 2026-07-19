// Parent / owner "mini North" - a parent's own personal anchor. Parents have no
// learner-style North/Compass tab, so this is where their anchor lives and grows:
//   - their year quote (chosen via the quote flow), and
//   - their VIA character strengths (imported here, with the "why your strengths
//     matter" copy shown right after the import - the same page learners see).
// Mounted at the top of the family view and the "My learner" parent tab. Both the
// quote and the strengths are one-time, optional, never re-prompted once set, and
// stay with the person for life (saved to their profile). Retake is always
// available here. (Captain 2026-07-19: "parents too", mini North; strengths added
// after verifying parents/owners had no VIA import path.)

import { getQuoteState, getStrengthRanking, getViaCharacterStrengths } from './store.js';
import { openQuoteFlow } from './modals.js';
import { openViaImportModal } from './via-import.js';
import { getYearCalendar } from './studios.js';

// Adults take the standard VIA survey (same registration URL as the youth one).
const VIA_SURVEY_URL = 'https://www.viacharacter.org/survey/account/register';

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// The "why your strengths matter" copy - identical to the learner onboarding page
// (renderStrengthsWhy in modals.js). Generic so it fits any person's strengths.
function whyStrengthsHtml() {
  return `
    <h4 class="parent-anchor-why-heading">Tools you already have</h4>
    <p class="parent-anchor-why-body">Meet your strengths. These are some of the best parts of who you are. You use them every day, in your own way - maybe you help a friend, ask a great question, make someone laugh, or keep going when something gets tricky.</p>
    <p class="parent-anchor-why-body">Your strengths are like tools you carry with you everywhere. When you want to learn something new or change something, you don't have to start from nothing. You get to use what you are already good at.</p>
    <p class="parent-anchor-why-body">These make you, you. And when something feels hard, you can stop and ask: which of my strengths can help me right now?</p>
    <p class="parent-anchor-why-body">The more you use them, the stronger they grow - and that is how they help you grow, a little more every day.</p>`;
}

// Render the parent's anchor (quote + strengths) into `host`. Re-renders itself
// after an edit, and calls onChange (if given) so a hosting surface can refresh.
export async function renderParentAnchor(host, parentId, { onChange } = {}) {
  if (!host || !parentId) return;

  const [quote, ranking, viaList] = await Promise.all([
    getQuoteState(parentId),
    getStrengthRanking(parentId),
    getViaCharacterStrengths(),
  ]);
  const currentCycle = getYearCalendar().yearStartISO;

  const labels = {};
  viaList.forEach((s) => { labels[s.id] = s.display_label_adult; });

  const hasQuote = !!quote.text;
  const top = Array.isArray(ranking?.top8) ? ranking.top8 : [];
  const hasStrengths = top.length > 0;

  const quoteBlock = hasQuote ? `
    <blockquote class="north-quote">
      <p class="north-quote-text">&ldquo;${escapeHtml(quote.text)}&rdquo;</p>
      <footer class="north-quote-footer">${quote.author ? '&mdash; ' + escapeHtml(quote.author) : 'Your anchor for the cycle'}</footer>
    </blockquote>
    ${quote.note ? `<p class="north-quote-note">${escapeHtml(quote.note)}</p>` : ''}
    <button type="button" class="btn btn-text parent-anchor-edit" data-anchor-edit>Change your quote</button>
  ` : `
    <div class="north-quote parent-anchor-empty">
      <p class="parent-anchor-empty-text">A line to carry you through the year. Choose your North.</p>
      <button type="button" class="btn btn-primary" data-anchor-edit>Choose your quote</button>
    </div>
  `;

  const strengthsBlock = hasStrengths ? `
    <ul class="strength-pill-list parent-anchor-strengths">${top.slice(0, 5).map((id) => `<li class="strength-pill">${escapeHtml(labels[id] || id)}</li>`).join('')}</ul>
    ${whyStrengthsHtml()}
    <button type="button" class="btn btn-text parent-anchor-edit" data-strengths-edit>Retake your strengths</button>
  ` : `
    <div class="north-quote parent-anchor-empty">
      <p class="parent-anchor-empty-text">Discover your character strengths with the free VIA Survey. It's read on your device, never uploaded.</p>
      <p class="parent-anchor-linkout"><a href="${VIA_SURVEY_URL}" target="_blank" rel="noopener noreferrer">Take the free VIA Survey &#8599;</a></p>
      <button type="button" class="btn btn-primary" data-strengths-edit>Add your results</button>
    </div>
  `;

  host.innerHTML = `
    <section class="parent-anchor">
      <h3 class="parent-anchor-label">Your North</h3>
      ${quoteBlock}
      <h3 class="parent-anchor-label parent-anchor-label-strengths">Your strengths</h3>
      ${strengthsBlock}
    </section>`;

  const refresh = () => { renderParentAnchor(host, parentId, { onChange }); if (onChange) onChange(); };

  host.querySelector('[data-anchor-edit]')?.addEventListener('click', () => {
    openQuoteFlow({
      profileId: parentId,
      currentCycle,
      existing: { text: quote.text, author: quote.author, note: quote.note },
      gated: false, // parents can close without setting; re-offered next cycle
      onComplete: refresh,
    });
  });

  host.querySelector('[data-strengths-edit]')?.addEventListener('click', () => {
    // Reuses the standalone VIA importer. On save it re-renders here, which shows
    // the top strengths + the "why" copy right after the import (per spec).
    openViaImportModal({ profileId: parentId, onSaved: refresh });
  });
}
