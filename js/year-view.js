// Compass (year view). Shows year-goal per category for the learner's studio,
// plus motivational quote and character traits at the top.

import { getLearner, getGoals, saveGoal, getYearQuote, setYearQuote, getYearTraits, setYearTraits, getActivePartnerOf, markYearGoalPendingApproval } from './store.js';
import { getCategoriesForStudio, getStudioName } from './studios.js';
import { openGoalModal, openQuoteModal, openTraitsModal, openConfirmModal, openYearGoalModal } from './modals.js';

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

  const partner = getActivePartnerOf(learnerId);

  categories.forEach((cat) => {
    const goal = goals.find((g) => g.categoryId === cat.id);
    const card = document.createElement('div');
    const status = goal?.status || (goal ? 'active' : null);
    card.className = 'category-card' + (status ? ` goal-${status}` : '');
    const placeholder = `Example: ${cat.example}`;

    let statusBadge = '';
    if (status === 'pending-approval') {
      statusBadge = '<span class="goal-status goal-status-pending">Awaiting partner</span>';
    } else if (status === 'approved') {
      statusBadge = '<span class="goal-status goal-status-approved">Approved ✓</span>';
    }

    const checkOffButton = (goal && status === 'active')
      ? `<button type="button" class="btn btn-text goal-checkoff" data-id="${goal.id}">Ready for check-off</button>`
      : '';

    card.innerHTML = `
      <div class="category-header">
        <span class="category-name">${cat.name}${statusBadge}</span>
        <span class="category-kind">${cat.kind}</span>
      </div>
      <p class="category-goal ${goal ? '' : 'empty'}">${goal ? escapeHtml(goal.text) : escapeHtml(placeholder)}</p>
      ${goal?.baseline ? `<p class="goal-meta"><span class="goal-meta-label">Starting line:</span> ${escapeHtml(goal.baseline)}</p>` : ''}
      ${goal?.halfwayPoint ? `<p class="goal-meta"><span class="goal-meta-label">Halfway:</span> ${escapeHtml(goal.halfwayPoint)}</p>` : ''}
      ${checkOffButton}
    `;

    // Card click opens the 3-stage year goal modal
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('goal-checkoff')) return; // handled separately
      openYearGoalModal({
        category: cat,
        existing: goal,
        onSave: ({ text, baseline, halfwayPoint }) => {
          const saved = saveGoal({
            id: goal?.id,
            learnerId,
            categoryId: cat.id,
            scope: 'year',
            text,
            baseline,
            halfwayPoint,
            targetSession: 6, // default per captain
            status: goal?.status || 'active',
          });
          // Auto-populate Session 3 goal with the halfway point if it doesn't
          // exist yet, OR update if it does. The learner can edit it.
          if (halfwayPoint) {
            const existingS3 = goals.find(
              (g) => g.scope === 'session' && g.sessionIndex === 3 && g.categoryId === cat.id
            );
            if (!existingS3) {
              saveGoal({
                learnerId,
                categoryId: cat.id,
                scope: 'session',
                sessionIndex: 3,
                text: halfwayPoint,
                status: 'active',
              });
            }
            // If S3 exists but is just the auto-populated text, refresh it;
            // otherwise leave the learner's edit alone.
            else if (existingS3.autoPopulated) {
              saveGoal({ ...existingS3, text: halfwayPoint });
            }
          }
          renderYearView(learnerId);
        },
      });
    });

    // Wire the check-off button
    const checkoffBtn = card.querySelector('.goal-checkoff');
    if (checkoffBtn) {
      checkoffBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!partner) {
          openConfirmModal({
            title: 'No partner yet',
            body: 'You need an accountability partner to check off year goals. Set one up on North first.',
            confirmLabel: 'OK',
            cancelLabel: 'Cancel',
            onConfirm: () => {},
          });
          return;
        }
        openConfirmModal({
          title: 'Ready for check-off?',
          body: 'Your partner will see this goal and confirm it. Are you ready to send it for approval?',
          confirmLabel: 'Send for approval',
          cancelLabel: 'Not yet',
          onConfirm: () => {
            markYearGoalPendingApproval(goal.id);
            renderYearView(learnerId);
          },
        });
      });
    }

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
