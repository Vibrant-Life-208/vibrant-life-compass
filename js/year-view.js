// Compass (year view).

import { getLearner, getGoals, saveGoal, getYearQuote, setYearQuote, getYearVision, setYearVision, getYearTraits, setYearTraits, getActivePartnerOf, markYearGoalPendingApproval, addNotification, getParentLearnerLinks } from './store.js';
import { getCategoriesForStudio, getStudioName } from './studios.js';
import { openGoalModal, openQuoteModal, openVisionModal, openTraitsModal, openConfirmModal, openYearGoalModal } from './modals.js';
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
  const [allGoals, quoteText, visionText, traits, partner] = await Promise.all([
    getGoals(learnerId),
    getYearQuote(learnerId),
    getYearVision(learnerId),
    getYearTraits(learnerId),
    getActivePartnerOf(learnerId),
  ]);
  const goals = allGoals.filter((g) => g.scope === 'year');

  // Vision (pedagogy addition 2026-05-13)
  const visionEl = document.getElementById('year-vision-text');
  if (visionEl) {
    visionEl.textContent = visionText || 'Tap to write where you see yourself a year from now';
    visionEl.classList.toggle('empty', !visionText);
  }

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
    document.querySelector('.year-vision')?.addEventListener('click', async () => {
      const existing = await getYearVision(learnerId);
      openVisionModal({
        existing,
        currentStudio: learner.studio,
        onSave: async (next) => {
          await setYearVision(learnerId, next);
          await renderYearView(learnerId);
        },
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

  // SSC-D2 (2026-05-13): low-shame reset copy for stuck learners. Accord's
  // observation - the recursive-halving structure is emotionally demanding
  // for anxious-perfectionist kids; locking End of Session 3 can become dread. A quiet
  // text presence makes "this is hard right now" a known state, not a
  // private shame loop.
  const resetCue = document.createElement('p');
  resetCue.className = 'compass-reset-cue';
  resetCue.textContent = 'Sometimes a goal looks impossible. That is information, not failure. Bring it to your partner or your guide.';
  list.appendChild(resetCue);

  // Glossary line retired 2026-05-13 — captain spelled out "End of Session"
  // everywhere it appears, so the abbreviation no longer needs explanation.

  // Has the learner started any year goal yet? Used to gate the
  // first-time invitation in the year-goal modal (PDC D1 2026-05-13).
  const noFilledGoalsYet = !goals.some((g) => g.scope === 'year' && g.text && g.text.trim().length > 0);

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

    const shareWinButton = (goal && status === 'approved')
      ? `<button type="button" class="btn btn-text goal-share-win" data-id="${goal.id}">Share this win with my parents</button>`
      : '';

    const placeholder = `Example: ${cat.example}`;
    card.innerHTML = `
      <div class="category-header">
        <span class="category-name">${cat.name}${statusBadge}</span>
        <span class="category-kind">${cat.kind}</span>
      </div>
      <p class="category-goal ${goal ? '' : 'empty'}">${goal ? escapeHtml(goal.text) : escapeHtml(placeholder)}</p>
      ${goal?.baseline ? `<p class="goal-meta"><span class="goal-meta-label">Starting line:</span> ${escapeHtml(goal.baseline)}</p>` : ''}
      ${goal?.eos1Point ? `<p class="goal-meta"><span class="goal-meta-label">End of Session 1:</span> ${escapeHtml(goal.eos1Point)}</p>` : ''}
      ${goal?.quarterPoint ? `<p class="goal-meta"><span class="goal-meta-label">End of Session 2:</span> ${escapeHtml(goal.quarterPoint)}</p>` : ''}
      ${goal?.halfwayPoint ? `<p class="goal-meta" title="This one stays. It is your commitment anchor."><span class="goal-meta-label">End of Session 3 · locked:</span> ${escapeHtml(goal.halfwayPoint)}</p>` : ''}
      ${checkOffButton}
      ${shareWinButton}
    `;

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('goal-checkoff')) return;
      openYearGoalModal({
        category: cat,
        existing: goal,
        isFirstTime: noFilledGoalsYet,
        studio: learner.studio,
        onSave: async ({ text, baseline, halfwayPoint, quarterPoint, eos1Point, weeklySteps }) => {
          await saveGoal({
            id: goal?.id,
            learnerId,
            categoryId: cat.id,
            scope: 'year',
            text,
            baseline,
            halfwayPoint,
            quarterPoint,
            eos1Point,
            weeklySteps: weeklySteps || goal?.weeklySteps || {},
            targetSession: 6,
            status: goal?.status || 'active',
          });
          // Auto-populate Session 1, 2, 3 goals (recursive halving + foundation).
          // End of Session 3 -> Session 3, End of Session 2 -> Session 2, End of Session 1 -> Session 1.
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
          await seedSession(1, eos1Point);
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

    // Share-this-win button: sends a notification to all linked parents
    const shareBtn = card.querySelector('.goal-share-win');
    if (shareBtn) {
      shareBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const links = await getParentLearnerLinks();
        const parentIds = links.filter((l) => l.learnerId === learnerId).map((l) => l.parentId);
        if (parentIds.length === 0) {
          openConfirmModal({
            title: 'No parent linked',
            body: 'A guide can link a parent to your account so you can share wins with them.',
            confirmLabel: 'OK',
            cancelLabel: 'Cancel',
            onConfirm: () => {},
          });
          return;
        }
        for (const pid of parentIds) {
          await addNotification({
            recipientId: pid,
            type: 'milestone-shared',
            title: 'A win to celebrate',
            body: `${learner.name || learner.heroName} reached: ${goal.text}`,
            fromId: learnerId,
          });
        }
        openConfirmModal({
          title: 'Yes!',
          body: `${parentIds.length === 1 ? 'Your parent just heard' : 'Your parents just heard'}. Big moment - sit with it for a second.`,
          confirmLabel: 'OK',
          cancelLabel: 'Cancel',
          onConfirm: () => {},
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
