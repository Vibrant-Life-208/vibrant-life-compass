// Compass (year view). Shows year-goal per category for the learner's studio,
// plus motivational quote and character traits at the top.

import { getLearner, getGoals, saveGoal, getYearQuote, setYearQuote, getYearTraits, setYearTraits } from './store.js';
import { getCategoriesForStudio, getStudioName } from './studios.js';
import { openGoalModal, openQuoteModal, openTraitsModal, openConfirmModal } from './modals.js';

let wired = false;

export function renderYearView(learnerId) {
  const learner = getLearner(learnerId);
  const list = document.getElementById('year-categories');
  if (!learner) {
    list.innerHTML = '<p class="learners-empty">No learner profile yet.</p>';
    return;
  }

  const categories = getCategoriesForStudio(learner.studio);
  const goals = getGoals(learnerId).filter((g) => g.scope === 'year');

  // Quote
  const quoteText = getYearQuote(learnerId);
  const quoteEl = document.getElementById('year-quote-text');
  quoteEl.textContent = quoteText || 'Tap to set';
  quoteEl.classList.toggle('empty', !quoteText);

  // Traits
  const traits = getYearTraits(learnerId);
  const traitsEl = document.getElementById('year-traits-text');
  traitsEl.textContent = traits.length ? traits.join(' · ') : 'Tap to set';
  traitsEl.classList.toggle('empty', !traits.length);

  // Wire quote + traits banners only once.
  if (!wired) {
    document.querySelector('.year-quote')?.addEventListener('click', () => {
      const existing = getYearQuote(learnerId);
      const editFlow = () => openQuoteModal(getYearQuote(learnerId), (next) => {
        setYearQuote(learnerId, next);
        renderYearView(learnerId);
      });
      // First-time set: no friction. Change to an existing quote: confirm first.
      if (existing) {
        openConfirmModal({
          title: 'Change your motivational quote?',
          body: 'Your quote is your anchor for the year. Most learners keep theirs until Session 7. Are you sure you want to change it?',
          confirmLabel: 'Change anyway',
          cancelLabel: 'Keep my quote',
          onConfirm: editFlow,
        });
      } else {
        editFlow();
      }
    });
    document.querySelector('.year-traits')?.addEventListener('click', () => {
      openTraitsModal(getYearTraits(learnerId), (next) => {
        setYearTraits(learnerId, next);
        renderYearView(learnerId);
      });
    });
    wired = true;
  }

  // Categories
  list.innerHTML = '';

  const studioHeader = document.createElement('p');
  studioHeader.className = 'session-meta';
  studioHeader.textContent = `${getStudioName(learner.studio)} studio · ${learner.name}`;
  list.appendChild(studioHeader);

  categories.forEach((cat) => {
    const goal = goals.find((g) => g.categoryId === cat.id);
    const card = document.createElement('div');
    card.className = 'category-card';
    const placeholder = `Example: ${cat.example}`;
    card.innerHTML = `
      <div class="category-header">
        <span class="category-name">${cat.name}</span>
        <span class="category-kind">${cat.kind}</span>
      </div>
      <p class="category-goal ${goal ? '' : 'empty'}">${goal ? escapeHtml(goal.text) : escapeHtml(placeholder)}</p>
    `;
    card.addEventListener('click', () => {
      openGoalModal({
        title: `${cat.name} - year goal`,
        existing: goal,
        example: cat.example,
        onSave: (text) => {
          saveGoal({
            id: goal?.id,
            learnerId,
            categoryId: cat.id,
            scope: 'year',
            text,
            status: 'active',
          });
          renderYearView(learnerId);
        },
      });
    });
    list.appendChild(card);
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
