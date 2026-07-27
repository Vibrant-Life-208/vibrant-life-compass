// Summary - "the story of the learner." A record, not a score.
// Synthesizes the learner's OWN data into a warm, factual narrative: their anchor
// (quote + how many values/strengths they named), what they're working toward
// (year goals + halfway points), how they've moved (check-ins, categories they
// keep returning to), and what they've reflected on (journal counts only).
// Always self-scoped (the learner's own Summary / a guide's own Patterns), so
// journal COUNTS are shown but never a learner's journal content on someone
// else's screen (INV-FOUNDATIONS-CANON holds - this is self-view only).
// "Observations, not scores" (2026-05-11 council); non-scoring by design.

import { getGoals, getCheckIns, getQuoteState, getProfileValues, getProfileStrengths, getProfileFoundations } from './store.js';
import { deadWatch, deadEnabled } from './dead-watch.js'; // Phase 0 dark-watch (retirement candidate)

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export async function renderPatterns(learnerId) {
  const list = document.getElementById('patterns-list');
  deadWatch('patterns');
  if (!deadEnabled('patterns')) { if (list) list.innerHTML = ''; return; } // Phase 0 kill-switch (default ON)
  if (!list) return;

  const [goals, checkIns, quote, values, strengths, foundations] = await Promise.all([
    getGoals(learnerId),
    getCheckIns(learnerId),
    getQuoteState(learnerId).catch(() => ({})),
    getProfileValues(learnerId).catch(() => []),
    getProfileStrengths(learnerId).catch(() => []),
    getProfileFoundations(learnerId).catch(() => ({})),
  ]);

  const blocks = buildStory({ goals, checkIns, quote, values, strengths, foundations });

  if (!blocks.length) {
    list.innerHTML = '<p class="patterns-empty">Your story fills in as you set goals, check in, and reflect. Nothing to show yet - and that is a fine place to start.</p>';
    return;
  }
  list.innerHTML = blocks.join('');
}

function block(title, bodyHtml) {
  return `<section class="summary-block"><h3 class="summary-block-title">${esc(title)}</h3>${bodyHtml}</section>`;
}

function buildStory({ goals, checkIns, quote, values, strengths, foundations }) {
  const out = [];
  const yearGoals = (goals || []).filter((g) => g.scope === 'year' && g.text);
  const climb = (foundations && foundations.climb && typeof foundations.climb === 'object' && !Array.isArray(foundations.climb))
    ? foundations.climb : {};

  // 1. Your anchor - quote + how many values/strengths named.
  const anchorBits = [];
  if (quote && quote.text) anchorBits.push(`<p class="summary-quote">"${esc(quote.text)}"</p>`);
  const vN = Array.isArray(values) ? values.length : 0;
  const sN = Array.isArray(strengths) ? strengths.length : 0;
  if (vN || sN) {
    const parts = [];
    if (vN) parts.push(`${vN} value${vN === 1 ? '' : 's'}`);
    if (sN) parts.push(`${sN} strength${sN === 1 ? '' : 's'}`);
    anchorBits.push(`<p>You've named ${parts.join(' and ')} - the compass you steer by.</p>`);
  }
  if (anchorBits.length) out.push(block('Your anchor', anchorBits.join('')));

  // 2. What you're working toward - year goals + halfway.
  if (yearGoals.length) {
    const items = yearGoals.map((g) => `<li>${esc(g.text)}${g.halfwayPoint ? `<span class="summary-goal-half"> · halfway: ${esc(g.halfwayPoint)}</span>` : ''}</li>`).join('');
    out.push(block('What you\'re working toward', `<ul class="summary-goals">${items}</ul>`));
  }

  // 3. How you've moved - check-ins + returned-to categories.
  const moveBits = [];
  if ((checkIns || []).length >= 1) {
    const n = checkIns.length;
    moveBits.push(`<p>You've checked in ${n} time${n === 1 ? '' : 's'}. Steady is the practice.</p>`);
  }
  const byCat = {};
  (goals || []).filter((g) => g.scope === 'session').forEach((g) => { byCat[g.categoryId] = (byCat[g.categoryId] || 0) + 1; });
  Object.entries(byCat).filter(([, c]) => c >= 3).forEach(([cat, c]) => {
    moveBits.push(`<p>You keep returning to ${esc(cat)} - ${c} sessions running.</p>`);
  });
  if (moveBits.length) out.push(block('How you\'ve moved', moveBits.join('')));

  // 4. What you've reflected on - journal COUNTS only (self-only content stays private).
  const bookN = Array.isArray(climb.bookJournal) ? climb.bookJournal.length : 0;
  const writeN = Array.isArray(climb.writingJournal) ? climb.writingJournal.length : 0;
  const reflectBits = [];
  if (bookN) reflectBits.push(`${bookN} reading-journal note${bookN === 1 ? '' : 's'}`);
  if (writeN) reflectBits.push(`${writeN} piece${writeN === 1 ? '' : 's'} of your own writing`);
  if (climb.consciousLiving) reflectBits.push('a note on how you live alongside others');
  if (reflectBits.length) {
    out.push(block('What you\'ve reflected on', `<p>You've written ${reflectBits.join(', ')}.</p>`));
  }

  return out;
}
