// Parent "mini North" - a parent's own year quote as a small personal anchor.
// Parents have no learner-style North/Compass tab, so this is where their quote
// lives and can be re-chosen. Mounted at the top of the family view and the
// "My learner" parent tab. Quote-only for now (parents have no traits flow).
// (Captain 2026-07-19: "parents too", mini North, skippable.)

import { getQuoteState } from './store.js';
import { openQuoteFlow } from './modals.js';
import { getYearCalendar } from './studios.js';

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Render the parent's anchor into `host`. Re-renders itself after an edit, and
// calls onChange (if given) so a hosting surface can refresh alongside it.
export async function renderParentAnchor(host, parentId, { onChange } = {}) {
  if (!host || !parentId) return;
  const { text, author, note } = await getQuoteState(parentId);
  const currentCycle = getYearCalendar().yearStartISO;
  const hasQuote = !!text;

  host.innerHTML = `
    <section class="parent-anchor">
      <h3 class="parent-anchor-label">Your North</h3>
      ${hasQuote ? `
        <blockquote class="north-quote">
          <p class="north-quote-text">&ldquo;${escapeHtml(text)}&rdquo;</p>
          <footer class="north-quote-footer">${author ? '&mdash; ' + escapeHtml(author) : 'Your anchor for the cycle'}</footer>
        </blockquote>
        ${note ? `<p class="north-quote-note">${escapeHtml(note)}</p>` : ''}
        <button type="button" class="btn btn-text parent-anchor-edit" data-anchor-edit>Change your quote</button>
      ` : `
        <div class="north-quote parent-anchor-empty">
          <p class="parent-anchor-empty-text">A line to carry you through the year. Choose your North.</p>
          <button type="button" class="btn btn-primary" data-anchor-edit>Choose your quote</button>
        </div>
      `}
    </section>`;

  host.querySelector('[data-anchor-edit]')?.addEventListener('click', () => {
    openQuoteFlow({
      profileId: parentId,
      currentCycle,
      existing: { text, author, note },
      gated: false, // parents can close without setting; re-offered next cycle
      onComplete: () => {
        renderParentAnchor(host, parentId, { onChange });
        if (onChange) onChange();
      },
    });
  });
}
