// Compass (year view).

import { getLearner, getGoals, saveGoal, getYearQuote, setYearQuote, getYearTraits, setYearTraits, getActivePartnerOf, markYearGoalPendingApproval } from './store.js';
import { getCategoriesForStudio, getStudioName } from './studios.js';
import { openGoalModal, openQuoteModal, openTraitsModal, openConfirmModal, openYearGoalModal } from './modals.js';
import { renderYearMap } from './year-map.js';
import { getYearMapClickHandler } from './north.js';

let wired = false;

export async function renderYearView(learnerId) {
  const learner = await getLearner(learnerId);
  const list = document.getElementById('year-categories');
  if (!learner) {
    list.innerHTML = '<p class="learners-empty">No learner profile yet.</p>';
    return;
  }

  // Year Map at top of Compass page (moved from North per captain 2026-05-12).
  const yearMapEl = document.getElementById('compass-year-map');
  if (yearMapEl) {
    renderYearMap(yearMapEl, learner, {
      onSessionClick: (sessionNumber) => {
        const h = getYearMapClickHandler();
        if (h) h(sessionNumber);
      },
    });
  }

  const categories = getCategoriesForStudio(learner.studio);
  const [allGoals, quoteText, traits, partner] = await Promise.all([
    getGoals(learnerId),
    getYearQuote(learnerId),
    getYearTraits(learnerId),
    getActivePartnerOf(learnerId),
  ]);
  const goals = allGoals.filter((g) => g.scope === 'year');

  // Quote
  const quoteEl = document.getElementById('year-quote-text');
  quoteEl.textContent = quoteText || 'Tap to set';
  quoteEl.classList.toggle('empty', !quoteText);

  // Traits
  const traitsEl = document.getElementById('year-traits-text');
  traitsEl.textContent = traits.length ? traits.join(' · ') : 'Tap to set';
  traitsEl.classList.toggle('empty', !traits.length);

  if (!wired) {
    document.querySelector('.year-quote')?.addEventListener('click', async () => {
      const existing = await getYearQuote(learnerId);
      const editFlow = async () => openQuoteModal(existing, async (next) => {
        await setYearQuote(learnerId, next);
        await renderYearView(learnerId);
      });
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
    document.querySelector('.year-traits')?.addEventListener('click', async () => {
      const existing = await getYearTraits(learnerId);
      openTraitsModal(existing, async (next) => {
        await setYearTraits(learnerId, next);
        await renderYearView(learnerId);
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
    const status = goal?.status || (goal ? 'active' : null);
    card.className = 'category-card' + (status ? ` goal-${status}` : '');

    let statusBadge = '';
    if (status === 'pending-approval') {
      statusBadge = '<span class="goal-status goal-status-pending">Awaiting partner</span>';
    } else if (status === 'approved') {
      statusBadge = '<span class="goal-status goal-status-approved">Approved ✓</span>';
    }

    const checkOffButton = (goal && status === 'active')
      ? `<button type="button" class="btn btn-text goal-checkoff" data-id="${goal.id}">Ready for check-off</button>`
      : '';

    const placeholder = `Example: ${cat.example}`;
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

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('goal-checkoff')) return;
      openYearGoalModal({
        category: cat,
        existing: goal,
        onSave: async ({ text, baseline, halfwayPoint, quarterPoint }) => {
          await saveGoal({
            id: goal?.id,
            learnerId,
            categoryId: cat.id,
            scope: 'year',
            text,
            baseline,
            halfwayPoint,
            quarterPoint,
            targetSession: 6,
            status: goal?.status || 'active',
          });
          // Auto-populate Session 3 and Session 2 goals (recursive halving)
          const seedSession = async (sessionIndex, seedText) => {
            if (!seedText) return;
            const existingS = allGoals.find(
              (g) => g.scope === 'session' && g.sessionIndex === sessionIndex && g.categoryId === cat.id
            );
            if (!existingS) {
              await saveGoal({
                learnerId,
                categoryId: cat.id,
                scope: 'session',
                sessionIndex,
                text: seedText,
                autoPopulated: true,
                status: 'active',
              });
            } else if (existingS.autoPopulated) {
              await saveGoal({ ...existingS, text: seedText, autoPopulated: true });
            }
          };
          await seedSession(3, halfwayPoint);
          await seedSession(2, quarterPoint);
          await renderYearView(learnerId);
        },
      });
    });

    const checkoffBtn = card.querySelector('.goal-checkoff');
    if (checkoffBtn) {
      checkoffBtn.addEventListener('click', async (e) => {
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
          onConfirm: async () => {
            await markYearGoalPendingApproval(goal.id);
            await renderYearView(learnerId);
            document.dispatchEvent(new CustomEvent('hc:partner-changed'));
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
